"""
WorkOS SSO Authentication Module  
Handles SSO authentication using WorkOS SDK v2.0
"""
from datetime import datetime, timedelta
from typing import Optional
from jose import jwt, JWTError
import workos
from workos.sso import SSO, SsoProviderType
from fastapi import HTTPException, status
from config import settings
from models import User
from sqlalchemy.orm import Session
import uuid

# Initialize WorkOS SSO client
workos.api_key = settings.WORKOS_API_KEY
workos.client_id = settings.WORKOS_CLIENT_ID

sso_client = None
if settings.WORKOS_API_KEY and settings.WORKOS_CLIENT_ID:
    try:
        sso_client = SSO()
    except Exception as e:
        print(f"Warning: Failed to initialize SSO client: {e}")
else:
    print("Warning: WorkOS SSO credentials not found. SSO features will be disabled.")

def get_authorization_url(provider: str, state: str) -> str:
    """
    Get WorkOS authorization URL for SSO login
    
    Args:
        provider: OAuth provider (e.g., 'GoogleOAuth', 'MicrosoftOAuth')
        state: CSRF protection state parameter
        
    Returns:
        Authorization URL to redirect user to
    """
    if not sso_client:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="SSO is not configured on this server"
        )

    try:
        print(f"Generating auth URL for provider: {provider}")
        # Convert string provider to SsoProviderType enum
        provider_type = getattr(SsoProviderType, provider)
        
        authorization_url = sso_client.get_authorization_url(
            provider=provider_type,
            redirect_uri=settings.WORKOS_REDIRECT_URI,
            state=state
        )
        print(f"Generated auth URL: {authorization_url}")
        return authorization_url
    except AttributeError:
        print(f"Invalid provider: {provider}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid provider: {provider}. Must be 'GoogleOAuth' or 'MicrosoftOAuth'"
        )
    except Exception as e:
        print(f"Error generating auth URL: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate authorization URL: {str(e)}"
        )


def handle_sso_callback(code: str, db: Session) -> dict:
    """
    Handle SSO callback from WorkOS
    
    Args:
        code: Authorization code from WorkOS
        db: Database session
        
    Returns:
        Dict with JWT token and user info
    """
    if not sso_client:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="SSO is not configured on this server"
        )

    try:
        print(f"🔵 [SSO] Exchanging code for profile...")
        # Exchange code for profile
        profile_and_token = sso_client.get_profile_and_token(code)
        profile = profile_and_token.profile
        print(f"🟢 [SSO] Profile received: {profile.email}")
       
        # Extract user info
        email = profile.email
        sso_user_id = profile.id
        sso_provider = profile.connection_type  # 'GoogleOAuth', 'MicrosoftOAuth', etc
        first_name = profile.first_name or ""
        last_name = profile.last_name or ""
        name = f"{first_name} {last_name}".strip() or email.split('@')[0]
        
        print(f"🔵 [SSO] Checking if user exists: {email}")
        # Check if user exists
        user = db.query(User).filter(User.email == email).first()
        
        if user:
            print(f"🟢 [SSO] User found, updating: {user.id}")
            # Update existing user with SSO info
            user.sso_provider = sso_provider
            user.sso_user_id = sso_user_id
            user.email_verified = True
            user.updated_at = datetime.utcnow()
            
            # Update avatar if available
            if hasattr(profile, 'raw_attributes') and profile.raw_attributes.get('picture'):
                user.avatar_url = profile.raw_attributes['picture']
                
        else:
            print(f"🔵 [SSO] User not found. Checking for valid invite: {email}")
            
            # Check for pending invite
            import crud
            invite = crud.get_invite_by_email(db, email)
            
            if not invite:
                print(f"🔴 [SSO] No pending invite found for {email}. Access denied.")
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Acesso negado. Você precisa de um convite para acessar a plataforma."
                )
            
            print(f"🟢 [SSO] Valid invite found! Role: {invite.role}")
            
            # Create new user with role from invite
            user = User(
                id=str(uuid.uuid4()),
                email=email,
                name=name,
                sso_provider=sso_provider,
                sso_user_id=sso_user_id,
                email_verified=True,
                active=True,
                password_hash=None,  # No password for SSO users
                # TODO: Add role field to User model if not exists, or handle permissions
                # For now assuming role is handled via organization or separate permissions
            )
            
            # Add avatar if available
            if hasattr(profile, 'raw_attributes') and profile.raw_attributes.get('picture'):
                user.avatar_url = profile.raw_attributes['picture']
            
            # If invite has organization, assign it
            if invite.organization_id:
                user.organization_id = invite.organization_id
                
            db.add(user)
            
            # Mark invite as accepted
            crud.update_invite_status(db, invite.id, "accepted", accepted_at=datetime.utcnow())
        
        print(f"🔵 [SSO] Committing to database...")
        db.commit()
        db.refresh(user)
        print(f"🟢 [SSO] User saved: {user.id}")
        
        # Generate JWT token
        print(f"🔵 [SSO] Generating JWT token...")
        access_token = create_access_token(
            data={"sub": user.email, "user_id": user.id}
        )
        print(f"🟢 [SSO] Token generated successfully")
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "avatar_url": user.avatar_url,
                "sso_provider": user.sso_provider,
                "email_verified": user.email_verified
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"📛 [SSO] Error: {str(e)}")
        print(f"📛 [SSO] Exception type: {type(e).__name__}")
        import traceback
        print(f"📛 [SSO] Traceback:")
        traceback.print_exc()
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"SSO authentication failed: {str(e)}"
        )


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create JWT access token
    
    Args:
        data: Data to encode in token
        expires_delta: Token expiration time
        
    Returns:
        JWT token string
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=7)  # 7 days default
        
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    
    return encoded_jwt
