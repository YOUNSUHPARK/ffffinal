/* ===================================================================
   OUTSIDOOR — 가짜 문 테스트 (Fake Door Test)
   -------------------------------------------------------------------
   저장소가 두 개입니다. 역할이 다릅니다.

   ① FORMSPREE  ← 이메일 신청 (놓치면 안 되는 것)
      · 신청이 들어올 때마다 내 메일함으로 알림이 옵니다
      · 전송 성공/실패를 코드가 진짜로 확인합니다
      · 무료: 월 50건, 보관 30일  → 메일 알림을 꼭 보관하세요

   ② 구글폼 (선택) ← 조회·클릭 로그 (양이 많고, 몇 개 빠져도 무방)
      · 건수 제한이 없고 메일 알림도 안 옵니다
      · 비워두면 클릭 통계만 없을 뿐, 사이트는 정상 동작합니다

   설정은 아래 FD 블록 하나뿐입니다.
   =================================================================== */
const FD = {
  /* ── ① 필수 ──────────────────────────────────────────────────────
     formspree.io 가입 → New Form → 엔드포인트가 이렇게 나옵니다.
       https://formspree.io/f/xabcdefg
                             └──┬──┘
     이 뒷부분만 따옴표 안에 넣으세요.                                */
  FORMSPREE_ID: 'mvkgrbng',

  /* ── ② 선택: 클릭·조회 로그용 구글폼 ────────────────────────────
     단답형 7문항(ts/event/artwork/variant/email/source/session)     */
  GFORM: {
    FORM_ID: '',
    ENTRY: { ts:'', event:'', artwork:'', variant:'', email:'', source:'', session:'' }
  },

  /* ── ③ 선택: 전송이 실패했을 때 안내할 연락처 ───────────────────
     공개 사이트에 노출되니, 개인 메일 말고 프로젝트용 주소를 쓰세요.
     비워두면 "잠시 후 다시 시도해 주세요"만 표시됩니다.             */
  CONTACT_EMAIL: ''
};

/* ---------- 세션 / 유입경로 ---------- */
const FD_SS = (() => {
  try {
    let v = sessionStorage.getItem('od.sid');
    if (!v) { v = (crypto.randomUUID?.() || Math.random().toString(36).slice(2) + Date.now().toString(36)).slice(0, 12); sessionStorage.setItem('od.sid', v); }
    return v;
  } catch { return 'nostore'; }
})();

const FD_SRC = (() => {
  const q = new URLSearchParams(location.search);
  const v = q.get('src') || q.get('utm_source');
  try {
    if (v) { sessionStorage.setItem('od.src', v.slice(0, 40)); return v.slice(0, 40); }
    return sessionStorage.getItem('od.src') || (document.referrer ? new URL(document.referrer).hostname : 'direct');
  } catch { return v || 'direct'; }
})();

/* ---------- 이 사람이 무엇을 보고 눌렀는지 (신청서에 같이 실림) ---------- */
function fdJourney(kind, value) {
  const k = 'od.' + kind;
  try {
    const a = JSON.parse(sessionStorage.getItem(k) || '[]');
    if (value && !a.includes(value)) { a.push(value); sessionStorage.setItem(k, JSON.stringify(a.slice(-20))); }
    return a;
  } catch { return []; }
}
const fdViewed = () => fdJourney('viewed');
const fdClicked = () => fdJourney('clicked');

/* ---------- ② 구글폼: 조용한 이벤트 로그 ---------- */
function fdLog(event, extra = {}) {
  const g = FD.GFORM;
  if (!g.FORM_ID || !g.ENTRY.event) return;
  const row = {
    ts: new Date().toISOString(), event,
    artwork: extra.artwork || '', variant: extra.variant || '',
    email: extra.email || '', source: FD_SRC, session: FD_SS
  };
  const body = new FormData();
  for (const [key, id] of Object.entries(g.ENTRY)) if (id) body.append(id, row[key] ?? '');
  fetch(`https://docs.google.com/forms/d/e/${g.FORM_ID}/formResponse`, { method: 'POST', mode: 'no-cors', body })
    .catch(() => {});   // 로그는 유실돼도 무방 — 통계에 지장 없음
}

/* ---------- ① Formspree: 이메일 신청 ---------- */
const FD_QUEUE = 'od.pending';
const fdQRead = () => { try { return JSON.parse(localStorage.getItem(FD_QUEUE) || '[]'); } catch { return []; } };
const fdQWrite = a => { try { localStorage.setItem(FD_QUEUE, JSON.stringify(a.slice(-50))); } catch {} };

/* 반환: 'ok' | 'retry'(일시적, 큐에 보관) | 에러 메시지 문자열(영구 실패) */
async function fdSignup(payload) {
  if (!FD.FORMSPREE_ID) return 'retry';

  const body = new FormData();
  body.append('email', payload.email);
  body.append('_subject', `[OUTSIDOOR] 출시 알림 신청 — ${payload.artworkTitle || '전체'}`);
  body.append('도안', payload.artwork || '(목록 페이지)');
  body.append('종류', payload.variant || '-');
  body.append('유입경로', payload.source);
  body.append('본_도안', (payload.viewed || []).join(', ') || '-');
  body.append('누른_도안', (payload.clicked || []).join(', ') || '-');
  body.append('신청시각', payload.ts);
  body.append('세션', payload.session);

  let res;
  try {
    res = await fetch(`https://formspree.io/f/${FD.FORMSPREE_ID}`, {
      method: 'POST', headers: { Accept: 'application/json' }, body
    });
  } catch {
    return 'retry';                       // 오프라인 등 — 나중에 다시 보냄
  }

  if (res.ok) return 'ok';
  if (res.status === 429 || res.status >= 500) return 'retry';

  let msg = '';
  try {
    const j = await res.json();
    msg = (j.errors || []).map(e => e.message).filter(Boolean).join(' ');
  } catch {}
  return msg || '지금은 신청을 받을 수 없습니다.';
}

/* 지난 방문에서 못 보낸 신청 재전송 */
(async function fdFlush() {
  const q = fdQRead();
  if (!q.length || !FD.FORMSPREE_ID) return;
  fdQWrite([]);
  const left = [];
  for (const row of q) { if ((await fdSignup(row)) === 'retry') left.push(row); }
  if (left.length) fdQWrite(fdQRead().concat(left));
})();

/* 같은 도안 버튼을 여러 번 눌러도 1회만 집계 */
const fdSeen = new Set();
const fdOnce = k => fdSeen.has(k) ? false : (fdSeen.add(k), true);

/* ---------- 모달 ---------- */
let fdCtx = { artwork: '', variant: '', title: '' };
let fdLastFocus = null;

const fdRoot = document.createElement('div');
fdRoot.className = 'fd-modal';
fdRoot.hidden = true;
fdRoot.innerHTML = `
  <div class="fd-sheet" role="dialog" aria-modal="true" aria-labelledby="fd-h" tabindex="-1">
    <button class="fd-x" type="button" aria-label="닫기">×</button>

    <div class="fd-step" data-step="form">
      <p class="fd-eyebrow">! COMING SOON !</p>
      <h2 id="fd-h">아직 문이 열리지 않았어요.</h2>
      <p class="fd-lede">
        <strong class="fd-work"></strong>은(는) 지금 제작 준비 중입니다.<br>
        가장 먼저 만나보고 싶다면 이메일을 남겨주세요.<br>
        출시되는 날, 딱 한 번 메일을 보내드릴게요.
      </p>
      <form class="fd-form" novalidate>
        <label class="fd-label" for="fd-email">이메일</label>
        <input class="fd-input" id="fd-email" type="email" name="email" inputmode="email"
               autocomplete="email" placeholder="you@example.com" required>
        <input class="fd-hp" type="text" name="_gotcha" tabindex="-1" autocomplete="off" aria-hidden="true">
        <p class="fd-err" role="alert" hidden></p>
        <label class="fd-check">
          <input type="checkbox" id="fd-agree" required>
          <span>출시 알림 발송을 위한 이메일 수집에 동의합니다.
            <em>수집 항목 이메일 · 목적 출시 알림 1회 발송 · 보유 기간 발송 후 파기(최대 12개월).
            동의하지 않아도 사이트 이용에는 제한이 없습니다.</em></span>
        </label>
        <button class="fd-submit" type="submit">출시 알림 받기</button>
      </form>
      <p class="fd-note">지금은 판매하지 않습니다. 결제 요청은 없습니다.</p>
    </div>

    <div class="fd-step" data-step="done" hidden>
      <p class="fd-eyebrow">! THANK YOU !</p>
      <h2>문 밖에서 기다릴게요.</h2>
      <p class="fd-lede">
        신청이 접수됐습니다.<br>
        <strong class="fd-work"></strong>이(가) 준비되면 가장 먼저 알려드릴게요.
      </p>
      <p class="fd-lede fd-dim">
        OUTSIDOOR는 고립·은둔 청년 작가의 그림을 타투 스티커로 만들고,
        판매 수익의 <strong>40%</strong>를 작가에게 배분합니다.
      </p>
      <button class="fd-submit fd-ghost" type="button" data-close>닫기</button>
    </div>
  </div>`;
document.body.appendChild(fdRoot);

const fdSheet  = fdRoot.querySelector('.fd-sheet');
const fdForm   = fdRoot.querySelector('.fd-form');
const fdEmail  = fdRoot.querySelector('#fd-email');
const fdAgree  = fdRoot.querySelector('#fd-agree');
const fdHp     = fdRoot.querySelector('.fd-hp');
const fdErr    = fdRoot.querySelector('.fd-err');
const fdBtn    = fdForm.querySelector('.fd-submit');

const fdShow = step => fdRoot.querySelectorAll('.fd-step').forEach(s => { s.hidden = s.dataset.step !== step; });

function fdFail(msg) {
  fdErr.innerHTML = FD.CONTACT_EMAIL
    ? `${msg} 계속 안 되면 <a href="mailto:${FD.CONTACT_EMAIL}">${FD.CONTACT_EMAIL}</a>로 보내주세요.`
    : `${msg} 잠시 후 다시 시도해 주세요.`;
  fdErr.hidden = false;
}

function fdOpen(ctx) {
  fdCtx = ctx;
  fdLastFocus = document.activeElement;
  fdRoot.querySelectorAll('.fd-work').forEach(el => { el.textContent = ctx.title || '이 도안'; });
  fdErr.hidden = true;
  fdForm.reset();
  fdShow('form');
  fdRoot.hidden = false;
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => fdEmail.focus());
  if (ctx.artwork && ctx.artwork !== '__all__') fdJourney('clicked', ctx.artwork);
  if (fdOnce('buy:' + ctx.artwork)) fdLog('click_buy', ctx);
}

function fdClose() {
  fdRoot.hidden = true;
  document.body.style.overflow = '';
  fdLastFocus?.focus?.();
}

fdRoot.addEventListener('click', e => {
  if (e.target === fdRoot || e.target.closest('.fd-x') || e.target.closest('[data-close]')) fdClose();
});
document.addEventListener('keydown', e => {
  if (fdRoot.hidden) return;
  if (e.key === 'Escape') { fdClose(); return; }
  if (e.key !== 'Tab') return;
  const f = [...fdSheet.querySelectorAll('button,input,[href]')]
    .filter(el => !el.disabled && !el.classList.contains('fd-hp') && el.offsetParent !== null);
  if (!f.length) return;
  const first = f[0], lastEl = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastEl.focus(); }
  else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); first.focus(); }
});

fdForm.addEventListener('submit', async e => {
  e.preventDefault();
  if (fdHp.value) return;                       // 스팸 봇
  const v = fdEmail.value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) {
    fdErr.textContent = '이메일 주소를 다시 확인해 주세요.'; fdErr.hidden = false; fdEmail.focus(); return;
  }
  if (!fdAgree.checked) {
    fdErr.textContent = '이메일 수집에 동의해 주세요.'; fdErr.hidden = false; fdAgree.focus(); return;
  }
  fdErr.hidden = true;
  fdBtn.disabled = true; fdBtn.textContent = '보내는 중…';

  const payload = {
    email: v, ts: new Date().toISOString(),
    artwork: fdCtx.artwork === '__all__' ? '' : fdCtx.artwork,
    artworkTitle: fdCtx.title, variant: fdCtx.variant,
    source: FD_SRC, session: FD_SS, viewed: fdViewed(), clicked: fdClicked()
  };

  const result = await fdSignup(payload);
  fdBtn.disabled = false; fdBtn.textContent = '출시 알림 받기';

  if (result === 'retry') {                     // 일시적 — 보관했다가 다시 보냄
    fdQWrite(fdQRead().concat([payload]));
  } else if (result !== 'ok') {                 // 영구 실패 — 솔직하게 알림
    fdFail(result);
    return;
  }

  fdLog('submit_email', { ...fdCtx, email: v });
  fdShow('done');
  fdRoot.querySelector('[data-close]').focus();
});

/* ---------- 사이트와 연결 ---------- */
document.addEventListener('click', e => {
  const b = e.target.closest('[data-fd]');
  if (!b) return;
  e.preventDefault();
  fdOpen({ artwork: b.dataset.fd, variant: b.dataset.fdVariant || '', title: b.dataset.fdTitle || '' });
});

window.fdView = (artwork, variant) => {
  fdJourney('viewed', artwork);
  if (fdOnce('view:' + artwork)) fdLog('view_detail', { artwork, variant });
};
