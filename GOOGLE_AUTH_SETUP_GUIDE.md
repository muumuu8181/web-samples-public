# 🔐 Google認証設定ガイド（新人向け）

## 📋 このガイドについて

Webアプリ（サンプルページ・テンプレート）でGoogle認証を使用するための**完全ガイド**です。  
新人エンジニアが一人で設定できるよう、ステップバイステップで説明します。

## 🎯 設定対象アプリ

- **汎用Webアプリテンプレート**: https://muumuu8181.github.io/web-samples-public/webapp-template.html
- **ダイエット記録アプリ**: https://muumuu8181.github.io/diet-tracker/
- その他Firebase + Google認証を使用するWebアプリ

## ⚠️ 前提条件

- Googleアカウントを持っている
- GitHub アカウントでリポジトリにアクセスできる
- ブラウザの開発者ツールが使える（F12キー）

---

## 🚀 Step 1: Firebase プロジェクト作成

### 1-1. Firebase Console にアクセス
```
https://console.firebase.google.com/
```

### 1-2. 新しいプロジェクトを作成
1. 「**プロジェクトを作成**」をクリック
2. **プロジェクト名**: `my-webapp-project`（任意の名前）
3. **Google アナリティクス**: 「無効にする」を選択
4. 「**プロジェクトを作成**」をクリック
5. 作成完了まで待機（約30秒）

---

## 🔥 Step 2: Firebase Authentication 設定

### 2-1. Authentication を有効化
1. 左サイドメニュー「**構築**」→「**Authentication**」をクリック
2. 「**始める**」ボタンをクリック

### 2-2. Google認証プロバイダーを有効化
1. 「**Sign-in method**」タブをクリック
2. 「**Google**」を選択
3. 右上の「**有効にする**」トグルをON
4. **プロジェクトのサポートメール**: 自分のGmailアドレスを入力
5. 「**保存**」をクリック

### 2-3. 承認済みドメインを追加
1. 「**Settings**」タブをクリック
2. 「**承認済みドメイン**」セクションを探す
3. 「**ドメインを追加**」をクリック
4. 以下のドメインを追加：
   ```
   muumuu8181.github.io
   ```
5. 「**追加**」をクリック

---

## 💾 Step 3: Realtime Database 設定

### 3-1. Realtime Database を有効化
1. 左サイドメニュー「**構築**」→「**Realtime Database**」をクリック
2. 「**データベースを作成**」をクリック
3. **場所**: 「**us-central1**」（米国）を選択
4. **セキュリティルール**: 「**テストモードで開始**」を選択
5. 「**有効にする**」をクリック

### 3-2. データベースURLを確認
作成後、画面上部に表示されるURLをメモ：
```
https://my-webapp-project-default-rtdb.firebaseio.com/
```

---

## ⚙️ Step 4: ウェブアプリの設定

### 4-1. ウェブアプリを登録
1. プロジェクト概要画面で「**</>**」（ウェブ）アイコンをクリック
2. **アプリのニックネーム**: `my-webapp`（任意）
3. **Firebase Hosting**: チェックを入れない
4. 「**アプリを登録**」をクリック

### 4-2. 設定コードをコピー
表示される設定コードをコピー：
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyB...",
  authDomain: "my-webapp-project.firebaseapp.com",
  databaseURL: "https://my-webapp-project-default-rtdb.firebaseio.com/",
  projectId: "my-webapp-project",
  storageBucket: "my-webapp-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

---

## 📝 Step 5: コードの修正

### 5-1. GitHubでファイルを編集

#### 方法A: GitHub Web Editor（推奨）
1. **リポジトリページ**にアクセス：
   - テンプレート: https://github.com/muumuu8181/web-samples-public
   - ダイエットアプリ: https://github.com/muumuu8181/diet-tracker

2. **ファイルを開く**:
   - テンプレート: `webapp-template.html`
   - ダイエットアプリ: `index.html`

3. **編集モード**:
   - 鉛筆アイコン（✏️）をクリック

### 5-2. Firebase設定を置き換え

#### 🔍 **置き換え箇所を見つける**
`Ctrl+F` で以下を検索：
```javascript
const firebaseConfig = {
```

#### ✏️ **設定を書き換える**
見つかった箇所を、Step 4-2でコピーした設定に置き換え

#### 例：
```javascript
// 変更前（例）
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "your-project.firebaseapp.com",
    // ...
};

// 変更後（実際の値）
const firebaseConfig = {
    apiKey: "AIzaSyB_actual_key_here",
    authDomain: "my-webapp-project.firebaseapp.com",
    databaseURL: "https://my-webapp-project-default-rtdb.firebaseio.com/",
    projectId: "my-webapp-project",
    storageBucket: "my-webapp-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};
```

### 5-3. Firebase初期化コードを有効化

#### 🔍 **コメントアウトされた部分を見つける**
以下のような行を探す：
```javascript
// firebase.initializeApp(firebaseConfig);
// const database = firebase.database();
// useFirebase = true;
```

#### ✏️ **コメントを削除**
`//` を削除して有効化：
```javascript
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
useFirebase = true;
```

### 5-4. 変更を保存
1. ページ下部の「**Commit changes**」をクリック
2. **Commit message**: `Add Firebase configuration`
3. 「**Commit changes**」をクリック

---

## ✅ Step 6: 動作確認

### 6-1. デプロイ待機
- GitHub Pages の更新に **2-3分** 待つ

### 6-2. アプリにアクセス
- **テンプレート**: https://muumuu8181.github.io/web-samples-public/webapp-template.html
- **ダイエットアプリ**: https://muumuu8181.github.io/diet-tracker/

### 6-3. Firebase接続確認
1. **開発者ツール**を開く（F12キー）
2. **デバッグログエリア**（画面下部）を確認
3. 以下が表示されればOK：
   ```
   ✅ Firebase: ON
   ✅ Firebase初期化完了
   ```

### 6-4. Google認証テスト
1. 「**Google認証**」ボタンをクリック
2. Googleアカウント選択画面が表示される
3. アカウントを選択してログイン
4. アプリに戻り、ユーザー情報が表示される

---

## 🔧 トラブルシューティング

### ❌ 問題: `Firebase: OFF` のまま

#### 🔍 原因確認
1. **コンソールエラー**をチェック（F12 → Console）
2. **設定ミス**の可能性

#### 🛠️ 解決方法
- firebaseConfig の各項目に `"YOUR_API_KEY"` などのダミー値が残っていないか確認
- `useFirebase = true` が設定されているか確認

### ❌ 問題: `auth/configuration-not-found`

#### 🔍 原因
- Google認証プロバイダーが無効
- または承認済みドメインが未設定

#### 🛠️ 解決方法
1. Firebase Console → Authentication → Sign-in method
2. Google プロバイダーが「**有効**」になっているか確認
3. Settings → 承認済みドメインに `muumuu8181.github.io` があるか確認

### ❌ 問題: `Firebase not defined`

#### 🔍 原因
- Firebase SDKが読み込まれていない
- インターネット接続の問題

#### 🛠️ 解決方法
- ページをリロード（Ctrl+F5）
- インターネット接続を確認

### ❌ 問題: データが同期されない

#### 🔍 原因確認
- `databaseURL` が正しいか確認
- Realtime Database のルールを確認

#### 🛠️ 解決方法
1. Firebase Console → Realtime Database
2. URLが設定ファイルと一致しているか確認
3. ルールタブで「テストモード」になっているか確認

---

## 📊 成功の指標

### ✅ 設定完了チェックリスト

- [ ] Firebase プロジェクト作成完了
- [ ] Authentication で Google プロバイダー有効化
- [ ] 承認済みドメインに `muumuu8181.github.io` 追加
- [ ] Realtime Database 有効化（テストモード）
- [ ] firebaseConfig をアプリに設定
- [ ] `useFirebase = true` に設定
- [ ] GitHub にコミット完了
- [ ] アプリで「Firebase: ON」表示
- [ ] Google認証でログイン成功
- [ ] データがリアルタイム同期される

---

## 🔒 セキュリティに関する注意

### ⚠️ テストモードについて
- **有効期限**: 30日間
- **アクセス制限**: なし（危険）
- **本番運用前**に認証ルールを設定してください

### 🛡️ 本番運用時のルール例
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

---

## 💡 よくある質問

### Q: 複数のアプリで同じFirebaseプロジェクトを使える？
**A**: はい。一つのFirebaseプロジェクトで複数のWebアプリを管理できます。

### Q: 無料枠の制限は？
**A**: 
- **Realtime Database**: 1GB ストレージ、10GB/月 転送
- **Authentication**: 月間アクティブユーザー数 無制限
- **同時接続**: 100接続まで

### Q: ローカル開発時はどうする？
**A**: 承認済みドメインに `localhost` も追加してください。

### Q: エラーログはどこで確認する？
**A**: 
1. ブラウザ: F12 → Console タブ
2. アプリ: デバッグログエリア（画面下部）

---

## 📞 サポート

### 🔗 参考リンク
- [Firebase Console](https://console.firebase.google.com/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [GitHub Repository](https://github.com/muumuu8181/web-samples-public)

### 🐛 問題報告
設定で困った場合は、以下の情報と一緒にIssueを作成してください：

1. **ブラウザのコンソールエラー**（スクリーンショット）
2. **アプリのデバッグログ**（コピー&ペースト）
3. **実行したステップ**（どこまで完了したか）

---

**🎉 設定完了お疲れさまでした！Google認証付きWebアプリをお楽しみください！**