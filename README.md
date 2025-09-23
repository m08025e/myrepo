# マスターテーブル管理アプリケーション

本プロジェクトは、複数のマスターテーブルを横断的にCRUD操作できるFastAPIベースのWebアプリケーションです。利用者はWebブラウザ上で商品マスターと従業員マスターを切り替えながら、レコードの新規作成・更新・削除を行えます。

## 主な構成要素

| ファイル / ディレクトリ | 説明 |
| --- | --- |
| `main.py` | FastAPIアプリケーション本体とCRUDエンドポイントを定義しています。 |
| `database.py` | SQLAlchemyのエンジンおよびセッションファクトリを定義します。 |
| `models.py` | `products` と `employees` テーブルのORMモデルを定義します。 |
| `schemas.py` | 入出力バリデーション用のPydanticモデルを定義します。 |
| `static/index.html` | 管理画面のHTML。単一ページでテーブル切り替えとCRUDを提供します。 |
| `static/style.css` | UIのスタイルシート。シンプルでクリーンなデザインです。 |
| `static/script.js` | Fetch APIを用いてデータ取得・モーダル表示・CRUD操作を実装したJavaScript。 |
| `.env` | データベース接続文字列を定義します。必要に応じて編集してください。 |
| `requirements.txt` | アプリケーションのPython依存パッケージ一覧です。 |

> **補足:** リポジトリには既存のサンプル（例: `obsidian-extension/`）も同梱されていますが、本アプリケーションとは独立しています。

## 動作要件

- Python 3.10 以上
- PostgreSQL 13 以上

## セットアップ手順

1. 依存関係のインストール
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # Windowsは .venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. PostgreSQLデータベースの準備
   ```sql
   CREATE DATABASE master_db;
   ```

3. `.env` の `DATABASE_URL` を実際の接続情報に更新します。
   ```env
   DATABASE_URL=postgresql+psycopg2://<ユーザー>:<パスワード>@localhost:5432/master_db
   ```

4. アプリケーションの起動
   ```bash
   uvicorn main:app --reload
   ```

5. ブラウザで `http://localhost:8000/` を開き、管理画面にアクセスします。

アプリケーション起動時にテーブルが存在しなければ自動生成されます。既存データが無い場合は、画面右上の「新規登録」ボタンからレコードを追加してください。

## API エンドポイント概要

| メソッド | パス | 説明 |
| --- | --- | --- |
| `GET` | `/api/tables` | 管理可能なテーブル一覧を取得します。 |
| `GET` | `/api/data/{table_name}` | 指定テーブルの列情報とレコード一覧を返します。 |
| `POST` | `/api/data/{table_name}` | 指定テーブルに新規レコードを作成します。 |
| `PUT` | `/api/data/{table_name}/{record_id}` | 指定レコードを更新します。 |
| `DELETE` | `/api/data/{table_name}/{record_id}` | 指定レコードを削除します。 |

## ライセンス

このリポジトリに特別なライセンスは設定されていません。必要に応じてプロジェクトポリシーに従ってください。
