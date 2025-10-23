import pandas as pd
from sklearn.tree import DecisionTreeRegressor, export_text
import warnings
import sys

# 警告を非表示
warnings.filterwarnings('ignore')

# ----------------------------------------------------
# ▼ ユーザー設定項目 ▼
# ----------------------------------------------------

# 1. 読み込むCSVファイル名
CSV_FILE_PATH = "your_data.csv" 

# 2. 目的変数（予測したい値）の「列名」
Y_COL = "Casting_Speed"  # 例: "鋳造速度"

# 3. 説明変数（操業パラメータ）の「列名」のリスト
# (3a) 数値の変数（温度、圧力など）
X_COLS_NUMERIC = ["Temp", "Pressure"] # 例: ["温度", "圧力"]
# (3b) 英数字の記号やパターンの変数（鋼種コード、操業パターンなど）
X_COLS_CATEGORICAL = ["Pattern", "Steel_Code"] # 例: ["操業パターン", "鋼種コード"]

# 4. 【重要】決定木の「深さ」
# (この値を小さくするほど、ルールが粗く（大きく）なります)
# (3〜5程度が推奨)
TREE_MAX_DEPTH = 4

# ----------------------------------------------------
# ▲ ユーザー設定項目はここまで ▲
# ----------------------------------------------------


def main():
    print("--- 最適分割ルール（決定木）探索プログラム ---")

    # --- ステップ1: データの読み込み ---
    try:
        df = pd.read_csv(CSV_FILE_PATH)
    except FileNotFoundError:
        print(f"エラー: ファイル '{CSV_FILE_PATH}' が見つかりません。")
        sys.exit(1)
    
    required_cols = X_COLS_NUMERIC + X_COLS_CATEGORICAL + [Y_COL]
    missing_cols = [col for col in required_cols if col not in df.columns]
    if missing_cols:
        print(f"エラー: CSVファイルに必要な列がありません: {missing_cols}")
        sys.exit(1)
    
    print(f"{CSV_FILE_PATH} (全 {len(df)} 件) を読み込みました。")

    # --- ステップ2: カテゴリカル変数の前処理 (One-Hotエンコーディング) ---
    df_processed = df.copy()
    if X_COLS_CATEGORICAL:
        df_processed = pd.get_dummies(df_processed, columns=X_COLS_CATEGORICAL, dummy_na=False)
    
    all_x_cols_processed = X_COLS_NUMERIC + [col for col in df_processed.columns if col not in df.columns or col in X_COLS_NUMERIC]
    all_x_cols_processed = [col for col in all_x_cols_processed if col != Y_COL and col not in X_COLS_CATEGORICAL]
    all_x_cols_processed = sorted(list(set(all_x_cols_processed)))
    
    print(f"モデルが学習する全ての説明変数 (X): {len(all_x_cols_processed)} 個")

    # --- ステップ3: 浅い決定木モデルの学習 ---
    X = df_processed[all_x_cols_processed]
    y = df_processed[Y_COL]
    
    print(f"\n[ステップ3: 決定木モデルの学習 (max_depth={TREE_MAX_DEPTH})]")
    
    # 決定木回帰モデル（深さ制限付き）
    tree_model = DecisionTreeRegressor(
        max_depth=TREE_MAX_DEPTH, 
        random_state=42,
        min_samples_leaf=10 # 少なくとも10件の実績が該当するルールのみ作成（過学習防止）
    )
    tree_model.fit(X, y)
    
    print("モデルの学習が完了しました。")

    # --- ステップ4: 分割ルールの出力 ---
    print(f"\n--- AIが発見した「最適分割ルール（基準テーブルの元）」 (深さ={TREE_MAX_DEPTH}) ---")
    
    try:
        # 学習した木のルールをテキスト形式で出力
        rules = export_text(tree_model, feature_names=all_x_cols_processed, decimals=2)
        print(rules)
    except Exception as e:
        print(f"ルールの出力に失敗しました: {e}")
        
    print("\n--- ルールの見方 ---")
    print("  `|--- Feature <= X.XX` : 分割条件（この特徴量で分割するとシグマが小さくなる）")
    print("  `|   |--- ...` : さらに次の条件")
    print("  `|   |   |--- value: [Y.YY]` : その条件に合致したグループの「予測平均速度（基準値）」")
    print("\nプログラム終了。")

if __name__ == "__main__":
    main()
