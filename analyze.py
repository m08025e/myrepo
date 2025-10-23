import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error
import warnings
import sys

# 警告を非表示
warnings.filterwarnings('ignore')

# Matplotlibの日本語フォント設定
# （環境に合わせて 'IPAexGothic', 'Hiragino Sans', 'Meiryo' などに変更してください）
try:
    plt.rcParams['font.family'] = 'IPAexGothic'
    plt.rcParams['axes.unicode_minus'] = False # マイナス記号の文字化け対策
except Exception as e:
    print(f"日本語フォントの設定に失敗しました: {e}")
    print("グラフの日本語が文字化けする可能性があります。")


# ----------------------------------------------------
# ▼ ユーザー設定項目 ▼
# ----------------------------------------------------

# 1. 読み込むCSVファイル名
# (このスクリプトと同じフォルダにあるファイル名を指定)
CSV_FILE_PATH = "your_data.csv" 

# 2. 目的変数（シグマを小さくしたい結果）の「列名」
Y_COL = "Quality"  # 例: "品質", "寸法", "重量" など

# 3. 説明変数（操業パラメータ）の「列名」のリスト
X_COLS = ["Temp", "Pressure", "Speed"] # 例: ["温度", "圧力", "速度"]

# 4. 目的変数の「目標値」
# (この値に平均値を近づけたい)
TARGET_VALUE = 200.0

# 5. シミュレーションの細かさ
# (大きいほど計算時間がかかりますが、精度が上がります)
GRID_POINTS = 10

# ----------------------------------------------------
# ▲ ユーザー設定項目はここまで ▲
# ----------------------------------------------------


def main():
    print("--- 分析プログラム開始 ---")

    # --- ステップ1: データの読み込みと確認 ---
    print(f"\n[ステップ1: データの読み込みと確認]")
    try:
        df = pd.read_csv(CSV_FILE_PATH)
    except FileNotFoundError:
        print(f"エラー: ファイル '{CSV_FILE_PATH}' が見つかりません。")
        print("ファイル名が正しいか、スクリプトと同じフォルダにあるか確認してください。")
        sys.exit(1)
    except Exception as e:
        print(f"エラー: ファイルの読み込みに失敗しました。 {e}")
        sys.exit(1)

    # 必須列の存在チェック
    required_cols = X_COLS + [Y_COL]
    missing_cols = [col for col in required_cols if col not in df.columns]
    if missing_cols:
        print(f"エラー: CSVファイルに必要な列がありません: {missing_cols}")
        print("X_COLS と Y_COL の設定を確認してください。")
        sys.exit(1)
        
    # 設定がデフォルトのままかチェック
    if Y_COL == "Quality" and CSV_FILE_PATH == "your_data.csv":
        print("警告: ユーザー設定項目がデフォルトのままのようです。")
        print("お手元のCSVファイル名と列名に合わせて設定を更新してください。")

    print(f"{CSV_FILE_PATH} を読み込みました。")
    print("データの先頭5行:")
    print(df.head())
    print("\nデータの基本統計量:")
    print(df.describe())


    # --- ステップ2: データの可視化（現状把握） ---
    print(f"\n[ステップ2: データの可視化]")
    try:
        # 目的変数の分布
        plt.figure(figsize=(10, 5))
        sns.histplot(df[Y_COL], kde=True, bins=30)
        plt.title(f'目的変数 ({Y_COL}) の分布（現状のばらつき）')
        plt.xlabel(Y_COL)
        plt.ylabel('頻度')
        plt.savefig("1_quality_distribution.png")
        print("グラフ '1_quality_distribution.png' を保存しました。")

        # ペアプロットで全体像を把握
        plot_df = df[X_COLS + [Y_COL]]
        sns.pairplot(plot_df)
        plt.suptitle('変数間の関係（ペアプロット）', y=1.02)
        plt.savefig("2_pairplot.png")
        print("グラフ '2_pairplot.png' を保存しました。")
    except Exception as e:
        print(f"グラフの描画に失敗しました: {e}")


    # --- ステップ3: 機械学習による「重要要因」の特定 ---
    print(f"\n[ステップ3: 機械学習による「重要要因」の特定]")
    
    X = df[X_COLS]
    y = df[Y_COL]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # ランダムフォレストモデルを学習
    model_mean = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1, max_features=1.0)
    model_mean.fit(X_train, y_train)

    # 予測精度の確認
    y_pred = model_mean.predict(X_test)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    print(f"モデルの予測精度 (RMSE): {rmse:.4f}  (この値が目的変数のばらつきに対して小さいほど良いモデルです)")

    # 特徴量の重要度
    importances = model_mean.feature_importances_
    feature_importance_df = pd.DataFrame({'Feature': X_COLS, 'Importance': importances})
    feature_importance_df = feature_importance_df.sort_values(by='Importance', ascending=False)

    print("\n特徴量の重要度（Yの平均値への影響度）:")
    print(feature_importance_df)

    # 特徴量の重要度をグラフ化
    plt.figure(figsize=(10, max(5, len(X_COLS) * 0.5))) # 列数に応じて縦幅を調整
    sns.barplot(x='Importance', y='Feature', data=feature_importance_df)
    plt.title(f'特徴量の重要度（{Y_COL} の平均値への影響度）')
    plt.savefig("3_feature_importance.png")
    print("グラフ '3_feature_importance.png' を保存しました。")


    # --- ステップ4: シミュレーションによる「基準テーブル（候補）」の作成 ---
    print(f"\n[ステップ4: シミュレーションによる「基準テーブル（候補）」の作成]")
    
    # 各変数の探索範囲（グリッド）を定義
    ranges = [np.linspace(df[col].min(), df[col].max(), GRID_POINTS) for col in X_COLS]

    # グリッド（全組み合わせ）を作成
    grids = np.meshgrid(*ranges)
    
    # グリッドをモデルが予測できる形式（DataFrame）に変換
    grid_df_data = {col: grid.flatten() for col, grid in zip(X_COLS, grids)}
    grid_df = pd.DataFrame(grid_df_data)

    n_combinations = len(grid_df)
    print(f"シミュレーションする総組み合わせ数: {n_combinations} 件")
    if n_combinations > 100000:
        print(f"警告: 組み合わせが多すぎます ({n_combinations}件)。")
        print("GRID_POINTS を小さくするか、X_COLS の変数を減らすことを検討してください。")
        if n_combinations > 1000000:
            print("エラー: 組み合わせが100万件を超えました。計算を中止します。")
            sys.exit(1)

    print("シミュレーションを実行中...（組み合わせが多いと時間がかかります）")

    # --- 全組み合わせに対して予測を実行 ---
    all_trees = model_mean.estimators_
    n_trees = len(all_trees)
    X_grid_values = grid_df.values

    # メモリ効率のため、予測値を保持する配列を直接作成
    predictions_all_trees = np.zeros((n_combinations, n_trees))
    
    for i, tree in enumerate(all_trees):
        predictions_all_trees[:, i] = tree.predict(X_grid_values)

    # 各組み合わせの「予測平均値」と「予測ばらつき（標準偏差）」を計算
    grid_df['Pred_Mean'] = np.mean(predictions_all_trees, axis=1)
    grid_df['Pred_Std'] = np.std(predictions_all_trees, axis=1)

    # 「目標値との誤差」も計算
    grid_df['Target_Error'] = np.abs(grid_df['Pred_Mean'] - TARGET_VALUE)
    
    # スコア（誤差＋ばらつき）
    grid_df['Score'] = grid_df['Target_Error'] + grid_df['Pred_Std']

    print("シミュレーション完了。")


    # --- ステップ5: 「基準テーブル（候補）」の抽出 ---
    print(f"\n[ステップ5: 「基準テーブル（候補）」の抽出]")

    # 例1: 「ばらつき（Pred_Std）」が最も小さい条件トップ10
    print(f"\n--- 基準テーブル候補 (ばらつき最小 Top 10) ---")
    best_std_table = grid_df.sort_values(by='Pred_Std', ascending=True)
    print(best_std_table.head(10))

    # 例2: 「目標値 (TARGET_VALUE) に近く」かつ「ばらつきが小さい」条件
    best_balanced_table = grid_df.sort_values(by='Score', ascending=True)
    print(f"\n--- 基準テーブル候補 (目標値 {TARGET_VALUE} とのバランス Top 10) ---")
    print(best_balanced_table.head(10))

    # 基準テーブル（全シミュレーション結果）をCSVに保存
    output_csv = "simulation_results_table.csv"
    best_balanced_table.to_csv(output_csv, index=False, encoding='utf-8-sig')
    print(f"\nシミュレーション結果全体を '{output_csv}' に保存しました。")


    # --- ステップ6: 最適化結果の可視化 ---
    print(f"\n[ステップ6: 最適化結果の可視化]")

    # トレードオフの可視化（パレートフロントの簡易版）
    plt.figure(figsize=(10, 6))
    # 全点だと多すぎるため、一部をサンプリング
    sample_df = grid_df.sample(min(2000, len(grid_df)))
    sns.scatterplot(data=sample_df, x='Target_Error', y='Pred_Std', alpha=0.5)
    plt.title(f'トレードオフ: 目標誤差 vs 予測ばらつき')
    plt.xlabel(f'目標 {TARGET_VALUE} との誤差')
    plt.ylabel('予測ばらつき (シグマの代理指標)')
    plt.grid(True)
    plt.savefig("4_tradeoff_plot.png")
    print("グラフ '4_tradeoff_plot.png' を保存しました。")

    # ばらつきに影響する要因の可視化
    # (平均値への重要度が「最も低かった」変数が、ばらつきに影響しているか確認)
    if not feature_importance_df.empty:
        least_important_feature = feature_importance_df.iloc[-1]['Feature']
        plt.figure(figsize=(10, 6))
        sns.scatterplot(data=sample_df, x=least_important_feature, y='Pred_Std', alpha=0.5)
        plt.title(f'要因分析: {least_important_feature} vs 予測ばらつき')
        plt.xlabel(least_important_feature)
        plt.ylabel('予測ばらつき (シグマの代理指標)')
        plt.grid(True)
        plt.savefig("5_factor_vs_std.png")
        print(f"グラフ '5_factor_vs_std.png' (平均への寄与が最小だった変数とばらつきの関係) を保存しました。")

    print("\n--- 分析プログラム終了 ---")
    print("生成されたCSVとPNG画像ファイルを確認してください。")

# --- プログラムの実行 ---
if __name__ == "__main__":
    main()

