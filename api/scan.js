export default async function handler(req, res) {
  const studentId = req.query.id;

  if (!studentId) {
    return res.status(400).send("ไม่พบ ID นักเรียน");
  }

  // เรียก Apps Script เพื่อบันทึกข้อมูล
  const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzhy_D-CFddKOcutYKmJvi_aj2FpzRGAtu7KHICK6nrGLJipI7ke5NkqsPeiJNdJaNb/exec";
  
  const scriptRes = await fetch(`${APPS_SCRIPT_URL}?id=${studentId}`, {
    redirect: "follow"
  });
  
  const html = await scriptRes.text();
  
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  return res.status(200).send(html);
}
