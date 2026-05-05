// MyFlix — reads from MYFLIX_DATA defined in data.js

function proxyImg(url) {
  if (!url || url.includes('wsrv.nl')) return url;
  return 'https://wsrv.nl/?url=' + encodeURIComponent(url.replace(/^https?:\/\//, '')) + '&w=400&output=jpg';
}
function proxyImgLarge(url) {
  if (!url || url.includes('wsrv.nl')) return url;
  return 'https://wsrv.nl/?url=' + encodeURIComponent(url.replace(/^https?:\/\//, '')) + '&w=1280&output=jpg';
}

const movies = (typeof MYFLIX_DATA !== 'undefined') ? MYFLIX_DATA : {trending:[],action:[],comedy:[]};
let bannerMovie = movies.trending[0] || movies.action[0] || movies.comedy[0];
let closeBtn;

document.addEventListener('DOMContentLoaded', () => {
  setupHeader(); setupBanner();
  renderRow('trending', movies.trending);
  renderRow('action',   movies.action);
  renderRow('comedy',   movies.comedy);
  setupCloseButton(); addFooter();
});

function setupHeader() {
  const h = document.querySelector('.header');
  window.addEventListener('scroll', () => h.classList.toggle('scrolled', window.scrollY > 60), {passive:true});
}

function setupBanner() {
  const all = [...movies.trending, ...movies.action, ...movies.comedy];
  if (all.length) bannerMovie = all[Math.floor(Math.random() * all.length)];
  updateBanner(bannerMovie);
}

function updateBanner(movie) {
  if (!movie) return;
  bannerMovie = movie;
  document.getElementById('banner').style.backgroundImage = 'url(' + proxyImgLarge(movie.img) + ')';
  document.getElementById('title').textContent = movie.title;
  document.getElementById('desc').textContent  = movie.desc;
  const c = document.querySelector('.banner-content');
  c.style.animation = 'none';
  requestAnimationFrame(() => { c.style.animation = ''; });
}

function playBanner() { openPlayer(bannerMovie.trailer); }
window.playBanner = playBanner;

function renderRow(id, list) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = '';
  if (!list || !list.length) { el.innerHTML = '<p style="color:#555;font-size:.85rem;padding:8px 0">No movies.</p>'; return; }
  list.forEach((m, i) => el.appendChild(createCard(m, i)));
}

function createCard(movie, index) {
  const card = document.createElement('div');
  card.className = 'card';
  card.style.animationDelay = (index * 60) + 'ms';
  card.innerHTML = '<img src="' + proxyImg(movie.img) + '" alt="' + movie.title + '" loading="lazy" onerror="this.src=\'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22300%22><rect width=%22200%22 height=%22300%22 fill=%22%231a1a1a%22/><text x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-size=%2214%22 fill=%22%23444%22>No+Image</text></svg>\'">' +
    '<div class="card-info"><h3>' + movie.title + '</h3><span>' + movie.year + ' &middot; ' + movie.genre + '</span><div class="card-play">&#9654;</div></div>';
  card.addEventListener('click',      () => { updateBanner(movie); openPlayer(movie.trailer); });
  card.addEventListener('mouseenter', () => updateBanner(movie));
  return card;
}

function setupCloseButton() {
  closeBtn = document.createElement('button');
  closeBtn.id = 'close-player'; closeBtn.innerHTML = '&#10005;'; closeBtn.title = 'Close';
  closeBtn.addEventListener('click', closePlayer);
  document.body.appendChild(closeBtn);
}
function openPlayer(tid) {
  const p = document.getElementById('player');
  p.src = 'https://www.youtube.com/embed/' + tid + '?autoplay=1&rel=0&modestbranding=1';
  p.classList.add('active'); closeBtn.classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closePlayer() {
  const p = document.getElementById('player');
  p.src = ''; p.classList.remove('active'); closeBtn.classList.remove('active');
  document.body.style.overflow = '';
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closePlayer(); });

function addFooter() {
  const f = document.createElement('footer');
  f.innerHTML = 'MYFLIX &nbsp;&middot;&nbsp; FOR DEMO PURPOSES ONLY';
  document.body.appendChild(f);
}
