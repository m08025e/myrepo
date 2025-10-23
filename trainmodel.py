import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error
import joblib # モデル保存用ライブラリ
import warnings
import sys

# 警告を非表示
warnings.filterwarnings('ignore')

# Matplotlibの日本語フォント設定
try:
    plt.rcParams['font.family'] = 'IPAexGothic'
    plt.rcParams['axes.unicode_minus'] = False
except Exception:
    pass

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

# 4. 生成するモデルファイル名
MODEL_FILE_NAME = "casting_speed_model.joblib"

# ----------------------------------------------------
# ▲ ユーザー設定項目はここまで ▲
# ----------------------------------------------------


def main():
    print("--- モデル学習プログラム開始 ---")

    # --- ステップ1: データの読み込みと確認 ---
    print(f"\n[ステップ1: データの読み込みと確認]")
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
    for col in X_COLS_CATEGORICAL:
        nunique = df[col].nunique()
        print(f"  カテゴリ変数 '{col}' のユニークな値の数: {nunique} 件")


    # --- ステップ2: カテゴリカル変数の前処理 (One-Hotエンコーディング) ---
    print(f"\n[ステップ2: カテゴリカル変数の前処理]")
    
    df_processed = df.copy()
    
    if X_COLS_CATEGORICAL:
        print(f"{X_COLS_CATEGORICAL} をダミー変数に変換します...")
        df_processed = pd.get_dummies(df_processed, columns=X_COLS_CATEGORICAL, dummy_na=False)
    
    # モデルが学習する説明変数の全リストを特定
    all_x_cols_processed = X_COLS_NUMERIC + [col for col in df_processed.columns if col not in df.columns or col in X_COLS_NUMERIC]
    all_x_cols_processed = [col for col in all_x_cols_processed if col != Y_COL and col not in X_COLS_CATEGORICAL]
    all_x_cols_processed = sorted(list(set(all_x_cols_processed)))
    
    print(f"モデルが学習する全ての説明変数 (X): {len(all_x_cols_processed)} 個")


    # --- ステップ3: 機械学習モデルの学習 ---
    print(f"\n[ステップ3: 機械学習モデルの学習]")
    
    X = df_processed[all_x_cols_processed]
    y = df_processed[Y_COL]

    # データを訓練用とテスト用に分割
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    print("モデルの学習を開始します...（データが多い場合、時間がかかります）")
    # n_estimators: 木の数（多いほど精度が上がるが時間もかかる）
    # max_depth: 木の深さ（Noneだと深くなる。過学習を防ぐため 10 などに制限する手もある）
    model = RandomForestRegressor(
        n_estimators=100, 
        random_state=42, 
        n_jobs=-1, # CPUの全コアを使用
        max_features=1.0
    )
    model.fit(X_train, y_train)
    print("モデルの学習が完了しました。")

    # --- ステップ4: モデルの精度評価 ---
    print(f"\n[ステップ4: モデルの精度評価]")
    y_pred = model.predict(X_test)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    y_mean = df[Y_COL].mean()
    print(f"  モデルの予測精度 (RMSE): {rmse:.4f}")
    print(f"  (参考) 全データの平均値: {y_mean:.4f}")
    print(f"  -> 平均値に対してRMSEが十分に小さければ、良いモデルと言えます。")

    # 特徴量の重要度も表示
    importances = model.feature_importances_
    feature_importance_df = pd.DataFrame({'Feature': all_x_cols_processed, 'Importance': importances})
    feature_importance_df = feature_importance_df.sort_values(by='Importance', ascending=False)
    print("\n  特徴量の重要度（予測への影響度）Top 10:")
    print(feature_importance_df.head(10))
    

    # --- ステップ5: モデルの保存 ---
    print(f"\n[ステップ5: モデルの保存]")
    
    # 予測時に必要な情報をすべて辞書にまとめる
    model_data = {
        "model": model, # 学習済みモデル本体
        "model_columns": all_x_cols_processed, # 学習時に使った列名リスト（ダミー変数含む）
        "original_cols_numeric": X_COLS_NUMERIC, # 予測時に入力を促すため
        "original_cols_categorical": X_COLS_CATEGORICAL # 予測時に入力を促すため
    }
    
    # joblibを使ってファイルに保存
    joblib.dump(model_data, MODEL_FILE_NAME)
    
    print(f"モデルと関連情報を '{MODEL_FILE_NAME}' に保存しました。")
    print("\n--- モデル学習プログラム終了 ---")


if __name__ == "__main__":
    main()
