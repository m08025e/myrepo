import joblib
import pandas as pd
import numpy as np
import sys

# ----------------------------------------------------
# ▼ ユーザー設定項目 ▼
# ----------------------------------------------------

# 1. 読み込むモデルファイル名
MODEL_FILE_NAME = "casting_speed_model.joblib"

# ----------------------------------------------------
# ▲ ユーザー設定項目はここまで ▲
# ----------------------------------------------------


def predict_speed(model, model_columns, numeric_cols, categorical_cols):
    """ 対話的に入力を受け取り、予測を実行する関数 """
    
    print("\n--- 鋳造速度 予測 ---")
    print("操業命令を入力してください。(終了する場合は 'exit' と入力)")
    
    input_data = {}

    # 1. 数値データの入力
    for col in numeric_cols:
        while True:
            try:
                val = input(f"  {col} を入力してください (例: 150.5): ")
                if val.lower() == 'exit':
                    return False # 終了フラグ
                input_data[col] = [float(val)]
                break
            except ValueError:
                print("エラー: 数値を入力してください。")

    # 2. カテゴリカルデータ（記号）の入力
    for col in categorical_cols:
        val = input(f"  {col} を入力してください (例: A1B2): ")
        if val.lower() == 'exit':
            return False # 終了フラグ
        input_data[col] = [val]

    # 3. 入力データをDataFrameに変換
    df_input = pd.DataFrame(input_data)
    
    # 4. 学習時と同様にダミー変数化
    df_input_processed = pd.get_dummies(df_input, columns=categorical_cols, dummy_na=False)
    
    # 5. 学習時の列構成に合わせる (入力になかったダミー列は 0 で埋める)
    df_input_processed = df_input_processed.reindex(columns=model_columns, fill_value=0)
    
    X_input = df_input_processed.values
    
    # 6. 予測の実行（平均とシグマ）
    all_trees = model.estimators_
    
    # 予測値（全ツリー分）を計算
    predictions = [tree.predict(X_input)[0] for tree in all_trees]
    
    # 平均値（予測速度）
    pred_mean = np.mean(predictions)
    # 標準偏差（予測の安定性・シグマ）
    pred_std = np.std(predictions)

    print("\n--- 予測結果 ---")
    print(f"  予測 鋳造速度   : {pred_mean:.4f}")
    print(f"  予測 安定性 (シグマ): {pred_std:.4f}  (この値が小さいほど予測が安定しています)")
    print("--------------------")
    
    return True # 継続フラグ


def main():
    print("... 予測モデルを読み込み中 ...")
    try:
        model_data = joblib.load(MODEL_FILE_NAME)
    except FileNotFoundError:
        print(f"エラー: モデルファイル '{MODEL_FILE_NAME}' が見つかりません。")
        print("先に `train_model.py` を実行してモデルを生成してください。")
        sys.exit(1)
    except Exception as e:
        print(f"エラー: モデルの読み込みに失敗しました。 {e}")
        sys.exit(1)

    model = model_data["model"]
    model_columns = model_data["model_columns"]
    numeric_cols = model_data["original_cols_numeric"]
    categorical_cols = model_data["original_cols_categorical"]
    
    print("モデルの読み込み完了。")

    # 予測ループ開始
    while True:
        if not predict_speed(model, model_columns, numeric_cols, categorical_cols):
            break
            
    print("予測プログラムを終了します。")


if __name__ == "__main__":
    main()
