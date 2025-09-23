# AI（Codex）向け開発指示書

## 1. プロジェクト概要
複数のマスターテーブルを横断的にCRUD操作できるWeb管理画面アプリケーションを開発してください。利用者は管理したいテーブルをドロップダウンリストで選択し、選択中テーブルのデータを1ページ上で追加・表示・更新・削除できるようにします。

## 2. 技術スタック
- **バックエンド**: Python（FastAPI）
- **フロントエンド**: HTML / CSS / JavaScript（プレーン実装）
- **データベース**: PostgreSQL（無料プランを使用）
- **Python ライブラリ**:
  - fastapi
  - uvicorn
  - sqlalchemy
  - psycopg2-binary
  - python-dotenv

## 3. データベース設計
PostgreSQL に以下の 2 つのマスターテーブルを作成してください。

### 3.1 products（商品マスター）
| カラム名 | データ型 | 制約 | 説明 |
| --- | --- | --- | --- |
| id | SERIAL | PRIMARY KEY | 商品ID（自動採番） |
| name | VARCHAR(100) | NOT NULL | 商品名 |
| price | INTEGER | NOT NULL | 単価 |
| is_active | BOOLEAN | NOT NULL, DEFAULT TRUE | 有効フラグ |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 作成日時 |

### 3.2 employees（従業員マスター）
| カラム名 | データ型 | 制約 | 説明 |
| --- | --- | --- | --- |
| id | SERIAL | PRIMARY KEY | 従業員ID（自動採番） |
| name | VARCHAR(100) | NOT NULL | 従業員名 |
| department | VARCHAR(50) |  | 所属部署 |
| email | VARCHAR(100) | UNIQUE | メールアドレス |
| hire_date | DATE | NOT NULL | 入社日 |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 作成日時 |

## 4. アプリケーション機能要件
単一ページ（`index.html`）で以下を実現してください。

### 4.1 画面構成
1. **ヘッダー**: 「マスターテーブル管理画面」というタイトルを表示。
2. **テーブル選択エリア**: 「管理対象テーブル」ラベル付きのドロップダウン。
   - 選択肢: 「商品マスター(products)」「従業員マスター(employees)」。
3. **データ表示・操作エリア**:
   - 選択されたテーブルのデータをHTML `<table>` で表示。
   - 各行に「編集」「削除」ボタンを配置。
4. **新規登録エリア**:
   - データ表示エリア上部に「新規登録」ボタン。
   - ボタンクリックで入力フォーム付きモーダルを表示。

### 4.2 CRUD 詳細
- **Read**: ページ初期表示・テーブル変更時に `/api/data/{table_name}` から全件取得し描画。非同期通信（Fetch APIなど）を利用。
- **Create**: モーダルフォーム（ID・作成日時除く入力項目）から `POST /api/data/{table_name}` へ送信。成功時にモーダルを閉じ一覧を再読込。
- **Update**: 各行の「編集」ボタンで既存データを埋めたモーダルを表示。`PUT /api/data/{table_name}/{record_id}` へ送信し、成功後再読込。
- **Delete**: 「削除」ボタンクリック時に `confirm()` で確認。OK 時 `DELETE /api/data/{table_name}/{record_id}` を呼び出し、成功後再読込。

## 5. 成果物
以下のファイルを生成してください。
- `main.py`: FastAPI エンドポイント定義。
- `database.py`: SQLAlchemy の接続設定。
- `models.py`: `products` と `employees` の ORM モデル。
- `schemas.py`: API のリクエスト／レスポンス用 Pydantic モデル。
- `index.html`: 単一ページのフロントエンド。
- `style.css`: シンプルなスタイルシート。
- `script.js`: フロントエンドのロジック（データ取得・CRUD 操作）。
- `requirements.txt`: 必要ライブラリ一覧。
- `.env`: DB 接続情報など環境変数。
- `README.md`: セットアップと起動方法を説明。

## 6. その他
- UI はシンプルでクリーンなデザインとし、主要ブラウザで動作すること。
- API 通信失敗時はエラーメッセージを画面に表示してください。
- `.env` には `DATABASE_URL`（例: `postgresql://user:password@localhost:5432/dbname`）を定義し、`python-dotenv` で読み込んでください。
