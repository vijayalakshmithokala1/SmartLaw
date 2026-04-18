# 🏛️ SmartLaw: Production-Grade Legal AI Platform

## ❗ Problem Statement
Legal professionals handle highly sensitive documents containing personal identifiers (PAN, Aadhaar, etc.).
Existing AI tools can expose this data to external models, creating serious privacy risks.


## 💡 Solution
SmartLaw is a privacy-first legal AI platform that analyzes documents, detects risks, and generates actionable insights—without exposing sensitive personal data to AI models.

## 🌐 Live Deployment

| Service | Link | Platform |
|---------|------|----------|
| 🖥️ **Frontend (App)** | [smart-law-kappa.vercel.app](https://smart-law-kappa.vercel.app/) | Vercel |
| ⚙️ **Backend (API)** | [smartlaw-backend.onrender.com](https://smartlaw-backend.onrender.com/) | Render |

> **💡 Presentation Tip:** Bookmark both links or open them in browser tabs before your demo starts. The Render backend may take ~30 seconds to wake up on first load (free tier cold start) — open it a minute early!

----

## 🧪 Quick Demo Guide
1. **Register/Login** via the frontend app.
2. **Upload a sample document** (You can use any standard NDA or employment contract PDF).
3. **Click "Analyze"** to process the document.
4. **Try the features**:
   - **Risk Audit**: Check the clause-level issues.
   - **Summary**: Read the plain-English explanation.
   - **Chat**: Ask specific questions about the document context.

---

SmartLaw is a secure legal document management and analysis platform. It leverages state-of-the-art AI (Llama 3.3) to provide deep legal insights while designed to ensure strict privacy through an advanced PII redaction and cloud-storage pipeline.

---

## 🌟 Project Highlights (Strengths)
1. **💎 Strong Core Idea**: Solves a real legal-tech problem with privacy-first AI inference (custom PII redaction + client-side restoration).
2. **🏗️ Distributed Architecture**: Dockerized backend, Gunicorn server, PostgreSQL production database, Cloudinary object storage, and separated frontend/backend deployments.
3. **⚡ Clean Architecture Separation**: Highly modular backend setup (`routes/` for API, `services/` for business logic, independent OCR/AI logic).
4. **🧠 Feature Depth**: Goes far beyond simple ChatGPT wrappers—delivers page-referenced risk auditing, actionable to-do generation, and targeted legal chat.

---

## 🚀 Core Philosophy: Privacy-First AI
Legal documents contain highly sensitive identifiers (Aadhaar, PAN, etc.). SmartLaw is designed so that real identifiers never reach the AI models:
- **Anonymized Inference**: PII is redacted before being sent to AI services. Sensitive identifiers are replaced with anonymous tokens.
- **Secure Processing**: Documents are temporarily processed in a secure backend environment for extraction and OCR.
- **Client-Side Restoration**: **PII mapping never leaves the browser and is not persisted server-side.** It remains strictly in the browser's volatile memory, enabling the UI to safely restore real values without the server or AI provider ever seeing them.
  - *(Technical Validation: The PII map is stored in React state only and is not persisted to storage. The backend never receives the original text after redaction.)*

### 📄 How It Works (Concrete Example)
**1. Original Document (Uploaded):**
> *Client PAN is ABCDE1234F.*

**2. Sent to AI (Cloud Backend):**
> *Client PAN is [PAN_1].*

**3. Restored on Frontend (Browser UI):**
> *Client PAN is ABCDE1234F.*

This architecture is designed to ensure your clients' sensitive information is never memorized or trained upon by external LLMs.

---

## 🏗️ System Architecture

```text
       [ User Browser ]
              ↓
    [ React Frontend — Vercel ]
    https://smart-law-kappa.vercel.app/
              ↓
    [ Flask API — Render / Docker / Gunicorn ]
    https://smartlaw-backend.onrender.com/
        ↙           ↓           ↘
[ PostgreSQL ] [ Cloudinary ] [ Groq API ]
 (Neon DB)     (File Storage)  (Llama 3.3)
```

---

## 🛠️ Technical Stack

### **Backend (Python / Flask / Docker)**
- **Framework**: Flask (Application Factory pattern).
- **Server**: Pro-grade `Gunicorn` WSGI server.
- **Database**: PostgreSQL (Production) with SQLite fallback (Development).
- **Storage**: **Cloudinary** for persistent, cloud-based file management.
- **OCR**: `Tesseract OCR` fully integrated via Docker system dependencies.
- **Containerization**: The backend is containerized using Docker to ensure consistent deployment with system-level dependencies.
- **AI**: **Groq API** (Llama 3.3 70B) for high-speed legal reasoning.

### **Frontend (React / Vite / Vercel)**
- **Framework**: React 19.
- **Styling**: Tailwind CSS 4.0 + Custom Glassmorphism.
- **Environment**: Dynamic API routing for Vercel deployment.

---

## 📸 Implementation Screenshots

### Dashboard
*Dashboard overview displaying active legal documents and their basic metrics.*
<img src="frontend/src/assets/dashboard.png" alt="Dashboard Screenshot" width="100%"/>

### Risk Audit & PII Redaction
*Risk audit highlighting clause-level issues with a PII redaction preview before AI processing.*
<img src="frontend/src/assets/analysis.png" alt="Analysis Screenshot" width="100%"/>

---

## ✨ Key Features & Capabilities

### 1. **Robust Document Processing**
- **Format Support**: PDF, DOCX, and Image-based documents (JPG/PNG).
- **Extraction**: Hybrid extraction using `pdfplumber` and `PyPDF2` fallback.
- **OCR Engine**: Tesseract-driven OCR for scanned legal papers.
- **Error Handling**: Graceful fallback and user feedback implemented for OCR or AI failures.

### 2. **Professional Legal AI Suite**
- **Risk Auditor**: Specialized AI persona that identifies harmful clauses and cites exact page numbers.
- **Summarizer**: Explains complex legal jargon in "chai-side" plain English.
- **Action Items**: Concrete, actionable To-Do checklists extracted from agreements.
- **Legal Chat**: Context-aware Q&A based on the uploaded document context.

---

## 📡 API Overview

A highly modular REST API powers the platform. Key endpoints include:

- `POST /auth/register` - Create a new secured user account
- `POST /auth/login` - Authenticate and receive a JWT
- `POST /documents/upload` - Securely upload and process a legal document
- `GET /documents/<id>` - Retrieve document analysis and metadata

---

## 📂 Project Structure

```text
SmartLaw/
├── backend/
│   ├── app.py              # Application Factory (Postgres + CORS logic)
│   ├── Dockerfile          # Production Build (Tesseract + Gunicorn)
│   ├── requirements.txt    # Production dependencies
│   ├── routes/
│   │   ├── auth_routes.py  # JWT-based Auth
│   │   └── document_routes.py # Cloud-based analysis logic
│   └── services/
│       ├── storage_service.py # Cloudinary & Temp Local Buffering
│       ├── pii_service.py     # Regex-based PII Redaction
│       ├── ai_service.py      # LLM Prompts & Integration
│       └── extraction_service.py # PDF & OCR Logic
├── frontend/
│   ├── src/
│   │   └── App.jsx         # Dynamic API Routing
│   └── vite.config.js
└── smartlaw.db             # Local dev database (Fallback)
```

---

## 📊 Performance Metrics
- **Average OCR Time**: ~3–5 seconds per page *(Observed on Render free tier during testing)*.
- **Average AI Response**: ~2–4 seconds per query *(Observed on Render free tier during testing)*.
- **Capacity limits**: Up to 20 pages per document per request.

---

## 🛡️ Security & Scalability
- **Strict Data Privacy**: PII mapping is maintained purely in client-side memory (never in localStorage or DB).
- **Authentication**: Stateless, time-limited JWT expiration strategy.
- **Transport Security**: Strict HTTPS enforcement across Vercel (Frontend) and Render (Backend).
- **Input Validation**: Strict server-side validation for file types (PDF, DOCX, Images) and file size (10MB limits).
- **Safe Cleaning**: All temporary OCR buffers are securely deleted immediately after extraction.
- **Database Scalability**: Native support for Render's `postgres://` to `postgresql://` URI mapping.

---

## 🧪 Deployment & Configuration

### **Environment Variables**
To deploy successfully, ensure the following variables are set:
- `DATABASE_URL`: PostgreSQL connection string.
- `GROQ_API_KEY`: Your Groq AI API key.
- `CLOUDINARY_CLOUD_NAME`: Cloudinary account name.
- `CLOUDINARY_API_KEY`: Cloudinary API key.
- `CLOUDINARY_API_SECRET`: Cloudinary API secret.
- `JWT_SECRET`: Secure string for token signing.
- `CORS_ORIGINS`: Allowed frontend URL (e.g., `https://smartlaw.vercel.app`).

### **Platform Strategy**
- **Backend**: Deploy `backend/` as a Docker web service on Render.
- **Frontend**: Deploy `frontend/` to Vercel (set `VITE_API_BASE_URL` to the Render service URL).

---

## ⚠️ Known Limitations
- OCR performance depends on server resources and may be slower on free-tier deployments.
- Large documents (>10MB) are restricted to ensure system stability.
- "Cold starts" on Render free tier may introduce initial request latency.
- **Production Reliability**: Currently lacks an automated CI/CD pipeline, and comprehensive unit/integration tests are still pending.
- **Monitoring**: No centralized error monitoring (e.g., Sentry) or explicit rate-limiting middleware is present in this iteration.

---

## 🚧 Future Enhancements
- **Strict Typing & Refactoring**: Migrate frontend to TypeScript and decouple large service classes.
- **Async Processing**: Background job queue (Celery/RQ) for long-running OCR and AI tasks.
- **Access Control**: Role-based Access Control (RBAC) for legal teams.
- **Encryption**: End-to-end encryption for stored documents.
- **Custom LLM**: Fine-tuned legal models for specialized jurisdiction reasoning.
