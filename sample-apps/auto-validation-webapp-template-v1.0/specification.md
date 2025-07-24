# カンバンガクガク問題解決技術仕様書

## 技術課題詳細

### 問題1: ドロップインジケーター頻繁更新
**現状:** `updateDropIndicator()`がマウス移動毎に実行され、DOM操作が連続発生
**影響:** リペイント・リフローの連鎖でガクガク発生
**解決策:** throttle機能実装 + 状態変化時のみ更新

### 問題2: アニメーション競合
**現状:** CSS `transition` + `requestAnimationFrame` の重複処理
**影響:** アニメーション干渉による不自然な動き
**解決策:** GPU加速（transform3d）+ アニメーション整理

### 問題3: 座標計算重複
**現状:** `getBoundingClientRect()`が毎回実行
**影響:** 重い計算処理の反復
**解決策:** 座標キャッシュシステム実装

## 修正対象ファイル

### moneyApp.js
**修正箇所:**
1. CSS部分（line 167-453）: GPU加速・アニメーション最適化
2. `updateDropIndicator()` 関数（line 702-761）: throttle実装
3. `handleDragOver()` 関数（line 677-685）: 呼び出し頻度制限
4. パフォーマンス計測システム追加

## 実装技術仕様

### 1. ガクガク検知システム
```javascript
// パフォーマンス監視システム
const performanceMonitor = {
    frameDrops: 0,
    lastFrameTime: 0,
    
    checkPerformance() {
        const now = performance.now();
        const frameDuration = now - this.lastFrameTime;
        
        // 16.67ms(60FPS)を大幅に超える場合はガクガク判定
        if (frameDuration > 33.34) { // 30FPS以下
            this.frameDrops++;
            return 'poor';
        } else if (frameDuration > 22.22) { // 45FPS以下
            return 'average';
        }
        return 'excellent';
    }
};
```

### 2. スムーズ化CSS
```css
.kanban-item {
    will-change: transform;
    transform: translate3d(0, 0, 0); /* GPU加速 */
    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1); /* 最適化されたeasing */
    backface-visibility: hidden;
    perspective: 1000px;
}

.kanban-item.dragging {
    transition: none; /* ドラッグ中はCSS transitionを無効化 */
    transform: translate3d(0, 0, 0) scale(1.05) rotate(2deg);
}
```

### 3. DOM操作最適化
```javascript
// throttle機能付きインジケーター更新
const throttledUpdateDropIndicator = throttle(updateDropIndicator, 16); // 60FPS制限

function throttle(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
```

### 4. 座標キャッシュシステム
```javascript
const coordinateCache = new Map();

function getCachedRect(element) {
    const elementId = element.dataset.id || element.id;
    if (coordinateCache.has(elementId)) {
        return coordinateCache.get(elementId);
    }
    
    const rect = element.getBoundingClientRect();
    coordinateCache.set(elementId, rect);
    
    // 100ms後にキャッシュクリア
    setTimeout(() => coordinateCache.delete(elementId), 100);
    
    return rect;
}
```

## ログ強化仕様

### ガクガク状態ログ
```json
{
    "performanceMetrics": {
        "frameDropCount": 5,
        "averageFrameTime": 28.5,
        "worstFrameTime": 45.2,
        "performanceRating": "poor",
        "dragDuration": 1250,
        "smoothnessScore": 0.65
    },
    "dragEvents": [
        {
            "timestamp": "2025-07-24T14:15:22.123Z",
            "event": "drag_performance_check",
            "frameDuration": 32.1,
            "rating": "poor",
            "coordinates": {...}
        }
    ]
}
```

## 成功判定基準

### パフォーマンス指標
- **フレームレート**: 55FPS以上維持
- **フレームドロップ**: ドラッグ中5回以下
- **応答時間**: ドラッグ開始～インジケーター表示 < 16ms

### 機能保持確認
- ✅ 座標追跡システム正常動作
- ✅ ログ生成・ダウンロード機能正常
- ✅ カンバン移動機能正常
- ✅ Firebase認証・DB機能正常

## 実装順序
1. パフォーマンス監視システム追加
2. CSS GPU加速最適化
3. throttle機能実装
4. 座標キャッシュシステム実装
5. ログ強化
6. テスト実行・検証

## 1. システム全体仕様

### 1.1 ファイル構成
```
/common-template/
├── common.js              # 共通基盤（変更禁止）
├── moneyApp.js           # お金管理アプリ
├── package.json          # 依存関係定義
├── logs/                 # ログ出力ディレクトリ
├── uploads/              # アップロードファイル
└── public/               # 静的ファイル
    ├── css/
    └── js/
```

### 1.2 ポート設定
- **メインサーバー:** 3001番ポート
- **ログAPI:** 3001/api/generate-log
- **テストアクセス:** curl -X POST localhost:3001/api/generate-test-log

## 2. common.js 仕様

### 2.1 基本構造
```javascript
// 必須モジュール
const express = require('express');
const admin = require('firebase-admin');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const path = require('path');
const fs = require('fs');

// Expressアプリ作成・設定
// Firebase初期化
// ミドルウェア設定
// 共通ルート定義
// エクスポート関数
```

### 2.2 共通APIエンドポイント

#### 2.2.1 ログ関連
- **POST /api/generate-log**
  - 用途: フロントエンドからのログ生成要求
  - 入力: JSON（action, data, timestamp）
  - 出力: ログファイル生成 + 成功レスポンス
  
- **POST /api/generate-test-log**  
  - 用途: Claude Code自動テスト用
  - 入力: なし
  - 出力: テストログJSON生成

#### 2.2.2 CSV出力
- **POST /api/download-csv**
  - 用途: 汎用データのCSV変換・ダウンロード
  - 入力: JSON（headers, data配列）
  - 出力: CSVファイル

#### 2.2.3 データベース操作
- **GET /api/data/:collection**
  - 用途: Firebase Realtime DB読み取り
  - 認証: 必須（Firebase Auth Token）
  - 出力: JSON（ユーザー別データ）

- **POST /api/data/:collection**
  - 用途: Firebase Realtime DB書き込み  
  - 認証: 必須
  - 入力: JSON（保存データ）

#### 2.2.4 認証
- **POST /api/auth/verify**
  - 用途: Firebase Auth Token検証
  - 入力: Authorization Header
  - 出力: ユーザー情報またはエラー

### 2.3 エクスポート関数

#### 2.3.1 createCommonApp()
```javascript
function createCommonApp(appConfig) {
  // Express app作成
  // Firebase初期化  
  // 共通ミドルウェア設定
  // 共通ルート設定
  // return app;
}
```

#### 2.3.2 setupLogging(app, appName)
```javascript
function setupLogging(app, appName) {
  // ログディレクトリ作成
  // ログ記録ミドルウェア
  // /api/generate-log エンドポイント
  // /api/generate-test-log エンドポイント
}
```

#### 2.3.3 setupCSVExport(app)
```javascript
function setupCSVExport(app) {
  // /api/download-csv エンドポイント
  // 汎用CSV変換器
}
```

#### 2.3.4 setupFirebase(app)
```javascript
function setupFirebase(app) {
  // Firebase Admin SDK初期化
  // Auth検証ミドルウェア
  // DB操作エンドポイント
}
```

## 3. moneyApp.js 仕様

### 3.1 基本構造
```javascript
const { createCommonApp, setupLogging, setupCSVExport, setupFirebase } = require('./common');

// アプリ設定
const appConfig = {
  name: 'Money Management App',
  port: 3001,
  collection: 'money_data'
};

// 共通基盤初期化
const app = createCommonApp(appConfig);

// アプリ固有ルート追加
// フロントエンドHTML配信
// データモデル定義
// サーバー起動
```

### 3.2 データモデル
```javascript
const MoneyData = {
  id: String,           // ユニークID (timestamp-based)
  userId: String,       // Firebase Auth UID
  amount: Number,       // 金額（正=収入、負=支出）
  category: String,     // カテゴリ（収入/食費/交通費/娯楽費等）
  description: String,  // 説明・メモ
  date: String,        // 日付（YYYY-MM-DD）
  timestamp: Number,   // 作成時刻（Date.now()）
  tags: Array          // タグ配列（任意）
};
```

### 3.3 アプリ固有ルート

#### 3.3.1 GET /
- フロントエンドHTML配信（お金管理UI）

#### 3.3.2 GET /api/summary
- 用途: 収支サマリー取得
- 出力: 総収入、総支出、残高、カテゴリ別集計

#### 3.3.3 GET /api/analytics
- 用途: 分析データ取得  
- 出力: 月別推移、カテゴリ別比率

### 3.4 フロントエンド仕様

#### 3.4.1 画面レイアウト
```html
<!DOCTYPE html>
<html>
<head>
  <title>💰 お金管理アプリ</title>
  <!-- Firebase SDK -->
  <!-- 共通CSS（レスポンシブ対応）-->
</head>
<body>
  <!-- ヘッダー: 認証状態・ユーザー情報 -->
  <!-- メイン入力フォーム -->
  <!-- データ一覧表示 -->
  <!-- 集計サマリー -->
  <!-- ダウンロードボタン -->  
  <!-- ログエリア -->
</body>
</html>
```

#### 3.4.2 入力フォーム
- **金額:** number input（正負対応）
- **カテゴリ:** select（プリセット + カスタム）
- **説明:** text input（任意）
- **日付:** date input（デフォルト: 今日）

#### 3.4.3 データ一覧
- **ソート:** 日付降順（最新が上）
- **表示項目:** 日付、カテゴリ、金額、説明、操作（編集・削除）
- **フィルター:** カテゴリ別、日付範囲

#### 3.4.4 集計サマリー
- **今月の収支:** 収入・支出・残高
- **カテゴリ別:** 支出カテゴリごとの金額・割合
- **グラフ:** 簡易棒グラフ（CSS）

## 4. 動作確認テスト仕様

### 4.1 段階的テスト手順

#### Step 1: サーバー起動確認
```bash
cd /data/data/com.termux/files/home/common-template
node moneyApp.js
# 期待: "Money Management App running on port 3001"
```

#### Step 2: ログAPI確認
```bash
curl -X POST localhost:3001/api/generate-test-log
# 期待: JSONファイル生成 + 200レスポンス
```

#### Step 3: Claude Code自動読み取り
```javascript
// Read tool でログファイル内容確認
// 期待: 正常なJSONデータ構造
```

#### Step 4: フロントエンド表示確認
```bash
termux-open http://localhost:3001
# 期待: お金管理画面表示、Firebase認証ボタン表示
```

#### Step 5: Firebase機能確認
- Google認証実行
- データ追加・表示・削除
- リアルタイム同期確認

#### Step 6: CSV出力確認
- データ入力後、ダウンロードボタンクリック
- CSV形式ファイル生成確認

### 4.2 成功判定基準
1. ✅ サーバー正常起動（3001ポート）
2. ✅ ログAPI実行成功（JSONファイル生成）
3. ✅ Claude Code読み取り成功（構造化データ確認）
4. ✅ フロントエンド表示成功（UI完全表示）
5. ✅ Firebase認証成功（Google OAuth）
6. ✅ データベース操作成功（CRUD操作）
7. ✅ CSV出力成功（ファイルダウンロード）
8. ✅ ログ記録成功（全操作の自動記録）

## 5. エラーハンドリング仕様

### 5.1 共通エラー処理
- **Firebase接続エラー:** 接続再試行 + ログ記録
- **認証エラー:** 適切なリダイレクト + エラーメッセージ
- **DB操作エラー:** エラーログ + ユーザー通知
- **ファイル操作エラー:** ディレクトリ作成 + 再試行

### 5.2 ログ出力フォーマット
```json
{
  "timestamp": "2025-07-23T14:30:00.000Z",
  "level": "info|warn|error",
  "source": "moneyApp",
  "action": "data_create|auth_login|csv_export",
  "userId": "firebase_uid",
  "details": {},
  "success": true|false,
  "errorMessage": "error_description"
}
```

この仕様書に基づき、実装を開始します。