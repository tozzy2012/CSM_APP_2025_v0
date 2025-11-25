"""
CRUD Operations for Organizations and Users
Multi-tenant user and organization management
"""
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
import time
from datetime import datetime

import models
import schemas
from password_utils import hash_password, verify_password


# ============================================================================
# ORGANIZATION CRUD
# ============================================================================

def get_organization(db: Session, org_id: str) -> Optional[dict]:
    """Get organization by ID"""
    # Since we use localStorage IDs, query by ID directly
    # In the future, this might query tenants table
    # For now, return from localStorage format or minimal structure
    return {"id": org_id, "name": "Organization"}


def get_all_organizations(db: Session) -> List[dict]:
    """Get all organizations (SUPER_ADMIN only)"""
    # Return all organizations from custom storage or tenants table
    # This will be extended when we fully migrate to database
    return []


def create_organization_with_admin(
    db: Session,
    org_data: schemas.OrganizationCreate
) -> tuple[dict, models.User]:
    """
    Create a new organization and its admin user
    Returns: (organization_dict, admin_user_model)
    """
    # Generate IDs
    org_id = f"org-{int(time.time() * 1000)}"
    admin_id = f"user-{int(time.time() * 1000) + 1}"
    
    # Create admin user in database
    admin_user = models.User(
        id=admin_id,
        email=org_data.admin_email,
        password_hash=hash_password(org_data.admin_password),
        name=org_data.admin_name,
        role="ORG_ADMIN",
        organization_id=org_id,
        active=True
    )
    
    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)
    
    # Organization object (simplified for now - can be stored in tenants table later)
    organization = {
        "id": org_id,
        "name": org_data.name,
        "plan": org_data.plan,
        "status": "active",
        "createdAt": datetime.utcnow().isoformat(),
        "active": True
    }
    
    return organization, admin_user


def update_organization_and_admin(
    db: Session,
    org_id: str,
    org_data: schemas.OrganizationUpdate
) -> dict:
    """Update organization and optionally its admin"""
    # Find admin user for this organization
    admin = db.query(models.User).filter(
        models.User.organization_id == org_id,
        models.User.role == "ORG_ADMIN"
    ).first()
    
    if admin and org_data.admin_name:
        admin.name = org_data.admin_name
    if admin and org_data.admin_email:
        admin.email = org_data.admin_email
    if admin and org_data.admin_password:
        admin.password_hash = hash_password(org_data.admin_password)
    
    db.commit()
    
    # Return updated org data
    return {
        "id": org_id,
        "name": org_data.name or "Organization",
        "plan": org_data.plan or "starter",
        "status": org_data.status or "active",
        "createdAt": datetime.utcnow().isoformat(),
        "active": True
    }


def delete_organization(db: Session, org_id: str) -> bool:
    """Delete organization and all its users"""
    # Delete all users in this organization
    db.query(models.User).filter(models.User.organization_id == org_id).delete()
    
    # Delete all data belonging to this organization
    db.query(models.Client).filter(models.Client.organization_id == org_id).delete()
    db.query(models.Account).filter(models.Account.organization_id == org_id).delete()
    db.query(models.Task).filter(models.Task.organization_id == org_id).delete()
    db.query(models.Activity).filter(models.Activity.organization_id == org_id).delete()
    db.query(models.Playbook).filter(models.Playbook.organization_id == org_id).delete()
    
    db.commit()
    return True


# ============================================================================
# USER CRUD
# ============================================================================

def get_user_by_id(db: Session, user_id: str) -> Optional[models.User]:
    """Get user by ID"""
    return db.query(models.User).filter(models.User.id == user_id).first()


def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    """Get user by email"""
    return db.query(models.User).filter(models.User.email == email).first()


def get_users_by_organization(db: Session, org_id: str) -> List[models.User]:
    """Get all users in an organization"""
    return db.query(models.User).filter(
        models.User.organization_id == org_id
    ).all()


def get_all_users(db: Session, skip: int = 0, limit: int = 100) -> List[models.User]:
    """Get all users (SUPER_ADMIN only)"""
    return db.query(models.User).offset(skip).limit(limit).all()


def create_user(db: Session, user_data: schemas.UserCreate) -> models.User:
    """Create a new user"""
    user_id = f"user-{int(time.time() * 1000)}"
    
    user = models.User(
        id=user_id,
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        name=user_data.name,
        role=user_data.role,
        organization_id=user_data.organization_id,
        active=True
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return user


def update_user(
    db: Session,
    user_id: str,
    user_data: schemas.UserUpdate
) -> Optional[models.User]:
    """Update user"""
    user = get_user_by_id(db, user_id)
    if not user:
        return None
    
    if user_data.email:
        user.email = user_data.email
    if user_data.name:
        user.name = user_data.name
    if user_data.role:
        user.role = user_data.role
    if user_data.organization_id is not None:
        user.organization_id = user_data.organization_id
    if user_data.active is not None:
        user.active = user_data.active
    
    user.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(user)
    
    return user


def delete_user(db: Session, user_id: str) -> bool:
    """Delete (deactivate) user"""
    user = get_user_by_id(db, user_id)
    if not user:
        return False
    
    user.active = False
    db.commit()
    
    return True


def authenticate_user(db: Session, email: str, password: str) -> Optional[models.User]:
    """Authenticate user with email and password"""
    user = get_user_by_email(db, email)
    
    if not user or not user.active:
        return None
    
    if not verify_password(password, user.password_hash):
        return None
    
    return user


def change_user_password(
    db: Session,
    user_id: str,
    current_password: str,
    new_password: str
) -> bool:
    """Change user password"""
    user = get_user_by_id(db, user_id)
    if not user:
        return False
    
    # Verify current password
    if not verify_password(current_password, user.password_hash):
        return False
    
    # Set new password
    user.password_hash = hash_password(new_password)
    user.updated_at = datetime.utcnow()
    
    db.commit()
    
    return True
