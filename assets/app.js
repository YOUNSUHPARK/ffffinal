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
    <span class="count">06 WORKS / COMING SOON!</span>
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
          <button class="buy" type="button"
                  data-fd="${w.n} ${esc(w.display)}"
                  data-fd-variant="${w.type === 'color' ? '컬러' : '흑백'}"
                  data-fd-title="${esc(w.display)}">구매하기</button>
        </div>
      </div>
      <p class="divider">${DOTS}</p>
      <nav class="work-nav" aria-label="작품 이동">
        ${next ? `<a href="${link(next)}"><small>다음 작품 →</small><strong>${esc(next.title)}</strong></a>` : '<span></span>'}
      </nav>
      <a class="back" href="#/">← 목록으로</a>
    </div>
  </article>`;
  window.fdView?.(`${w.n} ${w.display}`, w.type === 'color' ? '컬러' : '흑백');
}

let last = null;
function render(){
  const h = location.hash;
  const slug = h.startsWith('#/work/') ? decodeURIComponent(h.slice(7)) : null;
  const route = slug ? 'w:' + slug : 'index';
  if (slug) renderDetail(slug); else renderIndex();
  if (last !== null && last !== route) window.scrollTo(0, 0);
  if (!slug && h && !h.startsWith('#/')) {
    requestAnimationFrame(() => document.getElementById(h.slice(1))?.scrollIntoView({ behavior: 'smooth' }));
  }
  last = route;
}
window.addEventListener('hashchange', render);
fetch('assets/works.json').then(r => r.json()).then(d => { works = d.sort((a,b)=>+a.n - +b.n); render(); })
  .catch(() => { main.innerHTML = '<h1 class="work-title">작품을 불러오지 못했습니다.</h1>'; });
