/* ===================================================================
   OUTSIDOOR — 주문 (무통장 입금)
   -------------------------------------------------------------------
   구매하기 → 수량 확인 → 이름·전화번호 입력 → 입금 안내

   주문 내역은 Formspree로 전송되어 내 메일함에 도착합니다.
   (무료 요금제: 월 50건, 보관 30일 → 메일 알림을 꼭 보관하세요)

   설정은 아래 OD 블록 하나뿐입니다.
   =================================================================== */
const OD = {
  /* 주문 내역을 받을 Formspree 폼 ID (https://formspree.io/f/xxxxxxxx 의 뒷부분) */
  FORMSPREE_ID: 'mvkgrbng',

  /* 입금 계좌 */
  BANK: '토스뱅크',
  ACCOUNT: '100050972382',
  ACCOUNT_DISPLAY: '1000-5097-2382',
  HOLDER: '김나승',

  /* 1개 가격(원), 한 번에 주문할 수 있는 최대 수량 */
  UNIT_PRICE: 12000,
  MAX_QTY: 20,

  /* 전송이 실패했을 때 안내할 연락처 (비워두면 "잠시 후 다시 시도" 안내만 표시) */
  CONTACT_EMAIL: ''
};

const odWon = n => n.toLocaleString('ko-KR') + '원';
const odClamp = q => Math.min(OD.MAX_QTY, Math.max(1, parseInt(q, 10) || 1));

/* ---------- 세션 / 유입경로 ---------- */
const OD_SS = (() => {
  try {
    let v = sessionStorage.getItem('od.sid');
    if (!v) { v = (crypto.randomUUID?.() || Math.random().toString(36).slice(2) + Date.now().toString(36)).slice(0, 12); sessionStorage.setItem('od.sid', v); }
    return v;
  } catch { return 'nostore'; }
})();

const OD_SRC = (() => {
  const q = new URLSearchParams(location.search);
  const v = q.get('src') || q.get('utm_source');
  try {
    if (v) { sessionStorage.setItem('od.src', v.slice(0, 40)); return v.slice(0, 40); }
    return sessionStorage.getItem('od.src') || (document.referrer ? new URL(document.referrer).hostname : 'direct');
  } catch { return v || 'direct'; }
})();

/* ---------- 주문 전송 ---------- */
const OD_QUEUE = 'od.orders';
const odQRead = () => { try { return JSON.parse(localStorage.getItem(OD_QUEUE) || '[]'); } catch { return []; } };
const odQWrite = a => { try { localStorage.setItem(OD_QUEUE, JSON.stringify(a.slice(-50))); } catch {} };

/* 반환: 'ok' | 'retry'(일시적, 큐에 보관) | 에러 메시지 문자열(영구 실패) */
async function odSend(o) {
  if (!OD.FORMSPREE_ID) return 'retry';

  const body = new FormData();
  body.append('_subject', `[OUTSIDOOR] 주문 — ${o.title} × ${o.qty} (${odWon(o.total)})`);
  body.append('이름', o.name);
  body.append('전화번호', o.phone);
  body.append('도안', o.artwork);
  body.append('종류', o.variant || '-');
  body.append('수량', String(o.qty));
  body.append('입금액', odWon(o.total));
  body.append('유입경로', o.source);
  body.append('주문시각', o.ts);
  body.append('세션', o.session);

  let res;
  try {
    res = await fetch(`https://formspree.io/f/${OD.FORMSPREE_ID}`, {
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
  return msg || '지금은 주문을 받을 수 없습니다.';
}

/* 지난 방문에서 못 보낸 주문 재전송 */
(async function odFlush() {
  const q = odQRead();
  if (!q.length || !OD.FORMSPREE_ID) return;
  odQWrite([]);
  const left = [];
  for (const row of q) { if ((await odSend(row)) === 'retry') left.push(row); }
  if (left.length) odQWrite(odQRead().concat(left));
})();

/* ---------- 모달 ---------- */
let odCtx = { artwork: '', variant: '', title: '', qty: 1 };
let odLastFocus = null;

const odRoot = document.createElement('div');
odRoot.className = 'fd-modal';
odRoot.hidden = true;
odRoot.innerHTML = `
  <div class="fd-sheet" role="dialog" aria-modal="true" aria-labelledby="od-h" tabindex="-1">
    <button class="fd-x" type="button" aria-label="닫기">×</button>

    <div class="fd-step" data-step="form">
      <p class="fd-eyebrow">! ORDER !</p>
      <h2 id="od-h">주문서를 작성해 주세요.</h2>
      <dl class="od-sum">
        <div><dt>도안</dt><dd class="od-title"></dd></div>
        <div><dt>수량</dt><dd class="od-qty"></dd></div>
        <div class="od-total"><dt>입금하실 금액</dt><dd class="od-amount"></dd></div>
      </dl>
      <form class="fd-form" novalidate>
        <label class="fd-label" for="od-name">이름 (입금자명)</label>
        <input class="fd-input" id="od-name" type="text" name="name" autocomplete="name" placeholder="홍길동" required>
        <label class="fd-label od-gap" for="od-phone">전화번호</label>
        <input class="fd-input" id="od-phone" type="tel" name="phone" inputmode="tel" autocomplete="tel" placeholder="010-0000-0000" required>
        <input class="fd-hp" type="text" name="_gotcha" tabindex="-1" autocomplete="off" aria-hidden="true">
        <p class="fd-err" role="alert" hidden></p>
        <label class="fd-check">
          <input type="checkbox" id="od-agree" required>
          <span>주문 처리를 위한 개인정보 수집에 동의합니다.
            <em>수집 항목 이름·전화번호 · 목적 주문 확인 및 입금 대조, 배송 안내 연락 · 보유 기간 주문 처리 완료 후 파기(최대 6개월).
            동의하지 않으면 주문하실 수 없습니다.</em></span>
        </label>
        <button class="fd-submit" type="submit">주문하기</button>
      </form>
      <p class="fd-note">주문 후 계좌 입금 안내가 표시됩니다.</p>
    </div>

    <div class="fd-step" data-step="done" hidden>
      <p class="fd-eyebrow">! THANK YOU !</p>
      <h2>입금하시면 주문이 완료됩니다.</h2>
      <p class="fd-lede">
        <strong class="od-who"></strong> 님, 주문이 접수됐습니다.<br>
        아래 계좌로 <strong class="od-amount"></strong>을 입금해 주세요.
      </p>
      <dl class="od-sum od-bank">
        <div><dt>도안</dt><dd><span class="od-title"></span> × <span class="od-qty"></span></dd></div>
        <div><dt>은행</dt><dd>${OD.BANK}</dd></div>
        <div><dt>계좌번호</dt><dd class="od-acct">${OD.ACCOUNT_DISPLAY}</dd></div>
        <div><dt>예금주</dt><dd>${OD.HOLDER}</dd></div>
        <div class="od-total"><dt>입금 금액</dt><dd class="od-amount"></dd></div>
      </dl>
      <button class="fd-submit" type="button" data-copy>계좌번호 복사</button>
      <p class="fd-lede fd-dim">
        입금자명은 주문하신 이름과 같게 보내주세요.<br>
        입금이 확인되면 남겨주신 번호로 연락드립니다.
      </p>
      <button class="fd-submit fd-ghost" type="button" data-close>닫기</button>
    </div>
  </div>`;
document.body.appendChild(odRoot);

const odSheet = odRoot.querySelector('.fd-sheet');
const odForm  = odRoot.querySelector('.fd-form');
const odName  = odRoot.querySelector('#od-name');
const odPhone = odRoot.querySelector('#od-phone');
const odAgree = odRoot.querySelector('#od-agree');
const odHp    = odRoot.querySelector('.fd-hp');
const odErr   = odRoot.querySelector('.fd-err');
const odBtn   = odForm.querySelector('.fd-submit');
const odCopy  = odRoot.querySelector('[data-copy]');

const odShow = step => odRoot.querySelectorAll('.fd-step').forEach(s => { s.hidden = s.dataset.step !== step; });
const odFill = (sel, text) => odRoot.querySelectorAll(sel).forEach(el => { el.textContent = text; });

function odWarn(msg, el) { odErr.textContent = msg; odErr.hidden = false; el?.focus(); }

function odFail(msg) {
  odErr.innerHTML = OD.CONTACT_EMAIL
    ? `${msg} 계속 안 되면 <a href="mailto:${OD.CONTACT_EMAIL}">${OD.CONTACT_EMAIL}</a>로 보내주세요.`
    : `${msg} 잠시 후 다시 시도해 주세요.`;
  odErr.hidden = false;
}

function odOpen(ctx) {
  odCtx = { ...ctx, qty: odClamp(ctx.qty) };
  odLastFocus = document.activeElement;
  odFill('.od-title', odCtx.title || '이 도안');
  odFill('.od-qty', odCtx.qty + '개');
  odFill('.od-amount', odWon(odCtx.qty * OD.UNIT_PRICE));
  odErr.hidden = true;
  odForm.reset();
  odCopy.textContent = '계좌번호 복사';
  odShow('form');
  odRoot.hidden = false;
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => odName.focus());
}

function odClose() {
  odRoot.hidden = true;
  document.body.style.overflow = '';
  odLastFocus?.focus?.();
}

odRoot.addEventListener('click', async e => {
  if (e.target.closest('[data-copy]')) {
    try {
      await navigator.clipboard.writeText(OD.ACCOUNT);
      odCopy.textContent = '복사했습니다';
    } catch {
      odCopy.textContent = `${OD.BANK} ${OD.ACCOUNT_DISPLAY}`;
    }
    return;
  }
  if (e.target === odRoot || e.target.closest('.fd-x') || e.target.closest('[data-close]')) odClose();
});

document.addEventListener('keydown', e => {
  if (odRoot.hidden) return;
  if (e.key === 'Escape') { odClose(); return; }
  if (e.key !== 'Tab') return;
  const f = [...odSheet.querySelectorAll('button,input,[href]')]
    .filter(el => !el.disabled && !el.classList.contains('fd-hp') && el.offsetParent !== null);
  if (!f.length) return;
  const first = f[0], lastEl = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastEl.focus(); }
  else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); first.focus(); }
});

/* 전화번호: 숫자만 받아 010-0000-0000 꼴로 */
odPhone.addEventListener('input', () => {
  const d = odPhone.value.replace(/\D/g, '').slice(0, 11);
  odPhone.value = d.length < 4 ? d
    : d.length < 8 ? `${d.slice(0, 3)}-${d.slice(3)}`
    : d.length < 11 ? `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`
    : `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
});

odForm.addEventListener('submit', async e => {
  e.preventDefault();
  if (odHp.value) return;                       // 스팸 봇
  const name = odName.value.trim();
  const digits = odPhone.value.replace(/\D/g, '');
  if (name.length < 2) return odWarn('이름을 입력해 주세요.', odName);
  if (!/^0\d{8,10}$/.test(digits)) return odWarn('전화번호를 다시 확인해 주세요.', odPhone);
  if (!odAgree.checked) return odWarn('개인정보 수집에 동의해 주세요.', odAgree);
  odErr.hidden = true;
  odBtn.disabled = true; odBtn.textContent = '보내는 중…';

  const order = {
    name, phone: odPhone.value.trim(), ts: new Date().toISOString(),
    artwork: odCtx.artwork, title: odCtx.title, variant: odCtx.variant,
    qty: odCtx.qty, total: odCtx.qty * OD.UNIT_PRICE,
    source: OD_SRC, session: OD_SS
  };

  const result = await odSend(order);
  odBtn.disabled = false; odBtn.textContent = '주문하기';

  if (result === 'retry') {                     // 일시적 — 보관했다가 다시 보냄
    odQWrite(odQRead().concat([order]));
  } else if (result !== 'ok') {                 // 영구 실패 — 솔직하게 알림
    odFail(result);
    return;
  }

  odFill('.od-who', name);
  odShow('done');
  odCopy.focus();
});

/* ---------- 사이트와 연결 ---------- */
/* 수량 − / + */
document.addEventListener('click', e => {
  const step = e.target.closest('[data-qty-step]');
  if (!step) return;
  const box = step.closest('.qty');
  const q = odClamp(+box.dataset.qty + +step.dataset.qtyStep);
  box.dataset.qty = q;
  box.querySelector('.qty-n').textContent = q;
  box.querySelector('[data-qty-step="-1"]').disabled = q <= 1;
  box.querySelector('[data-qty-step="1"]').disabled = q >= OD.MAX_QTY;
  const total = document.querySelector('.total-n');
  if (total) total.textContent = odWon(q * OD.UNIT_PRICE);
});

/* 구매하기 */
document.addEventListener('click', e => {
  const b = e.target.closest('[data-buy]');
  if (!b) return;
  e.preventDefault();
  odOpen({
    artwork: b.dataset.buy, variant: b.dataset.variant || '', title: b.dataset.title || '',
    qty: document.querySelector('.qty')?.dataset.qty || 1
  });
});
