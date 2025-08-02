# 🔥 Firebase認証テンプレート

## 📋 概要

このテンプレートは、Firebase Authentication と Realtime Database を使用したWebアプリケーション開発を簡単にするためのコア機能を提供します。

### ✨ 主な機能

- 🔐 **Google認証**: ワンクリックでGoogle認証を実装
- 👤 **ユーザー別データ分離**: 各ユーザーのデータを完全に分離
- ⚡ **リアルタイム同期**: データの変更が即座に反映
- 🛡️ **セキュリティ**: Database Rulesによる適切なアクセス制御
- 🔒 **プライバシー保護**: センシティブデータのマスキング機能
- 🧩 **モジュール設計**: コア機能とアプリロジックを分離

### 🎯 こんな方におすすめ

- Firebase初心者だけど、しっかりとしたアプリを作りたい
- 認証周りの実装を簡単にしたい
- ユーザー別データ管理を手軽に実装したい
- セキュリティのベストプラクティスを取り入れたい

## 📁 フォルダ構成

```
firebase-auth-template/
├── 📁 core/                    ← ⚠️ 触らないでください
│   ├── firebase-auth.js        # 認証コア機能
│   ├── firebase-data.js        # データ管理コア機能
│   └── template-ui.js          # UI部品（予定）
├── 📁 config/                  ← 🔧 ここを編集してください
│   ├── firebase-config.js      # Firebase設定（必須）
│   └── app-settings.js         # アプリ設定（オプション）
├── 📁 examples/                ← 📖 参考にしてください
│   ├── todo-app.html           # ToDoアプリ例
│   └── survey-app.html         # アンケートアプリ例（マスキング機能付き）
├── README.md                   # このファイル
└── setup-guide.md             # 詳細セットアップ手順
```

## 🚀 クイックスタート（5分で開始）

### 1. テンプレートをダウンロード

```bash
# このフォルダをコピーして使用してください
cp -r firebase-auth-template/ my-new-app/
cd my-new-app/
```

### 2. Firebase設定を変更

`config/firebase-config.js` を編集：

```javascript
const firebaseConfig = {
    apiKey: "your-api-key-here",              // ← 変更
    authDomain: "your-project.firebaseapp.com", // ← 変更
    databaseURL: "https://your-project-default-rtdb.firebaseio.com", // ← 変更
    projectId: "your-project",                // ← 変更
    storageBucket: "your-project.firebasestorage.app", // ← 変更
    messagingSenderId: "123456789",           // ← 変更
    appId: "1:123456789:web:abcdef123456"     // ← 変更
};
```

### 3. Firebase Console でセキュリティ設定

Database Rules を以下に設定：

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid && auth.provider === 'google'"
      }
    },
    ".read": false,
    ".write": false
  }
}
```

### 4. サンプルアプリを開く

```bash
# ローカルサーバーを起動（Firebase認証に必要）
python3 -m http.server 8000
# または
node -e "require('http').createServer((req,res)=>{...}).listen(8000)"
```

ブラウザで `http://localhost:8000/examples/todo-app.html` を開く

### 5. 完了！ 🎉

Google認証でログインして、あなた専用のToDoアプリをお試しください。

## 💡 使用方法

### 基本的な実装パターン

```html
<!DOCTYPE html>
<html>
<head>
    <title>My App</title>
</head>
<body>
    <!-- Firebase SDK -->
    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-database-compat.js"></script>

    <!-- 設定ファイル -->
    <script src="config/firebase-config.js"></script>
    
    <!-- コア機能 -->
    <script src="core/firebase-auth.js"></script>
    <script src="core/firebase-data.js"></script>

    <script>
        // アプリ初期化
        const authCore = window.FirebaseAuthCore;
        const dataCore = new FirebaseDataCore();
        
        authCore.init(firebaseConfig);
        dataCore.init(firebaseConfig, 'my-data-type');
        
        // 認証状態監視
        authCore.onAuthStateChanged((user) => {
            if (user) {
                dataCore.setupUserData(user);
                showApp();
            } else {
                showLogin();
            }
        });
        
        // データ変更監視
        dataCore.onDataChange((data) => {
            updateUI(data);
        });
        
        // 認証関数
        async function login() {
            await authCore.signInWithGoogle();
        }
        
        // データ追加
        async function addData(content) {
            await dataCore.addData({ content });
        }
    </script>
</body>
</html>
```

### 主要なAPIメソッド

#### 認証 (FirebaseAuthCore)

```javascript
// 初期化
authCore.init(firebaseConfig);

// Google認証
await authCore.signInWithGoogle();

// ログアウト
await authCore.signOut();

// 現在のユーザー取得
const user = authCore.getCurrentUser();

// 認証状態監視
authCore.onAuthStateChanged((user) => {
    console.log('認証状態変更:', user);
});
```

#### データ管理 (FirebaseDataCore)

```javascript
// 初期化
dataCore.init(firebaseConfig, 'my-data-type');

// ユーザーデータ設定
dataCore.setupUserData(user);

// データ追加
await dataCore.addData({ title: 'Hello', content: 'World' });

// データ更新
await dataCore.updateData(id, { title: 'Updated' });

// データ削除
await dataCore.removeData(id);

// データ変更監視
dataCore.onDataChange((data) => {
    console.log('データ更新:', data);
});
```

## 🔒 セキュリティ機能

### Database Rules（必須）

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid && auth.provider === 'google'"
      }
    },
    ".read": false,
    ".write": false
  }
}
```

### データマスキング（オプション）

```javascript
// センシティブデータを自動マスキング
await dataCore.addData({
    publicData: 'みんなに見える情報',
    content: 'マスキングされる情報'
}, true); // withMasking = true
```

## 📖 サンプルアプリ

### ToDoアプリ (`examples/todo-app.html`)

- 基本的なCRUD操作
- リアルタイム同期
- ユーザー別データ管理

### アンケートアプリ (`examples/survey-app.html`)

- センシティブデータの取り扱い
- マスキング機能
- プライバシー保護

## 🛠️ カスタマイズ

### UI テーマ変更

`config/app-settings.js` でカラーテーマやフォントを変更：

```javascript
const uiTheme = {
    primaryColor: "#your-color",
    secondaryColor: "#your-secondary-color",
    fontFamily: "your-font-family"
};
```

### 機能の有効/無効

```javascript
const appConfig = {
    features: {
        enableOfflineMode: true,
        enableRealTimeSync: true,
        enableDataMasking: false,
        enableUserProfiles: true
    }
};
```

## 🚨 トラブルシューティング

### よくあるエラー

#### "Firebase: This operation is not supported..."

**原因**: `file://` プロトコルで開いている  
**解決**: ローカルサーバーを起動して `http://localhost:8000` でアクセス

#### "Permission denied"

**原因**: Database Rules が設定されていない  
**解決**: Firebase Console でDatabase Rulesを設定

#### "Auth domain not authorized"

**原因**: ドメインが承認済みドメインに含まれていない  
**解決**: Firebase Console の Authentication → Settings で現在のドメインを追加

### デバッグモード

```javascript
// config/app-settings.js
const appSettings = {
    debugMode: true // コンソールに詳細ログを出力
};
```

## 📚 詳細ドキュメント

- [setup-guide.md](setup-guide.md) - 詳細なセットアップ手順
- [Firebase Console](https://console.firebase.google.com/) - Firebase設定
- [Firebase Auth ドキュメント](https://firebase.google.com/docs/auth)
- [Firebase Realtime Database ドキュメント](https://firebase.google.com/docs/database)

## 🤝 サポート

質問やバグ報告は以下まで：

- GitHub Issues（もしあれば）
- メール（もしあれば）
- 開発者に直接連絡

## 📄 ライセンス

MIT License - 自由に使用、修正、配布してください。

## 🎯 次のステップ

1. ✅ サンプルアプリで動作確認
2. ✅ 自分のFirebase設定に変更
3. ✅ Database Rulesを設定
4. 🚀 独自アプリの開発開始

---

**Happy Coding! 🎉**