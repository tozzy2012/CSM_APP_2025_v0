from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import uuid4
import crud
import schemas
import models
from database import get_db

router = APIRouter(
    prefix="/activities",
    tags=["activities"]
)

@router.get("/", response_model=List[schemas.ActivityResponse])
def list_activities(
    organization_id: str = Query(..., alias="organizationId"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    activities = crud.get_activities(db, organization_id=organization_id, skip=skip, limit=limit)
    return activities

@router.get("/{activity_id}", response_model=schemas.ActivityResponse)
def get_activity(
    activity_id: str,
    organization_id: str = Query(..., alias="organizationId"),
    db: Session = Depends(get_db)
):
    activity = crud.get_activity(db, activity_id=activity_id, organization_id=organization_id)
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    return activity

@router.post("/", response_model=schemas.ActivityResponse, status_code=status.HTTP_201_CREATED)
def create_activity(
    activity: schemas.ActivityCreate,
    db: Session = Depends(get_db)
):
    activity_id = str(uuid4())
    # Similar to Tasks, ActivityCreate might be missing organization_id in schema.
    # ActivityBase (Line 331) has title, description...
    # ActivityCreate (Line 348) has account_id.
    # Missing organization_id.
    
    return crud.create_activity(
        db=db,
        activity=activity,
        organization_id=activity.organization_id, # Requires schema fix
        activity_id=activity_id,
        created_by="system"
    )

@router.put("/{activity_id}", response_model=schemas.ActivityResponse)
def update_activity(
    activity_id: str,
    activity_update: schemas.ActivityUpdate,
    organization_id: str = Query(..., alias="organizationId"),
    db: Session = Depends(get_db)
):
    activity = crud.update_activity(db, activity_id=activity_id, organization_id=organization_id, activity_update=activity_update)
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    return activity

@router.delete("/{activity_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_activity(
    activity_id: str,
    organization_id: str = Query(..., alias="organizationId"),
    db: Session = Depends(get_db)
):
    success = crud.delete_activity(db, activity_id=activity_id, organization_id=organization_id)
    if not success:
        raise HTTPException(status_code=404, detail="Activity not found")
    return None
