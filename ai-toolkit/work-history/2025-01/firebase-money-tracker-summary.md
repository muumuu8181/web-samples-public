# シンプル家計簿アプリ開発作業まとめ

## 🎯 プロジェクト概要
Webアプリテンプレートを使用して、Firebase Realtime Databaseと連携する家計簿アプリを開発し、GitHub Pagesで公開した。

## 📅 作業の流れ

### 1. 初期調査とファイル探索
- GitHubリポジトリ `web-samples-public` 内の「Web App テンプレート」ファイルを探索
- 最初はローカルリポジトリが古く、ファイルが見つからない問題に遭遇
- 最新版をGitHubからクローンして解決

### 2. テンプレートファイルの発見
- `webapp-template.html` - タスク管理アプリのテンプレート
- `WEBAPP_TEMPLATE_README.md` - テンプレートの説明書
- これらを基にして家計簿アプリの開発を開始

### 3. 家計簿アプリの開発

#### 初期バージョン (`money-tracker.html`)
- タスク管理機能を家計簿機能に変更
- 収入・支出の記録機能を実装
- 基本的なUI設計

#### 改良バージョン (`simple-money-tracker.html`)
- よりシンプルで使いやすいUIに改善
- Firebase認証とデータベース連携を実装
- デバッグログ機能の追加

### 4. 主な機能実装

#### Firebase統合
```javascript
const firebaseConfig = {
    apiKey: "AIzaSyA5PXKChizYDCXF_GJ4KL6Ylq9K5hCPXWE",
    authDomain: "shares-b1b97.firebaseapp.com",
    databaseURL: "https://shares-b1b97-default-rtdb.firebaseio.com",
    projectId: "shares-b1b97",
    storageBucket: "shares-b1b97.firebasestorage.app",
    messagingSenderId: "38311063248",
    appId: "1:38311063248:web:0d2d5726d12b305b24b8d5",
    measurementId: "G-S2ZMJH7CGC"
};
```

#### データ構造
```
money-tracker/
  └── {ユーザーUID}/
      └── {日付 YYYY-MM-DD}/
          └── {記録ID}: {
              id: タイムスタンプ,
              type: "income" | "expense",
              amount: 金額,
              content: 内容,
              timestamp: 記録時刻
          }
```

#### 主要機能
1. **Google認証** - Firebase Authenticationを使用
2. **データ同期** - Firebase Realtime Databaseでリアルタイム同期
3. **日付別管理** - 日付ごとにデータを分離
4. **ローカルストレージ** - 未ログイン時のフォールバック
5. **デバッグログ** - 詳細な動作ログとFirebase接続テスト

### 5. 問題解決の履歴

#### 問題1: Googleログインが機能しない
- **症状**: ログインボタンを押してもアカウント選択画面が出ない
- **原因**: イベントハンドラーの設定ミス
- **解決**: `provider.setCustomParameters({ prompt: 'select_account' })` を追加

#### 問題2: デバッグログのアイコン問題
- **症状**: 虫のアイコン（🐛）が分かりにくい
- **解決**: テキスト「ログ」に変更し、コピー/クリアボタンを追加

#### 問題3: 支出ボタンが反応しない
- **症状**: 金額と内容を入力してもデータが保存されない
- **解決**: 詳細なデバッグログを追加して問題を特定

#### 問題4: 認証後にデータが0円表示
- **症状**: ログイン直後に既存データが読み込まれない
- **解決**: 認証完了後のタイムアウト処理と再読み込みを実装

#### 問題5: ローカルファイルアクセスエラー
- **症状**: `file://` URLでアクセスできない
- **解決**: HTTPサーバーを起動してローカルホスト経由でアクセス

### 6. Web公開作業

#### GitHub Pages設定
1. `simple-money-tracker.html` をGitHubにプッシュ
2. 既存の `index.html` にリンクを追加
3. 公開URL: https://muumuu8181.github.io/web-samples-public/simple-money-tracker.html

#### アクセス方法の改善
- iPadのGitHubアプリからのアクセスが困難
- index.htmlにアプリ一覧を作成してタップでアクセス可能に

### 7. Firebase接続の証明

#### 実装した検証機能
1. **Firebase接続テストボタン** - SDK読み込み、認証状態、DB読み書きテスト
2. **詳細なユーザー情報表示** - プロフィール画像、UID、プロバイダ情報
3. **データ保存先の明示** - Firebase/LocalStorageの切り替え表示
4. **包括的なデバッグログ** - すべての操作を詳細にログ出力

#### マルチデバイス同期の確認
- Androidで入力したデータがiPadで表示される
- 日付の違いによる一時的な混乱があったが、正しく同期を確認

## 📊 最終成果物

### ファイル構成
```
web-samples-public/
├── index.html                    # アプリ一覧ページ
├── simple-money-tracker.html     # 家計簿アプリ本体
├── webapp-template.html          # 元のテンプレート
└── firebase-setup-private.md     # Firebase設定情報
```

### アプリの特徴
- **シングルHTMLファイル** - すべてのコードが1ファイルに統合
- **レスポンシブデザイン** - モバイル/デスクトップ両対応
- **プログレッシブ機能** - オフライン時はLocalStorage、オンライン時はFirebase
- **リアルタイム同期** - 複数端末で即座にデータ反映
- **セキュアな実装** - ユーザーごとにデータを分離

## 🚀 デプロイ情報
- **ホスティング**: GitHub Pages
- **URL**: https://muumuu8181.github.io/web-samples-public/simple-money-tracker.html
- **データベース**: Firebase Realtime Database (shares-b1b97プロジェクト)
- **認証**: Firebase Authentication (Google OAuth)

## ✅ 達成事項
1. ✅ Webアプリテンプレートを家計簿アプリに改造
2. ✅ Firebase認証とデータベース連携を実装
3. ✅ マルチデバイス対応のリアルタイム同期
4. ✅ GitHub Pagesでの公開
5. ✅ デバッグ機能と接続テスト機能の実装
6. ✅ 日付別データ管理システム
7. ✅ オフライン対応（LocalStorageフォールバック）