# 🚀 汎用Webアプリテンプレート

## 概要
Firebase認証・リアルタイム同期・デバッグログ機能を完備した、プロダクションレディな汎用Webアプリテンプレートです。

元々ダイエット記録アプリとして開発されたものから、食事記録関連の機能をタスク管理に変更し、汎用的なWebアプリテンプレートとして再構築しました。

## ✨ 主要機能

### 🔐 認証・アカウント管理
- **Google OAuth認証** (Firebase Authentication)
- **複数アカウント対応** (アカウント切り替え)
- **ゲストモード** (ログインなしで使用可能)
- **デモモード** (ログイン中でも一時的にデモデータ表示)

### 💾 データ管理
- **Firebase Realtime Database** (認証ユーザー)
- **LocalStorage** (ゲスト・オフライン対応)
- **リアルタイム同期** (複数デバイス間)
- **アカウント別データ分離**

### 🎨 UI/UX
- **レスポンシブデザイン** (スマホ・PC対応)
- **ダークモード対応**
- **ドラッグ&ドロップ機能**
- **FAB (Floating Action Button)**
- **モーダルシステム**

### 🛠️ 開発者機能
- **リアルタイムデバッグログ**
- **ログのコピー・エクスポート**
- **データリセット機能**
- **Firebase ON/OFF切り替え**
- **バージョン表示**

## 🚀 セットアップ

### 1. Firebaseプロジェクト作成
1. [Firebase Console](https://console.firebase.google.com/) で新しいプロジェクトを作成
2. Authentication → Sign-in method → Google を有効化
3. Realtime Database を有効化
4. 承認済みドメインにデプロイ先ドメインを追加

### 2. 設定情報の更新
`webapp-template.html` の Firebase設定を更新：

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "your-project.firebaseapp.com",
    databaseURL: "https://your-project-default-rtdb.firebaseio.com",
    projectId: "your-project",
    storageBucket: "your-project.firebasestorage.app",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef1234567890"
};
```

### 3. デプロイ
- GitHub Pages
- Netlify
- Vercel
- Firebase Hosting

## 📱 デフォルト機能

### 記録タイプ
- **📝 タスク**: 作業項目・TODO
- **📔 ノート**: メモ・記録
- **👥 会議**: ミーティング記録
- **🎯 目標**: 目標設定・振り返り

### 時間帯区分
- **🌅 午前** (6:00-12:00)
- **☀️ 午後** (12:00-18:00)  
- **🌙 夜** (18:00-24:00)
- **🌌 深夜** (0:00-6:00)

### 優先度管理
- **高** (赤色)
- **中** (オレンジ色) 
- **低** (緑色)

## 🔧 カスタマイズ方法

### 1. 記録タイプの変更
FABボタンの選択肢を変更：

```html
<!-- FABオプション -->
<button class="fab-option" data-type="custom1" title="カスタム1">🔖</button>
<button class="fab-option" data-type="custom2" title="カスタム2">⚡</button>
```

```javascript
// タイプアイコンの設定
const typeIcons = {
    custom1: '🔖',
    custom2: '⚡',
    // 追加...
};
```

### 2. 時間帯区分の変更
HTML構造とCSS、JavaScript の期間定義を変更：

```html
<section class="time-period" data-period="custom-period">
    <h3>🎨 カスタム期間</h3>
    <div class="records-list" id="custom-period-records"></div>
</section>
```

### 3. テーマカラーの変更
CSS変数を変更：

```css
:root {
    --primary-color: #YOUR_COLOR;
    --secondary-color: #YOUR_COLOR;
}
```

### 4. 入力項目の変更
モーダル内のフォームを変更：

```html
<div class="form-group">
    <label for="customField">カスタム項目</label>
    <input type="text" id="customField" name="customField">
</div>
```

## 🏗️ アーキテクチャ

### ファイル構成
```
webapp-template.html    # 単一HTMLファイル (全機能含む)
├── HTML構造           # レスポンシブレイアウト
├── CSS               # モダンスタイル・ダークモード
└── JavaScript        # アプリケーションロジック
```

### クラス設計
```javascript
class WebApp {
    // 主要メソッド
    ├── 認証管理 (setupAuth, signInWithGoogle, signOut)
    ├── データ管理 (loadData, saveData, Firebase連携)
    ├── UI制御 (renderData, updateAccountUI)
    ├── イベント処理 (D&D, フォーム, ボタン)
    └── デバッグ (ログ管理, データリセット)
}
```

### データ構造
```javascript
{
  "2025-07-20": {
    "morning": [
      {
        "id": "uuid",
        "type": "task",
        "time": "09:00",
        "content": "タスク内容",
        "notes": "詳細メモ",
        "priority": "high"
      }
    ],
    "afternoon": [...],
    "evening": [...],
    "night": [...]
  }
}
```

## 🎯 使用例・応用アイデア

### 1. プロジェクト管理アプリ
- タスク → プロジェクト項目
- 時間帯 → フェーズ・工程
- 優先度 → 重要度

### 2. 学習管理アプリ
- タスク → 学習項目
- 時間帯 → 時間割
- メモ → 学習記録

### 3. 健康管理アプリ
- タスク → 運動・食事
- 時間帯 → 時間区分
- ノート → 体調記録

### 4. 日記・ライフログアプリ
- ノート → 日記エントリー
- 時間帯 → 一日の流れ
- 目標 → 振り返り

## 🔒 セキュリティ機能

### データ保護
- **Firebase Rules**: 認証済みユーザーのみアクセス可能
- **アカウント分離**: 他ユーザーのデータにアクセス不可
- **Local Fallback**: オフライン時の安全なローカル保存

### 推奨Firebase Rules
```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null",
    "webapp-data": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    }
  }
}
```

## 📊 機能比較

| 機能 | ゲストモード | 認証ユーザー | デモモード |
|------|-------------|-------------|-----------|
| データ保存 | LocalStorage | Firebase | LocalStorage |
| 複数デバイス同期 | ❌ | ✅ | ❌ |
| アカウント切り替え | ❌ | ✅ | ✅ |
| データ永続化 | ✅ | ✅ | ✅ |
| リアルタイム更新 | ❌ | ✅ | ❌ |

## 🚀 パフォーマンス

### 最適化済み機能
- **Single File**: デプロイ・管理が簡単
- **Event Delegation**: 動的コンテンツ対応
- **Lazy Loading**: 必要時のみFirebase接続
- **Local Caching**: オフライン対応

### 推奨スペック
- **最小**: スマートフォン (iOS/Android)
- **推奨**: モダンブラウザ (Chrome, Safari, Firefox, Edge)
- **ネットワーク**: オフライン対応 (LocalStorage)

## 🤝 ライセンス・貢献

### ライセンス
このテンプレートはMITライセンスの下で公開されています。商用・非商用問わず自由にご利用ください。

### 貢献方法
1. このテンプレートを使用してアプリを作成
2. 改善点・新機能のアイデアを共有
3. バグ報告・修正提案

## 📚 参考資料

### 元プロジェクト
- [ダイエット記録アプリ開発ログ](https://github.com/muumuu8181/claude-ai-toolkit/blob/main/DIET_TRACKER_PROJECT_LOG.md)
- 実装時間: 1日 (2025年7月20日)
- 最終バージョン: 2025.07.20-11:15

### 使用技術
- HTML5, CSS3, JavaScript (ES6+)
- Firebase Authentication
- Firebase Realtime Database
- CSS Grid, Flexbox
- Drag & Drop API

---

**このテンプレートを使用して、あなた独自のWebアプリを素早く構築してください！** 🎉