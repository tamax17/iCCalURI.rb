/**
 * 講義室予約管理システム - Google Apps Script
 */

// スプレッドシートID（新しいスプレッドシートを作成後、URLからIDを取得して設定）
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID'; // 実際のスプレッドシートIDに置き換えてください

// シート名
const ROOMS_SHEET = '講義室';
const BOOKINGS_SHEET = '予約';

/**
 * スプレッドシートの初期化
 */
function initializeSpreadsheet() {
  const ss = SpreadsheetApp.create('講義室予約管理システム_データ');
  
  // 講義室シートの作成
  const roomsSheet = ss.getSheets()[0];
  roomsSheet.setName(ROOMS_SHEET);
  
  // 講義室シートのヘッダー設定
  const roomsHeaders = ['ID', '講義室名', '収容人数', '建物', '階', '設備'];
  roomsSheet.getRange(1, 1, 1, roomsHeaders.length).setValues([roomsHeaders]);
  
  // 初期講義室データ
  const roomsData = [
    [generateId(), '第1演習室', 30, '本館', 1, 'プロジェクター,ホワイトボード'],
    [generateId(), '第2演習室', 30, '本館', 1, 'プロジェクター,ホワイトボード'],
    [generateId(), '第3演習室', 25, '本館', 1, 'プロジェクター,ホワイトボード'],
    [generateId(), '第4演習室', 25, '本館', 1, 'プロジェクター,ホワイトボード'],
    [generateId(), '講座', 50, '本館', 2, 'プロジェクター,音響設備'],
    [generateId(), 'S207', 40, 'S棟', 2, 'プロジェクター,PC'],
    [generateId(), 'A302', 35, 'A棟', 3, 'プロジェクター'],
    [generateId(), 'A304', 35, 'A棟', 3, 'プロジェクター'],
    [generateId(), 'A305', 30, 'A棟', 3, 'プロジェクター'],
    [generateId(), 'A402', 40, 'A棟', 4, 'プロジェクター,PC'],
    [generateId(), 'A403', 40, 'A棟', 4, 'プロジェクター,PC'],
    [generateId(), 'A404', 35, 'A棟', 4, 'プロジェクター'],
    [generateId(), 'A405', 35, 'A棟', 4, 'プロジェクター'],
    [generateId(), 'A501', 45, 'A棟', 5, 'プロジェクター,音響設備'],
    [generateId(), 'A503', 40, 'A棟', 5, 'プロジェクター'],
    [generateId(), '体育館', 100, '体育棟', 1, '音響設備,体育用具']
  ];
  
  roomsSheet.getRange(2, 1, roomsData.length, roomsData[0].length).setValues(roomsData);
  
  // 予約シートの作成
  const bookingsSheet = ss.insertSheet(BOOKINGS_SHEET);
  const bookingsHeaders = ['ID', '講義室ID', '講義室名', 'タイトル', '担当者', '講義コード', '開始時間', '終了時間', '日付', '色', '説明', '作成日時'];
  bookingsSheet.getRange(1, 1, 1, bookingsHeaders.length).setValues([bookingsHeaders]);
  
  console.log('スプレッドシートが作成されました: ' + ss.getUrl());
  console.log('スプレッドシートID: ' + ss.getId());
  
  return ss.getId();
}

/**
 * IDの生成
 */
function generateId() {
  return Utilities.getUuid();
}

/**
 * スプレッドシートの取得
 */
function getSpreadsheet() {
  try {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  } catch (e) {
    console.log('スプレッドシートが見つかりません。initializeSpreadsheet()を実行してください。');
    throw new Error('スプレッドシートが見つかりません');
  }
}

/**
 * Webアプリのメイン関数
 */
function doGet(e) {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * HTMLファイルの読み込み
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * 全講義室取得
 */
function getRooms() {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(ROOMS_SHEET);
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) return [];
    
    const headers = data[0];
    const rooms = data.slice(1).map(row => {
      const room = {};
      headers.forEach((header, index) => {
        room[header.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_')] = row[index];
      });
      return room;
    });
    
    return rooms;
  } catch (e) {
    console.error('講義室取得エラー:', e);
    throw new Error('講義室の取得に失敗しました');
  }
}

/**
 * 予約一覧取得
 */
function getBookings(startDate, endDate) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(BOOKINGS_SHEET);
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) return [];
    
    const headers = data[0];
    let bookings = data.slice(1).map(row => {
      const booking = {};
      headers.forEach((header, index) => {
        booking[header.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_')] = row[index];
      });
      return booking;
    });
    
    // 日付フィルタリング
    if (startDate && endDate) {
      bookings = bookings.filter(booking => {
        const bookingDate = new Date(booking['日付']);
        return bookingDate >= new Date(startDate) && bookingDate <= new Date(endDate);
      });
    }
    
    return bookings;
  } catch (e) {
    console.error('予約取得エラー:', e);
    throw new Error('予約の取得に失敗しました');
  }
}

/**
 * 新規予約作成
 */
function createBooking(bookingData) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(BOOKINGS_SHEET);
    
    // 重複チェック
    const existingBookings = getBookings();
    const conflict = existingBookings.find(booking => 
      booking['講義室id'] === bookingData.roomId &&
      booking['日付'] === bookingData.date &&
      ((bookingData.startTime >= booking['開始時間'] && bookingData.startTime < booking['終了時間']) ||
       (bookingData.endTime > booking['開始時間'] && bookingData.endTime <= booking['終了時間']) ||
       (bookingData.startTime <= booking['開始時間'] && bookingData.endTime >= booking['終了時間']))
    );
    
    if (conflict) {
      throw new Error('指定された時間帯は既に予約されています');
    }
    
    // 講義室名を取得
    const rooms = getRooms();
    const room = rooms.find(r => r.id === bookingData.roomId);
    if (!room) {
      throw new Error('講義室が見つかりません');
    }
    
    const id = generateId();
    const now = new Date();
    
    const newBooking = [
      id,
      bookingData.roomId,
      room['講義室名'],
      bookingData.title,
      bookingData.instructor || '',
      bookingData.courseCode || '',
      bookingData.startTime,
      bookingData.endTime,
      bookingData.date,
      bookingData.color || '#3B82F6',
      bookingData.description || '',
      now.toISOString()
    ];
    
    sheet.appendRow(newBooking);
    
    return {
      id: id,
      room_id: bookingData.roomId,
      room_name: room['講義室名'],
      title: bookingData.title,
      instructor: bookingData.instructor,
      course_code: bookingData.courseCode,
      start_time: bookingData.startTime,
      end_time: bookingData.endTime,
      date: bookingData.date,
      color: bookingData.color || '#3B82F6',
      description: bookingData.description
    };
  } catch (e) {
    console.error('予約作成エラー:', e);
    throw new Error(e.message || '予約の作成に失敗しました');
  }
}

/**
 * 予約更新
 */
function updateBooking(id, bookingData) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(BOOKINGS_SHEET);
    const data = sheet.getDataRange().getValues();
    
    // IDで予約を検索
    const rowIndex = data.findIndex((row, index) => index > 0 && row[0] === id);
    if (rowIndex === -1) {
      throw new Error('予約が見つかりません');
    }
    
    // 講義室名を取得
    const rooms = getRooms();
    const room = rooms.find(r => r.id === bookingData.roomId);
    if (!room) {
      throw new Error('講義室が見つかりません');
    }
    
    const updatedBooking = [
      id,
      bookingData.roomId,
      room['講義室名'],
      bookingData.title,
      bookingData.instructor || '',
      bookingData.courseCode || '',
      bookingData.startTime,
      bookingData.endTime,
      bookingData.date,
      bookingData.color || '#3B82F6',
      bookingData.description || '',
      data[rowIndex][11] // 作成日時は保持
    ];
    
    sheet.getRange(rowIndex + 1, 1, 1, updatedBooking.length).setValues([updatedBooking]);
    
    return {
      id: id,
      room_id: bookingData.roomId,
      room_name: room['講義室名'],
      title: bookingData.title,
      instructor: bookingData.instructor,
      course_code: bookingData.courseCode,
      start_time: bookingData.startTime,
      end_time: bookingData.endTime,
      date: bookingData.date,
      color: bookingData.color || '#3B82F6',
      description: bookingData.description
    };
  } catch (e) {
    console.error('予約更新エラー:', e);
    throw new Error(e.message || '予約の更新に失敗しました');
  }
}

/**
 * 予約削除
 */
function deleteBooking(id) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(BOOKINGS_SHEET);
    const data = sheet.getDataRange().getValues();
    
    // IDで予約を検索
    const rowIndex = data.findIndex((row, index) => index > 0 && row[0] === id);
    if (rowIndex === -1) {
      throw new Error('予約が見つかりません');
    }
    
    sheet.deleteRow(rowIndex + 1);
    
    return { message: '予約が削除されました' };
  } catch (e) {
    console.error('予約削除エラー:', e);
    throw new Error(e.message || '予約の削除に失敗しました');
  }
}

/**
 * 時間スロットの生成
 */
function generateTimeSlots() {
  const slots = [];
  for (let hour = 9; hour < 18; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
    if (hour < 17) {
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
  }
  return slots;
}

/**
 * 今週の日付を取得
 */
function getThisWeekDates() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - dayOfWeek + 1);
  
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }
  
  return dates;
}