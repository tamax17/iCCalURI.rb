const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// ミドルウェア
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// データベース初期化
const db = new sqlite3.Database('./lecture_room_booking.db');

// テーブル作成
db.serialize(() => {
  // 講義室テーブル
  db.run(`CREATE TABLE IF NOT EXISTS rooms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    capacity INTEGER,
    building TEXT,
    floor INTEGER,
    equipment TEXT
  )`);

  // 予約テーブル
  db.run(`CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL,
    title TEXT NOT NULL,
    instructor TEXT,
    course_code TEXT,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    date TEXT NOT NULL,
    color TEXT DEFAULT '#3B82F6',
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms (id)
  )`);

  // 初期データ投入
  const rooms = [
    { id: uuidv4(), name: '第1演習室', capacity: 30, building: '本館', floor: 1, equipment: 'プロジェクター,ホワイトボード' },
    { id: uuidv4(), name: '第2演習室', capacity: 30, building: '本館', floor: 1, equipment: 'プロジェクター,ホワイトボード' },
    { id: uuidv4(), name: '第3演習室', capacity: 25, building: '本館', floor: 1, equipment: 'プロジェクター,ホワイトボード' },
    { id: uuidv4(), name: '第4演習室', capacity: 25, building: '本館', floor: 1, equipment: 'プロジェクター,ホワイトボード' },
    { id: uuidv4(), name: '講座', capacity: 50, building: '本館', floor: 2, equipment: 'プロジェクター,音響設備' },
    { id: uuidv4(), name: 'S207', capacity: 40, building: 'S棟', floor: 2, equipment: 'プロジェクター,PC' },
    { id: uuidv4(), name: 'A302', capacity: 35, building: 'A棟', floor: 3, equipment: 'プロジェクター' },
    { id: uuidv4(), name: 'A304', capacity: 35, building: 'A棟', floor: 3, equipment: 'プロジェクター' },
    { id: uuidv4(), name: 'A305', capacity: 30, building: 'A棟', floor: 3, equipment: 'プロジェクター' },
    { id: uuidv4(), name: 'A402', capacity: 40, building: 'A棟', floor: 4, equipment: 'プロジェクター,PC' },
    { id: uuidv4(), name: 'A403', capacity: 40, building: 'A棟', floor: 4, equipment: 'プロジェクター,PC' },
    { id: uuidv4(), name: 'A404', capacity: 35, building: 'A棟', floor: 4, equipment: 'プロジェクター' },
    { id: uuidv4(), name: 'A405', capacity: 35, building: 'A棟', floor: 4, equipment: 'プロジェクター' },
    { id: uuidv4(), name: 'A501', capacity: 45, building: 'A棟', floor: 5, equipment: 'プロジェクター,音響設備' },
    { id: uuidv4(), name: 'A503', capacity: 40, building: 'A棟', floor: 5, equipment: 'プロジェクター' },
    { id: uuidv4(), name: '体育館', capacity: 100, building: '体育棟', floor: 1, equipment: '音響設備,体育用具' }
  ];

  db.get("SELECT COUNT(*) as count FROM rooms", (err, row) => {
    if (row.count === 0) {
      const stmt = db.prepare("INSERT INTO rooms (id, name, capacity, building, floor, equipment) VALUES (?, ?, ?, ?, ?, ?)");
      rooms.forEach(room => {
        stmt.run(room.id, room.name, room.capacity, room.building, room.floor, room.equipment);
      });
      stmt.finalize();
    }
  });
});

// API エンドポイント

// 全講義室取得
app.get('/api/rooms', (req, res) => {
  db.all("SELECT * FROM rooms ORDER BY name", (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// 予約一覧取得
app.get('/api/bookings', (req, res) => {
  const { start_date, end_date } = req.query;
  
  let query = `
    SELECT b.*, r.name as room_name 
    FROM bookings b 
    JOIN rooms r ON b.room_id = r.id
  `;
  let params = [];

  if (start_date && end_date) {
    query += " WHERE b.date BETWEEN ? AND ?";
    params = [start_date, end_date];
  }

  query += " ORDER BY b.date, b.start_time";

  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// 新規予約作成
app.post('/api/bookings', (req, res) => {
  const { room_id, title, instructor, course_code, start_time, end_time, date, color, description } = req.body;
  
  if (!room_id || !title || !start_time || !end_time || !date) {
    res.status(400).json({ error: '必須フィールドが不足しています' });
    return;
  }

  // 重複チェック
  db.get(
    "SELECT id FROM bookings WHERE room_id = ? AND date = ? AND ((start_time <= ? AND end_time > ?) OR (start_time < ? AND end_time >= ?))",
    [room_id, date, start_time, start_time, end_time, end_time],
    (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      if (row) {
        res.status(409).json({ error: '指定された時間帯は既に予約されています' });
        return;
      }

      const id = uuidv4();
      db.run(
        "INSERT INTO bookings (id, room_id, title, instructor, course_code, start_time, end_time, date, color, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [id, room_id, title, instructor, course_code, start_time, end_time, date, color || '#3B82F6', description],
        function(err) {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }
          
          db.get("SELECT b.*, r.name as room_name FROM bookings b JOIN rooms r ON b.room_id = r.id WHERE b.id = ?", [id], (err, row) => {
            if (err) {
              res.status(500).json({ error: err.message });
              return;
            }
            res.status(201).json(row);
          });
        }
      );
    }
  );
});

// 予約更新
app.put('/api/bookings/:id', (req, res) => {
  const { id } = req.params;
  const { room_id, title, instructor, course_code, start_time, end_time, date, color, description } = req.body;
  
  db.run(
    "UPDATE bookings SET room_id = ?, title = ?, instructor = ?, course_code = ?, start_time = ?, end_time = ?, date = ?, color = ?, description = ? WHERE id = ?",
    [room_id, title, instructor, course_code, start_time, end_time, date, color, description, id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      if (this.changes === 0) {
        res.status(404).json({ error: '予約が見つかりません' });
        return;
      }
      
      db.get("SELECT b.*, r.name as room_name FROM bookings b JOIN rooms r ON b.room_id = r.id WHERE b.id = ?", [id], (err, row) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json(row);
      });
    }
  );
});

// 予約削除
app.delete('/api/bookings/:id', (req, res) => {
  const { id } = req.params;
  
  db.run("DELETE FROM bookings WHERE id = ?", [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: '予約が見つかりません' });
      return;
    }
    
    res.json({ message: '予約が削除されました' });
  });
});

// 静的ファイル配信
app.use(express.static(path.join(__dirname, '../client/build')));

// React アプリのルーティング
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`サーバーがポート ${PORT} で起動しました`);
});

// プロセス終了時にデータベース接続を閉じる
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('データベース接続を閉じました');
    process.exit(0);
  });
});