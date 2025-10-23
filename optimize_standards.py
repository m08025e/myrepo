import joblib
import pandas as pd
import numpy as np
import optuna
import sys
import warnings

# Optunaのログ出力を抑制
optuna.logging.set_verbosity(optuna.logging.WARNING)
warnings.filterwarnings('ignore')

# ----------------------------------------------------
# ▼ ユーザー設定項目 ▼
# ----------------------------------------------------

# 1. 読み込むモデルファイル名
MODEL_FILE_NAME = "casting_speed_model.joblib"

# 2. 【重要】基準テーブルの「軸」となる列名
#    (この列の全種類について最適化を実行する)
MAIN_CATEGORY_COL = "Steel_Code" # 例: "鋼種コード"

# 3. 【重要】最適化したい（制御可能）なパラメータ
# (3a) 最適化したい「数値」変数
OPTIMIZE_COLS_NUMERIC = ["Temp", "Pressure"] # 例: ["温度", "圧力"]
# (3b) 最適化したい「カテゴリ」変数
OPTIMIZE_COLS_CATEGORICAL = ["Pattern"] # 例: ["操業パターン"]

# 4. 最適化の試行回数（多いほど高精度だが時間がかかる）
N_TRIALS_PER_CATEGORY = 100

# 5. 出力する基準テーブルのファイル名
OUTPUT_TABLE_CSV = "optimal_standards_table.csv"

# ----------------------------------------------------
# ▲ ユーザー設定項目はここまで ▲
# ----------------------------------------------------

# グローバル変数（Optunaの目的関数に渡すため）
g_model_data = None
g_current_main_category_value = None


def get_prediction(params_dict):
    """ 入力辞書から予測平均とシグマを返す """
    global g_model_data
    
    # 1. 入力データをDataFrameに
    df_input = pd.DataFrame([params_dict])
    
    # 2. ダミー変数化
    categorical_cols = g_model_data["original_cols_categorical"]
    df_input_processed = pd.get_dummies(df_input, columns=categorical_cols, dummy_na=False)
    
    # 3. 学習時の列構成に合わせる
    model_columns = g_model_data["model_columns"]
    df_input_processed = df_input_processed.reindex(columns=model_columns, fill_value=0)
    
    X_input = df_input_processed.values
    
    # 4. 予測の実行
    model = g_model_data["model"]
    all_trees = model.estimators_
    predictions = [tree.predict(X_input)[0] for tree in all_trees]
    
    pred_mean = np.mean(predictions)
    pred_std = np.std(predictions)
    
    return pred_mean, pred_std


def objective(trial):
    """ Optunaが最適化（試行錯誤）するための関数 """
    global g_model_data, g_current_main_category_value
    
    param_ranges = g_model_data["param_ranges"]
    input_params = {}
    
    # 1. 最適化対象の変数を Optuna に「提案」させる
    for col in OPTIMIZE_COLS_NUMERIC:
        r = param_ranges[col]
        input_params[col] = trial.suggest_float(col, r["min"], r["max"])
        
    for col in OPTIMIZE_COLS_CATEGORICAL:
        r = param_ranges[col]
        input_params[col] = trial.suggest_categorical(col, r["values"])

    # 2. メインのカテゴリ（鋼種コード）は固定
    input_params[MAIN_CATEGORY_COL] = g_current_main_category_value
    
    # 3. 予測を実行
    pred_mean, pred_std = get_prediction(input_params)
    
    # 4. 目的を返す
    # 目的1: pred_std（安定性）を「最小化」
    # 目的2: pred_mean（速度）を「最大化」 (Optunaは最小化が基本なのでマイナスをつける)
    return pred_std, -pred_mean


def main():
    global g_model_data, g_current_main_category_value

    print("--- 最適基準テーブル自動生成プログラム 開始 ---")
    
    # --- 1. 最新モデルとパラメータ範囲の読み込み ---
    print(f"\n[ステップ1: 最新モデル '{MODEL_FILE_NAME}' を読み込み中...]")
    try:
        g_model_data = joblib.load(MODEL_FILE_NAME)
    except FileNotFoundError:
        print(f"エラー: モデルファイル '{MODEL_FILE_NAME}' が見つかりません。")
        print("先に `train_model.py` (修正版) を実行してください。")
        sys.exit(1)
    
    param_ranges = g_model_data["param_ranges"]
    
    # メインカテゴリ（鋼種コード）の全リストを取得
    try:
        main_categories_list = param_ranges[MAIN_CATEGORY_COL]["values"]
    except KeyError:
        print(f"エラー: MAIN_CATEGORY_COL '{MAIN_CATEGORY_COL}' がモデルの学習範囲に含まれていません。")
        sys.exit(1)
        
    print(f"モデル読み込み完了。'{MAIN_CATEGORY_COL}' の全 {len(main_categories_list)} 種類について最適化を開始します。")

    # --- 2. 鋼種ごとに最適化ループを実行 ---
    optimal_results = []
    
    for i, category_value in enumerate(main_categories_list):
        g_current_main_category_value = category_value # グローバル変数を設定
        
        print(f"\n[{i+1}/{len(main_categories_list)}] '{category_value}' の最適条件を探索中 (試行 {N_TRIALS_PER_CATEGORY} 回)...")
        
        # 2a. Optunaで多目的最適化（安定性↓、速度↑）を実行
        study = optuna.create_study(directions=["minimize", "minimize"]) # [std, -mean]
        study.optimize(objective, n_trials=N_TRIALS_PER_CATEGORY)

        # 2b. 最適化結果（パレート解）から「ベスト」を選ぶ
        # ここでは「最も速度が速い（-meanが最小）」解を「最適」として採用する
        best_trial = min(study.best_trials, key=lambda t: t.values[1])
        
        optimal_params = best_trial.params
        optimal_std, optimal_negative_mean = best_trial.values
        
        result_row = {
            MAIN_CATEGORY_COL: category_value,
            "Predicted_Speed": -optimal_negative_mean,
            "Predicted_Sigma": optimal_std
        }
        # 最適と判断されたパラメータも追加
        result_row.update(optimal_params)
        optimal_results.append(result_row)

    print("\n--- 全ての最適化が完了しました ---")

    # --- 3. 最適基準テーブルをCSVに保存 ---
    optimal_df = pd.DataFrame(optimal_results)
    
    # 列順を整理
    cols_order = [MAIN_CATEGORY_COL, "Predicted_Speed", "Predicted_Sigma"] + \
                 OPTIMIZE_COLS_NUMERIC + OPTIMIZE_COLS_CATEGORICAL
    optimal_df = optimal_df[cols_order]
    optimal_df = optimal_df.sort_values(by="Predicted_Speed", ascending=False)
    
    optimal_df.to_csv(OUTPUT_TABLE_CSV, index=False, encoding='utf-8-sig')
    
    print(f"最適基準テーブルを '{OUTPUT_TABLE_CSV}' に保存しました。")
    print(optimal_df.head())


if __name__ == "__main__":
    main()

