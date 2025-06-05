from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, date

from src.models import get_db, User
from src.routes.auth import get_current_active_user

# Criar router
router = APIRouter()

# Rota temporária
@router.get("/")
async def read_calculos(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return {"message": "Endpoint de cálculos em desenvolvimento"}

