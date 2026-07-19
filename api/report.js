export default async function handler(req, res) {
  const SHEET_ID = "1O2PK1OzXrume3-sehPLjThpWTWLfn0JhHhj3XgCMsEQ";
  const API_KEY = process.env.GOOGLE_API_KEY;

  const ROUTES = {
    chonburi: { gid: 1129444107, title: "รายงานปัจจุบัน - ชลบุรี สุขบท" },
    spare: { gid: 1756784613, title: "รายงานปัจจุบัน - Spare" },
    chonyanukul: { gid: 168697584, title: "รายงานปัจจุบัน - ชลกันยานุกูล (ชลหญิง)" }
  };

  const defaultRoute = req.query.route && ROUTES[req.query.route] ? req.query.route : "chonburi";

  try {
    // 1) ดึงรายชื่อชีททั้งหมด เพื่อจับคู่ gid -> ชื่อชีทจริง
    const metaRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}?key=${API_KEY}&fields=sheets.properties`
    );
    const metaData = await metaRes.json();
    const sheetsMeta = metaData.sheets || [];

    function findSheetTitleByGid(gid) {
      const found = sheetsMeta.find(s => s.properties.sheetId === gid);
      return found ? found.properties.title : null;
    }

    // 2) ดึงข้อมูลของทั้ง 3 โรงเรียนพร้อมกัน
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

          rowsHtml += `
            <tr>
              <td>${row[0] || "-"}</td>
              <td>${row[1] || "-"}</td>
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
              <th>ลำดับ</th><th>Student ID</th><th>ชื่อนักเรียน</th><th>ชั้น</th><th>โรงเรียน</th>
              <th>ขึ้นรถเช้า</th><th>ลงรถโรงเรียน</th><th>ขึ้นรถเย็น</th><th>ลงบ้าน</th><th>สถานะ</th>
            </tr>
            ${rowsHtml}
          </table>
        </div>
      `;
    }

    const now = new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });

    const panels = routeKeys.map(key => `
      <div id="panel-${key}" class="panel" style="display:${key === defaultRoute ? "block" : "none"};">
        ${tablesHtml[key]}
      </div>
    `).join("");

    const tabs = routeKeys.map(key => `
      <button class="tab ${key === defaultRoute ? "active" : ""}" id="tab-${key}" onclick="showRoute('${key}')">${ROUTES[key].title}</button>
    `).join("");

    const titlesJson = JSON.stringify(
      Object.fromEntries(routeKeys.map(k => [k, ROUTES[k].title]))
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
            h1 { color: #2e7d32; text-align: center; font-size: 1.25em; margin: 8px 0; }
            .updated { text-align: center; color: #888; margin-bottom: 12px; font-size: 0.78em; }
            .tabs { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }
            .tab { width: 100%; padding: 12px 10px; background: white; border-radius: 10px; border: 1px solid #ddd; color: #333; font-size: 0.95em; box-shadow: 0 1px 4px rgba(0,0,0,0.08); cursor: pointer; }
            .tab.active { background: #2e7d32; color: white; border-color: #2e7d32; }
            .refresh-btn { display: block; width: 100%; margin: 0 0 16px; padding: 12px; background: #1565c0; color: white; border: none; border-radius: 10px; font-size: 1em; cursor: pointer; }
            .table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; background: white; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            table { border-collapse: collapse; width: 100%; min-width: 700px; }
            th, td { border: 1px solid #ddd; padding: 8px 10px; text-align: center; font-size: 0.85em; white-space: nowrap; }
            th { background: #2e7d32; color: white; position: sticky; top: 0; z-index: 1; }
            tr:nth-child(even) { background: #f7f7f7; }
            .hint { text-align: center; font-size: 0.75em; color: #999; margin: 6px 0 0; }
          </style>
        </head>
        <body>
          <h1 id="pageTitle">${ROUTES[defaultRoute].title}</h1>
          <div class="updated">อัปเดตล่าสุด: ${now} (รีเฟรชอัตโนมัติทุก 2.5 นาที)</div>
          <div class="tabs">${tabs}</div>
          <button class="refresh-btn" onclick="location.reload()">🔄 รีเฟรชตอนนี้</button>
          ${panels}
          <p class="hint">👉 เลื่อนตารางซ้าย-ขวาเพื่อดูข้อมูลเพิ่มเติม</p>

          <script>
            const titles = ${titlesJson};
            const routeKeys = ${routeKeysJson};

            function showRoute(key) {
              routeKeys.forEach(function(k) {
                document.getElementById('panel-' + k).style.display = (k === key) ? 'block' : 'none';
                document.getElementById('tab-' + k).classList.toggle('active', k === key);
              });
              document.getElementById('pageTitle').textContent = titles[key];
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
