const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 3000;

// 静的ファイルの提供（ルートディレクトリからファイルを提供）
app.use(express.static(__dirname));

// ホームページのルート
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, "https://rampotchi.glitch.me/home.html"));
});

// diaryディレクトリのファイルを取得
app.get('/diaries', (req, res) => {
  const diaryDir = path.join(__dirname, 'https://rampotchi.glitch.me/diary');
  
  // diaryディレクトリ内のファイルを読み取る
  fs.readdir(diaryDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'ディレクトリを読み取れませんでした' });
    }
    
    // HTMLファイルのみフィルタリング
    const diaryFiles = files.filter(file => path.extname(file) === '.html');
    
    // タイトルと説明文を取得するためのPromiseの配列を作成
    const diaryInfoPromises = diaryFiles.map(file => {
      return new Promise((resolve, reject) => {
        fs.readFile(path.join(diaryDir, file), 'utf8', (err, data) => {
          if (err) return reject(err);
          
          // タイトルと説明文を正規表現で取得
          const titleMatch = data.match(/<title>ランポっち┃(.*?)<\/title>/);
          const descriptionMatch = data.match(/<meta name="description" content="(.*?)">/);
          
          const title = titleMatch ? titleMatch[1] : file; // タイトルがなければファイル名を使用
          const description = descriptionMatch ? descriptionMatch[1] : ''; // 説明文がなければ空文字

          resolve({ file, title, description });
        });
      });
    });

    // すべてのタイトルと説明文を取得した後にレスポンスを返す
    Promise.all(diaryInfoPromises)
      .then(results => {
        // ファイル名で逆アルファベット順にソート
        results.sort((a, b) => b.file.localeCompare(a.file));
        
        // ソートされた結果をJSONで返す
        res.json(results);
      })
      .catch(error => {
        console.error('エラーが発生しました:', error);
        res.status(500).json({ error: 'タイトルまたは説明を取得できませんでした' });
      });
  });
});

// 404エラーハンドラー
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "404.html"));
});

const listener = app.listen(process.env.PORT, () => {
});
