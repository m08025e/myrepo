import joblib
import pandas as pd
import numpy as np
import sys
import shap # SHAPライブラリをインポート

# ----------------------------------------------------
# ▼ ユーザー設定項目 ▼
# ----------------------------------------------------

# 1. 読み込むモデルファイル名
MODEL_FILE_NAME = "casting_speed_model.joblib"

# ----------------------------------------------------
# ▲ ユーザー設定項目はここまで ▲
# ----------------------------------------------------

# SHAP Explainerをグローバルで初期化（起動時に1回だけ）
explainer = None
base_value = None

def predict_speed(model, model_columns, numeric_cols, categorical_cols, original_features):
    """ 対話的に入力を受け取り、予測と「SHAPによる根拠」を実行する関数 """
    
    print("\n--- 鋳造速度 予測 (解説付き) ---")
    print("操業命令を入力してください。(終了する場合は 'exit' と入力)")
    
    input_data = {}

    # 1. 数値データの入力
    for col in numeric_cols:
        while True:
            try:
                val = input(f"  {col} を入力してください (例: 150.5): ")
                if val.lower() == 'exit':
                    return False
                input_data[col] = [float(val)]
                break
            except ValueError:
                print("エラー: 数値を入力してください。")

    # 2. カテゴリカルデータの入力
    for col in categorical_cols:
        val = input(f"  {col} を入力してください (例: A1B2): ")
        if val.lower() == 'exit':
            return False
        input_data[col] = [val]

    # 3. 入力データをDataFrameに変換
    df_input = pd.DataFrame(input_data)
    
    # 4. 学習時と同様にダミー変数化
    df_input_processed = pd.get_dummies(df_input, columns=categorical_cols, dummy_na=False)
    
    # 5. 学習時の列構成に合わせる
    df_input_processed = df_input_processed.reindex(columns=model_columns, fill_value=0)
    
    X_input = df_input_processed.values
    
    # 6. 予測の実行（平均とシグマ）
    all_trees = model.estimators_
    predictions = [tree.predict(X_input)[0] for tree in all_trees]
    pred_mean = np.mean(predictions)
    pred_std = np.std(predictions)

    print("\n--- 予測結果 ---")
    print(f"  予測 鋳造速度   : {pred_mean:.4f}")
    print(f"  予測 安定性 (シグマ): {pred_std:.4f}  (この値が小さいほど予測が安定しています)")

    # --- 7. SHAPによる「予測根拠」の計算 ---
    global explainer, base_value
    
    # SHAP値（個々の予測に対する寄与度）を計算
    # X_input は (1, N_features) の形状
    shap_values = explainer.shap_values(X_input)
    
    # SHAP値を元の特徴量の名前にマッピング
    shap_df = pd.DataFrame({
        'feature': model_columns,
        'shap_value': shap_values[0] # 最初の（唯一の）予測に対するSHAP値
    })
    
    # SHAP値はダミー変数ごと（例: Steel_Code_A, Steel_Code_B）に出るため、
    # 元の変数名（例: Steel_Code）に集約する
    shap_agg = {}
    for original_col in original_features:
        # この元の特徴量に関連するダミー変数（またはそのままの数値変数）を見つける
        related_features = [col for col in model_columns if col.startswith(original_col)]
        if related_features:
            # 関連するSHAP値の「合計」を、その元の特徴量の寄与度とする
            total_shap = shap_df[shap_df['feature'].isin(related_features)]['shap_value'].sum()
            shap_agg[original_col] = total_shap

    # 寄与度の絶対値が大きい順にソート
    shap_agg_sorted = sorted(shap_agg.items(), key=lambda item: abs(item[1]), reverse=True)

    print("\n--- この予測の「根拠」 (SHAP) ---")
    print(f"  (全パラメータの平均速度: {base_value[0]:.4f})")
    
    # 寄与度が大きかったTop 3 (または5) を表示
    for feature, value in shap_agg_sorted[:3]:
        sign = "+" if value > 0 else "-"
        # 元の入力値も表示
        original_value = df_input[feature].values[0] if feature in df_input.columns else "N/A"
        print(f"  {sign} {abs(value):.4f} : {feature} == {original_value}")
        
    print("-----------------------------------")
    
    return True

def main():
    global explainer, base_value
    
    print("... 予測モデルを読み込み中 ...")
    try:
        model_data = joblib.load(MODEL_FILE_NAME)
    except FileNotFoundError:
        print(f"エラー: モデルファイル '{MODEL_FILE_NAME}' が見つかりません。")
        sys.exit(1)

    model = model_data["model"]
    model_columns = model_data["model_columns"]
    numeric_cols = model_data["original_cols_numeric"]
    categorical_cols = model_data["original_cols_categorical"]
    original_features = numeric_cols + categorical_cols # 元の特徴量リスト

    print("... SHAP解説モデルを初期化中（初回のみ時間がかかります）...")
    # TreeExplainerはRandomForestに高速
    explainer = shap.TreeExplainer(model)
    # SHAPのベース値（全データの平均予測値）を計算
    base_value = explainer.expected_value
    
    print("モデルの読み込み完了。")

    while True:
        if not predict_speed(model, model_columns, numeric_cols, categorical_cols, original_features):
            break
            
    print("予測プログラムを終了します。")

if __name__ == "__main__":
    main()
