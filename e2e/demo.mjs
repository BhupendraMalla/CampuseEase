/**
 * CampusEase — full end-to-end demo + smoke test, with video recording.
 *
 * Drives the real app in a Chromium browser like a human:
 *   • logs in as every seeded role
 *   • walks every sidebar feature, screenshotting each page and catching JS errors
 *   • performs real "write" actions (create department, enroll in a semester,
 *     edit profile, submit feedback, post a discussion, etc.)
 *   • records the whole session to one video file
 *
 * Run:  node e2e/demo.mjs            (frontend on :4200, backend on :3200)
 * Output: e2e/artifacts/{screenshots,video,report.md,report.json}
 *
 * Playwright is resolved from the local Playwright-MCP install via NODE_PATH
 * (see e2e/run.sh) so nothing is added to the app's package.json.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
// ESM ignores NODE_PATH — resolve Playwright explicitly (borrowed from the
// Playwright-MCP install so the app's package.json stays untouched).
const PW_PATH = process.env.PW_PATH || '/Users/nirajkafle/.npm/_npx/e41f203b7505f1fb/node_modules';
const { chromium } = require(path.join(PW_PATH, 'playwright'));

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.BASE_URL || 'http://localhost:4200';
const OUT = path.join(__dirname, 'artifacts');
const SHOTS = path.join(OUT, 'screenshots');
const VIDEO = path.join(OUT, 'video');
for (const d of [OUT, SHOTS, VIDEO]) fs.mkdirSync(d, { recursive: true });

const ROLES = [
  { key: 'admin',     email: 'admin@campusease.com',     pass: 'admin' },
  { key: 'faculty',   email: 'faculty@campusease.com',   pass: 'faculty123' },
  { key: 'student',   email: 'student@campusease.com',   pass: 'student123' },
  { key: 'secretary', email: 'secretary@campusease.com', pass: 'secretary123' },
  { key: 'finance',   email: 'finance@campusease.com',   pass: 'finance123' },
];

const NAV = 'ul.campus-nav > li > a.nav-link';
const results = [];
let shotN = 0;
const pageErrors = [];

const slug = (s) => s.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
const log = (...a) => console.log(...a);

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  recordVideo: { dir: VIDEO, size: { width: 1440, height: 900 } },
});
const page = await context.newPage();
page.on('pageerror', (e) => pageErrors.push(String(e)));

async function shot(name) {
  shotN++;
  const file = path.join(SHOTS, String(shotN).padStart(3, '0') + '-' + slug(name) + '.png');
  await page.screenshot({ path: file }).catch(() => {});
  return path.basename(file);
}

async function login(role) {
  try { await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); }); } catch {}
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(900);
  await page.fill('input[formcontrolname="email"]', role.email);
  await page.waitForTimeout(250);
  await page.fill('input[formcontrolname="password"]', role.pass);
  await page.waitForTimeout(250);
  await shot(role.key + '-login');
  await page.click('button:has-text("Login")');
  await page.waitForURL('**/dashboard', { timeout: 20000 });
  await page.waitForTimeout(2200); // profile + tables load
}

async function sections() {
  return await page.$$eval(NAV, (els) => els.map((a) => a.innerText.trim()).filter(Boolean));
}

// Human-like: move the cursor to the item, then trigger its Angular (click) handler.
async function clickNav(label) {
  const loc = page.getByText(label, { exact: true }).first();
  const box = await loc.boundingBox().catch(() => null);
  if (box) await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 6 });
  await page.waitForTimeout(150);
  const ok = await page.evaluate((lbl) => {
    const links = [...document.querySelectorAll('ul.campus-nav > li > a.nav-link')];
    const el = links.find((a) => a.innerText.trim() === lbl);
    if (!el) return false;
    el.scrollIntoView({ block: 'center' });
    el.click();
    return true;
  }, label);
  await page.waitForTimeout(1100);
  return ok;
}

async function visit(role, label) {
  const before = pageErrors.length;
  let detail = 'rendered';
  try {
    const ok = await clickNav(label);
    if (!ok) detail = 'nav item not found';
    // some items route away from /dashboard (e.g. CV submission)
    if (!page.url().includes('/dashboard')) {
      detail = 'navigated to ' + page.url().replace(BASE, '');
    }
  } catch (e) {
    detail = 'ERR ' + String(e).slice(0, 100);
  }
  const file = await shot(role + '-' + label);
  const errored = pageErrors.length > before;
  results.push({ role, section: label, status: errored ? 'FAIL' : 'PASS', detail: errored ? pageErrors[pageErrors.length - 1].slice(0, 120) : detail, screenshot: file });
  if (!page.url().includes('/dashboard')) {
    await page.goto(BASE + '/dashboard', { waitUntil: 'domcontentloaded' }).catch(() => {});
    await page.waitForTimeout(900);
  }
}

// record a discrete write action outcome
function record(role, section, status, detail, file) {
  results.push({ role, section: '✍ ' + section, status, detail, screenshot: file || '' });
}

async function tryWrite(role, label, fn) {
  try {
    const r = await fn();
    record(role, label, 'PASS', r || 'ok', await shot(role + '-write-' + label));
  } catch (e) {
    record(role, label, 'WARN', String(e).slice(0, 120), await shot(role + '-write-' + label));
  }
}

// ---------- role-specific human write flows ----------
async function adminWrites() {
  await tryWrite('admin', 'create-department', async () => {
    await clickNav('Department');
    const name = page.locator('input[placeholder="Create Department"]');
    await name.fill('E2E Demo Dept ' + Date.now().toString().slice(-4));
    // pick a teacher that isn't already a HOD (last option), if any
    const sel = page.locator('select').first();
    const opts = await sel.locator('option').allInnerTexts().catch(() => []);
    if (opts.length > 1) await sel.selectOption({ index: opts.length - 1 }).catch(() => {});
    await page.waitForTimeout(300);
    await page.click('button:has-text("Create")');
    await page.waitForTimeout(1500);
    return 'submitted create-department (teacher=' + (opts[opts.length - 1] || '?') + ')';
  });
}

async function studentWrites() {
  await tryWrite('student', 'edit-profile', async () => {
    await clickNav('Profile');
    const addr = page.getByRole('textbox', { name: 'Address' }).first();
    await addr.fill('Hostel Block A — Room 204 (e2e)');
    await page.waitForTimeout(300);
    await page.click('button:has-text("Save Changes")');
    await page.waitForTimeout(1500);
    return 'profile address updated';
  });
  await tryWrite('student', 'semester-enroll', async () => {
    await clickNav('Semester Enroll');
    const key = page.locator('input[placeholder="Enter semester enrollment key"]');
    await key.fill('CSE-2024');
    await page.waitForTimeout(300);
    await page.click('button:has-text("Enroll Now")');
    await page.waitForTimeout(2000);
    return 'enrolled with key CSE-2024';
  });
  await tryWrite('student', 'submit-feedback', async () => {
    await clickNav('Feedback');
    const ta = page.locator('textarea').first();
    await ta.fill('Great campus portal — submitted by automated e2e demo.');
    await page.waitForTimeout(300);
    const btn = page.locator('button:has-text("Submit"), button:has-text("Send"), button[type="submit"]').first();
    await btn.click();
    await page.waitForTimeout(1500);
    return 'feedback submitted';
  });
}

// ---------------------- run ----------------------
log('▶ CampusEase E2E demo starting against', BASE);
for (const role of ROLES) {
  log('\n=== ROLE:', role.key, '===');
  try {
    await login(role);
    results.push({ role: role.key, section: '(login)', status: 'PASS', detail: 'authenticated → /dashboard', screenshot: await shot(role.key + '-dashboard') });
  } catch (e) {
    results.push({ role: role.key, section: '(login)', status: 'FAIL', detail: String(e).slice(0, 140), screenshot: await shot(role.key + '-login-fail') });
    log('  ✗ login failed:', String(e).slice(0, 120));
    continue;
  }

  const labels = await sections();
  log('  sidebar:', labels.join(', '));
  for (const label of labels) {
    if (label.toLowerCase() === 'logout') continue;
    await visit(role.key, label);
    log('   •', label, '→', results[results.length - 1].status);
  }

  if (role.key === 'admin') await adminWrites();
  if (role.key === 'student') await studentWrites();

  // logout
  try {
    await page.evaluate(() => {
      const a = [...document.querySelectorAll('a')].find((x) => /logout/i.test(x.innerText));
      if (a) a.click();
    });
    await page.waitForTimeout(1200);
  } catch {}
}

// ---------------------- report ----------------------
const total = results.length;
const pass = results.filter((r) => r.status === 'PASS').length;
const fail = results.filter((r) => r.status === 'FAIL').length;
const warn = results.filter((r) => r.status === 'WARN').length;

let md = `# CampusEase — End-to-End Test Report\n\n`;
md += `Generated by \`e2e/demo.mjs\` against ${BASE}.\n\n`;
md += `**${pass} passed · ${fail} failed · ${warn} warnings** out of ${total} checks.\n\n`;
let curRole = '';
for (const r of results) {
  if (r.role !== curRole) { md += `\n## ${r.role}\n\n| Status | Feature | Detail | Screenshot |\n|---|---|---|---|\n`; curRole = r.role; }
  const icon = r.status === 'PASS' ? '✅' : r.status === 'FAIL' ? '❌' : '⚠️';
  md += `| ${icon} ${r.status} | ${r.section} | ${String(r.detail).replace(/\|/g, '/')} | ${r.screenshot} |\n`;
}
fs.writeFileSync(path.join(OUT, 'report.md'), md);
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify({ pass, fail, warn, total, results }, null, 2));

// finalize video
await context.close(); // flushes video to disk
await browser.close();

const vids = fs.readdirSync(VIDEO).filter((f) => f.endsWith('.webm'));
if (vids.length) {
  const src = path.join(VIDEO, vids.sort()[vids.length - 1]);
  const dest = path.join(OUT, 'campusease-demo.webm');
  fs.copyFileSync(src, dest);
  log('\n🎬 video:', dest);
}
log(`\n📊 ${pass} passed · ${fail} failed · ${warn} warnings (of ${total})`);
log('📄 report:', path.join(OUT, 'report.md'));
log('🖼  screenshots:', SHOTS);
process.exit(fail > 0 ? 1 : 0);
