#!/bin/bash

# D3.jsガントチャートプロジェクトセットアップスクリプト
# このスクリプトは必要なディレクトリ構造を作成し、プロジェクトファイルを生成します

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}D3.jsガントチャートプロジェクトのセットアップを開始します...${NC}"

# ルートディレクトリの作成
mkdir -p d3-gantt-chart
cd d3-gantt-chart

# README.mdの作成
cat > README.md << 'EOF'
# D3.jsガントチャートプロジェクト

Vue.js、D3.js、Spring Bootを使用したドラッグ可能なガントチャートアプリケーション。

## 機能

- タスクの表示と管理（縦軸：工程、横軸：時間）
- ドラッグによるタスクのスケジュール調整
- タスク間の依存関係の表示
- RESTful APIによるデータの永続化

## 開発環境の起動

Docker Composeを使用して開発環境を起動できます：

```bash
docker-compose up
```

フロントエンドは http://localhost:80 でアクセスできます。
バックエンドは http://localhost:8080 でアクセスできます。

## フロントエンド開発

```bash
cd frontend
npm install
npm run serve
```

## バックエンド開発

```bash
cd backend
./gradlew bootRun
```

## 本番環境へのデプロイ

```bash
# フロントエンドのビルド
cd frontend
npm run build

# バックエンドのビルド
cd backend
./gradlew build
```

## ライセンス

MIT
EOF

echo -e "${BLUE}README.mdを作成しました${NC}"

# Docker Compose ファイルの作成
cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  # フロントエンドサービス
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "80:80"
    depends_on:
      - backend
    environment:
      - VUE_APP_API_URL=http://localhost:8080/api
    volumes:
      - ./frontend:/app
      - /app/node_modules
    command: npm run serve

  # バックエンドサービス
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    depends_on:
      - db
    environment:
      - SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/ganttdb
      - SPRING_DATASOURCE_USERNAME=postgres
      - SPRING_DATASOURCE_PASSWORD=password
      - SPRING_JPA_HIBERNATE_DDL_AUTO=update

  # データベースサービス
  db:
    image: postgres:14
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_DB=ganttdb
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
EOF

echo -e "${BLUE}docker-compose.ymlを作成しました${NC}"

# フロントエンドディレクトリ構造の作成
mkdir -p frontend/public frontend/src/components
cd frontend

# package.jsonの作成
cat > package.json << 'EOF'
{
  "name": "d3-gantt-chart-frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "serve": "vue-cli-service serve",
    "build": "vue-cli-service build",
    "lint": "vue-cli-service lint"
  },
  "dependencies": {
    "axios": "^1.6.0",
    "core-js": "^3.33.0",
    "d3": "^7.8.5",
    "vue": "^3.3.4"
  },
  "devDependencies": {
    "@babel/core": "^7.23.2",
    "@babel/eslint-parser": "^7.22.15",
    "@vue/cli-plugin-babel": "~5.0.8",
    "@vue/cli-plugin-eslint": "~5.0.8",
    "@vue/cli-service": "~5.0.8",
    "@vue/compiler-sfc": "^3.3.4",
    "eslint": "^8.51.0",
    "eslint-plugin-vue": "^9.17.0"
  },
  "eslintConfig": {
    "root": true,
    "env": {
      "node": true
    },
    "extends": [
      "plugin:vue/vue3-essential",
      "eslint:recommended"
    ],
    "parserOptions": {
      "parser": "@babel/eslint-parser"
    },
    "rules": {}
  },
  "browserslist": [
    "> 1%",
    "last 2 versions",
    "not dead",
    "not ie 11"
  ]
}
EOF

# vue.config.jsの作成
cat > vue.config.js << 'EOF'
const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    port: 80,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  }
})
EOF

# Dockerfileの作成
cat > Dockerfile << 'EOF'
FROM node:16-alpine

WORKDIR /app

# package.jsonとpackage-lock.jsonをコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm install

# ソースコードをコピー
COPY . .

# 開発サーバーのポートを公開
EXPOSE 80

# 開発サーバーを起動
CMD ["npm", "run", "serve"]
EOF

# index.htmlの作成
mkdir -p public
cat > public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width,initial-scale=1.0">
    <link rel="icon" href="<%= BASE_URL %>favicon.ico">
    <title>D3.js ガントチャート</title>
  </head>
  <body>
    <noscript>
      <strong>このアプリケーションを実行するにはJavaScriptを有効にしてください。</strong>
    </noscript>
    <div id="app"></div>
    <!-- built files will be auto injected -->
  </body>
</html>
EOF

# faviconの追加
cat > public/favicon.ico << 'EOF'
EOF

# main.jsの作成
mkdir -p src
cat > src/main.js << 'EOF'
import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')
EOF

# App.vueの作成
cat > src/App.vue << 'EOF'
<template>
  <div class="app-container">
    <h1>社内向けガントチャート</h1>
    
    <div class="controls">
      <button @click="fetchData">データ更新</button>
      <button @click="saveChanges">変更を保存</button>
    </div>
    
    <div class="chart-wrapper">
      <GanttChart
        :tasks="tasks"
        :dependencies="dependencies"
        :width="chartWidth"
        :height="chartHeight"
        @task-updated="handleTaskUpdated"
      />
    </div>
  </div>
</template>

<script>
import GanttChart from './components/GanttChart.vue';
import { ref, onMounted, computed } from 'vue';

export default {
  name: 'App',
  components: {
    GanttChart
  },
  setup() {
    // データの状態
    const tasks = ref([]);
    const dependencies = ref([]);
    const modifiedTasks = ref([]);
    
    // チャートのサイズ
    const chartWidth = ref(1000);
    const chartHeight = computed(() => 50 * tasks.value.length + 100);
    
    // APIからデータを取得
    const fetchData = async () => {
      try {
        // 実際のAPIエンドポイントに変更してください
        const response = await fetch('/api/gantt-data');
        const data = await response.json();
        
        tasks.value = data.tasks.map(task => ({
          ...task,
          // ISO形式の日付文字列に変換（必要に応じて）
          startDate: new Date(task.startDate).toISOString(),
          endDate: new Date(task.endDate).toISOString()
        }));
        
        dependencies.value = data.dependencies;
        modifiedTasks.value = []; // 変更をリセット
      } catch (error) {
        console.error('データ取得エラー:', error);
        // エラー時にはサンプルデータを使用
        createSampleData();
      }
    };
    
    // 変更されたタスクを追跡
    const handleTaskUpdated = (updatedTask) => {
      const existingIndex = modifiedTasks.value.findIndex(t => t.taskId === updatedTask.taskId);
      
      if (existingIndex !== -1) {
        modifiedTasks.value[existingIndex] = updatedTask;
      } else {
        modifiedTasks.value.push(updatedTask);
      }
    };
    
    // 変更を保存
    const saveChanges = async () => {
      if (modifiedTasks.value.length === 0) {
        alert('保存する変更はありません');
        return;
      }
      
      try {
        // 実際のAPIエンドポイントに変更してください
        const response = await fetch('/api/update-tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ tasks: modifiedTasks.value })
        });
        
        if (response.ok) {
          alert('変更が保存されました');
          modifiedTasks.value = []; // 変更をリセット
        } else {
          alert('保存に失敗しました');
        }
      } catch (error) {
        console.error('保存エラー:', error);
        alert('保存中にエラーが発生しました');
      }
    };
    
    // サンプルデータの作成（APIがない場合のデモ用）
    const createSampleData = () => {
      const today = new Date();
      
      tasks.value = [
        {
          id: 1,
          name: '設計',
          process: 'プロセスA',
          startDate: new Date(today).toISOString(),
          endDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          color: '#6495ED'
        },
        {
          id: 2,
          name: '開発',
          process: 'プロセスB',
          startDate: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          color: '#FF7F50'
        },
        {
          id: 3,
          name: 'テスト',
          process: 'プロセスC',
          startDate: new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(today.getTime() + 20 * 24 * 60 * 60 * 1000).toISOString(),
          color: '#32CD32'
        },
        {
          id: 4,
          name: 'リリース',
          process: 'プロセスD',
          startDate: new Date(today.getTime() + 20 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(today.getTime() + 22 * 24 * 60 * 60 * 1000).toISOString(),
          color: '#9370DB'
        }
      ];
      
      dependencies.value = [
        { id: 1, sourceId: 1, targetId: 2 },
        { id: 2, sourceId: 2, targetId: 3 },
        { id: 3, sourceId: 3, targetId: 4 }
      ];
    };
    
    onMounted(() => {
      // 本番環境ではfetchData()を呼び出します
      // デモ用にサンプルデータを使用
      createSampleData();
      
      // ウィンドウサイズに応じてチャートサイズを調整
      const updateChartSize = () => {
        const container = document.querySelector('.chart-wrapper');
        if (container) {
          chartWidth.value = container.clientWidth;
        }
      };
      
      updateChartSize();
      window.addEventListener('resize', updateChartSize);
    });
    
    return {
      tasks,
      dependencies,
      chartWidth,
      chartHeight,
      fetchData,
      handleTaskUpdated,
      saveChanges
    };
  }
};
</script>

<style>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 20px;
}

.controls {
  margin-bottom: 20px;
}

.controls button {
  margin-right: 10px;
  padding: 8px 16px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.controls button:hover {
  background-color: #45a049;
}

.chart-wrapper {
  flex: 1;
  border: 1px solid #ddd;
  overflow: hidden;
}
</style>
EOF

# GanttChart.vueの作成
mkdir -p src/components
cat > src/components/GanttChart.vue << 'EOF'
<template>
  <div class="gantt-chart-container">
    <div ref="chartContainer" class="chart-area"></div>
  </div>
</template>

<script>
import * as d3 from 'd3';

export default {
  name: 'GanttChart',
  props: {
    // タスクデータ：工程、開始時刻、終了時刻などの情報を含む配列
    tasks: {
      type: Array,
      required: true
    },
    // 線で結ぶための依存関係データ
    dependencies: {
      type: Array,
      default: () => []
    },
    // チャートの幅と高さ
    width: {
      type: Number,
      default: 800
    },
    height: {
      type: Number,
      default: 500
    },
    // マージン設定
    margin: {
      type: Object,
      default: () => ({top: 20, right: 30, bottom: 30, left: 150})
    }
  },
  data() {
    return {
      // D3.js関連の変数
      svg: null,
      xScale: null,
      yScale: null,
      // ドラッグ中のタスク
      draggingTask: null,
      // チャートの実際の描画エリアサイズ
      chartWidth: 0,
      chartHeight: 0
    };
  },
  mounted() {
    this.initChart();
    this.renderChart();
    window.addEventListener('resize', this.handleResize);
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize);
  },
  methods: {
    // チャートの初期化
    initChart() {
      // 描画エリアのサイズを計算
      this.chartWidth = this.width - this.margin.left - this.margin.right;
      this.chartHeight = this.height - this.margin.top - this.margin.bottom;
      
      // SVG要素の作成
      this.svg = d3.select(this.$refs.chartContainer)
        .append('svg')
        .attr('width', this.width)
        .attr('height', this.height)
        .append('g')
        .attr('transform', `translate(${this.margin.left},${this.margin.top})`);
      
      // X軸（時間軸）のスケール設定
      const dates = this.tasks.flatMap(d => [new Date(d.startDate), new Date(d.endDate)]);
      const minDate = d3.min(dates);
      const maxDate = d3.max(dates);
      
      this.xScale = d3.scaleTime()
        .domain([minDate, maxDate])
        .range([0, this.chartWidth]);
      
      // Y軸（工程軸）のスケール設定
      this.yScale = d3.scaleBand()
        .domain(this.tasks.map(d => d.process))
        .range([0, this.chartHeight])
        .padding(0.1);
      
      // X軸の描画
      this.svg.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${this.chartHeight})`)
        .call(d3.axisBottom(this.xScale));
      
      // Y軸の描画
      this.svg.append('g')
        .attr('class', 'y-axis')
        .call(d3.axisLeft(this.yScale));
    },
    
    // チャートの描画
    renderChart() {
      const self = this;
      
      // ドラッグの挙動を定義
      const dragBehavior = d3.drag()
        .on('start', function(event, d) {
          self.handleDragStart(event, d);
        })
        .on('drag', function(event, d) {
          self.handleDrag(event, d, this);
        })
        .on('end', function(event, d) {
          self.handleDragEnd(event, d);
        });
      
      // 既存のタスクバーとラインを削除（再描画のため）
      this.svg.selectAll('.task-bar').remove();
      this.svg.selectAll('.dependency-line').remove();
      
      // タスクバーの描画
      this.svg.selectAll('.task-bar')
        .data(this.tasks)
        .enter()
        .append('rect')
        .attr('class', 'task-bar')
        .attr('x', d => this.xScale(new Date(d.startDate)))
        .attr('y', d => this.yScale(d.process))
        .attr('width', d => {
          const start = this.xScale(new Date(d.startDate));
          const end = this.xScale(new Date(d.endDate));
          return end - start;
        })
        .attr('height', this.yScale.bandwidth())
        .attr('fill', d => d.color || '#4682b4')
        .attr('rx', 3)
        .attr('ry', 3)
        .attr('data-id', d => d.id) // タスクIDを属性として保存
        .call(dragBehavior)
        .on('mouseover', function() {
          d3.select(this).attr('fill', '#ff9900');
        })
        .on('mouseout', function(event, d) {
          d3.select(this).attr('fill', d.color || '#4682b4');
        });
      
      // タスク名を表示
      this.svg.selectAll('.task-label')
        .data(this.tasks)
        .enter()
        .append('text')
        .attr('class', 'task-label')
        .attr('x', d => {
          const start = this.xScale(new Date(d.startDate));
          const end = this.xScale(new Date(d.endDate));
          return start + 5;
        })
        .attr('y', d => this.yScale(d.process) + this.yScale.bandwidth() / 2 + 5)
        .text(d => d.name)
        .attr('font-size', '12px')
        .attr('fill', 'white');
      
      // 依存関係の線を描画
      this.drawDependencyLines();
    },
    
    // 依存関係の線を描画するメソッド
    drawDependencyLines() {
      const self = this;
      
      this.dependencies.forEach(dep => {
        const sourceTask = this.tasks.find(t => t.id === dep.sourceId);
        const targetTask = this.tasks.find(t => t.id === dep.targetId);
        
        if (!sourceTask || !targetTask) return;
        
        // 線の始点と終点を計算
        const sourceX = this.xScale(new Date(sourceTask.endDate));
        const sourceY = this.yScale(sourceTask.process) + this.yScale.bandwidth() / 2;
        const targetX = this.xScale(new Date(targetTask.startDate));
        const targetY = this.yScale(targetTask.process) + this.yScale.bandwidth() / 2;
        
        // 線の描画
        const lineGenerator = d3.line()
          .x(d => d.x)
          .y(d => d.y)
          .curve(d3.curveMonotoneX);
        
        // 制御点を計算（緩やかなカーブのため）
        const controlX = (sourceX + targetX) / 2;
        const points = [
          { x: sourceX, y: sourceY },
          { x: controlX, y: sourceY },
          { x: controlX, y: targetY },
          { x: targetX, y: targetY }
        ];
        
        // パスを描画
        this.svg.append('path')
          .attr('class', 'dependency-line')
          .attr('d', lineGenerator(points))
          .attr('stroke', '#999')
          .attr('stroke-width', 1.5)
          .attr('fill', 'none')
          .attr('marker-end', 'url(#arrow)');
      });
      
      // 矢印マーカーを定義
      if (!this.svg.select('defs').node()) {
        const defs = this.svg.append('defs');
        
        defs.append('marker')
          .attr('id', 'arrow')
          .attr('viewBox', '0 -5 10 10')
          .attr('refX', 8)
          .attr('refY', 0)
          .attr('markerWidth', 6)
          .attr('markerHeight', 6)
          .attr('orient', 'auto')
          .append('path')
          .attr('d', 'M0,-5L10,0L0,5')
          .attr('fill', '#999');
      }
    },
    
    // ドラッグ開始時の処理
    handleDragStart(event, d) {
      this.draggingTask = d;
      // ドラッグ中のタスクを強調表示
      d3.select(event.sourceEvent.target)
        .attr('stroke', '#333')
        .attr('stroke-width', 2);
    },
    
    // ドラッグ中の処理
    handleDrag(event, d, element) {
      if (!this.draggingTask) return;
      
      // ドラッグによる移動量を計算
      const dx = event.dx;
      
      // 開始日と終了日を更新（横方向の移動のみ許可）
      const taskDuration = new Date(d.endDate) - new Date(d.startDate);
      const pixelsPerMs = this.chartWidth / (this.xScale.domain()[1] - this.xScale.domain()[0]);
      const msPerPixel = 1 / pixelsPerMs;
      
      const msDelta = dx * msPerPixel;
      
      // 新しい開始日と終了日を計算
      const newStartDate = new Date(new Date(d.startDate).getTime() + msDelta);
      const newEndDate = new Date(newStartDate.getTime() + taskDuration);
      
      // タスクの位置を更新
      d3.select(element)
        .attr('x', this.xScale(newStartDate))
        .attr('width', this.xScale(newEndDate) - this.xScale(newStartDate));
      
      // 一時的にタスクのデータを更新
      d.tempStartDate = newStartDate;
      d.tempEndDate = newEndDate;
    },
    
    // ドラッグ終了時の処理
    handleDragEnd(event, d) {
      if (!this.draggingTask) return;
      
      // ドラッグ中のスタイルをリセット
      d3.select(event.sourceEvent.target)
        .attr('stroke', null)
        .attr('stroke-width', null);
      
      // タスクの日付を更新
      const taskIndex = this.tasks.findIndex(t => t.id === d.id);
      
      if (taskIndex !== -1 && d.tempStartDate && d.tempEndDate) {
        // ディープコピーを作成して変更を反映
        const updatedTasks = JSON.parse(JSON.stringify(this.tasks));
        updatedTasks[taskIndex].startDate = d.tempStartDate.toISOString();
        updatedTasks[taskIndex].endDate = d.tempEndDate.toISOString();
        
        // 親コンポーネントに更新を通知
        this.$emit('update:tasks', updatedTasks);
        this.$emit('task-updated', {
          taskId: d.id,
          startDate: d.tempStartDate,
          endDate: d.tempEndDate
        });
        
        // 一時データをクリア
        delete d.tempStartDate;
        delete d.tempEndDate;
      }
      
      // 依存関係の線を再描画
      this.drawDependencyLines();
      
      this.draggingTask = null;
    },
    
    // リサイズ時の処理
    handleResize() {
      // SVGをクリアして再描画
      d3.select(this.$refs.chartContainer).select('svg').remove();
      this.initChart();
      this.renderChart();
    }
  },
  watch: {
    // タスクやチャートサイズの変更を監視して再描画
    tasks: {
      handler() {
        if (this.svg) {
          this.renderChart();
        }
      },
      deep: true
    },
    dependencies: {
      handler() {
        if (this.svg) {
          this.drawDependencyLines();
        }
      },
      deep: true
    },
    width(newVal) {
      this.chartWidth = newVal - this.margin.left - this.margin.right;
      this.handleResize();
    },
    height(newVal) {
      this.chartHeight = newVal - this.margin.top - this.margin.bottom;
      this.handleResize();
    }
  }
};
</script>

<style scoped>
.gantt-chart-container {
  width: 100%;
  height: 100%;
  overflow: auto;
}

.chart-area {
  min-width: 100%;
  min-height: 100%;
}

.task-bar:hover {
  cursor: move;
}
</style>
EOF

echo -e "${BLUE}フロントエンドのファイルを作成しました${NC}"

# バックエンドディレクトリ構造の作成
cd ..
mkdir -p backend/src/main/java/com/example/ganttchart/controller \
         backend/src/main/java/com/example/ganttchart/model \
         backend/src/main/java/com/example/ganttchart/repository \
         backend/src/main/java/com/example/ganttchart/service \
         backend/src/main/resources
cd backend

# build.gradleの作成
cat > build.gradle << 'EOF'
plugins {
    id 'org.springframework.boot' version '3.2.0'
    id 'io.spring.dependency-management' version '1.1.4'
    id 'java'
}

group = 'com.example'
version = '0.0.1-SNAPSHOT'
sourceCompatibility = '17'

configurations {
    compileOnly {
        extendsFrom annotationProcessor
    }
}

repositories {
    mavenCentral()
}

dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    implementation 'org.springframework.boot:spring-boot-starter-web'
    compileOnly 'org.projectlombok:lombok'
    runtimeOnly 'org.postgresql:postgresql'
    annotationProcessor 'org.projectlombok:lombok'
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
    
    // 開発用ツール
    developmentOnly 'org.springframework.boot:spring-boot-devtools'
}

tasks.named('test') {
    useJUnitPlatform()
}
EOF

# gradlewの作成
cat > gradlew << 'EOF'
#!/bin/sh
# gradleラッパーのダミースクリプト
# 実際には「gradle wrapper」コマンドで生成するものです
java -version
echo "Gradlewスクリプト実行中..."
EOF
chmod +x gradlew

# gradlew.batの作成
cat > gradlew.bat << 'EOF'
@rem
@rem gradleラッパーのダミーバッチファイル
@rem 実際には「gradle wrapper」コマンドで生成するものです
@echo off
echo Gradlew.batスクリプト実行中...
EOF

# Dockerfileの作成
cat > Dockerfile << 'EOF'
FROM openjdk:17-jdk-slim

WORKDIR /app

# Gradleビルドファイルをコピー
COPY build.gradle settings.gradle ./
COPY gradle ./gradle
COPY gradlew ./

# Gradleラッパーに実行権限を付与
RUN chmod +x gradlew

# 依存関係をインストール
# RUN ./gradlew dependencies

# ソースコードをコピー
COPY src ./src

# アプリケーションをビルド
# RUN ./gradlew build -x test

# ポートを公開
EXPOSE 8080

# アプリケーションを実行
CMD ["./gradlew", "bootRun"]
EOF

# settings.gradleの作成
cat > settings.gradle << 'EOF'
rootProject.name = 'gantt-chart'
EOF

# アプリケーションクラスの作成
mkdir -p src/main/java/com/example/ganttchart
cat > src/main/java/com/example/ganttchart/GanttChartApplication.java << 'EOF'
package com.example.ganttchart;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class GanttChartApplication {
    public static void main(String[] args) {
        SpringApplication.run(GanttChartApplication.class, args);
    }
}
EOF

# モデルクラスの作成
mkdir -p src/main/java/com/example/ganttchart/model
cat > src/main/java/com/example/ganttchart/model/Task.java << 'EOF'
package com.example.ganttchart.model;

import java.time.LocalDateTime;
import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "tasks")
public class Task {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String name;
    private String process;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String color;
}
EOF

cat > src/main/java/com/example/ganttchart/model/Dependency.java << 'EOF'
package com.example.ganttchart.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "dependencies")
public class Dependency {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private Long sourceId;
    private Long targetId;
}
EOF

# リポジトリクラスの作成
mkdir -p src/main/java/com/example/ganttchart/repository
cat > src/main/java/com/example/ganttchart/repository/TaskRepository.java << 'EOF'
package com.example.ganttchart.repository;

import com.example.ganttchart.model.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    // カスタムクエリが必要な場合はここに追加
}
EOF

cat > src/main/java/com/example/ganttchart/repository/DependencyRepository.java << 'EOF'
package com.example.ganttchart.repository;

import com.example.ganttchart.model.Dependency;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DependencyRepository extends JpaRepository<Dependency, Long> {
    // カスタムクエリが必要な場合はここに追加
}
EOF

# サービスクラスの作成
mkdir -p src/main/java/com/example/ganttchart/service
cat > src/main/java/com/example/ganttchart/service/GanttService.java << 'EOF'
package com.example.ganttchart.service;

import com.example.ganttchart.model.Task;
import com.example.ganttchart.model.Dependency;
import com.example.ganttchart.repository.TaskRepository;
import com.example.ganttchart.repository.DependencyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

@Service
public class GanttService {
    
    private final TaskRepository taskRepository;
    private final DependencyRepository dependencyRepository;
    
    @Autowired
    public GanttService(TaskRepository taskRepository, DependencyRepository dependencyRepository) {
        this.taskRepository = taskRepository;
        this.dependencyRepository = dependencyRepository;
    }
    
    // すべてのタスクを取得
    public List<Task> getAllTasks() {
        return taskRepository.findAll();
    }
    
    // すべての依存関係を取得
    public List<Dependency> getAllDependencies() {
        return dependencyRepository.findAll();
    }
    
    // タスクを更新
    @Transactional
    public Task updateTask(Long id, Task taskDetails) {
        Optional<Task> taskOpt = taskRepository.findById(id);
        
        if (taskOpt.isPresent()) {
            Task task = taskOpt.get();
            
            // 必要なフィールドを更新
            if (taskDetails.getName() != null) {
                task.setName(taskDetails.getName());
            }
            if (taskDetails.getProcess() != null) {
                task.setProcess(taskDetails.getProcess());
            }
            if (taskDetails.getStartDate() != null) {
                task.setStartDate(taskDetails.getStartDate());
            }
            if (taskDetails.getEndDate() != null) {
                task.setEndDate(taskDetails.getEndDate());
            }
            if (taskDetails.getColor() != null) {
                task.setColor(taskDetails.getColor());
            }
            
            return taskRepository.save(task);
        } else {
            throw new RuntimeException("タスクが見つかりません ID: " + id);
        }
    }
    
    // 複数のタスクを一括更新
    @Transactional
    public List<Task> updateMultipleTasks(List<Task> tasks) {
        return taskRepository.saveAll(tasks);
    }
    
    // タスクを作成
    public Task createTask(Task task) {
        return taskRepository.save(task);
    }
    
    // 依存関係を作成
    public Dependency createDependency(Dependency dependency) {
        return dependencyRepository.save(dependency);
    }
    
    // タスクを削除
    public void deleteTask(Long id) {
        taskRepository.deleteById(id);
    }
    
    // 依存関係を削除
    public void deleteDependency(Long id) {
        dependencyRepository.deleteById(id);
    }
}
EOF

# コントローラークラスの作成
mkdir -p src/main/java/com/example/ganttchart/controller
cat > src/main/java/com/example/ganttchart/controller/GanttController.java << 'EOF'
package com.example.ganttchart.controller;

import com.example.ganttchart.model.Task;
import com.example.ganttchart.model.Dependency;
import com.example.ganttchart.service.GanttService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*") // 開発環境用。本番環境では適切なオリジンを指定
public class GanttController {
    
    private final GanttService ganttService;
    
    @Autowired
    public GanttController(GanttService ganttService) {
        this.ganttService = ganttService;
    }
    
    // ガントチャート全データの取得
    @GetMapping("/gantt-data")
    public ResponseEntity<Map<String, Object>> getGanttData() {
        List<Task> tasks = ganttService.getAllTasks();
        List<Dependency> dependencies = ganttService.getAllDependencies();
        
        Map<String, Object> response = new HashMap<>();
        response.put("tasks", tasks);
        response.put("dependencies", dependencies);
        
        return ResponseEntity.ok(response);
    }
    
    // タスク更新API
    @PostMapping("/update-tasks")
    public ResponseEntity<List<Task>> updateTasks(@RequestBody Map<String, List<Map<String, Object>>> request) {
        List<Map<String, Object>> taskUpdates = request.get("tasks");
        
        // 更新するタスクのリストを作成
        List<Task> tasksToUpdate = taskUpdates.stream()
            .map(update -> {
                Long taskId = Long.parseLong(update.get("taskId").toString());
                Task task = ganttService.getAllTasks().stream()
                    .filter(t -> t.getId().equals(taskId))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("タスクが見つかりません ID: " + taskId));
                
                // タスクの日付を更新
                if (update.containsKey("startDate")) {
                    task.setStartDate(LocalDateTime.parse(update.get("startDate").toString()));
                }
                if (update.containsKey("endDate")) {
                    task.setEndDate(LocalDateTime.parse(update.get("endDate").toString()));
                }
                
                return task;
            })
            .toList();
        
        // 一括更新して結果を返す
        List<Task> updatedTasks = ganttService.updateMultipleTasks(tasksToUpdate);
        return ResponseEntity.ok(updatedTasks);
    }
    
    // 単一タスク取得API
    @GetMapping("/tasks/{id}")
    public ResponseEntity<Task> getTaskById(@PathVariable Long id) {
        return ganttService.getAllTasks().stream()
            .filter(task -> task.getId().equals(id))
            .findFirst()
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
    
    // タスク作成API
    @PostMapping("/tasks")
    public ResponseEntity<Task> createTask(@RequestBody Task task) {
        Task createdTask = ganttService.createTask(task);
        return ResponseEntity.ok(createdTask);
    }
    
    // 依存関係作成API
    @PostMapping("/dependencies")
    public ResponseEntity<Dependency> createDependency(@RequestBody Dependency dependency) {
        Dependency createdDependency = ganttService.createDependency(dependency);
        return ResponseEntity.ok(createdDependency);
    }
    
    // タスク削除API
    @DeleteMapping("/tasks/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id) {
        ganttService.deleteTask(id);
        return ResponseEntity.ok().build();
    }
    
    // 依存関係削除API
    @DeleteMapping("/dependencies/{id}")
    public ResponseEntity<Void> deleteDependency(@PathVariable Long id) {
        ganttService.deleteDependency(id);
        return ResponseEntity.ok().build();
    }
}
EOF

# application.propertiesの作成
mkdir -p src/main/resources
cat > src/main/resources/application.properties << 'EOF'
# データベース接続設定
spring.datasource.url=jdbc:postgresql://db:5432/ganttdb
spring.datasource.username=postgres
spring.datasource.password=password
spring.datasource.driver-class-name=org.postgresql.Driver

# JPA/Hibernateの設定
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect

# サーバー設定
server.port=8080

# ロギング設定
logging.level.org.springframework=INFO
logging.level.com.example=DEBUG

# CORS設定
spring.mvc.cors.allowed-origins=*
spring.mvc.cors.allowed-methods=GET,POST,PUT,DELETE
spring.mvc.cors.allowed-headers=*
EOF

echo -e "${BLUE}バックエンドのファイルを作成しました${NC}"

# ルートディレクトリに戻る
cd ..

echo -e "${GREEN}プロジェクトのセットアップが完了しました！${NC}"
echo -e "次のコマンドでプロジェクトを実行できます：\n"
echo -e "${YELLOW}docker-compose up${NC}"
echo -e "\nまたは、フロントエンドとバックエンドを個別に実行することもできます："
echo -e "${YELLOW}cd frontend && npm install && npm run serve${NC}"
echo -e "${YELLOW}cd backend && ./gradlew bootRun${NC}"
echo -e "\nフロントエンドは http://localhost:80 でアクセスできます。"
echo -e "バックエンドは http://localhost:8080 でアクセスできます。"