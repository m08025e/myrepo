from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, List

from fastapi import Depends, FastAPI, HTTPException, Path as FastAPIPath
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from database import engine, get_db
from models import Base, Employee, Product
from schemas import (
    ColumnInfo,
    EmployeeCreate,
    EmployeeRead,
    EmployeeUpdate,
    FieldInfo,
    ProductCreate,
    ProductRead,
    ProductUpdate,
    TableDataResponse,
)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="マスターテーブル管理API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

STATIC_DIR = Path("static")
STATIC_DIR.mkdir(exist_ok=True)
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

TABLE_CONFIG: Dict[str, Dict[str, Any]] = {
    "products": {
        "display_name": "商品マスター",
        "model": Product,
        "create_schema": ProductCreate,
        "update_schema": ProductUpdate,
        "read_schema": ProductRead,
        "columns": [
            ColumnInfo(key="id", label="ID"),
            ColumnInfo(key="name", label="商品名"),
            ColumnInfo(key="price", label="単価"),
            ColumnInfo(key="is_active", label="有効"),
            ColumnInfo(key="created_at", label="作成日時"),
        ],
        "fields": [
            FieldInfo(name="name", label="商品名", input_type="text", required=True),
            FieldInfo(name="price", label="単価", input_type="number", required=True),
            FieldInfo(name="is_active", label="有効", input_type="checkbox", required=True),
        ],
    },
    "employees": {
        "display_name": "従業員マスター",
        "model": Employee,
        "create_schema": EmployeeCreate,
        "update_schema": EmployeeUpdate,
        "read_schema": EmployeeRead,
        "columns": [
            ColumnInfo(key="id", label="ID"),
            ColumnInfo(key="name", label="従業員名"),
            ColumnInfo(key="department", label="部署"),
            ColumnInfo(key="email", label="メール"),
            ColumnInfo(key="hire_date", label="入社日"),
            ColumnInfo(key="created_at", label="作成日時"),
        ],
        "fields": [
            FieldInfo(name="name", label="従業員名", input_type="text", required=True),
            FieldInfo(name="department", label="部署", input_type="text", required=False),
            FieldInfo(name="email", label="メール", input_type="email", required=False),
            FieldInfo(name="hire_date", label="入社日", input_type="date", required=True),
        ],
    },
}

TABLE_OPTIONS: List[Dict[str, str]] = [
    {"value": key, "label": f"{config['display_name']} ({key})"}
    for key, config in TABLE_CONFIG.items()
]


def get_table_config(table_name: str) -> Dict[str, Any]:
    table = TABLE_CONFIG.get(table_name)
    if table is None:
        raise HTTPException(status_code=404, detail="指定されたテーブルは存在しません。")
    return table


@app.get("/", response_class=FileResponse)
def read_index() -> FileResponse:
    index_path = STATIC_DIR / "index.html"
    if not index_path.exists():
        raise HTTPException(status_code=404, detail="フロントエンドが見つかりません。")
    return FileResponse(index_path)


@app.get("/api/tables")
def list_tables() -> List[Dict[str, str]]:
    return TABLE_OPTIONS


@app.get("/api/data/{table_name}", response_model=TableDataResponse)
def read_table_data(
    table_name: str = FastAPIPath(..., description="テーブル名"),
    db: Session = Depends(get_db),
) -> TableDataResponse:
    config = get_table_config(table_name)
    model = config["model"]
    read_schema = config["read_schema"]

    items = db.query(model).order_by(model.id).all()
    records = [read_schema.from_orm(item).dict() for item in items]

    return TableDataResponse(
        display_name=config["display_name"],
        columns=config["columns"],
        fields=config["fields"],
        records=records,
    )


@app.post("/api/data/{table_name}")
def create_record(
    payload: Dict[str, Any],
    table_name: str = FastAPIPath(..., description="テーブル名"),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    config = get_table_config(table_name)
    create_schema = config["create_schema"](**payload)
    model = config["model"](**create_schema.dict())

    db.add(model)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail="登録に失敗しました。入力内容を確認してください。") from exc
    db.refresh(model)

    return config["read_schema"].from_orm(model).dict()


@app.put("/api/data/{table_name}/{record_id}")
def update_record(
    payload: Dict[str, Any],
    table_name: str = FastAPIPath(..., description="テーブル名"),
    record_id: int = FastAPIPath(..., description="レコードID"),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    config = get_table_config(table_name)
    model = config["model"]
    instance = db.get(model, record_id)
    if instance is None:
        raise HTTPException(status_code=404, detail="指定されたレコードが見つかりません。")

    update_schema = config["update_schema"](**payload)
    for key, value in update_schema.dict().items():
        setattr(instance, key, value)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail="更新に失敗しました。入力内容を確認してください。") from exc
    db.refresh(instance)

    return config["read_schema"].from_orm(instance).dict()


@app.delete("/api/data/{table_name}/{record_id}")
def delete_record(
    table_name: str = FastAPIPath(..., description="テーブル名"),
    record_id: int = FastAPIPath(..., description="レコードID"),
    db: Session = Depends(get_db),
) -> Dict[str, str]:
    config = get_table_config(table_name)
    model = config["model"]
    instance = db.get(model, record_id)
    if instance is None:
        raise HTTPException(status_code=404, detail="指定されたレコードが見つかりません。")

    db.delete(instance)
    db.commit()

    return {"detail": "削除しました。"}
