# カンバンガクガク問題解決プロジェクト計画書

## プロジェクト概要
- **目的**: common-templateのカンバン画面ガクガク（揺れ・ちら付き）問題の解決
- **対象**: `/data/data/com.termux/files/home/common-template/moneyApp.js`
- **重要**: 基本3機能（Google認証、realtimeDB、ログDL機能）は絶対維持

## 現状分析
- ✅ 8割の機能は正常動作
- ❌ カンバンドラッグ&ドロップ時の画面揺れが発生
- ✅ ログシステム・座標追跡システムは動作済み

## 推定原因
1. **ドロップインジケーター頻繁更新**: マウス移動毎のDOM操作でリペイント連発
2. **アニメーション競合**: CSS transition + requestAnimationFrame の重複
3. **座標計算重複**: getBoundingClientRect()の無駄な連続実行
4. **要素再配置による連鎖リフロー**: DOM構造変更時の予期しない再描画

## 目標効率化
- 通常300%の工数を180%に削減（共通部分60%、個別部分40%）
- 基本3機能（Google認証・RealtimeDB・ログDL）の完全共通化

## アーキテクチャ設計

### 1. 共通ファイル: common.js（変更禁止）
**責任範囲：**
- Express.jsサーバー基盤
- 基本ルーティング（/, /api/*, /auth/*）
- Firebase Auth統合（Google認証）
- Firebase Realtime Database統合
- CSV出力エンジン（汎用データ→CSV変換）
- ログ機能（自動取得・ダウンロード）
- エラーハンドリング
- セキュリティ設定

**APIエンドポイント：**
- GET / → ルートページ（個別アプリが設定）
- POST /api/generate-log → ログ生成・ファイル出力
- POST /api/download-csv → CSV生成・ダウンロード
- POST /api/auth/login → Google認証開始
- POST /api/auth/logout → ログアウト
- GET /api/data/:collection → DB読み取り
- POST /api/data/:collection → DB書き込み

### 2. 個別ファイル: [appName]App.js
**責任範囲：**
- common.jsのインポートと拡張
- アプリ固有のデータモデル定義
- アプリ固有のルート追加
- フロントエンドHTML/CSS（アプリ別デザイン）
- 業務ロジック（計算、バリデーション等）

## 実装仕様

### 共通機能仕様

#### 1. Firebase設定
```javascript
const firebaseConfig = {
  // 既存テンプレートの設定を使用
  apiKey: "AIzaSyA5PXKChizYDCXF_GJ4KL6Ylq9K5hCPXWE",
  authDomain: "shares-b1b97.firebaseapp.com",
  databaseURL: "https://shares-b1b97-default-rtdb.firebaseio.com",
  // ... 他設定
};
```

#### 2. データダウンロード機能
- **入力:** アプリから渡される任意データ配列
- **出力:** CSV形式ファイル
- **実装:** 汎用的なオブジェクト→CSV変換器

#### 3. ログ機能
- **自動記録:** アクセス、認証、DB操作、エラー
- **出力形式:** JSON（タイムスタンプ・ユーザー・アクション・詳細）
- **ダウンロード:** /api/generate-log経由

#### 4. 認証システム
- **プロバイダー:** Google OAuth
- **セッション管理:** Firebase Auth Token
- **権限制御:** ユーザー別データ分離

### 個別アプリ仕様（お金管理アプリ）

#### データモデル
```javascript
{
  id: String,          // ユニークID
  userId: String,      // ユーザーID（Firebase）
  amount: Number,      // 金額
  category: String,    // カテゴリ（収入/支出/貯金等）
  description: String, // 説明
  date: Date,         // 日付
  timestamp: Number   // 作成時刻
}
```

#### 画面構成
1. **ヘッダー:** Google認証状態表示
2. **入力フォーム:** 金額・カテゴリ・説明・日付
3. **データ一覧:** 時系列表示・編集・削除
4. **集計表示:** カテゴリ別合計・月別推移
5. **ダウンロード:** CSV出力ボタン
6. **ログエリア:** システムログ表示

#### 特有機能
- 収支計算（自動集計）
- カテゴリ別分析
- 月次レポート
- 予算設定・アラート

## 技術スタック
- **バックエンド:** Node.js + Express.js
- **認証:** Firebase Auth（Google OAuth）
- **データベース:** Firebase Realtime Database
- **フロントエンド:** HTML5 + CSS3 + Vanilla JavaScript
- **ファイル処理:** csv-writer（CSV生成）

## 開発順序
1. ✅ 計画書・仕様書作成
2. common.js実装（共通基盤）
3. package.json設定
4. moneyApp.js実装（個別アプリ）
5. サーバー起動・基本動作確認
6. Firebase機能テスト
7. ログ機能テスト  
8. CSV出力機能テスト

## 制約事項
- 共通ファイル（common.js）は作成後変更禁止
- アプリ分岐のif文禁止（純粋な汎用化）
- 既存テンプレートの基本3機能は保持
- ログは第3原則に従いサーバー・クライアント分離