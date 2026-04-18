import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")

def send_verification_email(to_email: str, verify_link: str, username: str):
    """
    Sends an HTML verification email.
    If SMTP credentials are not configured, it will print the link to the console.
    """
    # Check if SMTP is configured correctly
    is_mock = not SMTP_USERNAME or not SMTP_PASSWORD or SMTP_USERNAME == "your-email@gmail.com"

    if is_mock:
        print("\n" + "📧 " + "="*58)
        print("⚠️  SMTP CREDENTIALS NOT CONFIGURED (MOCK MODE)  ⚠️")
        print(f"To: {to_email}")
        print(f"Subject: Verify your SmartLaw Account")
        print(f"Verification Link: {verify_link}")
        print("="*60 + "\n")
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Verify your SmartLaw Account"
        msg["From"] = f"SmartLaw <{SMTP_USERNAME}>"
        msg["To"] = to_email

        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; background-color: #f4f4f5; padding: 20px;">
            <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; border: 1px solid #e4e4e7;">
                <h2 style="color: #07090F; margin-top: 0;">Welcome to SmartLaw, {username}!</h2>
                <p style="color: #475569; line-height: 1.6;">
                    Thank you for joining SmartLaw. To ensure the security of your private legal documents, we require all users to verify their email addresses.
                </p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{verify_link}" style="background-color: #C9A84C; color: #07090F; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block;">
                        Verify Email Address
                    </a>
                </div>
                <p style="color: #475569; font-size: 13px;">
                    If the button doesn't work, copy and paste this link into your browser:<br>
                    <a href="{verify_link}" style="color: #3B82F6;">{verify_link}</a>
                </p>
                <hr style="border: 0; border-top: 1px solid #e4e4e7; margin: 20px 0;">
                <p style="color: #94A3B8; font-size: 12px; margin-bottom: 0;">
                    SmartLaw Privacy-First Legal Platform
                </p>
            </div>
        </body>
        </html>
        """
        
        part = MIMEText(html_content, "html")
        msg.attach(part)

        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        server.sendmail(SMTP_USERNAME, to_email, msg.as_string())
        server.quit()
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False

def send_password_reset_email(to_email: str, reset_link: str, username: str):
    """
    Sends an HTML password reset email.
    """
    is_mock = not SMTP_USERNAME or not SMTP_PASSWORD or SMTP_USERNAME == "your-email@gmail.com"

    if is_mock:
        print("\n" + "📧 " + "="*58)
        print("⚠️  SMTP CREDENTIALS NOT CONFIGURED (MOCK MODE)  ⚠️")
        print(f"To: {to_email}")
        print(f"Subject: Reset your SmartLaw Password")
        print(f"Reset Link: {reset_link}")
        print("="*60 + "\n")
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Reset your SmartLaw Password"
        msg["From"] = f"SmartLaw <{SMTP_USERNAME}>"
        msg["To"] = to_email

        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; background-color: #f4f4f5; padding: 20px;">
            <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; border: 1px solid #e4e4e7;">
                <h2 style="color: #07090F; margin-top: 0;">Password Reset Request</h2>
                <p style="color: #475569; line-height: 1.6;">
                    Hi {username},<br><br>
                    We received a request to reset your SmartLaw password. If you didn't make this request, you can safely ignore this email.
                </p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{reset_link}" style="background-color: #C9A84C; color: #07090F; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block;">
                        Reset Password
                    </a>
                </div>
                <p style="color: #475569; font-size: 13px;">
                    This link will expire in 1 hour.<br><br>
                    If the button doesn't work, copy and paste this link into your browser:<br>
                    <a href="{reset_link}" style="color: #3B82F6;">{reset_link}</a>
                </p>
                <hr style="border: 0; border-top: 1px solid #e4e4e7; margin: 20px 0;">
                <p style="color: #94A3B8; font-size: 12px; margin-bottom: 0;">
                    SmartLaw Privacy-First Legal Platform
                </p>
            </div>
        </body>
        </html>
        """
        
        part = MIMEText(html_content, "html")
        msg.attach(part)

        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        server.sendmail(SMTP_USERNAME, to_email, msg.as_string())
        server.quit()
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False
