const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static('.'));

// ログファイル生成API
app.post('/api/generate-test-log', (req, res) => {
    const logData = {
        exportInfo: {
            exportedAt: new Date().toISOString(),
            exportedBy: 'test-user',
            version: '1.0',
            source: 'Test Download Server',
            testPurpose: 'ダウンロード機能確認'
        },
        systemLogs: [
            `[${new Date().toLocaleTimeString('ja-JP')}] 🚀 テストサーバー開始`,
            `[${new Date().toLocaleTimeString('ja-JP')}] 📥 ログ生成API実行`,
            `[${new Date().toLocaleTimeString('ja-JP')}] ✅ ダウンロード機能テスト完了`
        ],
        testData: {
            message: 'これはダウンロード機能のテストです',
            timestamp: Date.now(),
            success: true
        },
        timestamp: Date.now()
    };

    // logsディレクトリ作成
    const logsDir = path.join(__dirname, 'logs');
    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir);
    }

    // ダウンロードフォルダにも保存
    const downloadsPath = path.join(process.env.HOME, 'storage', 'downloads');
    
    // ログファイル保存
    const fileName = `test-download-${new Date().toISOString().slice(0,10)}.json`;
    const filePath = path.join(logsDir, fileName);
    const downloadPath = path.join(downloadsPath, `common-template-test-${new Date().toISOString().slice(0,10)}.json`);
    
    // 両方の場所に保存
    fs.writeFileSync(filePath, JSON.stringify(logData, null, 2));
    fs.writeFileSync(downloadPath, JSON.stringify(logData, null, 2));
    
    console.log(`📁 ログファイル生成: ${fileName}`);
    console.log(`📂 ダウンロードフォルダにも保存: ${path.basename(downloadPath)}`);
    
    res.json({
        success: true,
        message: 'ログファイルが生成されました',
        fileName: fileName,
        filePath: filePath,
        downloadPath: downloadPath,
        fileExists: fs.existsSync(filePath),
        downloadExists: fs.existsSync(downloadPath),
        directoryContents: fs.readdirSync(logsDir)
    });
});

// ログダウンロードAPI
app.get('/api/download-log/:filename', (req, res) => {
    const fileName = req.params.filename;
    const filePath = path.join(__dirname, 'logs', fileName);
    
    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.status(404).json({ error: 'ファイルが見つかりません' });
    }
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`🌐 テストダウンロードサーバー起動: http://localhost:${PORT}`);
    console.log(`📥 ログ生成テスト: curl -X POST localhost:${PORT}/api/generate-test-log`);
});