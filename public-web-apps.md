# 🌐 公開中のWebアプリ一覧

## 📱 アクセスURL

### 1. 3つのサンプルページ（タブ切り替え）
🔗 **https://muumuu8181.github.io/web-samples-public/samples.html**

- Sample 1: Modern Clean Design
- Sample 2: Creative Glass Design  
- Sample 3: Ultra Cool Design
- 左側のタブで切り替え可能

### 2. Firebase同期タスクアプリ
🔗 **https://muumuu8181.github.io/web-samples-public/simple-sync.html**

- リアルタイム同期機能
- 複数端末で即座に反映
- Firebase Realtime Database使用

### 3. ダイエット記録アプリ
🔗 **https://muumuu8181.github.io/diet-tracker/**

- 食事・飲み物・体重・トイレ・服装を記録
- 4つの時間帯で管理（深夜・朝・昼・夜）
- ドラッグ&ドロップで時間帯間の移動
- Firebase リアルタイム同期対応
- デバッグログ機能

## 🚀 アクセス方法

1. **アプリ一覧から**: https://muumuu8181.github.io/web-samples-public/
2. **直接アクセス**: 各アプリのURLをブラウザに入力
3. **QRコード**: スマホでスキャン（必要なら生成可能）

## 📊 技術仕様

- **ホスティング**: GitHub Pages（無料）
- **データベース**: Firebase Realtime Database（無料枠）
- **フロントエンド**: HTML/CSS/JavaScript
- **レスポンシブ**: 全端末対応

## 🔧 開発情報

- **リポジトリ**: https://github.com/muumuu8181/web-samples-public
- **更新方法**: GitHubにプッシュ → 自動反映（1-2分）

## ⚠️ 実際に遭遇したトラブルと解決法

### プッシュに失敗する場合

**症状**: ローカルでコードを修正したが、GitHub Pages に反映されない

#### ケース1: SSH認証エラー
```bash
$ git push origin main
ssh_askpass: exec(/usr/bin/ssh-askpass): No such file or directory
Host key verification failed.
```

**解決手順**:
1. **GitHub CLI の認証確認**
   ```bash
   gh auth status
   ```
   
2. **GitHub CLI でファイル更新**（最も確実）
   ```bash
   # 現在のファイルのSHAを取得
   SHA=$(gh api repos/muumuu8181/リポジトリ名/contents/ファイル名 --jq '.sha')
   
   # ローカルファイルをBase64エンコード
   base64 -w 0 ファイル名 > /tmp/file_base64.txt
   
   # GitHub API で更新
   echo "{\"message\": \"修正内容\", \"content\": \"$(cat /tmp/file_base64.txt)\", \"sha\": \"$SHA\"}" > /tmp/update.json
   gh api -X PUT repos/muumuu8181/リポジトリ名/contents/ファイル名 --input /tmp/update.json
   ```

#### ケース2: 認証は成功するが反映されない場合
1. **実際に更新されたか確認**
   ```bash
   curl -s https://raw.githubusercontent.com/muumuu8181/リポジトリ名/main/ファイル名 | grep "確認したい文字列"
   ```

2. **GitHub Pages の更新確認**
   - 通常1-2分で反映
   - 5分以上待っても反映されない場合は認証問題の可能性

### Firebase 設定のトラブル

**症状**: `Firebase: OFF` のまま動作しない

**解決手順**:
1. **既存のFirebaseプロジェクト設定を確認**
   ```javascript
   const firebaseConfig = {
       apiKey: "実際のAPIキー",
       authDomain: "shares-b1b97.firebaseapp.com",
       databaseURL: "https://shares-b1b97-default-rtdb.firebaseio.com",
       projectId: "shares-b1b97",
       // ... 他の設定
   };
   ```

2. **useFirebase フラグの有効化**
   ```javascript
   useFirebase = true; // この行のコメントアウトを解除
   ```

### 事前確認チェックリスト

プッシュ前に必ず確認：
- [ ] `gh auth status` で認証状態を確認
- [ ] `git status` でコミット状況を確認  
- [ ] ローカルファイルが実際に修正されているか確認

### 学んだ教訓

1. **GitHub CLI が最優先**: SSH や HTTPS の問題に関係なく確実に更新できる
2. **段階的確認**: ローカル → GitHub リポジトリ → 配信先の順で問題を切り分ける
3. **エラーメッセージの活用**: 具体的なエラーから原因を特定する

---
最終更新: 2025-07-19