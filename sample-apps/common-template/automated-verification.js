/**
 * 完全自動化された動作確認システム
 * 解釈の余地ゼロ・誰がやっても同じ結果
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class StandardVerificationSystem {
    constructor() {
        this.results = {
            step1: false, // サーバー起動確認
            step2: false, // API実行成功
            step3: false, // ファイル生成確認
            step4: false, // AI読み取り確認
            overall: false,
            details: {},
            timestamp: new Date().toISOString()
        };
    }

    // STEP1: サーバー起動確認
    async verifyServerStartup() {
        console.log('🔍 STEP1: サーバー起動確認...');
        
        return new Promise((resolve) => {
            exec('curl -s http://localhost:3001 -w "%{http_code}"', (error, stdout, stderr) => {
                if (error) {
                    this.results.details.step1 = `❌ サーバー接続失敗: ${error.message}`;
                    this.results.step1 = false;
                    resolve(false);
                } else {
                    const httpCode = stdout.trim().slice(-3);
                    if (httpCode === '200' || httpCode === '404') { // 404でもサーバーは動作中
                        this.results.details.step1 = `✅ サーバー起動確認済み (HTTP: ${httpCode})`;
                        this.results.step1 = true;
                        resolve(true);
                    } else {
                        this.results.details.step1 = `❌ 予期しないHTTPコード: ${httpCode}`;
                        this.results.step1 = false;
                        resolve(false);
                    }
                }
            });
        });
    }

    // STEP2: API実行成功確認
    async verifyAPIExecution() {
        console.log('🔍 STEP2: API実行確認...');
        
        return new Promise((resolve) => {
            exec('curl -X POST localhost:3001/api/generate-test-log', (error, stdout, stderr) => {
                if (error) {
                    this.results.details.step2 = `❌ API実行失敗: ${error.message}`;
                    this.results.step2 = false;
                    resolve(false);
                } else {
                    try {
                        const response = JSON.parse(stdout);
                        // 複数の応答形式に対応
                        if (response.success === true && (response.fileName || response.filename)) {
                            const fileName = response.fileName || response.filename;
                            let filePath = response.filePath || response.path || `logs/${fileName}`;
                            
                            // 絶対パスでない場合のみ、__dirnameと結合
                            if (!path.isAbsolute(filePath)) {
                                filePath = path.join(__dirname, filePath);
                            }
                            
                            this.results.details.step2 = `✅ API実行成功: ${fileName}`;
                            this.results.step2 = true;
                            this.results.generatedFile = filePath;
                            resolve(true);
                        } else {
                            this.results.details.step2 = `❌ API応答異常: ${JSON.stringify(response)}`;
                            this.results.step2 = false;
                            resolve(false);
                        }
                    } catch (parseError) {
                        this.results.details.step2 = `❌ JSON解析失敗: ${parseError.message}`;
                        this.results.step2 = false;
                        resolve(false);
                    }
                }
            });
        });
    }

    // STEP3: ファイル生成確認
    async verifyFileGeneration() {
        console.log('🔍 STEP3: ファイル生成確認...');
        
        if (!this.results.generatedFile) {
            this.results.details.step3 = '❌ 生成ファイルパスが不明';
            this.results.step3 = false;
            return false;
        }

        try {
            if (fs.existsSync(this.results.generatedFile)) {
                const stats = fs.statSync(this.results.generatedFile);
                if (stats.size > 0) {
                    this.results.details.step3 = `✅ ファイル生成確認: ${stats.size}バイト`;
                    this.results.step3 = true;
                    return true;
                } else {
                    this.results.details.step3 = '❌ ファイルサイズが0バイト';
                    this.results.step3 = false;
                    return false;
                }
            } else {
                this.results.details.step3 = `❌ ファイルが存在しません: ${this.results.generatedFile}`;
                this.results.step3 = false;
                return false;
            }
        } catch (error) {
            this.results.details.step3 = `❌ ファイル確認エラー: ${error.message}`;
            this.results.step3 = false;
            return false;
        }
    }

    // STEP4: AI読み取りシミュレーション（構造確認）
    async verifyAIReadability() {
        console.log('🔍 STEP4: AI読み取り確認...');
        
        if (!this.results.generatedFile) {
            this.results.details.step4 = '❌ 読み取り対象ファイルが不明';
            this.results.step4 = false;
            return false;
        }

        try {
            const content = fs.readFileSync(this.results.generatedFile, 'utf8');
            const lines = content.split('\n');
            const jsonData = JSON.parse(content);
            
            // エビデンス抽出機能
            const evidence = this.extractEvidence(lines, jsonData);
            this.results.evidence = evidence;
            
            // 必須構造チェック
            const requiredFields = ['exportInfo', 'testData', 'timestamp'];
            const missingFields = requiredFields.filter(field => !jsonData.hasOwnProperty(field));
            
            if (missingFields.length === 0 && jsonData.testData && jsonData.testData.success === true) {
                this.results.details.step4 = `✅ AI読み取り可能・構造正常`;
                this.results.step4 = true;
                return true;
            } else {
                this.results.details.step4 = `❌ 不正な構造: 不足フィールド ${missingFields.join(', ')}`;
                this.results.step4 = false;
                return false;
            }
        } catch (error) {
            this.results.details.step4 = `❌ JSON読み取りエラー: ${error.message}`;
            this.results.step4 = false;
            return false;
        }
    }

    // エビデンス抽出メソッド
    extractEvidence(lines, jsonData) {
        const evidence = {
            fileName: path.basename(this.results.generatedFile),
            totalLines: lines.length,
            keyEvidence: []
        };

        // 重要な値を含む行を特定
        lines.forEach((line, index) => {
            const lineNum = index + 1;
            
            // success: true を確認
            if (line.includes('"success": true')) {
                evidence.keyEvidence.push({
                    lineNumber: lineNum,
                    content: line.trim(),
                    significance: 'success判定の確認',
                    category: 'critical'
                });
            }
            
            // exportedAtタイムスタンプを確認
            if (line.includes('"exportedAt"')) {
                evidence.keyEvidence.push({
                    lineNumber: lineNum,
                    content: line.trim(),
                    significance: 'エクスポート時刻の記録確認',
                    category: 'timestamp'
                });
            }
            
            // testPurposeを確認
            if (line.includes('"testPurpose"')) {
                evidence.keyEvidence.push({
                    lineNumber: lineNum,
                    content: line.trim(),
                    significance: 'テスト目的の明記確認',
                    category: 'purpose'
                });
            }

            // エラーメッセージが無いことを確認
            if (line.toLowerCase().includes('error') || line.toLowerCase().includes('failed')) {
                evidence.keyEvidence.push({
                    lineNumber: lineNum,
                    content: line.trim(),
                    significance: 'エラー検出',
                    category: 'error'
                });
            }
        });

        return evidence;
    }

    // 総合判定
    async runCompleteVerification() {
        console.log('🚀 統一動作確認システム開始...\n');
        
        const step1 = await this.verifyServerStartup();
        if (!step1) {
            console.log('❌ STEP1失敗のため中断');
            this.saveResults();
            return false;
        }

        const step2 = await this.verifyAPIExecution();
        if (!step2) {
            console.log('❌ STEP2失敗のため中断');
            this.saveResults();
            return false;
        }

        const step3 = await this.verifyFileGeneration();
        if (!step3) {
            console.log('❌ STEP3失敗のため中断');
            this.saveResults();
            return false;
        }

        const step4 = await this.verifyAIReadability();
        if (!step4) {
            console.log('❌ STEP4失敗');
            this.saveResults();
            return false;
        }

        this.results.overall = true;
        console.log('\n🎉 全4段階の動作確認が完了しました！');
        this.saveResults();
        return true;
    }

    // 結果保存
    saveResults() {
        const resultsFile = path.join(__dirname, 'logs', `verification-result-${new Date().toISOString().slice(0,10)}.json`);
        
        // logsディレクトリ作成
        const logsDir = path.dirname(resultsFile);
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }

        fs.writeFileSync(resultsFile, JSON.stringify(this.results, null, 2));
        console.log(`\n📊 検証結果保存: ${resultsFile}`);
        
        // work_history.logにエビデンス付きで記録
        this.saveEvidenceToWorkHistory();
        
        // 結果サマリー表示
        console.log('\n=== 動作確認結果サマリー ===');
        console.log(`STEP1 (サーバー起動): ${this.results.step1 ? '✅' : '❌'}`);
        console.log(`STEP2 (API実行): ${this.results.step2 ? '✅' : '❌'}`);
        console.log(`STEP3 (ファイル生成): ${this.results.step3 ? '✅' : '❌'}`);
        console.log(`STEP4 (AI読み取り): ${this.results.step4 ? '✅' : '❌'}`);
        console.log(`総合判定: ${this.results.overall ? '✅ 成功' : '❌ 失敗'}`);
        console.log('========================\n');
    }

    // work_history.logにエビデンス記録
    saveEvidenceToWorkHistory() {
        const workHistoryFile = path.join(__dirname, 'work_history.log');
        const now = new Date();
        const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        let evidenceLog = `${timeStr},統一動作確認システム - step4,エビデンス付き動作確認,自動検証実行,`;
        
        if (this.results.overall) {
            evidenceLog += `完了:${this.results.evidence.fileName}の動作確認成功`;
            
            // 重要なエビデンスを記録
            if (this.results.evidence && this.results.evidence.keyEvidence.length > 0) {
                evidenceLog += ` [エビデンス]`;
                this.results.evidence.keyEvidence.forEach(evidence => {
                    if (evidence.category === 'critical') {
                        evidenceLog += ` L${evidence.lineNumber}:${evidence.content.substring(0, 50)}...`;
                    }
                });
            }
        } else {
            evidenceLog += `失敗:検証エラー`;
        }
        
        // ファイルに追記
        try {
            fs.appendFileSync(workHistoryFile, evidenceLog + '\n');
            console.log(`📝 エビデンス記録完了: work_history.log`);
        } catch (error) {
            console.log(`⚠️ work_history.log記録失敗: ${error.message}`);
        }
    }
}

// 実行部分
if (require.main === module) {
    const verifier = new StandardVerificationSystem();
    verifier.runCompleteVerification()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('❌ 予期しないエラー:', error);
            process.exit(1);
        });
}

module.exports = StandardVerificationSystem;