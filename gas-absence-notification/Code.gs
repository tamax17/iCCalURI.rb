/**
 * 授業欠席連絡システム - Google Apps Script
 * 学生が複数の授業を欠席する際に、各担当教員に一括でメール連絡を送信するシステム
 */

// スプレッドシートID（実際のスプレッドシートIDに置き換えてください）
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';

// 管理者メールアドレス
const ADMIN_EMAIL = 'tamada@hiroshima-u.ac.jp';

// シート名の定義
const SHEETS = {
  COURSES: '授業情報',
  ABSENCES: '欠席情報'
};

/**
 * Webアプリとしてアクセスされた時に実行される関数
 */
function doGet() {
  return HtmlService.createTemplateFromFile('form')
    .evaluate()
    .setTitle('授業欠席連絡フォーム')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * HTMLファイルをインクルードする関数
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * スプレッドシートとシートを初期化する関数
 */
function initializeSheets() {
  try {
    let spreadsheet;
    
    // スプレッドシートIDが設定されていない場合、新しいスプレッドシートを作成
    if (SPREADSHEET_ID === 'YOUR_SPREADSHEET_ID_HERE') {
      spreadsheet = SpreadsheetApp.create('授業欠席連絡システム');
      console.log('新しいスプレッドシートを作成しました。ID: ' + spreadsheet.getId());
      console.log('Code.gsファイルのSPREADSHEET_IDを上記のIDに変更してください。');
    } else {
      spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    }
    
    // 授業情報シートの作成・初期化
    let courseSheet = spreadsheet.getSheetByName(SHEETS.COURSES);
    if (!courseSheet) {
      courseSheet = spreadsheet.insertSheet(SHEETS.COURSES);
    }
    
    // 授業情報シートのヘッダーを設定
    if (courseSheet.getLastRow() === 0) {
      courseSheet.getRange(1, 1, 1, 3).setValues([['授業科目名', '担当教員名', 'メールアドレス']]);
      courseSheet.getRange(1, 1, 1, 3).setFontWeight('bold');
      
      // サンプルデータを追加
      const sampleCourses = [
        ['数学I', '田中太郎', 'tanaka@example.ac.jp'],
        ['物理学', '佐藤花子', 'sato@example.ac.jp'],
        ['化学', '山田次郎', 'yamada@example.ac.jp'],
        ['英語I', 'スミス', 'smith@example.ac.jp'],
        ['国語', '鈴木一郎', 'suzuki@example.ac.jp']
      ];
      courseSheet.getRange(2, 1, sampleCourses.length, 3).setValues(sampleCourses);
    }
    
    // 欠席情報シートの作成・初期化
    let absenceSheet = spreadsheet.getSheetByName(SHEETS.ABSENCES);
    if (!absenceSheet) {
      absenceSheet = spreadsheet.insertSheet(SHEETS.ABSENCES);
    }
    
    // 欠席情報シートのヘッダーを設定
    if (absenceSheet.getLastRow() === 0) {
      absenceSheet.getRange(1, 1, 1, 7).setValues([['提出日時', '学生番号', '氏名', 'メールアドレス', '欠席開始日', '欠席終了日', '欠席科目']]);
      absenceSheet.getRange(1, 1, 1, 7).setFontWeight('bold');
    }
    
    return { success: true, spreadsheetId: spreadsheet.getId() };
  } catch (error) {
    console.error('シート初期化エラー:', error);
    return { success: false, error: error.toString() };
  }
}

/**
 * 授業情報を取得する関数
 */
function getCourses() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const courseSheet = spreadsheet.getSheetByName(SHEETS.COURSES);
    
    if (!courseSheet) {
      throw new Error('授業情報シートが見つかりません');
    }
    
    const lastRow = courseSheet.getLastRow();
    if (lastRow <= 1) {
      return [];
    }
    
    const data = courseSheet.getRange(2, 1, lastRow - 1, 3).getValues();
    return data.map(row => ({
      courseName: row[0],
      teacherName: row[1],
      email: row[2]
    }));
  } catch (error) {
    console.error('授業情報取得エラー:', error);
    throw new Error('授業情報の取得に失敗しました: ' + error.toString());
  }
}

/**
 * 欠席連絡を処理する関数
 */
function submitAbsence(formData) {
  try {
    // フォームデータの検証
    if (!formData.studentId || !formData.studentName || !formData.studentEmail || !formData.startDate || !formData.endDate || !formData.subjects || formData.subjects.length === 0) {
      throw new Error('必須項目が入力されていません');
    }
    
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const absenceSheet = spreadsheet.getSheetByName(SHEETS.ABSENCES);
    const courseSheet = spreadsheet.getSheetByName(SHEETS.COURSES);
    
    if (!absenceSheet || !courseSheet) {
      throw new Error('必要なシートが見つかりません');
    }
    
    // 欠席情報をスプレッドシートに記録
    const timestamp = new Date();
    const subjectsText = formData.subjects.join(', ');
    
    absenceSheet.appendRow([
      timestamp,
      formData.studentId,
      formData.studentName,
      formData.studentEmail,
      formData.startDate,
      formData.endDate,
      subjectsText
    ]);
    
    // 授業情報を取得
    const courses = getCourses();
    const courseMap = {};
    courses.forEach(course => {
      courseMap[course.courseName] = course;
    });
    
    // 選択された科目の担当教員にメールを送信
    const emailsSent = [];
    const emailsNotSent = [];
    
    for (const subject of formData.subjects) {
      if (courseMap[subject]) {
        const course = courseMap[subject];
        try {
          sendAbsenceEmail(course, formData);
          emailsSent.push(subject + ' (' + course.teacherName + ')');
        } catch (emailError) {
          console.error('メール送信エラー:', emailError);
          emailsNotSent.push(subject + ' (' + course.teacherName + ')');
        }
      } else {
        emailsNotSent.push(subject + ' (担当教員情報なし)');
      }
    }
    
    // 管理者に通知メールを送信
    try {
      sendAdminNotification(formData, emailsSent, emailsNotSent);
    } catch (adminEmailError) {
      console.error('管理者への通知メール送信エラー:', adminEmailError);
    }

    return {
      success: true,
      message: '欠席連絡を処理しました',
      emailsSent: emailsSent,
      emailsNotSent: emailsNotSent
    };
    
  } catch (error) {
    console.error('欠席連絡処理エラー:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * 担当教員にメールを送信する関数
 */
function sendAbsenceEmail(course, formData) {
  const subject = `【欠席連絡】${course.courseName} - ${formData.studentName}さん`;
  
  const body = `
${course.teacherName}先生

いつもお世話になっております。

以下の学生より授業の欠席連絡がありましたのでお知らせいたします。

【学生情報】
学生番号: ${formData.studentId}
氏名: ${formData.studentName}

【欠席情報】
科目名: ${course.courseName}
欠席期間: ${formData.startDate} ～ ${formData.endDate}

【欠席理由】
${formData.reason || '記載なし'}

何かご不明な点がございましたら、学生に直接お問い合わせください。

よろしくお願いいたします。

---
このメールは授業欠席連絡システムから自動送信されました。
`;

  try {
    MailApp.sendEmail({
      to: course.email,
      subject: subject,
      body: body,
      replyTo: formData.studentEmail
    });
    console.log(`メール送信完了: ${course.teacherName}先生 (${course.email})`);
  } catch (error) {
    console.error(`メール送信失敗: ${course.teacherName}先生`, error);
    throw error;
  }
}

/**
 * 授業情報を追加する関数（管理者用）
 */
function addCourse(courseName, teacherName, email) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const courseSheet = spreadsheet.getSheetByName(SHEETS.COURSES);
    
    if (!courseSheet) {
      throw new Error('授業情報シートが見つかりません');
    }
    
    courseSheet.appendRow([courseName, teacherName, email]);
    return { success: true };
  } catch (error) {
    console.error('授業追加エラー:', error);
    return { success: false, error: error.toString() };
  }
}

/**
 * 管理者に欠席情報を通知する関数
 */
function sendAdminNotification(formData, emailsSent, emailsNotSent) {
  const subject = `【欠席連絡システム】新しい欠席届が提出されました - ${formData.studentName}さん`;
  
  let body = `
欠席連絡システムから新しい欠席届が提出されました。

【学生情報】
学生番号: ${formData.studentId}
氏名: ${formData.studentName}
メールアドレス: ${formData.studentEmail}

【欠席情報】
欠席期間: ${formData.startDate} ～ ${formData.endDate}
欠席理由: ${formData.reason || '記載なし'}

【欠席科目】
${formData.subjects.join('\n')}

【メール送信結果】
`;

  if (emailsSent && emailsSent.length > 0) {
    body += `
✅ 送信完了:
${emailsSent.map(item => '  - ' + item).join('\n')}
`;
  }

  if (emailsNotSent && emailsNotSent.length > 0) {
    body += `
❌ 送信失敗:
${emailsNotSent.map(item => '  - ' + item).join('\n')}
`;
  }

  body += `
詳細はスプレッドシートの「欠席情報」シートをご確認ください。

---
このメールは授業欠席連絡システムから自動送信されました。
提出日時: ${new Date().toLocaleString('ja-JP')}
`;

  try {
    MailApp.sendEmail({
      to: ADMIN_EMAIL,
      subject: subject,
      body: body,
      replyTo: formData.studentEmail
    });
    console.log(`管理者への通知メール送信完了: ${ADMIN_EMAIL}`);
  } catch (error) {
    console.error('管理者への通知メール送信失敗:', error);
    throw error;
  }
}

/**
 * テスト用の関数
 */
function testSystem() {
  console.log('システムテストを開始します...');
  
  // シート初期化テスト
  const initResult = initializeSheets();
  console.log('シート初期化結果:', initResult);
  
  // 授業情報取得テスト
  try {
    const courses = getCourses();
    console.log('取得した授業情報:', courses);
  } catch (error) {
    console.error('授業情報取得テストエラー:', error);
  }
  
  console.log('システムテストが完了しました。');
}