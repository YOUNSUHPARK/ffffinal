/* ---------- star field (vector, replaces the Figma PNG) ---------- */
(function(){
  const SEED = [[8,6,14,.9],[23,3,10,.7],[31,9,12,.8],[44,2,9,.6],[52,7,15,.9],[63,4,11,.7],
    [71,10,13,.8],[82,3,9,.6],[91,8,14,.85],[16,13,11,.7],[37,15,13,.75],[58,12,10,.6],
    [76,16,12,.8],[95,13,9,.55],[5,29,12,.7],[27,33,10,.6],[48,31,13,.75],[68,35,11,.65],
    [88,30,14,.8],[12,44,11,.6],[34,47,13,.7],[57,45,10,.55],[79,48,12,.7],[97,43,9,.5],
    [3,58,13,.75],[21,61,11,.6],[41,59,14,.8],[62,63,10,.55],[84,60,12,.7],[9,72,11,.6],
    [29,75,13,.7],[51,73,10,.5],[73,77,12,.65],[93,71,14,.75],[18,86,12,.6],[39,89,10,.5],
    [60,87,13,.7],[81,91,11,.55],[99,85,9,.45]];
  const svgNS = 'http://www.w3.org/2000/svg';
  const host = document.getElementById('starfield');
  if (!host) return;
  for (const [x, y, s, o] of SEED) {
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', s); svg.setAttribute('height', s);
    svg.style.left = x + '%'; svg.style.top = y + '%'; svg.style.opacity = o;
    const p = document.createElementNS(svgNS, 'path');
    p.setAttribute('d', 'M12 1.6 14.7 9 22.4 9.3 16.3 14 18.5 21.6 12 17.1 5.5 21.6 7.7 14 1.6 9.3 9.3 9Z');
    p.setAttribute('fill', 'none'); p.setAttribute('stroke', '#FFFFFF');
    p.setAttribute('stroke-width', '1.4'); p.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(p); host.appendChild(svg);
  }
})();


/* ---------- painted star frame (original hand-cut vector art) ---------- */
const STAR_PATHS = [
  'M50 5 62.5 35 93 31.5 70 54.5 87 82 55.5 70.5 29 94 31 60.5 6 43.5 39 38Z',
  'M48 4 63 33 92 36 71 57 84 88 50 72 22 91 27 58 5 39 36 36Z',
  'M52 7 60 37 90 38 68 58 88 84 52 69 24 90 30 57 8 40 40 35Z'
];
const STAR_SPOTS = [
  [12,4,60,-14],[33,-1,52,26],[53,6,46,8],[76,2,58,-22],[93,9,50,17],
  [96,27,44,-9],[91,48,58,22],[97,68,48,-18],[90,87,54,11],
  [73,96,50,-25],[50,99,56,14],[28,94,46,-7],[8,97,52,20],
  [4,73,56,-16],[7,50,44,9],[3,28,50,-23],[23,20,38,31]
];
function paintedStars(seed){
  const svgs = STAR_SPOTS.map(([x,y,size,rot],k)=>{
    const d = STAR_PATHS[(k + seed) % STAR_PATHS.length];
    return `<svg viewBox="0 0 100 100" aria-hidden="true"
      style="width:${(size/4.6).toFixed(1)}%;left:${x}%;top:${y}%;transform:translate(-50%,-50%) rotate(${rot}deg)"><path d="${d}"/></svg>`;
  }).join('');
  return `<span class="paint" aria-hidden="true">${svgs}</span>`;
}

/* ---------- app ---------- */
const main = document.querySelector('main');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const link = w => '#/work/' + encodeURIComponent(w.slug);
const DOTS = '.'.repeat(70);
let works = [];

function renderIndex(){
  document.title = 'All TATTOOS. — OUTSIDOOR';
  main.innerHTML = `
  <section class="intro">
    <p class="eyebrow">ARTWORKS</p>
    <h1 class="title">All TATTOOS.</h1>
    <p class="copy">문 안에서 시작된 그림이<br>문 밖의 당신에게 닿을 때.<br>청년 작가의 시선을 일상에서 만나보세요.</p>
    <span class="count">06 WORKS / NOW OPEN!</span>
  </section>
  <section class="grid" aria-label="작품 목록">
    ${works.map((w, i) => `
      <a class="card" href="${link(w)}" style="--rot:${w.rot}deg;--off:${w.off}px" aria-label="${esc(w.title)} 상세 보기">
        <span class="frame">
          ${paintedStars(i)}
          <img src="${w.img}" alt="${esc(w.title)} 작품 이미지" width="900" height="900" loading="lazy">
          ${w.ex ? '<span class="ex">예시입니다.</span>' : ''}
        </span>
        <span class="cap">${w.n} / ${esc(w.title)}</span>
      </a>`).join('')}
  </section>
  <div class="grid-end">
    <span class="note">작가님의 새로운 그림을 기다리고 있습니다.</span>
  </div>
  <p class="divider">${DOTS}</p>
  <section id="artists" class="artists">
    <p class="eyebrow">! OUR ARTISTS !</p>
    <h2>곧 만날, 새로운 시선들.</h2>
    <p class="note-kr">참여 작가와 작품은 공개 준비 중입니다.</p>
  </section>`;
}

function renderDetail(slug){
  const i = works.findIndex(w => w.slug === slug);
  if (i < 0) { main.innerHTML = '<h1 class="work-title">작품을 찾을 수 없습니다.</h1><a class="back" href="#/">← 목록으로</a>'; return; }
  const w = works[i], next = works[i + 1];
  const wear = w.wear || [];
  const unit = typeof OD !== 'undefined' ? OD.UNIT_PRICE : (parseInt(String(w.price).replace(/\D/g, ''), 10) || 0);
  document.title = `${w.display} — OUTSIDOOR`;
  main.innerHTML = `
  <article class="detail">
    <figure class="hero"><span class="hero-wrap"><img src="${w.img}" alt="${esc(w.display)} 작품 이미지" width="900" height="900" fetchpriority="high">${w.ex ? '<span class="ex">예시입니다.</span>' : ''}</span></figure>
    <div class="detail-body">
      <p class="eyebrow">ARTWORK / ${w.n}</p>
      <h1 class="work-title">${esc(w.display)}</h1>
      <p class="meta">${esc(w.artist)}</p>
      <p class="desc">${esc(w.desc_a)}${w.desc_hi ? `<mark>${esc(w.desc_hi)}</mark>${esc(w.desc_b)}` : ''}</p>
      <p class="divider">${DOTS}</p>
      <div class="product">
        <p class="spec">${w.spec.map(esc).join('<br>')}</p>
        <div class="buy-col">
          <p class="size">${esc(w.size)}</p>
          <p class="price">${esc(w.price)}</p>
          <div class="qty-row">
            <span class="qty-label" id="qty-label">수량</span>
            <div class="qty" data-qty="1" role="group" aria-labelledby="qty-label">
              <button type="button" data-qty-step="-1" aria-label="수량 줄이기" disabled>−</button>
              <span class="qty-n" aria-live="polite">1</span>
              <button type="button" data-qty-step="1" aria-label="수량 늘리기">+</button>
            </div>
          </div>
          <p class="total"><span>합계</span><strong class="total-n">${unit.toLocaleString('ko-KR')}원</strong></p>
          <button class="buy" type="button"
                  data-buy="${w.n} ${esc(w.display)}"
                  data-variant="${w.type === 'color' ? '컬러' : '흑백'}"
                  data-title="${esc(w.display)}">구매하기</button>
        </div>
      </div>
      <p class="divider">${DOTS}</p>
      ${wear.length ? `
      <section class="wear" aria-labelledby="wear-h">
        <p class="eyebrow">ON SKIN</p>
        <h2 class="wear-h" id="wear-h">착용컷</h2>
        <div class="wear-list">
          ${wear.map(p => `<figure><img src="${esc(p.src)}" alt="${esc(w.display)} 타투 스티커를 ${esc(p.alt)}" loading="lazy"></figure>`).join('')}
        </div>
        ${w.wear_note ? `<p class="wear-note">${esc(w.wear_note)}</p>` : ''}
      </section>
      <p class="divider">${DOTS}</p>` : ''}
      <nav class="work-nav" aria-label="작품 이동">
        ${next ? `<a href="${link(next)}"><small>다음 작품 →</small><strong>${esc(next.title)}</strong></a>` : '<span></span>'}
      </nav>
      <a class="back" href="#/">← 목록으로</a>
    </div>
  </article>`;
}

/* ---------- about ---------- */
const ABOUT_DOOR = `<svg viewBox="0 0 200 300" role="img" aria-label="살짝 열린 방문과 그 앞에 놓인 그림 한 장">
  <g fill="none" stroke="#3D2B1E" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M52 232V58h96v174"/>
    <path d="M148 58 104 74v172l44-14"/>
    <circle cx="113" cy="160" r="3.4" fill="#3D2B1E"/>
    <path d="M34 232h132"/>
    <path d="M62 250l44-8 10 28-46 9z"/>
    <path d="M80 262c3-6 9-6 10 0 5-4 10 0 6 5"/>
    <path d="M64 96l-8-4M62 118h-10M64 140l-8 4" opacity=".55"/>
  </g>
  <path d="M30 60l3.4 8.6 9.2.5-7.2 5.7 2.5 8.9-7.9-5.1-7.9 5.1 2.5-8.9-7.2-5.7 9.2-.5z" fill="#3D2B1E"/>
</svg>`;
const ABOUT_LOOP = `<svg viewBox="0 0 200 300" role="img" aria-label="수익이 그림을 그린 청년에게 돌아가는 순환">
  <g fill="none" stroke="#3D2B1E" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M148 112a56 56 0 0 0-98 14"/>
    <path d="M50 126l-9-17M50 126l18-6"/>
    <path d="M52 190a56 56 0 0 0 98-14"/>
    <path d="M150 176l9 17M150 176l-18 6"/>
    <circle cx="100" cy="74" r="20"/>
    <path d="M90 67l5 14 5-11 5 11 5-14M89 73h22"/>
    <path d="M84 258v-44h32v44"/>
    <path d="M116 214l-13 6v40l13-4"/>
    <path d="M72 258h56"/>
  </g>
  <path d="M100 133l5 12.6 13.5.7-10.6 8.4 3.7 13-11.6-7.5-11.6 7.5 3.7-13-10.6-8.4 13.5-.7z" fill="#3D2B1E"/>
</svg>`;

function renderAbout(){
  document.title = 'About us — OUTSIDOOR';
  const pick = n => works.find(w => w.n === n) || works[0] || {};
  const art = pick('03'), skin = (pick('01').wear || [])[0];
  const steps = [
    { n: '01', t: '문 안에서 그린 그림', d: '고립·은둔 청년이 자기 방에서 그린 그림에서 시작합니다.', art: ABOUT_DOOR, rot: -2.2 },
    { n: '02', t: '타투 스티커가 되고', d: '그 그림을 그대로 살려, 어디에도 없는 타투 스티커로 만듭니다.',
      art: art.img ? `<img src="${art.img}" alt="${esc(art.display)} 타투 스티커 도안" loading="lazy">` : '', rot: 1.6 },
    { n: '03', t: '당신의 피부 위에', d: '청년 한 사람 한 사람의 이야기가 담긴 그림을 몸에 새깁니다.',
      art: skin ? `<img src="${esc(skin.src)}" alt="타투 스티커를 어깨에 붙인 모습" loading="lazy">` : '', rot: -1.4 },
    { n: '04', t: '다시 청년에게', d: '수익의 일부는 그림을 그린 청년에게 고스란히 돌아갑니다.', art: ABOUT_LOOP, rot: 2 }
  ];
  main.innerHTML = `
  <article class="about">
    <section class="intro">
      <p class="eyebrow">ABOUT US</p>
      <h1 class="title">Outside the DOOR.</h1>
      <p class="copy about-copy">OUTSIDOOR는 고립·은둔 청년의 그림으로<br>독창적인 타투 스티커를 만드는 브랜드입니다.</p>
    </section>

    <ol class="flow" aria-label="OUTSIDOOR가 일하는 방식">
      ${steps.map((s, i) => `
      <li class="flow-step" style="--rot:${s.rot}deg">
        <span class="frame">${paintedStars(i)}<span class="flow-art">${s.art}</span></span>
        <span class="flow-n">${s.n}</span>
        <strong class="flow-t">${s.t}</strong>
        <span class="flow-d">${s.d}</span>
      </li>`).join('')}
    </ol>

    <p class="divider">${DOTS}</p>

    <section class="facts" aria-label="OUTSIDOOR를 숫자로 보면">
      <div><strong>${String(works.length).padStart(2, '0')}</strong><span>청년 작가의 그림이<br>도안이 되었습니다.</span></div>
      <div><strong>1 : 1</strong><span>그림 하나에<br>이야기 하나가 담깁니다.</span></div>
      <div><strong>SHARE.</strong><span>수익의 일부는<br>그림을 그린 청년에게 갑니다.</span></div>
    </section>

    <p class="divider">${DOTS}</p>

    <section class="artists">
      <p class="eyebrow">! OUR PROMISE !</p>
      <h2>문 안의 그림, 문 밖의 만남.</h2>
      <p class="note-kr about-lede">각각의 그림에는 그것을 그린 청년의 이야기가 담겨 있습니다.<br>
        당신이 그 그림을 몸에 새기는 순간, 방 안에서 시작된 이야기는 문 밖으로 한 걸음 나옵니다.<br>
        그리고 그 걸음은 수익이 되어, 그림을 그린 청년에게 고스란히 돌아갑니다.</p>
      <a class="about-cta" href="#/">타투 보러가기&nbsp;&nbsp;→</a>
    </section>
  </article>`;
}

let last = null;
function render(){
  const h = location.hash;
  const slug = h.startsWith('#/work/') ? decodeURIComponent(h.slice(7)) : null;
  const about = h === '#/about';
  const route = slug ? 'w:' + slug : about ? 'about' : 'index';
  if (slug) renderDetail(slug); else if (about) renderAbout(); else renderIndex();
  if (last !== null && last !== route) window.scrollTo(0, 0);
  if (!slug && !about && h && !h.startsWith('#/')) {
    requestAnimationFrame(() => document.getElementById(h.slice(1))?.scrollIntoView({ behavior: 'smooth' }));
  }
  last = route;
}
window.addEventListener('hashchange', render);
fetch('assets/works.json?v=2').then(r => r.json()).then(d => { works = d.sort((a,b)=>+a.n - +b.n); render(); })
  .catch(() => { main.innerHTML = '<h1 class="work-title">작품을 불러오지 못했습니다.</h1>'; });
