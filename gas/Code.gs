/**
 * 講義室予約管理システム（曜日テンプレート＋学年歴対応版） - Google Apps Script
 */

// スプレッドシートID（新しいスプレッドシートを作成後、URLからIDを取得して設定）
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID'; // 実際のスプレッドシートIDに置き換えてください

// シート名
const ROOMS_SHEET = '講義室';
const TEMPLATE_SHEET = '曜日テンプレート';
const BOOKINGS_SHEET = '予約';
const CALENDAR_SHEET = '学年歴';

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
  
  // 曜日テンプレートシートの作成
  const templateSheet = ss.insertSheet(TEMPLATE_SHEET);
  const templateHeaders = ['ID', '曜日', '講義室ID', '講義室名', 'タイトル', '担当者', '講義コード', '開始時間', '終了時間', '色', '説明', '作成日時'];
  templateSheet.getRange(1, 1, 1, templateHeaders.length).setValues([templateHeaders]);
  
  // 予約シートの作成
  const bookingsSheet = ss.insertSheet(BOOKINGS_SHEET);
  const bookingsHeaders = ['ID', 'テンプレートID', '講義室ID', '講義室名', 'タイトル', '担当者', '講義コード', '開始時間', '終了時間', '日付', '色', '説明', '作成日時'];
  bookingsSheet.getRange(1, 1, 1, bookingsHeaders.length).setValues([bookingsHeaders]);
  
  // 学年歴シートの作成
  const calendarSheet = ss.insertSheet(CALENDAR_SHEET);
  const calendarHeaders = ['ID', 'タイプ', '名称', '開始日', '終了日', '除外フラグ', '説明'];
  calendarSheet.getRange(1, 1, 1, calendarHeaders.length).setValues([calendarHeaders]);
  
  // 初期学年歴データ
  const currentYear = new Date().getFullYear();
  const calendarData = [
    [generateId(), '学期', '前期', `${currentYear}-04-01`, `${currentYear}-09-30`, false, '前期授業期間'],
    [generateId(), '学期', '後期', `${currentYear}-10-01`, `${currentYear + 1}-03-31`, false, '後期授業期間'],
    [generateId(), '休日', 'ゴールデンウィーク', `${currentYear}-04-29`, `${currentYear}-05-05`, true, 'GW休暇'],
    [generateId(), '休日', '夏季休暇', `${currentYear}-08-01`, `${currentYear}-08-31`, true, '夏季休暇'],
    [generateId(), '休日', '冬季休暇', `${currentYear}-12-25`, `${currentYear + 1}-01-07`, true, '冬季休暇'],
    [generateId(), '試験', '前期試験', `${currentYear}-07-15`, `${currentYear}-07-31`, false, '前期定期試験'],
    [generateId(), '試験', '後期試験', `${currentYear + 1}-01-15`, `${currentYear + 1}-01-31`, false, '後期定期試験']
  ];
  
  calendarSheet.getRange(2, 1, calendarData.length, calendarData[0].length).setValues(calendarData);
  
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
 * 曜日テンプレート一覧取得
 */
function getTemplates(dayOfWeek) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(TEMPLATE_SHEET);
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) return [];
    
    const headers = data[0];
    let templates = data.slice(1).map(row => {
      const template = {};
      headers.forEach((header, index) => {
        template[header.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_')] = row[index];
      });
      return template;
    });
    
    // 曜日フィルタリング
    if (dayOfWeek) {
      templates = templates.filter(template => template['曜日'] === dayOfWeek);
    }
    
    return templates;
  } catch (e) {
    console.error('テンプレート取得エラー:', e);
    throw new Error('テンプレートの取得に失敗しました');
  }
}

/**
 * 曜日テンプレート作成
 */
function createTemplate(templateData) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(TEMPLATE_SHEET);
    
    // 重複チェック
    const existingTemplates = getTemplates(templateData.dayOfWeek);
    const conflict = existingTemplates.find(template => 
      template['講義室id'] === templateData.roomId &&
      template['曜日'] === templateData.dayOfWeek &&
      ((templateData.startTime >= template['開始時間'] && templateData.startTime < template['終了時間']) ||
       (templateData.endTime > template['開始時間'] && templateData.endTime <= template['終了時間']) ||
       (templateData.startTime <= template['開始時間'] && templateData.endTime >= template['終了時間']))
    );
    
    if (conflict) {
      throw new Error('指定された時間帯は既にテンプレートが存在します');
    }
    
    // 講義室名を取得
    const rooms = getRooms();
    const room = rooms.find(r => r.id === templateData.roomId);
    if (!room) {
      throw new Error('講義室が見つかりません');
    }
    
    const id = generateId();
    const now = new Date();
    
    const newTemplate = [
      id,
      templateData.dayOfWeek,
      templateData.roomId,
      room['講義室名'],
      templateData.title,
      templateData.instructor || '',
      templateData.courseCode || '',
      templateData.startTime,
      templateData.endTime,
      templateData.color || '#3B82F6',
      templateData.description || '',
      now.toISOString()
    ];
    
    sheet.appendRow(newTemplate);
    
    return {
      id: id,
      dayOfWeek: templateData.dayOfWeek,
      room_id: templateData.roomId,
      room_name: room['講義室名'],
      title: templateData.title,
      instructor: templateData.instructor,
      course_code: templateData.courseCode,
      start_time: templateData.startTime,
      end_time: templateData.endTime,
      color: templateData.color || '#3B82F6',
      description: templateData.description
    };
  } catch (e) {
    console.error('テンプレート作成エラー:', e);
    throw new Error(e.message || 'テンプレートの作成に失敗しました');
  }
}

/**
 * 曜日テンプレート更新
 */
function updateTemplate(id, templateData) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(TEMPLATE_SHEET);
    const data = sheet.getDataRange().getValues();
    
    // IDでテンプレートを検索
    const rowIndex = data.findIndex((row, index) => index > 0 && row[0] === id);
    if (rowIndex === -1) {
      throw new Error('テンプレートが見つかりません');
    }
    
    // 講義室名を取得
    const rooms = getRooms();
    const room = rooms.find(r => r.id === templateData.roomId);
    if (!room) {
      throw new Error('講義室が見つかりません');
    }
    
    const updatedTemplate = [
      id,
      templateData.dayOfWeek,
      templateData.roomId,
      room['講義室名'],
      templateData.title,
      templateData.instructor || '',
      templateData.courseCode || '',
      templateData.startTime,
      templateData.endTime,
      templateData.color || '#3B82F6',
      templateData.description || '',
      data[rowIndex][11] // 作成日時は保持
    ];
    
    sheet.getRange(rowIndex + 1, 1, 1, updatedTemplate.length).setValues([updatedTemplate]);
    
    return {
      id: id,
      dayOfWeek: templateData.dayOfWeek,
      room_id: templateData.roomId,
      room_name: room['講義室名'],
      title: templateData.title,
      instructor: templateData.instructor,
      course_code: templateData.courseCode,
      start_time: templateData.startTime,
      end_time: templateData.endTime,
      color: templateData.color || '#3B82F6',
      description: templateData.description
    };
  } catch (e) {
    console.error('テンプレート更新エラー:', e);
    throw new Error(e.message || 'テンプレートの更新に失敗しました');
  }
}

/**
 * 曜日テンプレート削除
 */
function deleteTemplate(id) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(TEMPLATE_SHEET);
    const data = sheet.getDataRange().getValues();
    
    // IDでテンプレートを検索
    const rowIndex = data.findIndex((row, index) => index > 0 && row[0] === id);
    if (rowIndex === -1) {
      throw new Error('テンプレートが見つかりません');
    }
    
    sheet.deleteRow(rowIndex + 1);
    
    return { message: 'テンプレートが削除されました' };
  } catch (e) {
    console.error('テンプレート削除エラー:', e);
    throw new Error(e.message || 'テンプレートの削除に失敗しました');
  }
}

/**
 * 学年歴取得
 */
function getAcademicCalendar() {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(CALENDAR_SHEET);
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) return [];
    
    const headers = data[0];
    const calendar = data.slice(1).map(row => {
      const item = {};
      headers.forEach((header, index) => {
        item[header.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_')] = row[index];
      });
      return item;
    });
    
    return calendar;
  } catch (e) {
    console.error('学年歴取得エラー:', e);
    throw new Error('学年歴の取得に失敗しました');
  }
}

/**
 * テンプレートから予約を展開
 */
function expandTemplateToBookings(startDate, endDate) {
  try {
    const ss = getSpreadsheet();
    const bookingsSheet = ss.getSheetByName(BOOKINGS_SHEET);
    
    // 既存の予約をクリア
    const existingData = bookingsSheet.getDataRange().getValues();
    if (existingData.length > 1) {
      bookingsSheet.getRange(2, 1, existingData.length - 1, existingData[0].length).clear();
    }
    
    const templates = getTemplates();
    const calendar = getAcademicCalendar();
    
    // 除外日の計算
    const excludeDates = new Set();
    calendar.filter(item => item['除外フラグ']).forEach(item => {
      const start = new Date(item['開始日']);
      const end = new Date(item['終了日']);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        excludeDates.add(formatDate(new Date(d)));
      }
    });
    
    const newBookings = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // 日付ごとにテンプレートを適用
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dateStr = formatDate(new Date(date));
      const dayOfWeek = getDayOfWeekJapanese(date.getDay());
      
      // 除外日はスキップ
      if (excludeDates.has(dateStr)) continue;
      
      // その曜日のテンプレートを取得
      const dayTemplates = templates.filter(t => t['曜日'] === dayOfWeek);
      
      dayTemplates.forEach(template => {
        const booking = [
          generateId(),
          template.id,
          template['講義室id'],
          template['講義室名'],
          template['タイトル'],
          template['担当者'],
          template['講義コード'],
          template['開始時間'],
          template['終了時間'],
          dateStr,
          template['色'],
          template['説明'],
          new Date().toISOString()
        ];
        newBookings.push(booking);
      });
    }
    
    // 予約を一括追加
    if (newBookings.length > 0) {
      bookingsSheet.getRange(2, 1, newBookings.length, newBookings[0].length).setValues(newBookings);
    }
    
    return { 
      message: `${newBookings.length}件の予約が展開されました`,
      count: newBookings.length 
    };
  } catch (e) {
    console.error('予約展開エラー:', e);
    throw new Error('予約の展開に失敗しました');
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
 * 日付フォーマット
 */
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

/**
 * 曜日を日本語で取得
 */
function getDayOfWeekJapanese(dayIndex) {
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  return days[dayIndex];
}

/**
 * 曜日一覧取得
 */
function getDaysOfWeek() {
  return ['月', '火', '水', '木', '金', '土', '日'];
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