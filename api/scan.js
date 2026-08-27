import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';

export default async function handler(req, res) {
  const studentId = req.query.id;

  if (!studentId) {
    return res.status(400).send("ไม่พบ ID นักเรียน");
  }

  const auth = new GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const SHEET_ID = "1O2PK1OzXrume3-sehPLjThpWTWLfn0JhHhj3XgCMsEQ";

  const studentRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Students',
  });

  const rows = studentRes.data.values || [];
  let student = null;
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] == studentId) {
      student = {
        id: rows[i][0],
        name: rows[i][1],
        class: rows[i][2],
        school: rows[i][3] || ''
      };
      break;
    }
  }

  if (!student) {
    return res.status(404).send(`<h2>❌ ไม่พบนักเรียน ID: ${studentId}</h2>`);
  }

  // แยก Date และ Time ให้ตรงกับ format เดิม dd/MM/yyyy และ HH:mm:ss
  const now = new Date();
  const bkk = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
  const dd = String(bkk.getDate()).padStart(2, '0');
  const mm = String(bkk.getMonth() + 1).padStart(2, '0');
  const yyyy = bkk.getFullYear();
  const hh = String(bkk.getHours()).padStart(2, '0');
  const min = String(bkk.getMinutes()).padStart(2, '0');
  const ss = String(bkk.getSeconds()).padStart(2, '0');

  const nowDate = `${dd}/${mm}/${yyyy}`;
  const nowTime = `${hh}:${min}:${ss}`;

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: 'Attendance',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[nowDate, nowTime, student.id, student.name, student.class, student.school]],
    },
  });

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  return res.status(200).send(`
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: sans-serif; text-align: center; padding: 40px; background: #f0f9f0; margin: 0; }
          .card { background: white; border-radius: 16px; padding: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); max-width: 400px; margin: auto; }
          h1 { color: #2e7d32; font-size: 1.8em; }
          p { font-size: 1.2em; color: #555; }
          .time { color: #1565c0; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>✅ ลงทะเบียน<br>สำเร็จ</h1>
          <p>👤 <strong>${student.name}</strong></p>
          <p>🏫 ชั้น ${student.class}</p>
          <p>🏢 ${student.school}</p>
          <p class="time">🕐 ${nowDate} ${nowTime}</p>
        </div>
      </body>
    </html>
  `);
}
