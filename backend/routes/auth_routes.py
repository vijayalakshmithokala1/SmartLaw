"""
Authentication Routes
POST /api/auth/register  — Create new account
POST /api/auth/login     — Login and receive JWT
GET  /api/auth/me        — Get current user info (requires token)
"""
import os
import bcrypt
import jwt
from datetime import datetime, timedelta, timezone
from flask import Blueprint, request, jsonify, g, redirect
from functools import wraps
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadTimeSignature
from models import db, User
from services.email_service import send_verification_email, send_password_reset_email

auth_bp = Blueprint("auth", __name__)

JWT_SECRET = os.getenv("JWT_SECRET", "smartlaw-super-secret-key-change-in-production")
JWT_EXPIRY_DAYS = 7
BACKEND_URL = os.getenv("BACKEND_URL", "http://127.0.0.1:5000")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# Serializer for verification tokens
# It uses the same JWT_SECRET to generate a secure, url-safe token for emails
verify_serializer = URLSafeTimedSerializer(JWT_SECRET)
reset_serializer = URLSafeTimedSerializer(JWT_SECRET)


# ──────────────────────────────────────────────
#  JWT Helpers
# ──────────────────────────────────────────────

def generate_token(user_id: int, email: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRY_DAYS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def decode_token(token: str) -> dict:
    return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])


def require_auth(f):
    """Decorator to protect routes — injects g.current_user."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Authentication required"}), 401
        token = auth_header[7:]
        try:
            payload = decode_token(token)
            user = User.query.get(payload["user_id"])
            if not user:
                return jsonify({"error": "User not found"}), 401
            g.current_user = user
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Session expired. Please log in again."}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401
        return f(*args, **kwargs)
    return decorated


# ──────────────────────────────────────────────
#  Routes
# ──────────────────────────────────────────────

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    # Validation
    if not all([name, email, password]):
        return jsonify({"error": "Name, email, and password are all required."}), 400

    if len(name) < 2:
        return jsonify({"error": "Name must be at least 2 characters."}), 400

    if "@" not in email or "." not in email:
        return jsonify({"error": "Please enter a valid email address."}), 400

    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters."}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "An account with this email already exists."}), 409

    # Hash password
    password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    user = User(name=name, email=email, password_hash=password_hash, is_verified=False)
    db.session.add(user)
    db.session.commit()

    # Generate an email verification token (valid for 24 hours)
    token = verify_serializer.dumps(user.email, salt='email-verify')
    verify_link = f"{BACKEND_URL}/api/auth/verify/{token}"
    
    # Send email (or print to console based on env variable setup)
    send_verification_email(to_email=user.email, verify_link=verify_link, username=user.name)

    response_data = {
        "status": "verification_sent",
        "message": f"Account created! Please check {user.email} to verify your account before logging in."
    }

    # In development, return the link directly to save time
    if os.getenv("DEVELOPMENT_MODE") == "true":
        response_data["verify_link"] = verify_link

    return jsonify(response_data), 201


@auth_bp.route("/verify/<token>", methods=["GET"])
def verify_email(token):
    try:
        # Token expires after 86400 seconds (24 hours)
        email = verify_serializer.loads(token, salt='email-verify', max_age=86400)
    except SignatureExpired:
        return "<h1>Verification link expired</h1><p>Please register again or request a new link.</p>", 400
    except BadTimeSignature:
        return "<h1>Invalid verification link</h1><p>The link is broken or invalid.</p>", 400
        
    user = User.query.filter_by(email=email).first()
    if not user:
        return "<h1>User not found</h1><p>It seems this account was deleted.</p>", 404
        
    if user.is_verified:
        return redirect(f"{FRONTEND_URL}/?verified=already")
        
    user.is_verified = True
    db.session.commit()
    
    # Redirect to the frontend with a success parameter
    return redirect(f"{FRONTEND_URL}/?verified=true")


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required."}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not bcrypt.checkpw(password.encode("utf-8"), user.password_hash.encode("utf-8")):
        return jsonify({"error": "Invalid email or password."}), 401
        
    if not user.is_verified:
        return jsonify({"error": "Please verify your email address before logging in. Check your inbox for the verification link."}), 403

    token = generate_token(user.id, user.email)
    return jsonify({
        "token": token,
        "user": user.to_dict(),
        "message": f"Welcome back, {user.name}!"
    })


@auth_bp.route("/me", methods=["GET"])
@require_auth
def get_me():
    return jsonify({"user": g.current_user.to_dict()})


@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()

    if not email:
        return jsonify({"error": "Email is required."}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        # Don't reveal if account exists to prevent email enumeration attacks
        return jsonify({"message": "If an account exists with this email, a password reset link has been sent."}), 200

    # Generate an email reset token (valid for 1 hour)
    token = reset_serializer.dumps(user.email, salt='password-reset')
    reset_link = f"{FRONTEND_URL}/reset-password?token={token}"
    
    send_password_reset_email(to_email=user.email, reset_link=reset_link, username=user.name)

    response_data = {
        "message": "If an account exists with this email, a password reset link has been sent."
    }

    # In development, return the link directly to save time
    if os.getenv("DEVELOPMENT_MODE") == "true":
        response_data["reset_link"] = reset_link

    return jsonify(response_data), 200


@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    data = request.get_json() or {}
    token = data.get("token")
    new_password = data.get("new_password")

    if not token or not new_password:
        return jsonify({"error": "Token and new password are required."}), 400

    if len(new_password) < 8:
        return jsonify({"error": "Password must be at least 8 characters."}), 400

    try:
        # Token expires after 3600 seconds (1 hour)
        email = reset_serializer.loads(token, salt='password-reset', max_age=3600)
    except SignatureExpired:
        return jsonify({"error": "The password reset link has expired. Please request a new one."}), 400
    except BadTimeSignature:
        return jsonify({"error": "The password reset link is invalid or corrupted."}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "User not found."}), 404

    # Hash new password
    password_hash = bcrypt.hashpw(new_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    
    user.password_hash = password_hash
    db.session.commit()

    return jsonify({"message": "Your password has been successfully reset. You can now log in."}), 200
