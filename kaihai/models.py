from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, Column, Date, Integer, String, TIMESTAMP
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    price = Column(Integer, nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(TIMESTAMP, nullable=False, default=datetime.utcnow)


class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    department = Column(String(50), nullable=True)
    email = Column(String(100), nullable=True, unique=True)
    hire_date = Column(Date, nullable=False)
    created_at = Column(TIMESTAMP, nullable=False, default=datetime.utcnow)
