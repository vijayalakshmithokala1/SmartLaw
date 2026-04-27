from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    is_verified = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'is_verified': self.is_verified,
            'created_at': self.created_at.isoformat()
        }


class RevokedToken(db.Model):
    """
    Token blacklist — stores JWT tokens that have been explicitly revoked on logout.
    Implements AuthService.revokeToken() as per the system class diagram.
    Expired tokens are automatically ignored since we still validate JWT expiry.
    """
    __tablename__ = 'revoked_tokens'

    id = db.Column(db.Integer, primary_key=True)
    jti = db.Column(db.String(512), unique=True, nullable=False, index=True)  # raw token
    revoked_at = db.Column(db.DateTime, default=datetime.utcnow)

    @classmethod
    def revoke(cls, token: str):
        """Blacklist a token on logout."""
        if not cls.query.filter_by(jti=token).first():
            db.session.add(cls(jti=token))
            db.session.commit()

    @classmethod
    def is_revoked(cls, token: str) -> bool:
        """Return True if the token has been explicitly revoked."""
        return cls.query.filter_by(jti=token).first() is not None
