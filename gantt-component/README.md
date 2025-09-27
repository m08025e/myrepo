# Gantt Chart Web Component

## 概要

このプロジェクトは、HTMLのWebコンポーネントとして実装されたインタラクティブなガントチャートです。生産スケジュールや設備稼働状況などを視覚的に表示し、ズーム、スクロール、タスク詳細表示などの機能を提供します。モダンなダークモードデザインと、設備の休止情報表示機能を備えています。

## 特徴

*   **Webコンポーネント**: 再利用可能でカプセル化されたHTML要素として実装。
*   **インタラクティブな表示**:
    *   ズームスライダーとボタンによる時間軸の拡大・縮小。
    *   X軸（時間軸）とY軸（設備）の同期スクロール。
    *   タスククリックによる詳細パネル表示。
*   **モダンなUI**: ダークモードを基調とした洗練されたデザイン。
*   **カスタマイズ可能な表示**:
    *   表示範囲（開始・終了時刻）の指定。
    *   行の高さ調整。
    *   計画対実績モードの切り替え。
    *   カスタム縦線の追加。
*   **アラート表示**: 定義されたアラートアイコンと説明の表示。
*   **休止情報表示**: 設備の休止期間を視覚的に区別して表示。

## 使用技術

*   **HTML/CSS/JavaScript**: Webコンポーネントの基盤技術。
*   **D3.js (v7)**: データ駆動型ドキュメントのためのJavaScriptライブラリ。チャートの描画に使用。
*   **Google Fonts (Noto Sans JP)**: モダンな日本語フォント。

## セットアップと実行方法

1.  このリポジトリをクローンします。
    ```bash
    git clone [リポジトリのURL]
    cd gantt-component
    ```
2.  プロジェクトのルートディレクトリで、ローカルWebサーバーを起動します。
    *   **Pythonの場合:**
        ```bash
        python -m http.server
        ```
    *   **Node.jsの場合 (http-serverをインストール済みの場合):**
        ```bash
        npx http-server
        ```
3.  Webブラウザで `http://localhost:8000` (またはWebサーバーが指定するポート) にアクセスします。

## コンポーネントの使用方法

`<gantt-chart-component>` Webコンポーネントは、`index.html` のように使用します。

```html
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gantt Chart Web Component</title>
    <script src="gantt-chart-component.js"></script>
</head>
<body>
    <gantt-chart-component 
        data-url="schedule-data.json"
        alert-definitions-url="alert-definitions.json"
        start-time="2025-09-26T08:00:00"
        end-time="2025-09-26T14:00:00">
    </gantt-chart-component>
</body>
</html>
```

### 属性

| 属性名                | 型     | 説明                                                              | デフォルト値                               |
| :-------------------- | :----- | :---------------------------------------------------------------- | :----------------------------------------- |
| `data-url`            | `string` | スケジュールデータを含むJSONファイルのURL。必須。                 | -                                          |
| `alert-definitions-url` | `string` | アラート定義を含むJSONファイルのURL。必須。                       | -                                          |
| `start-time`          | `string` | チャートの表示開始時刻 (ISO 8601形式: `YYYY-MM-DDTHH:MM`)。省略可。 | データ内の最小開始時刻                     |
| `end-time`            | `string` | チャートの表示終了時刻 (ISO 8601形式: `YYYY-MM-DDTHH:MM`)。省略可。 | `start-time`から24時間後、またはデータ内の最大終了時刻 |
| `row-height`          | `number` | 各設備の行の高さ (ピクセル)。                                     | `50`                                       |

## データ形式

### `schedule-data.json`

ガントチャートに表示されるタスク、設備、リンクの情報を定義します。

```json
{
    "equipment": ["設備A", "設備B", "設備C"],
    "items": [
        {
            "id": "J1-main",
            "jobId": "Job1",
            "type": "main",
            "equipment": "設備A",
            "startTime": "2025-09-26T09:20:00",
            "endTime": "2025-09-26T10:00:00",
            "actualStartTime": "2025-09-26T09:20:00",
            "actualEndTime": "2025-09-26T09:50:00",
            "options": ["bg-blue", "border-blue"],
            "alertId": "ALERT_POWER",
            "description": "タスクの詳細説明"
        },
        {
            "id": "Downtime-EQA-01",
            "type": "downtime",
            "equipment": "設備A",
            "startTime": "2025-09-26T10:30:00",
            "endTime": "2025-09-26T11:00:00",
            "description": "定期メンテナンス"
        }
        // ... その他のタスク
    ],
    "links": [
        { "source": "J1-out", "target": "J2-in" }
        // ... その他のリンク
    ]
}
```

*   `equipment`: チャートのY軸に表示される設備名の配列。
*   `items`: 各タスクのオブジェクトの配列。
    *   `id`: タスクの一意のID。
    *   `jobId`: 関連するジョブのID。
    *   `type`: タスクの種類（例: `"main"`, `"pre"`, `"post"`, `"port-in"`, `"port-out"`, `"downtime"`）。CSSでスタイルを適用するために使用されます。
    *   `equipment`: このタスクが関連付けられている設備名。
    *   `startTime`, `endTime`: 計画されたタスクの開始・終了時刻 (ISO 8601形式)。
    *   `actualStartTime`, `actualEndTime`: 実績の開始・終了時刻 (ISO 8601形式)。計画対実績モードで使用されます。
    *   `options`: 追加のCSSクラスや装飾のための文字列配列。
    *   `alertId`: `alert-definitions.json`で定義されたアラートのID。
    *   `description`: タスクの詳細説明。詳細パネルに表示されます。
*   `links`: タスク間の依存関係を定義するオブジェクトの配列。
    *   `source`: リンク元のタスクID。
    *   `target`: リンク先のタスクID。

### `alert-definitions.json`

アラートのアイコンと説明を定義します。

```json
{
  "ALERT_CRANE": {
    "icon": "⚠️",
    "description": "クレーン#3が競合しています"
  },
  "ALERT_POWER": {
    "icon": "⚡️",
    "description": "電力不足の可能性があります"
  }
}
```

## 開発者向け情報

### ファイル構成

*   `index.html`: コンポーネントを使用するメインのHTMLファイル。
*   `gantt-chart-component.js`: Webコンポーネントのロジック。
*   `gantt-chart-component.html`: WebコンポーネントのHTMLテンプレート。
*   `gantt-chart-component.css`: Webコンポーネントのスタイル。
*   `schedule-data.json`: チャート表示用のサンプルデータ。
*   `alert-definitions.json`: アラート定義データ。

## ライセンス

[必要に応じてライセンス情報をここに記述]