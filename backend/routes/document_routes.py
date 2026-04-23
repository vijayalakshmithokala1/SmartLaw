"""
Document Routes
POST /api/document/upload  — Upload doc → extract → redact PII → summarize
POST /api/document/chat    — Legal Q&A chatbot
GET  /api/health           — Health check
"""
import os
import uuid
import time
from flask import Blueprint, request, jsonify, g
from routes.auth_routes import require_auth
from services.extraction_service import extract_text, is_allowed
from services.pii_service import redact_pii, get_redaction_summary
from services.ai_service import (
    generate_action_items, draft_letter, find_lawyer_advice,
    analyze_risk, extract_deadlines, negotiate_clause, simulate_what_if,
    draft_legal_document
)

document_bp = Blueprint("document", __name__)

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "temp_uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Simple in-memory rate limiter
_last_request: dict = {}

def _is_rate_limited(user_id: int, min_gap: float = 2.0) -> bool:
    now = time.time()
    key = str(user_id)
    if key in _last_request and now - _last_request[key] < min_gap:
        return True
    _last_request[key] = now
    return False


# ──────────────────────────────────────────────
#  Upload & Summarize
# ──────────────────────────────────────────────

from services.storage_service import StorageService

@document_bp.route("/upload", methods=["POST"])
@require_auth
def upload_and_summarize():
    """
    Pipeline:
    1. Receive file
    2. Upload to Cloudinary (Production-safe storage)
    3. Download to temp local path (Required for OCR access)
    4. Extract text
    5. Cleanup temp file
    6. Redact PII (anonymized text)
    7. AI Summary via Llama 3.3
    """
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded."}), 400

    file = request.files["file"]

    if not file.filename:
        return jsonify({"error": "No file selected."}), 400

    if not is_allowed(file.filename):
        return jsonify({
            "error": "Unsupported file type. Please upload PDF, DOC, DOCX, JPG, or PNG."
        }), 400

    temp_path = None
    try:
        # Step 1: Read file bytes into memory
        file_bytes = file.read()

        # Step 2: Write bytes directly to a temp file for text extraction
        # (No need to download from Cloudinary — we already have the bytes)
        import tempfile, os as _os
        ext = _os.path.splitext(file.filename)[1]
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=ext)
        tmp.write(file_bytes)
        tmp.close()
        temp_path = tmp.name

        # Step 3: Extract text from local temp file
        raw_text = extract_text(temp_path, file.filename)

        # Step 4: Redact PII — server only sees anonymized text after this point
        redacted_text, token_map = redact_pii(raw_text)
        redaction_stats = get_redaction_summary(token_map)

        # Step 5: Upload to Cloudinary for persistent storage (after extraction)
        secure_url = StorageService.upload_file(file_bytes, file.filename)

        # Step 6: AI Summary (using anonymized text)
        full_res = summarize_document(redacted_text)
        
        # Extract risk level from the first line (e.g., "RISK: [MEDIUM]")
        risk_level = "LOW"
        risk_score = "N/A"
        summary = full_res
        
        lines = full_res.split("\n")
        remaining_lines = []
        for line in lines:
            if line.startswith("RISK:"):
                risk_level = line.replace("RISK:", "").replace("[", "").replace("]", "").strip()
            elif line.startswith("RISK SCORE:"):
                risk_score = line.replace("RISK SCORE:", "").replace("[", "").replace("]", "").strip()
            else:
                remaining_lines.append(line)
        summary = "\n".join(remaining_lines).strip()

        return jsonify({
            "summary": summary,
            "risk_level": risk_level,
            "risk_score": risk_score,
            "redacted_text": redacted_text[:8000],   # For chat context
            "token_map": token_map,                  # Sent to client for UI restoration
            "redaction_stats": redaction_stats,
            "char_count": len(raw_text),
            "pii_found": len(token_map) > 0,
            "file_url": secure_url                   # Store/Return for future reference
        })

    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        error_msg = str(e)
        if "rate limit" in error_msg.lower():
            return jsonify({"error": "AI service is busy. Please wait a moment and try again."}), 429
        return jsonify({"error": f"Processing failed: {error_msg}"}), 500
    finally:
        # Always clean up the temp file
        if temp_path:
            StorageService.cleanup(temp_path)


# ──────────────────────────────────────────────
#  Legal Chat
# ──────────────────────────────────────────────

@document_bp.route("/chat", methods=["POST"])
@require_auth
def chat():
    """
    Legal Q&A chatbot.
    Optionally accepts redacted_context (already anonymized document text from client).
    """
    if _is_rate_limited(g.current_user.id):
        return jsonify({"error": "Please wait a moment before sending another message."}), 429

    data = request.get_json() or {}
    query = data.get("query", "").strip()
    # Client sends back already-redacted document context (PII was stripped client-side via token_map)
    redacted_context = data.get("redacted_context", "")

    if not query:
        return jsonify({"error": "Please enter a question."}), 400

    if len(query) > 2000:
        return jsonify({"error": "Question is too long. Please keep it under 2000 characters."}), 400

    try:
        answer = legal_chat(query, document_context=redacted_context)
        return jsonify({"answer": answer})

    except Exception as e:
        error_msg = str(e)
        if "rate limit" in error_msg.lower():
            return jsonify({"error": "AI service is busy. Please try again in a moment."}), 429
        return jsonify({"error": f"Could not get a response: {error_msg}"}), 500


@document_bp.route("/draft", methods=["POST"])
@require_auth
def draft_document():
    """
    Dedicated legal drafting endpoint for templates.
    """
    if _is_rate_limited(g.current_user.id):
        return jsonify({"error": "Please wait a moment."}), 429

    data = request.get_json() or {}
    prompt = data.get("query", "").strip()

    if not prompt:
        return jsonify({"error": "Please provide drafting instructions."}), 400

    try:
        draft = draft_legal_document(prompt)
        return jsonify({"answer": draft})

    except Exception as e:
        return jsonify({"error": f"Drafting failed: {str(e)}"}), 500


# ──────────────────────────────────────────────
#  Document Analysis (Direct Text)
# ──────────────────────────────────────────────

@document_bp.route("/analyze", methods=["POST"])
@require_auth
def analyze_direct_text():
    """
    Handles direct text analysis (e.g., from the Legal Library drafts).
    """
    if _is_rate_limited(g.current_user.id):
        return jsonify({"error": "Rate limited. Please wait."}), 429

    data = request.get_json() or {}
    text = data.get("text", "").strip()
    filename = data.get("filename", "Draft Document")

    if not text:
        return jsonify({"error": "No text provided for analysis."}), 400

    try:
        # Step 1: Analyze via AI
        full_res = summarize_document(text)
        
        # Extract risk level
        risk_level = "LOW"
        risk_score = "N/A"
        summary = full_res
        
        lines = full_res.split("\n")
        remaining_lines = []
        for line in lines:
            if line.startswith("RISK:"):
                risk_level = line.replace("RISK:", "").replace("[", "").replace("]", "").strip()
            elif line.startswith("RISK SCORE:"):
                risk_score = line.replace("RISK SCORE:", "").replace("[", "").replace("]", "").strip()
            else:
                remaining_lines.append(line)
        summary = "\n".join(remaining_lines).strip()

        return jsonify({
            "summary": summary,
            "risk_level": risk_level,
            "risk_score": risk_score,
            "redacted_text": text[:8000],
            "filename": filename,
            "char_count": len(text),
            "pii_found": False  # Drafts from library are already clean
        })

    except Exception as e:
        return jsonify({"error": f"Analysis failed: {str(e)}"}), 500


# ──────────────────────────────────────────────
#  Quick Actions
# ──────────────────────────────────────────────

@document_bp.route("/translate", methods=["POST"])
@require_auth
def translate_action():
    data = request.get_json() or {}
    text = data.get("text", "").strip()
    language = data.get("language", "Hindi")
    if not text: return jsonify({"error": "No text provided."}), 400
    try:
        if _is_rate_limited(g.current_user.id): return jsonify({"error": "Rate limited."}), 429
        return jsonify({"result": translate_text(text, language)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@document_bp.route("/action-items", methods=["POST"])
@require_auth
def action_items_action():
    data = request.get_json() or {}
    text = data.get("redacted_context", "").strip()
    if not text: return jsonify({"error": "No context provided."}), 400
    try:
        if _is_rate_limited(g.current_user.id): return jsonify({"error": "Rate limited."}), 429
        return jsonify({"result": generate_action_items(text)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@document_bp.route("/draft-letter", methods=["POST"])
@require_auth
def draft_letter_action():
    data = request.get_json() or {}
    text = data.get("redacted_context", "").strip()
    intent = data.get("intent", "Draft a general polite reply.")
    if not text: return jsonify({"error": "No context provided."}), 400
    try:
        if _is_rate_limited(g.current_user.id): return jsonify({"error": "Rate limited."}), 429
        return jsonify({"result": draft_letter(text, intent)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@document_bp.route("/lawyer-advice", methods=["POST"])
@require_auth
def lawyer_advice_action():
    data = request.get_json() or {}
    text = data.get("redacted_context", "").strip()
    if not text: return jsonify({"error": "No context provided."}), 400
    try:
        if _is_rate_limited(g.current_user.id): return jsonify({"error": "Rate limited."}), 429
        return jsonify({"result": find_lawyer_advice(text)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@document_bp.route("/analyze-risk", methods=["POST"])
@require_auth
def analyze_risk_action():
    data = request.get_json() or {}
    text = data.get("redacted_context", "").strip()
    if not text: return jsonify({"error": "No context provided."}), 400
    try:
        if _is_rate_limited(g.current_user.id): return jsonify({"error": "Rate limited."}), 429
        return jsonify({"result": analyze_risk(text)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@document_bp.route("/extract-deadlines", methods=["POST"])
@require_auth
def extract_deadlines_action():
    data = request.get_json() or {}
    text = data.get("redacted_context", "").strip()
    if not text: return jsonify({"error": "No context provided."}), 400
    try:
        if _is_rate_limited(g.current_user.id): return jsonify({"error": "Rate limited."}), 429
        return jsonify({"result": extract_deadlines(text)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@document_bp.route("/negotiate", methods=["POST"])
@require_auth
def negotiate_action():
    data = request.get_json() or {}
    text = data.get("redacted_context", "").strip()
    if not text: return jsonify({"error": "No context provided."}), 400
    try:
        if _is_rate_limited(g.current_user.id): return jsonify({"error": "Rate limited."}), 429
        return jsonify({"result": negotiate_clause(text)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@document_bp.route("/what-if", methods=["POST"])
@require_auth
def what_if_action():
    data = request.get_json() or {}
    text = data.get("redacted_context", "").strip()
    scenario = data.get("scenario", "").strip()
    if not text or not scenario: return jsonify({"error": "Context and scenario required."}), 400
    try:
        if _is_rate_limited(g.current_user.id): return jsonify({"error": "Rate limited."}), 429
        return jsonify({"result": simulate_what_if(text, scenario)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ──────────────────────────────────────────────

#  Health Check
# ──────────────────────────────────────────────

@document_bp.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "running", "service": "SmartLaw API"})
