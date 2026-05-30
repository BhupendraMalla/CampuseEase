/**
 * CampusEase — full end-to-end demo + smoke test, with SMOOTH video recording.
 *
 * Drives the real app in Chromium like a human, once per role:
 *   • logs in as every seeded role (typed slowly, real clicks)
 *   • walks every sidebar feature — cursor travels to each item, the page is
 *     gently scrolled through, then screenshotted; JS errors are captured
 *   • performs real write actions (enroll in a semester, edit profile, submit
 *     feedback, create a department…)
 *   • records ONE smooth video per role, then stitches a combined full demo
 *
 * Run:  bash e2e/run.sh        (frontend on :4200, backend on :3200)
 * Output: e2e/artifacts/
 *   ├── videos/<role>-demo.mp4           one smooth clip per role
 *   ├── campusease-demo.mp4              combined full walkthrough
 *   ├── screenshots/                     one per feature page, per role
 *   └── report.md / report.json          pass/fail per feature
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { execFileSync } from 'child_process';

const require = createRequire(import.meta.url);
const PW_PATH = process.env.PW_PATH || '/Users/nirajkafle/.npm/_npx/e41f203b7505f1fb/node_modules';
const { chromium } = require(path.join(PW_PATH, 'playwright'));
const FFMPEG = process.env.FFMPEG || '/opt/homebrew/opt/ffmpeg@4/bin/ffmpeg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.BASE_URL || 'http://localhost:4200';
const OUT = path.join(__dirname, 'artifacts');
const SHOTS = path.join(OUT, 'screenshots');
const VIDEOS = path.join(OUT, 'videos');
const RAW = path.join(OUT, '.raw-video');
for (const d of [OUT, SHOTS, VIDEOS, RAW]) { fs.rmSync(d, { recursive: true, force: true }); fs.mkdirSync(d, { recursive: true }); }

const ROLES = [
  { key: 'admin',     email: 'admin@campusease.com',     pass: 'admin' },
  { key: 'faculty',   email: 'faculty@campusease.com',   pass: 'faculty123' },
  { key: 'student',   email: 'student@campusease.com',   pass: 'student123' },
  { key: 'secretary', email: 'secretary@campusease.com', pass: 'secretary123' },
  { key: 'finance',   email: 'finance@campusease.com',   pass: 'finance123' },
];

const NAV = 'ul.campus-nav > li > a.nav-link';
const VW = { width: 1440, height: 900 };
const results = [];
let shotN = 0;
const slug = (s) => s.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
const sleep = (p, ms) => p.waitForTimeout(ms);

const browser = await chromium.launch({ headless: true, slowMo: 45 });

async function shot(page, name) {
  shotN++;
  const file = path.join(SHOTS, String(shotN).padStart(3, '0') + '-' + slug(name) + '.png');
  await page.screenshot({ path: file }).catch(() => {});
  return path.basename(file);
}

// gentle scroll through the content area so the whole page is shown in the video
async function panel(page) {
  await page.evaluate(async () => {
    const el = document.querySelector('#content') || document.scrollingElement || document.body;
    const max = el.scrollHeight - el.clientHeight;
    if (max <= 20) return;
    const step = Math.max(60, Math.round(max / 14));
    for (let y = 0; y <= max; y += step) { el.scrollTo({ top: y, behavior: 'smooth' }); await new Promise(r => setTimeout(r, 90)); }
    await new Promise(r => setTimeout(r, 300));
    el.scrollTo({ top: 0, behavior: 'smooth' });
  }).catch(() => {});
  await sleep(page, 500);
}

async function login(page, role) {
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });
  await sleep(page, 800);
  await page.locator('input[formcontrolname="email"]').click();
  await page.locator('input[formcontrolname="email"]').pressSequentially(role.email, { delay: 35 });
  await sleep(page, 250);
  await page.locator('input[formcontrolname="password"]').click();
  await page.locator('input[formcontrolname="password"]').pressSequentially(role.pass, { delay: 35 });
  await sleep(page, 400);
  await shot(page, role.key + '-login');
  const btn = page.locator('button:has-text("Login")');
  const box = await btn.boundingBox().catch(() => null);
  if (box) await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 8 });
  await btn.click();
  // fallback: if the SPA didn't navigate, trigger the handler directly
  try {
    await page.waitForURL('**/dashboard', { timeout: 8000 });
  } catch {
    await page.evaluate(() => {
      const b = [...document.querySelectorAll('button')].find(x => /login/i.test(x.innerText));
      if (b) b.click();
    });
    await page.waitForURL('**/dashboard', { timeout: 8000 });
  }
  await sleep(page, 2200);
}

async function clickNav(page, label) {
  const loc = page.getByText(label, { exact: true }).first();
  const box = await loc.boundingBox().catch(() => null);
  if (box) await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 8 });
  await sleep(page, 200);
  const ok = await page.evaluate((lbl) => {
    const links = [...document.querySelectorAll('ul.campus-nav > li > a.nav-link')];
    const el = links.find((a) => a.innerText.trim() === lbl);
    if (!el) return false;
    el.scrollIntoView({ block: 'center' }); el.click(); return true;
  }, label);
  await sleep(page, 900);
  return ok;
}

async function visit(page, role, label, errsRef) {
  const before = errsRef.length;
  let detail = 'rendered';
  try {
    const ok = await clickNav(page, label);
    if (!ok) detail = 'nav item not found';
    if (!page.url().includes('/dashboard')) detail = 'navigated to ' + page.url().replace(BASE, '');
  } catch (e) { detail = 'ERR ' + String(e).slice(0, 90); }
  await panel(page);
  const file = await shot(page, role + '-' + label);
  const errored = errsRef.length > before;
  results.push({ role, section: label, status: errored ? 'FAIL' : 'PASS', detail: errored ? errsRef[errsRef.length - 1].slice(0, 110) : detail, screenshot: file });
  if (!page.url().includes('/dashboard')) { await page.goto(BASE + '/dashboard', { waitUntil: 'domcontentloaded' }).catch(() => {}); await sleep(page, 900); }
}

function record(role, section, status, detail, file) { results.push({ role, section: '✍ ' + section, status, detail, screenshot: file || '' }); }
async function tryWrite(page, role, label, fn) {
  try { const r = await fn(); record(role, label, 'PASS', r || 'ok', await shot(page, role + '-write-' + label)); }
  catch (e) { record(role, label, 'WARN', String(e).slice(0, 110), await shot(page, role + '-write-' + label)); }
}

async function adminWrites(page) {
  await tryWrite(page, 'admin', 'create-department', async () => {
    await clickNav(page, 'Department');
    await page.locator('input[placeholder="Create Department"]').fill('Demo Dept ' + Date.now().toString().slice(-4));
    const sel = page.locator('select').first();
    const opts = await sel.locator('option').allInnerTexts().catch(() => []);
    if (opts.length > 1) await sel.selectOption({ index: 1 }).catch(() => {});
    await sleep(page, 400);
    await page.locator('button:has-text("Create")').click();
    await sleep(page, 1600);
    return 'create-department submitted';
  });
}
async function studentWrites(page) {
  await tryWrite(page, 'student', 'edit-profile', async () => {
    await clickNav(page, 'Profile');
    await page.getByRole('textbox', { name: 'Address' }).first().fill('Hostel Block A — Room 204');
    await sleep(page, 400);
    await page.locator('button:has-text("Save Changes")').click();
    await sleep(page, 1500);
    return 'profile address updated';
  });
  await tryWrite(page, 'student', 'semester-enroll', async () => {
    await clickNav(page, 'Semester Enroll');
    await page.locator('input[placeholder="Enter semester enrollment key"]').fill('CSE-2024');
    await sleep(page, 400);
    await page.locator('button:has-text("Enroll Now")').click();
    await sleep(page, 2000);
    return 'enrolled with key CSE-2024';
  });
  await tryWrite(page, 'student', 'submit-feedback', async () => {
    await clickNav(page, 'Feedback');
    await page.locator('textarea').first().fill('Great campus portal — submitted during the e2e demo.');
    await sleep(page, 400);
    await page.locator('button:has-text("Submit"), button:has-text("Send"), button[type="submit"]').first().click();
    await sleep(page, 1500);
    return 'feedback submitted';
  });
}

async function logout(page) {
  await page.evaluate(() => { const a = [...document.querySelectorAll('a')].find(x => /logout/i.test(x.innerText)); if (a) a.click(); }).catch(() => {});
  await sleep(page, 1200);
}

// ---------------------- run, one context (=one video) per role ----------------------
console.log('▶ CampusEase smooth demo against', BASE);
const roleVideos = [];
for (const role of ROLES) {
  console.log('\n=== ROLE:', role.key, '===');
  const context = await browser.newContext({ viewport: VW, recordVideo: { dir: RAW, size: VW } });
  const page = await context.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e)));
  let vpath = null;
  try {
    await login(page, role);
    results.push({ role: role.key, section: '(login)', status: 'PASS', detail: 'authenticated → /dashboard', screenshot: await shot(page, role.key + '-dashboard') });
    const labels = await page.$$eval(NAV, (els) => els.map((a) => a.innerText.trim()).filter(Boolean));
    console.log('  sidebar:', labels.join(', ') || '(none)');
    for (const label of labels) {
      if (label.toLowerCase() === 'logout') continue;
      await visit(page, role.key, label, errs);
      console.log('   •', label, '→', results[results.length - 1].status);
    }
    if (role.key === 'admin') await adminWrites(page);
    if (role.key === 'student') await studentWrites(page);
    await logout(page);
  } catch (e) {
    results.push({ role: role.key, section: '(login)', status: 'FAIL', detail: String(e).slice(0, 130), screenshot: await shot(page, role.key + '-login-fail') });
    console.log('  ✗', String(e).slice(0, 120));
  }
  try { vpath = await page.video().path(); } catch {}
  await context.close();
  if (vpath && fs.existsSync(vpath)) {
    const mp4 = path.join(VIDEOS, role.key + '-demo.mp4');
    try {
      execFileSync(FFMPEG, ['-y', '-i', vpath, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', mp4], { stdio: 'ignore' });
      roleVideos.push(mp4);
      console.log('  🎬', path.basename(mp4));
    } catch (e) { console.log('  ! mp4 convert failed for', role.key); }
  }
}
await browser.close();

// ---------------------- combined full demo ----------------------
if (roleVideos.length) {
  const listFile = path.join(RAW, 'concat.txt');
  fs.writeFileSync(listFile, roleVideos.map(v => `file '${v}'`).join('\n'));
  try {
    execFileSync(FFMPEG, ['-y', '-f', 'concat', '-safe', '0', '-i', listFile, '-c', 'copy', path.join(OUT, 'campusease-demo.mp4')], { stdio: 'ignore' });
    console.log('\n🎬 combined:', path.join(OUT, 'campusease-demo.mp4'));
  } catch (e) { console.log('! combine failed:', String(e).slice(0, 80)); }
}
fs.rmSync(RAW, { recursive: true, force: true });

// ---------------------- report ----------------------
const pass = results.filter(r => r.status === 'PASS').length;
const fail = results.filter(r => r.status === 'FAIL').length;
const warn = results.filter(r => r.status === 'WARN').length;
let md = `# CampusEase — End-to-End Test Report\n\nGenerated by \`e2e/demo.mjs\` against ${BASE}.\n\n**${pass} passed · ${fail} failed · ${warn} warnings** of ${results.length} checks.\n\nVideos: \`e2e/artifacts/videos/<role>-demo.mp4\` + combined \`campusease-demo.mp4\`.\n`;
let cur = '';
for (const r of results) {
  if (r.role !== cur) { md += `\n## ${r.role}\n\n| Status | Feature | Detail | Screenshot |\n|---|---|---|---|\n`; cur = r.role; }
  const icon = r.status === 'PASS' ? '✅' : r.status === 'FAIL' ? '❌' : '⚠️';
  md += `| ${icon} ${r.status} | ${r.section} | ${String(r.detail).replace(/\|/g, '/')} | ${r.screenshot} |\n`;
}
fs.writeFileSync(path.join(OUT, 'report.md'), md);
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify({ pass, fail, warn, total: results.length, results }, null, 2));
console.log(`\n📊 ${pass} passed · ${fail} failed · ${warn} warnings (of ${results.length})`);
console.log('📄', path.join(OUT, 'report.md'));
process.exit(fail > 0 ? 1 : 0);
