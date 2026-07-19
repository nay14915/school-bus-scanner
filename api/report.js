export default async function handler(req, res) {
  const SHEET_ID = "1O2PK1OzXrume3-sehPLjThpWTWLfn0JhHhj3XgCMsEQ";
  const API_KEY = process.env.GOOGLE_API_KEY;

  const ROUTES = {
    chonburi: { gid: 1129444107, title: "รายงานปัจจุบัน - ชลบุรี สุขบท", routeName: "ชลบุรี สุขบท" },
    spare: { gid: 1756784613, title: "รายงานปัจจุบัน - Spare", routeName: "Spare" },
    chonyanukul: { gid: 168697584, title: "รายงานปัจจุบัน - ชลกันยานุกูล (ชลหญิง)", routeName: "ชลกันยานุกูล (ชลหญิง)" }
  };

  const defaultRoute = req.query.route && ROUTES[req.query.route] ? req.query.route : "chonburi";

  const THAI_MONTHS = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];

  function formatThaiDate(date) {
    const day = date.getDate();
    const month = THAI_MONTHS[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  }

  try {
    const metaRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}?key=${API_KEY}&fields=sheets.properties`
    );
    const metaData = await metaRes.json();
    const sheetsMeta = metaData.sheets || [];

    function findSheetTitleByGid(gid) {
      const found = sheetsMeta.find(s => s.properties.sheetId === gid);
      return found ? found.properties.title : null;
    }

    const routeKeys = Object.keys(ROUTES);
    const tablesHtml = {};

    for (const key of routeKeys) {
      const gid = ROUTES[key].gid;
      const sheetTitle = findSheetTitleByGid(gid);

      if (!sheetTitle) {
        tablesHtml[key] = `<h2>❌ ไม่พบชีท (gid: ${gid})</h2>`;
        continue;
      }

      const range = `${sheetTitle}!A:J`;
      const valuesRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(range)}?key=${API_KEY}`
      );
      const valuesData = await valuesRes.json();
      const rows = valuesData.values || [];

      let headerRowIndex = -1;
      for (let i = 0; i < rows.length; i++) {
        if (String(rows[i][0]).trim() === "ลำดับ") {
          headerRowIndex = i;
          break;
        }
      }

      let rowsHtml = "";
      if (headerRowIndex >= 0) {
        for (let i = headerRowIndex + 1; i < rows.length; i++) {
          const row = rows[i];
          const name = row[2];
          if (!name || name === "-") continue;

          const rowClass = ((i - headerRowIndex) % 2 === 0) ? "even-row" : "odd-row";

          rowsHtml += `
            <tr class="${rowClass}">
              <td>${row[0] || "-"}</td>
              <td class="col-sticky">${row[1] || "-"}</td>
              <td>${row[2] || "-"}</td>
              <td>${row[3] || "-"}</td>
              <td>${row[4] || "-"}</td>
              <td>${row[5] || "-"}</td>
              <td>${row[6] || "-"}</td>
              <td>${row[7] || "-"}</td>
              <td>${row[8] || "-"}</td>
              <td>${row[9] || "-"}</td>
            </tr>
          `;
        }
      }

      tablesHtml[key] = `
        <div class="table-scroll">
          <table>
            <tr>
              <th>ลำดับ</th>
              <th class="col-sticky">Student ID</th>
              <th>ชื่อนักเรียน</th>
              <th>ชั้น</th><th>โรงเรียน</th>
              <th>ขึ้นรถเช้า</th><th>ลงรถโรงเรียน</th><th>ขึ้นรถเย็น</th><th>ลงบ้าน</th><th>สถานะ</th>
            </tr>
            ${rowsHtml}
          </table>
        </div>
      `;
    }

    const nowDate = new Date();
    const thaiDateStr = formatThaiDate(
      new Date(nowDate.toLocaleString("en-US", { timeZone: "Asia/Bangkok" }))
    );
    const timeStr = nowDate.toLocaleTimeString("th-TH", {
      timeZone: "Asia/Bangkok", hour: "2-digit", minute: "2-digit"
    });

    const panels = routeKeys.map(key => `
      <div id="panel-${key}" class="panel" style="display:${key === defaultRoute ? "block" : "none"};">
        ${tablesHtml[key]}
      </div>
    `).join("");

    const options = routeKeys.map(key => `
      <option value="${key}" ${key === defaultRoute ? "selected" : ""}>${ROUTES[key].title}</option>
    `).join("");

    const routeNamesJson = JSON.stringify(
      Object.fromEntries(routeKeys.map(k => [k, ROUTES[k].routeName]))
    );
    const routeKeysJson = JSON.stringify(routeKeys);

    const html = `
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
          <meta http-equiv="refresh" content="150">
          <style>
            * { box-sizing: border-box; }
            body { font-family: sans-serif; background: #f0f9f0; margin: 0; padding: 12px; }
            .header-box {
              background: linear-gradient(135deg, #2e7d32, #1b5e20);
              color: white;
              border-radius: 14px;
              padding: 18px 16px;
              text-align: center;
              margin-bottom: 16px;
              box-shadow: 0 3px 10px rgba(0,0,0,0.15);
            }
            .header-box h1 { margin: 0; font-size: 1.15em; }
            .header-box .en-title { font-size: 0.75em; opacity: 0.85; margin-top: 2px; }
            .header-box .sub-title { font-size: 0.95em; margin-top: 10px; font-weight: bold; }
            .header-box .route-line { font-size: 0.9em; margin-top: 6px; }
            .header-box .date-line { font-size: 0.78em; margin-top: 6px; opacity: 0.9; }

            .select-wrap { margin-bottom: 14px; }
            .route-select {
              width: 100%;
              padding: 14px 12px;
              font-size: 1em;
              border-radius: 10px;
              border: 1px solid #ccc;
              background: white;
              color: #2e7d32;
              font-weight: bold;
              box-shadow: 0 1px 4px rgba(0,0,0,0.08);
              -webkit-appearance: none;
              appearance: none;
            }

            .refresh-btn { display: block; width: 100%; margin: 0 0 16px; padding: 12px; background: #1565c0; color: white; border: none; border-radius: 10px; font-size: 1em; cursor: pointer; }
            .table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; background: white; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            table { border-collapse: collapse; width: 100%; min-width: 760px; }
            th, td { border: 1px solid #ddd; padding: 8px 10px; text-align: center; font-size: 0.85em; white-space: nowrap; }
            th { background: #2e7d32; color: white; position: sticky; top: 0; z-index: 3; }

            /* ตรึงเฉพาะคอลัมน์ Student ID */
            .col-sticky {
              position: sticky;
              left: 0;
              z-index: 2;
              box-shadow: 2px 0 4px rgba(0,0,0,0.08);
            }
            th.col-sticky { z-index: 4; }
            tr.odd-row td.col-sticky { background: #ffffff; }
            tr.even-row td.col-sticky { background: #f7f7f7; }
            tr.odd-row { background: #ffffff; }
            tr.even-row { background: #f7f7f7; }

            .hint { text-align: center; font-size: 0.75em; color: #999; margin: 6px 0 0; }
          </style>
        </head>
        <body>
          <div class="header-box">
            <h1>ระบบติดตามรถรับ-ส่งนักเรียน</h1>
            <div class="en-title">School Bus Monitoring System</div>
            <div class="sub-title">รายงานการขึ้น-ลงรถนักเรียน</div>
            <div class="route-line">สายรถ : <span id="routeName">${ROUTES[defaultRoute].routeName}</span></div>
            <div class="date-line">วันที่ ${thaiDateStr} อัปเดตล่าสุด : ${timeStr} น.</div>
          </div>

          <div class="select-wrap">
            <select class="route-select" id="routeSelect" onchange="showRoute(this.value)">
              ${options}
            </select>
          </div>

          <button class="refresh-btn" onclick="location.reload()">🔄 รีเฟรชตอนนี้</button>
          ${panels}
          <p class="hint">👉 เลื่อนตารางซ้าย-ขวาเพื่อดูข้อมูลเพิ่มเติม (คอลัมน์ Student ID จะตรึงอยู่ด้านซ้ายเสมอ)</p>

          <script>
            const routeNames = ${routeNamesJson};
            const routeKeys = ${routeKeysJson};

            function showRoute(key) {
              routeKeys.forEach(function(k) {
                document.getElementById('panel-' + k).style.display = (k === key) ? 'block' : 'none';
              });
              document.getElementById('routeName').textContent = routeNames[key];
            }
          </script>
        </body>
      </html>
    `;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(html);

  } catch (err) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(500).send(`<h2>❌ เกิดข้อผิดพลาด: ${err.message}</h2>`);
  }
}
