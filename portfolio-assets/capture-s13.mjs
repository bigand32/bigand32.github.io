/**
 * 현장톡(s13) 포트폴리오 스크린샷 캡처
 * 사용: npx playwright install chromium && node capture-s13.mjs
 */
import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_DIR = path.resolve(__dirname, '../고용');
const OUT_DIR = path.resolve(__dirname, 's13');

const SETUP = () => {
  const sp = document.getElementById('screen-splash');
  if (sp) { sp.style.display = 'none'; sp.classList.add('hidden'); }
  document.getElementById('screen-login')?.classList.add('hidden');
  document.getElementById('screen-role')?.classList.add('hidden');
  localStorage.setItem('currentUserId', 'user_portfolio_capture');
  localStorage.removeItem('isGuest');
  localStorage.setItem('currentUserName', '이수정');
  localStorage.setItem('userRole', '현장 관리자');
  localStorage.setItem('supplierDoc', JSON.stringify({
    company: '(주)용성건설',
    bizNo: '123-45-67890',
    ceo: '홍길동',
    addr: '충남 태안군 현장로 123',
    tel: '041-000-0000',
    account: '국민 000-00-0000-000',
  }));
  showScreen('screen-main');
  groupsByType.all = 'local-group-all';
  groupsByType.clients = 'local-group-clients';
  categoriesByGroup['local-group-all'] = [
    { id: 'local-cat-all-dump', name: '장비 덤프' },
    { id: 'local-cat-all-repair', name: '수리' },
  ];
  categoriesByGroup['local-group-clients'] = [{ id: 'local-cat-clients-dump', name: '장비 덤프' }];
  contactsCache = [
    { id: 'local-c1', name: '김덤프기사', phone: '01022223333', displayPhone: '010-2222-3333', groupId: 'local-group-all', categoryId: 'local-cat-all-dump', category: '장비 덤프' },
    { id: 'local-c2', name: '박정비', phone: '01033334444', displayPhone: '010-3333-4444', groupId: 'local-group-all', categoryId: 'local-cat-all-repair', category: '수리' },
    { id: 'local-c3', name: '한중기사업소', phone: '01012345678', displayPhone: '010-1234-5678', groupId: 'local-group-clients', categoryId: 'local-cat-clients-dump', category: '장비 덤프' },
  ];
  renderCategorySections();
  if (typeof updateFriendTabCounts === 'function') updateFriendTabCounts();
  chatRoomList.length = 0;
  chatRoomList.push(
    { id: 'room_demo1', name: '용성건설 박소장', avatar: null, lastMsg: '내일 자재 입고 확인 부탁드립니다', time: '오후 2:15' },
    { id: 'room_demo2', name: '진용산업 김팀장', avatar: null, lastMsg: '거래명세표 보내드렸습니다', time: '어제' },
  );
  openChatRoomList.length = 0;
  openChatRoomList.push(
    { id: 'open_demo1', name: '용성건설 현장팀', memberCount: 12, lastMsg: '내일 오전 7시 반장님 오셔야 합니다', img: null },
    { id: 'open_demo2', name: 'A현장 협력사방', memberCount: 28, lastMsg: '오늘 안전점검 15시 진행합니다', img: null },
  );
  const roomId = buildRoomId('용성건설 박소장');
  const me = 'user_portfolio_capture';
  mockChatMessages[roomId] = [
    { senderId: 'other', senderName: '박소장', text: '내일 자재 입고 일정 확인 부탁드려요', createdAt: { toDate: () => new Date() } },
    { senderId: me, senderName: '이수정', text: '네, 오전 9시 도착 예정입니다', createdAt: { toDate: () => new Date() } },
    { senderId: 'other', senderName: '박소장', text: '감사합니다! 현장에서 뵙겠습니다', createdAt: { toDate: () => new Date() } },
  ];
  selectedDate = '2026-03-10';
  calendarData = JSON.parse(JSON.stringify(SAMPLE_CALENDAR_DATA));
  renderChatRoomList();
  renderOpenChatRoomList();
  if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
};

function startServer(port) {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      let p = (req.url || '/').split('?')[0];
      if (p === '/') p = '/index.html';
      const fp = path.join(APP_DIR, decodeURIComponent(p));
      if (!fp.startsWith(APP_DIR) || !existsSync(fp)) {
        res.writeHead(404);
        res.end();
        return;
      }
      const ext = path.extname(fp).toLowerCase();
      const types = {
        '.html': 'text/html; charset=utf-8',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.png': 'image/png',
        '.json': 'application/json',
        '.webp': 'image/webp',
      };
      res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
      res.end(readFileSync(fp));
    });
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

async function shot(page, file, action, selector = '#app-container') {
  if (action) await page.evaluate(action);
  await page.waitForTimeout(900);
  await page.evaluate(() => { if (window.lucide?.createIcons) lucide.createIcons(); });
  if (selector.includes('doc-draft-modal')) {
    await page.waitForFunction(() => {
      const m = document.getElementById('doc-draft-modal');
      return m && m.classList.contains('active') && !m.classList.contains('hidden');
    }, { timeout: 10000 });
    await page.evaluate(() => {
      const c = document.querySelector('#doc-draft-modal .modal-center-content');
      if (c) {
        c.style.transition = 'none';
        c.style.opacity = '1';
        c.style.transform = 'scale(1)';
      }
    });
    await page.waitForTimeout(200);
  }
  const loc = page.locator(selector).first();
  await loc.waitFor({ state: 'visible', timeout: 10000 });
  await page.waitForTimeout(300);
  await loc.screenshot({ path: path.join(OUT_DIR, file) });
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const server = await startServer(9876);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await page.goto('http://127.0.0.1:9876/index.html', { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForTimeout(2800);
  await page.evaluate(SETUP);

  await shot(page, '0.png', () => {
    closeChatRoom();
    closeModal('doc-draft-modal');
    switchTab('friends', '연락처');
  }, '#app-container');
  await shot(page, '1.png', () => {
    closeChatRoom();
    closeModal('doc-draft-modal');
    switchTab('openchat', '오픈방');
    renderOpenChatRoomList();
  }, '#app-container');
  await shot(page, '2.png', () => {
    closeChatRoom();
    closeModal('doc-draft-modal');
    switchTab('chat', '채팅');
    renderChatRoomList();
  }, '#app-container');
  await shot(page, '3.png', () => {
    closeModal('doc-draft-modal');
    switchTab('chat', '채팅');
    openChatRoom('용성건설 박소장');
    const rid = buildRoomId('용성건설 박소장');
    renderChatMessages(mockChatMessages[rid]);
  }, '#screen-chatroom');
  await shot(page, '4.png', () => {
    closeChatRoom();
    closeModal('doc-draft-modal');
    switchTab('calendar', '기록');
    renderCalendar();
  }, '#app-container');
  const invDiag = await page.evaluate(() => {
    try {
      closeChatRoom();
      closeModal('doc-draft-modal');
      switchTab('calendar', '기록');
      renderCalendar();
      selectedDate = '2026-03-10';
      openDocDraftModal('invoice');
      const m = document.getElementById('doc-draft-modal');
      return {
        ok: true,
        selectedDate,
        hidden: m?.classList.contains('hidden'),
        active: m?.classList.contains('active'),
        title: document.getElementById('doc-draft-title')?.textContent,
      };
    } catch (e) {
      return { ok: false, err: String(e && (e.stack || e.message || e)) };
    }
  });
  if (!invDiag.ok || !invDiag.active) console.warn('invoice modal:', invDiag);
  await page.waitForTimeout(900);
  await page.evaluate(() => { if (window.lucide?.createIcons) lucide.createIcons(); });
  await page.waitForFunction(() => {
    const m = document.getElementById('doc-draft-modal');
    return m && m.classList.contains('active') && !m.classList.contains('hidden');
  }, { timeout: 10000 }).catch(() => {});
  await page.evaluate(() => {
    const m = document.getElementById('doc-draft-modal');
    if (m) {
      m.classList.remove('hidden');
      m.classList.add('active');
      const c = m.querySelector('.modal-center-content');
      if (c) {
        c.style.transition = 'none';
        c.style.opacity = '1';
        c.style.transform = 'scale(1)';
      }
    }
  });
  await page.locator('#doc-draft-modal').first().screenshot({ path: path.join(OUT_DIR, '5.png') });

  await browser.close();
  server.close();
  console.log('Saved 6 screenshots to', OUT_DIR);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
