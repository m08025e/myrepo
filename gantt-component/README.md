# Gantt Chart Web Component

## 概要

このプロジェクトは、HTMLのWebコンポーネントとして実装されたインタラクティブなガントチャートです。生産スケジュールや設備稼働状況などを視覚的に表示し、ズーム、スクロール、タスク詳細表示などの機能を提供します。モダンなダークモードデザインと、設備の休止情報表示機能を備えています。

## 特徴

*   **Webコンポーネント**: 再利用可能でカプセル化されたHTML要素として実装。
*   **外部設定ファイル**: 表示内容や文言、スタイルを外部のJSONファイルから設定可能。
*   **インタラクティブな表示**:
    *   ズームスライダーとボタンによる時間軸の拡大・縮小。
    *   X軸（時間軸）とY軸（設備）の同期スクロール。
    *   タスククリックによる詳細パネル表示。
*   **モダンなUI**: ダークモードを基調とした洗練されたデザイン。
*   **テスト完備**: Jestによるテストスイートが導入されており、機能の追加やリファクタリング時の品質を保証します。

## 使用技術

*   **HTML/CSS/JavaScript**: Webコンポーネントの基盤技術。
*   **D3.js (v7)**: データ駆動型ドキュメントのためのJavaScriptライブラリ。チャートの描画に使用。
*   **Jest**: JavaScriptテストフレームワーク。

## セットアップと実行方法

1.  このリポジトリをクローンし、プロジェクトディレクトリに移動します。
    ```bash
    git clone [リポジトリのURL]
    cd gantt-component
    ```
2.  テスト環境に必要な依存関係をインストールします。
    ```bash
    npm install
    ```
3.  プロジェクトのルートディレクトリで、ローカルWebサーバーを起動します。
    *   **Pythonの場合:**
        ```bash
        python -m http.server
        ```
    *   **Node.jsの場合 (http-serverをインストール済みの場合):**
        ```bash
        npx http-server
        ```
4.  Webブラウザで `http://localhost:8000/public/` にアクセスします。

## コンポーネントの使用方法

コンポーネントの表示や動作は、主に外部の設定ファイルによって制御されます。`public/index.html` のように使用します。

```html
<gantt-chart-component 
    properties-url="config.json"
    data-config-url="config-data.json"
    data-url="schedule-data.json"
    alert-definitions-url="alert-definitions.json"
></gantt-chart-component>
```

### 属性 (Attributes)

| 属性名                | 型     | 説明                                                              |
| :-------------------- | :----- | :---------------------------------------------------------------- |
| `properties-url`      | `string` | UIの文言(locale)や外観のデフォルト設定を含むJSONファイルのURL。     |
| `data-config-url`     | `string` | 表示期間やカスタム縦線など、データに依存する設定を含むJSONファイルのURL。 |
| `data-url`            | `string` | スケジュールデータ（タスク、設備など）を含むJSONファイルのURL。必須。   |
| `alert-definitions-url` | `string` | アラート定義を含むJSONファイルのURL。必須。                       |

**Note:** `title`や`row-height`といった個別の属性をHTMLタグに直接指定することで、設定ファイルの内容を上書きすることも可能です。

### スロット (Slots)

コンポーネントの描画をさらにカスタマイズするために、以下のスロットが用意されています。

| スロット名          | 説明                                                                                                                            |
| :------------------ | :------------------------------------------------------------------------------------------------------------------------------ |
| `custom-styles`     | 外部からカスタムCSSを注入するためのスロット。`<style slot="custom-styles">...</style>`の形で使用します。`options`プロパティと組み合わせて、タスクバーの見た目を変更するのに便利です。 |
| `svg-defs`          | 外部からSVG定義（`<pattern>`や`<linearGradient>`など）を注入するためのスロット。`<svg slot="svg-defs">...</svg>`の形で使用します。`options`プロパティでパターン塗りを指定する際に必要です。 |

## 設定ファイル

サンプルページ（`public/`）で使用されている設定ファイルです。

### `config.json` (プロパティ設定)

コンポーネントのタイトル、初期ズームレベル、UIの文言などを定義します。（内容は省略）

### `config-data.json` (データ設定)

表示期間やカスタム縦線を定義します。（内容は省略）

### `schedule-data.json` (スケジュールデータ)

ガントチャートに表示されるタスク(`items`)、設備(`equipment`)、タスク間の連携(`links`)の情報を定義します。

#### `items`オブジェクトの`options`プロパティ

`options`プロパティは、個々のタスクバーの見た目をカスタマイズするための文字列の配列です。オプションには、コンポーネントに予め用意された**マネージドオプション**と、ユーザーが自由に定義できる**カスタムオプション**の2種類があります。

**1. マネージドオプション (Managed Options)**

`managed-`という接頭辞が付く、コンポーネント標準のオプションです。これらを使用するために、ユーザー側でCSSやSVGを追加定義する必要はありません。

| オプション名                  | 説明                               |
| :-------------------------- | :--------------------------------- |
| `managed-color-blue`        | タスクバーを青系の色にします。     |
| `managed-color-red`         | タスクバーを赤系の色にします。     |
| `managed-color-green`       | タスクバーを緑系の色にします。     |
| `managed-color-yellow`      | タスクバーを黄色系の色にします。   |
| `managed-pattern-stripes`   | タスクバーをストライプ柄にします。 |
| `managed-border-thick`      | 枠線を太くします。                 |
| `managed-border-dashed`     | 枠線を破線にします。               |

*   **使用例:**
    ```json
    "options": ["managed-color-green", "managed-border-thick"]
    ```

**2. カスタムオプション (Custom Options)**

`managed-`接頭辞が付かない文字列は、すべてカスタムオプションとして扱われます。これは、タスクバー要素にそのままCSSクラス名として付与されます。

カスタムオプションを機能させるには、`custom-styles`スロットや`svg-defs`スロットを使い、ユーザー自身で対応するCSSやSVG定義をコンポーネントに注入する必要があります。

*   **使用例:**
    *   `schedule-data.json`で`"options": ["my-custom-style"]`と指定します。
    *   コンポーネントを使用するHTML側で、以下のようにスタイルを注入します。
        ```html
        <gantt-chart-component>
            <style slot="custom-styles">
                .my-custom-style {
                    fill: purple;
                    stroke: gold;
                }
            </style>
        </gantt-chart-component>
        ```

## テスト

このプロジェクトにはJestを使用したテストスイートが含まれています。テストを実行するには、以下のコマンドを使用します。

```bash
npm test
```

コードを変更した際は、このコマンドを実行してすべてのテストが成功することを確認してください。

## ファイル構成

```
/ (プロジェクトルート)
├── dist/      (コンポーネントのソース)
│   ├── gantt-chart-component.css
│   ├── gantt-chart-component.html
│   └── gantt-chart-component.js
│
├── public/    (サンプルページと関連データ)
│   ├── index.html
│   ├── alert-definitions.json
│   ├── schedule-data.json
│   ├── config.json
│   └── config-data.json
│
├── tests/     (テストコードと設定)
│   ├── __mocks__/
│   ├── babel.config.js
│   ├── jest.config.js
│   ├── jest.setup.js
│   └── gantt-chart-component.test.js
│
├── package.json
├── package-lock.json
└── README.md
```

*   `dist/`: コンポーネントを構成する配布用のファイル群。
*   `public/`: コンポーネントの使用方法を示すサンプルページと、そのデータファイル群。
*   `tests/`: Jestによる自動テスト関連のファイル群。

## ライセンス

[必要に応じてライセンス情報をここに記述]
