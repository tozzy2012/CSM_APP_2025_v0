import os
import logging
import resend
from config import settings

# Configure logging
logger = logging.getLogger(__name__)

# Configure Resend
if settings.RESEND_API_KEY:
    resend.api_key = settings.RESEND_API_KEY
else:
    logger.warning("RESEND_API_KEY not set. Email sending will fail.")

async def send_invite_email(to_email: str, invite_token: str, invited_by_name: str = "Admin"):
    """
    Send an invite email to a new user.
    """
    if not settings.RESEND_API_KEY:
        logger.error("Cannot send email: RESEND_API_KEY not configured")
        return False
    
    logger.info(f"Attempting to send email to {to_email} with API Key: {settings.RESEND_API_KEY[:4]}***")

    try:
        # Construct invite URL
        # Assuming frontend is on port 3003 or configured domain
        base_url = settings.WORKOS_REDIRECT_URI.replace("/auth/callback", "").replace(":8000", ":3003")
        # If redirect URI is backend, we need to point to frontend
        if "localhost" in base_url or "127.0.0.1" in base_url:
             base_url = "http://localhost:3003"
        elif "unraidlab.online" in base_url:
             base_url = "https://csapp.unraidlab.online"
             
        invite_url = f"{base_url}/login?invite={invite_token}"

        html_content = f"""
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Você foi convidado!</h2>
            <p><strong>{invited_by_name}</strong> convidou você para a plataforma <strong>Zapper CS</strong>.</p>
            <p>Para aceitar o convite e acessar a plataforma, clique no botão abaixo:</p>
            <p style="text-align: center; margin: 30px 0;">
                <a href="{invite_url}"
                   style="background-color: #0066ff; color: white; padding: 12px 24px; 
                          text-decoration: none; border-radius: 6px; font-weight: bold;">
                    Aceitar Convite
                </a>
            </p>
            <p>Ou copie e cole este link no seu navegador:</p>
            <p><a href="{invite_url}">{invite_url}</a></p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #666; font-size: 12px;">
                Este convite expira em 7 dias. Se você não esperava este convite, pode ignorar este email.
            </p>
        </div>
        """

        params = {
            "from": settings.FROM_EMAIL,
            "to": [to_email],
            "subject": "Você foi convidado para o Zapper CS",
            "html": html_content,
        }

        email = resend.Emails.send(params)
        logger.info(f"Invite email sent to {to_email}: {email}")
        return True

    except Exception as e:
        logger.error(f"Failed to send invite email to {to_email}: {str(e)}")
        return False
