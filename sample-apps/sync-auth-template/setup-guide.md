# 🛠️ Firebase認証テンプレート - 詳細セットアップガイド

## 📋 目次

1. [事前準備](#1-事前準備)
2. [Firebaseプロジェクト作成](#2-firebaseプロジェクト作成)
3. [Authentication設定](#3-authentication設定)
4. [Realtime Database設定](#4-realtime-database設定)
5. [テンプレート設定](#5-テンプレート設定)
6. [ローカル開発環境](#6-ローカル開発環境)
7. [動作確認](#7-動作確認)
8. [本番環境デプロイ](#8-本番環境デプロイ)

## 1. 事前準備

### 必要なもの

- ✅ Googleアカウント
- ✅ モダンブラウザ（Chrome、Firefox、Safari、Edge）
- ✅ テキストエディタ（VS Code、Sublime Text等）
- ✅ ローカルサーバー（Python、Node.js、PHP等）

### 前提知識

- 📚 HTML/CSS/JavaScript の基本知識
- 📚 Firebaseの基本概念（推奨）

## 2. Firebaseプロジェクト作成

### Step 1: Firebase Console にアクセス

1. https://console.firebase.google.com/ を開く
2. Googleアカウントでログイン
3. 「プロジェクトを作成」をクリック

### Step 2: プロジェクト作成

1. **プロジェクト名**: 任意の名前を入力（例：my-app-project）
2. **Google アナリティクス**: 有効にする（推奨）
3. **アナリティクスアカウント**: デフォルトまたは新規作成
4. 「プロジェクトを作成」をクリック

### Step 3: ウェブアプリを追加

1. プロジェクトダッシュボードで `</>` アイコンをクリック
2. **アプリのニックネーム**: 任意の名前（例：my-app）
3. **Firebase Hosting**: チェックを入れる（推奨）
4. 「アプリを登録」をクリック

### Step 4: 設定情報を保存

表示された設定をコピーして保存：

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "my-app-project.firebaseapp.com",
  databaseURL: "https://my-app-project-default-rtdb.firebaseio.com",
  projectId: "my-app-project",
  storageBucket: "my-app-project.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef..."
};
```

## 3. Authentication設定

### Step 1: Authentication を有効化

1. 左メニューから「Authentication」をクリック
2. 「始める」をクリック

### Step 2: Googleプロバイダーを設定

1. 「Sign-in method」タブをクリック
2. 「Google」を選択
3. 「有効にする」をオンにする
4. **プロジェクトのサポートメール**: あなたのメールアドレス
5. 「保存」をクリック

### Step 3: 承認済みドメインを確認

1. 「Settings」タブをクリック
2. 「Authorized domains」セクションを確認
3. 以下が含まれていることを確認：
   - `localhost`
   - `your-project.firebaseapp.com`
   - `your-project.web.app`

### Step 4: テストアカウントを追加（オプション）

1. 「Users」タブでテストユーザーを確認

## 4. Realtime Database設定

### Step 1: Realtime Database を作成

1. 左メニューから「Realtime Database」をクリック
2. 「データベースを作成」をクリック
3. **リージョン**: asia-southeast1（シンガポール）を推奨
4. **セキュリティルール**: 「テストモードで開始」を選択
5. 「有効にする」をクリック

### Step 2: セキュリティルールを設定

1. 「ルール」タブをクリック
2. 現在のルールを以下に置き換え：

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid && auth.provider === 'google'",
        ".validate": "auth != null"
      }
    },
    ".read": false,
    ".write": false
  }
}
```

3. 「公開」をクリック

### Step 3: データ構造を確認

データは以下の構造で保存されます：

```
your-database/
└── users/
    ├── user1_uid/
    │   ├── todos/
    │   ├── surveys/
    │   └── その他のデータ/
    └── user2_uid/
        ├── todos/
        └── その他のデータ/
```

## 5. テンプレート設定

### Step 1: 設定ファイルを編集

`config/firebase-config.js` を開いて、Step 2-4 で取得した設定に変更：

```javascript
const firebaseConfig = {
    apiKey: "your-api-key-here",                    // ← Step 2-4の値
    authDomain: "your-project.firebaseapp.com",     // ← Step 2-4の値
    databaseURL: "https://your-project-default-rtdb.firebaseio.com", // ← Step 2-4の値
    projectId: "your-project",                      // ← Step 2-4の値
    storageBucket: "your-project.firebasestorage.app", // ← Step 2-4の値
    messagingSenderId: "123456789",                 // ← Step 2-4の値
    appId: "1:123456789:web:abcdef123456"          // ← Step 2-4の値
};
```

### Step 2: アプリ設定をカスタマイズ（オプション）

`config/app-settings.js` で以下を変更可能：

```javascript
const appConfig = {
    name: "My Awesome App",  // アプリ名
    features: {
        enableDataMasking: false,  // マスキング機能
        enableUserProfiles: true   // ユーザープロフィール
    }
};
```

## 6. ローカル開発環境

### Firebase認証は `file://` プロトコルでは動作しません

必ずローカルサーバーを起動してください：

#### Python がある場合

```bash
cd your-template-folder
python3 -m http.server 8000
```

#### Node.js がある場合

```bash
cd your-template-folder
npx http-server -p 8000
```

#### PHP がある場合

```bash
cd your-template-folder
php -S localhost:8000
```

#### VS Code の Live Server 拡張機能

1. VS Code で Live Server 拡張機能をインストール
2. HTMLファイルを右クリック → 「Open with Live Server」

### アクセス方法

ブラウザで以下にアクセス：

- http://localhost:8000/examples/todo-app.html
- http://localhost:8000/examples/survey-app.html

## 7. 動作確認

### Step 1: 基本機能テスト

1. **認証テスト**
   - ログインボタンをクリック
   - Google認証画面が表示される
   - 認証後にユーザー情報が表示される

2. **データ操作テスト**
   - ToDoアプリでタスクを追加
   - データがリアルタイムで表示される
   - Firebase Console のデータベースで確認

3. **ユーザー分離テスト**
   - 別のGoogleアカウントでログイン
   - 前のユーザーのデータが表示されない

### Step 2: セキュリティテスト

1. **未認証アクセステスト**
   ```
   https://your-project-default-rtdb.firebaseio.com/users.json
   ```
   → Permission denied が返される

2. **Database Rules テスト**
   - Firebase Console → Realtime Database → ルール → シミュレーター

### Step 3: エラーハンドリングテスト

1. **ネットワーク切断テスト**
   - WiFiを切断して操作
   - 再接続後にデータが同期される

2. **無効なデータテスト**
   - 空のデータを送信
   - 適切なエラーメッセージが表示される

## 8. 本番環境デプロイ

### Firebase Hosting（推奨）

1. **Firebase CLI インストール**
   ```bash
   npm install -g firebase-tools
   ```

2. **ログイン**
   ```bash
   firebase login
   ```

3. **プロジェクト初期化**
   ```bash
   firebase init hosting
   ```

4. **デプロイ**
   ```bash
   firebase deploy
   ```

### 他のホスティングサービス

#### GitHub Pages

1. GitHubリポジトリを作成
2. テンプレートファイルをプッシュ
3. Settings → Pages でGitHub Pagesを有効化

#### Netlify

1. Netlifyアカウントを作成
2. フォルダをドラッグ＆ドロップでデプロイ

#### Vercel

1. Vercelアカウントを作成
2. GitHubリポジトリと連携してデプロイ

### 本番環境での注意点

1. **承認済みドメインを追加**
   - Firebase Console → Authentication → Settings
   - 本番ドメインを「Authorized domains」に追加

2. **デバッグモードを無効化**
   ```javascript
   // config/app-settings.js
   const appSettings = {
       debugMode: false  // 本番では false
   };
   ```

3. **HTTPS必須**
   - Firebase認証はHTTPS必須
   - ほとんどのホスティングサービスで自動対応

## 🔧 トラブルシューティング

### よくある問題と解決方法

#### 1. "This operation is not supported in the environment..."

**原因**: file:// プロトコルで開いている  
**解決**: ローカルサーバーを起動

#### 2. "Permission denied"

**原因**: Database Rules が正しく設定されていない  
**解決**: Step 4-2 のルールを再確認

#### 3. "Auth domain not authorized"

**原因**: ドメインが承認済みドメインに含まれていない  
**解決**: Firebase Console で現在のドメインを追加

#### 4. "Firebase App named '[DEFAULT]' already exists"

**原因**: Firebase が既に初期化されている  
**解決**: ページをリロードするか、以下のコードを使用

```javascript
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
```

#### 5. データが表示されない

**確認ポイント**:
- ユーザーがログインしているか？
- Database Rules が正しく設定されているか？
- ネットワーク接続は正常か？
- ブラウザの開発者ツールでエラーを確認

### デバッグ方法

1. **ブラウザ開発者ツール**
   - F12 を押してConsoleタブを確認
   - エラーメッセージを読む

2. **Firebase Console**
   - Authentication → Users でユーザー登録確認
   - Realtime Database → データ でデータ確認

3. **ネットワークタブ**
   - Firebase APIの通信状況を確認

## 📞 サポート

困った時は：

1. **このガイドを再確認**
2. **ブラウザの開発者ツールでエラーを確認**
3. **Firebase公式ドキュメントを参照**
4. **開発者に連絡**

---

**これでセットアップ完了です！🎉**  
Happy Coding!