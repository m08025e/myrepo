from __future__ import annotations

from datetime import date, datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, EmailStr, Field


class ProductBase(BaseModel):
    name: str = Field(..., max_length=100)
    price: int = Field(..., ge=0)
    is_active: bool = True


class ProductCreate(ProductBase):
    pass


class ProductUpdate(ProductBase):
    pass


class ProductRead(ProductBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True


class EmployeeBase(BaseModel):
    name: str = Field(..., max_length=100)
    department: Optional[str] = Field(None, max_length=50)
    email: Optional[EmailStr] = None
    hire_date: date


class EmployeeCreate(EmployeeBase):
    pass


class EmployeeUpdate(EmployeeBase):
    pass


class EmployeeRead(EmployeeBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True


class ColumnInfo(BaseModel):
    key: str
    label: str


class FieldInfo(BaseModel):
    name: str
    label: str
    input_type: str
    required: bool


class TableDataResponse(BaseModel):
    display_name: str
    columns: List[ColumnInfo]
    fields: List[FieldInfo]
    records: List[Dict[str, Any]]
