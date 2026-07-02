export default async function handler(req, res) {
  const studentId = req.query.id;

  if (!studentId) {
    return res.status(400).send("ไม่พบ ID นักเรียน");
  }

  const SHEET_ID = "1O2PK1OzXrume3-sehPLjThpWTWLfn0JhHhj3XgCMsEQ";
  const API_KEY = process.env.GOOGLE_API_KEY;
  const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwDDQa1WXeFOvOEoodOOac_JXDZ5HStEcOlGYWv4_SSGIexqLae5DM3Rqng8u2wWhRn/exec";
  
  //"https://script.google.com/macros/s/AKfycbzhy_D-CFddKOcutYKmJvi_aj2FpzRGAtu7KHICK6nrGLJipI7ke5NkqsPeiJNdJaNb/exec"

  // ดึงข้อมูลนักเรียนจาก Sheet
  const sheetRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Students?key=${API_KEY}`);
  const sheetData = await sheetRes.json();
  const rows = sheetData.values || [];

  let student = null;
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] == studentId) {
      student = { id: rows[i][0], name: rows[i][1], class: rows[i][2] };
      break;
    }
  }

  if (!student) {
    return res.status(404).send(`<h2>❌ ไม่พบนักเรียน ID: ${studentId}</h2>`);
  }

  // บันทึกลง Sheet ผ่าน Apps Script (background)
  fetch(`${APPS_SCRIPT_URL}?id=${studentId}`).catch(() => {});

  const now = new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });

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
          <h1>✅ ขึ้นรถสำเร็จ!</h1>
          <p>👤 <strong>${student.name}</strong></p>
          <p>🏫 ชั้น ${student.class}</p>
          <p class="time">🕐 ${now}</p>
        </div>
      </body>
    </html>
  `);
}
