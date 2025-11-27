from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import logging
import traceback

from database import get_db
from auth import get_current_user, CurrentUser
import crud
import schemas
import models

router = APIRouter(
    prefix="/tenants",
    tags=["Tenants"]
)

logger = logging.getLogger(__name__)

@router.get(
    "/default",
    response_model=schemas.TenantResponse,
    summary="Get Default Tenant",
    description="Returns the default tenant (or the first one found). Creates one if none exists."
)
async def get_default_tenant(
    db: Session = Depends(get_db),
    # current_user: CurrentUser = Depends(get_current_user) # Optional: require auth
):
    """Get or create default tenant"""
    try:
        # Try to find the first tenant
        tenant = db.query(models.Tenant).first()
        
        if not tenant:
            # Create a default tenant if none exists
            logger.info("No tenant found. Creating default tenant.")
            default_tenant = schemas.TenantCreate(
                name="Default Organization",
                subdomain="default",
                plan="starter",
                status="active",
                settings={}
            )
            tenant = crud.create_tenant(db, default_tenant)
            
        return tenant
    except Exception as e:
        logger.error(f"Error getting default tenant: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting default tenant: {str(e)}"
        )

@router.put(
    "/{tenant_id}",
    response_model=schemas.TenantResponse,
    summary="Update Tenant",
    description="Update tenant details including settings"
)
async def update_tenant(
    tenant_id: str,
    tenant_update: schemas.TenantUpdate,
    db: Session = Depends(get_db),
    # current_user: CurrentUser = Depends(get_current_user) # Optional: require auth
):
    """Update tenant"""
    try:
        # Convert string ID to UUID if necessary, or let Pydantic handle it if schema expects UUID
        # The model uses UUID, but the router receives string. 
        # Let's assume the ID passed is correct.
        
        db_tenant = db.query(models.Tenant).filter(models.Tenant.tenant_id == tenant_id).first()
        if not db_tenant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tenant {tenant_id} not found"
            )
            
        # Update fields
        update_data = tenant_update.model_dump(exclude_unset=True)
        logger.info(f"Updating tenant {tenant_id} with data: {update_data}")
        
        for field, value in update_data.items():
            setattr(db_tenant, field, value)
            
        # Force flag modified for JSON field if it exists in update
        if 'settings' in update_data:
            from sqlalchemy.orm.attributes import flag_modified
            flag_modified(db_tenant, "settings")
            logger.info(f"Settings updated to: {update_data['settings']}")
            
        db.commit()
        db.refresh(db_tenant)
        
        return db_tenant
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating tenant {tenant_id}: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating tenant: {str(e)}"
        )
