from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import uuid4
import crud
import schemas
import models
from database import get_db

router = APIRouter(
    prefix="/tasks",
    tags=["tasks"]
)

@router.get("/", response_model=List[schemas.TaskResponse])
def list_tasks(
    organization_id: str = Query(..., alias="organizationId"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    tasks = crud.get_tasks(db, organization_id=organization_id, skip=skip, limit=limit)
    return tasks

@router.get("/{task_id}", response_model=schemas.TaskResponse)
def get_task(
    task_id: str,
    organization_id: str = Query(..., alias="organizationId"),
    db: Session = Depends(get_db)
):
    task = crud.get_task(db, task_id=task_id, organization_id=organization_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@router.post("/", response_model=schemas.TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    task: schemas.TaskCreate,
    db: Session = Depends(get_db)
):
    # Generate ID if not provided (though usually frontend might not provide it, backend should)
    # In this system, it seems we use string IDs.
    task_id = str(uuid4())
    
    # We need organization_id from the body, as it's part of TaskBase
    # schemas.TaskCreate inherits from TaskBase which has organization_id?
    # Let's check schemas.py again. 
    # TaskBase has organization_id? No, let's check Step 71.
    # Step 71: TaskBase has title, description, status, priority, assignee, due_date.
    # TaskResponse has organization_id.
    # TaskCreate has account_id.
    # Wait, where is organization_id in TaskCreate?
    # It seems missing in TaskCreate in schemas.py!
    # Let's check schemas.py in Step 71.
    # Line 392: TaskBase
    # Line 408: TaskCreate(TaskBase) -> adds account_id.
    # It does NOT have organization_id.
    # But models.Task (Step 70, line 184) has organization_id as nullable=False.
    # This is a bug in schemas.py or I need to pass it separately?
    # In crud.py create_task takes organization_id as an argument.
    # So I should probably expect it in the request body or query param?
    # Usually it's in the body.
    # I will assume for now I need to fix schemas.py or pass it via query param?
    # No, creating a resource usually has all data in body.
    # I will check how other creates are done.
    # ClientCreate (Line 104) inherits ClientBase (Line 83) which has organization_id.
    # AccountCreate (Line 163) inherits AccountBase (Line 141) which has organization_id.
    # TaskBase (Line 392) DOES NOT have organization_id.
    # So TaskCreate is missing organization_id.
    # I MUST FIX schemas.py first or add it to TaskCreate.
    
    # For now, I will assume I'll fix schemas.py to include organization_id in TaskCreate/TaskBase
    # OR I will accept it as a query param, but that's ugly for POST.
    # I will add it to the router logic to extract from body if I fix the schema.
    
    # Wait, I can't modify schemas.py in this tool call.
    # I will write this file assuming schemas.TaskCreate WILL have organization_id.
    # Actually, I should fix schemas.py first.
    # But I'm already writing this file.
    # I'll write it assuming `task.organization_id` exists, and then I'll fix schemas.py immediately after.
    
    return crud.create_task(
        db=db,
        task=task,
        organization_id=task.organization_id, # This requires schema fix
        task_id=task_id,
        created_by="system" # TODO: Get from auth
    )

@router.put("/{task_id}", response_model=schemas.TaskResponse)
def update_task(
    task_id: str,
    task_update: schemas.TaskUpdate,
    organization_id: str = Query(..., alias="organizationId"),
    db: Session = Depends(get_db)
):
    task = crud.update_task(db, task_id=task_id, organization_id=organization_id, task_update=task_update)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: str,
    organization_id: str = Query(..., alias="organizationId"),
    db: Session = Depends(get_db)
):
    success = crud.delete_task(db, task_id=task_id, organization_id=organization_id)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found")
    return None
