// ── AUTH / PASSWORD GATE ──────────────────────────────────────────────────────
const AUTH_KEY   = 'myflix_auth_token';
const HASH_KEY   = 'myflix_pw_hash';
const SESSION_MS = 8 * 60 * 60 * 1000;
const DEFAULT_HASH = 'dcb820a04659def4de2d0e4b5bfab1a2b722798d48f46ac9ce0fcb4780b4ddae';

async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}
function getStoredHash() { return localStorage.getItem(HASH_KEY) || DEFAULT_HASH; }
function isSessionValid() {
  try { const t = JSON.parse(localStorage.getItem(AUTH_KEY)||'{}'); return t.expires && Date.now() < t.expires; }
  catch { return false; }
}
function grantSession() { localStorage.setItem(AUTH_KEY, JSON.stringify({ expires: Date.now() + SESSION_MS })); }
function logout() { localStorage.removeItem(AUTH_KEY); location.reload(); }
window.adminLogout = logout;
window.setAdminPassword = async function(p) {
  if (!p || p.length < 4) { console.warn('Min 4 chars'); return; }
  localStorage.setItem(HASH_KEY, await sha256(p));
  console.log('%c Password updated!', 'color:lime');
};

const gate      = document.getElementById('gate');
const gateInput = document.getElementById('gateInput');
const gateBtn   = document.getElementById('gateBtn');
const gateError = document.getElementById('gateError');

async function tryUnlock() {
  const pw = gateInput.value.trim();
  if (!pw) { shakeGate(); return; }
  if (await sha256(pw) === getStoredHash()) {
    grantSession(); gate.classList.add('hidden'); gateError.textContent = '';
  } else {
    gateError.textContent = 'Incorrect password. Try again.';
    gateInput.value = ''; gateInput.focus(); shakeGate();
  }
}
function shakeGate() {
  const box = document.querySelector('.gate-box');
  box.style.animation = 'none';
  requestAnimationFrame(() => { box.style.animation = 'shake 0.4s ease'; });
}
gateBtn.addEventListener('click', tryUnlock);
gateInput.addEventListener('keydown', e => { if (e.key === 'Enter') tryUnlock(); });
const shakeStyle = document.createElement('style');
shakeStyle.textContent = '@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-10px)}40%{transform:translateX(10px)}60%{transform:translateX(-7px)}80%{transform:translateX(7px)}}';
document.head.appendChild(shakeStyle);

if (isSessionValid()) {
  gate.classList.add('hidden');
} else {
  document.querySelector('.sidebar').style.visibility = 'hidden';
  document.querySelector('.main').style.visibility = 'hidden';
  gate.addEventListener('transitionend', () => {
    document.querySelector('.sidebar').style.visibility = '';
    document.querySelector('.main').style.visibility = '';
  }, { once: true });
}

document.addEventListener('DOMContentLoaded', () => {
  const footer = document.querySelector('.sidebar-footer');
  const btn = document.createElement('button');
  btn.className = 'view-site-btn';
  btn.style.cssText = 'border-color:#3a1a1a;color:#ff4d57;margin-top:8px;width:100%;background:rgba(229,9,20,0.06);cursor:pointer;font-family:inherit;';
  btn.textContent = 'Lock Admin';
  btn.onclick = logout;
  footer.appendChild(btn);

  // Download button in topbar
  const topbar = document.querySelector('.topbar');
  const dlBtn = document.createElement('button');
  dlBtn.className = 'add-btn';
  dlBtn.style.cssText = 'background:#1a1a1a;border:1px solid #333;color:#aaa;margin-right:8px;';
  dlBtn.textContent = 'Download data.js';
  dlBtn.title = 'Download updated data.js and upload to GitHub';
  dlBtn.onclick = exportDataJS;
  topbar.insertBefore(dlBtn, document.getElementById('topAddBtn'));
});

// ── IMAGE PROXY ───────────────────────────────────────────────────────────────
function proxyImg(url) {
  if (!url) return url;
  if (url.includes('wsrv.nl')) return url;
  const clean = url.replace(/^https?:\/\//, '');
  return 'https://wsrv.nl/?url=' + encodeURIComponent(clean) + '&w=400&output=jpg';
}

// ── DATA — loaded from data.js global, kept in memory only ───────────────────
let db = (typeof MYFLIX_DATA !== 'undefined') ? JSON.parse(JSON.stringify(MYFLIX_DATA)) : {trending:[],action:[],comedy:[]};
let nextId = computeNextId();
let editingId  = null;
let deletingId = null;
let hasUnsaved = false;

function computeNextId() {
  const all = [...db.trending, ...db.action, ...db.comedy];
  return all.length ? Math.max(...all.map(m => Number(m.id))) + 1 : 1;
}
function allMovies() {
  return [
    ...db.trending.map(m => ({...m, row:'trending'})),
    ...db.action.map(m =>   ({...m, row:'action'})),
    ...db.comedy.map(m =>   ({...m, row:'comedy'})),
  ];
}
function findMovie(id) {
  const nid = Number(id);
  for (const row of ['trending','action','comedy']) {
    const m = db[row].find(m => Number(m.id) === nid);
    if (m) return {...m, row};
  }
  return null;
}
function deleteFromDB(id) {
  const nid = Number(id);
  for (const row of ['trending','action','comedy']) {
    db[row] = db[row].filter(m => Number(m.id) !== nid);
  }
}

// ── EXPORT data.js ────────────────────────────────────────────────────────────
function exportDataJS() {
  const now = new Date().toISOString().slice(0,19).replace('T',' ');
  const content = '// MyFlix Movie Database - Generated ' + now + '\n// Upload this file to GitHub to publish changes\n\nconst MYFLIX_DATA = ' + JSON.stringify(db, null, 2) + ';\n';
  const blob = new Blob([content], {type:'text/javascript'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'data.js';
  a.click();
  URL.revokeObjectURL(a.href);
  hasUnsaved = false;
  updateBanner(false);
  showToast('data.js downloaded! Upload it to your GitHub repo.', 'success');
}
window.exportDataJS = exportDataJS;

// ── UNSAVED CHANGES BANNER ────────────────────────────────────────────────────
function updateBanner(show) {
  let b = document.getElementById('dlBanner');
  if (!b) {
    b = document.createElement('div');
    b.id = 'dlBanner';
    b.style.cssText = 'position:fixed;bottom:0;left:220px;right:0;z-index:400;background:#1a0a00;border-top:2px solid #e50914;padding:14px 28px;display:flex;align-items:center;gap:16px;font-size:0.85rem;color:#f0f0f0;transition:transform 0.3s ease;transform:translateY(100%)';
    b.innerHTML = '<span style="flex:1"><strong>Unsaved changes.</strong> Download data.js and upload to GitHub to publish.</span>' +
      '<button onclick="exportDataJS()" style="background:#e50914;color:#fff;border:none;padding:9px 20px;border-radius:4px;font-weight:600;cursor:pointer;">Download data.js</button>' +
      '<button onclick="document.getElementById(\'dlBanner\').style.transform=\'translateY(100%)\'" style="background:transparent;border:1px solid #444;color:#aaa;padding:9px 14px;border-radius:4px;cursor:pointer;margin-left:8px;">Dismiss</button>';
    document.body.appendChild(b);
  }
  requestAnimationFrame(() => { b.style.transform = show ? 'translateY(0)' : 'translateY(100%)'; });
}

// ── RENDER ────────────────────────────────────────────────────────────────────
function renderAll() {
  updateStats();
  renderTable('recentBody',   allMovies().slice(-6).reverse(), true);
  renderTable('allBody',      allMovies(), true);
  renderTable('bodyTrending', db.trending.map(m => ({...m, row:'trending'})));
  renderTable('bodyAction',   db.action.map(m =>   ({...m, row:'action'})));
  renderTable('bodyComedy',   db.comedy.map(m =>   ({...m, row:'comedy'})));
}
function updateStats() {
  document.getElementById('statTotal').textContent    = allMovies().length;
  document.getElementById('statTrending').textContent = db.trending.length;
  document.getElementById('statAction').textContent   = db.action.length;
  document.getElementById('statComedy').textContent   = db.comedy.length;
}
function renderTable(tbodyId, movies, showRow) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  if (!movies.length) { tbody.innerHTML = '<tr class="empty-row"><td colspan="7">No movies found.</td></tr>'; return; }
  tbody.innerHTML = movies.map(m => '<tr>' +
    '<td><img class="poster-thumb" src="' + proxyImg(m.img) + '" alt="' + m.title + '" onerror="this.src=\'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2258%22><rect width=%2240%22 height=%2258%22 fill=%22%231a1a1a%22/></svg>\'"></td>' +
    '<td class="movie-title-cell">' + m.title + '<small>' + (m.desc ? m.desc.substring(0,60)+'...' : '') + '</small></td>' +
    '<td>' + m.year + '</td><td>' + m.genre + '</td>' +
    (showRow ? '<td><span class="row-badge ' + m.row + '">' + m.row + '</span></td>' : '') +
    '<td><a class="yt-link" href="https://youtube.com/watch?v=' + m.trailer + '" target="_blank">Play ' + m.trailer + '</a></td>' +
    '<td><div class="action-btns">' +
    '<button class="btn-edit" onclick="startEdit(' + m.id + ')">Edit</button>' +
    '<button class="btn-delete" onclick="startDelete(' + m.id + ')">Delete</button>' +
    '</div></td></tr>'
  ).join('');
}

// ── NAVIGATION ────────────────────────────────────────────────────────────────
const pageTitles = {dashboard:'Dashboard',movies:'All Movies',trending:'Trending',action:'Action',comedy:'Comedy'};
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', e => {
    e.preventDefault();
    switchPage(item.dataset.page);
    document.getElementById('sidebar').classList.remove('open');
  });
});
function switchPage(page) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === page));
  document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id === 'page-'+page));
  document.getElementById('topbarTitle').textContent = pageTitles[page] || page;
  renderAll();
}
document.getElementById('sidebarToggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

// ── SEARCH ────────────────────────────────────────────────────────────────────
document.getElementById('searchInput').addEventListener('input', function() {
  const q = this.value.toLowerCase().trim();
  renderTable('allBody', allMovies().filter(m =>
    m.title.toLowerCase().includes(q) || m.genre.toLowerCase().includes(q) || String(m.year).includes(q)
  ), true);
});

// ── MODAL ─────────────────────────────────────────────────────────────────────
function openModal(id) {
  editingId = id != null ? Number(id) : null;
  document.getElementById('movieForm').reset();
  hideImgPreview();
  if (editingId !== null) {
    const m = findMovie(editingId);
    if (!m) { showToast('Movie not found.', 'error'); return; }
    document.getElementById('modalTitle').textContent    = 'Edit Movie';
    document.getElementById('formSubmitBtn').textContent = 'Save Changes';
    document.getElementById('fId').value      = m.id;
    document.getElementById('fTitle').value   = m.title;
    document.getElementById('fYear').value    = m.year;
    document.getElementById('fGenre').value   = m.genre;
    document.getElementById('fRow').value     = m.row;
    document.getElementById('fDesc').value    = m.desc || '';
    document.getElementById('fImg').value     = m.img;
    document.getElementById('fTrailer').value = m.trailer;
    showImgPreview(m.img);
    updateYtLink(m.trailer);
  } else {
    document.getElementById('modalTitle').textContent    = 'Add Movie';
    document.getElementById('formSubmitBtn').textContent = 'Add Movie';
  }
  document.getElementById('modalOverlay').classList.add('open');
}
function closeModal() { document.getElementById('modalOverlay').classList.remove('open'); editingId = null; }
window.openModal  = openModal;
window.closeModal = closeModal;

document.getElementById('fImg').addEventListener('input', function() { showImgPreview(this.value.trim()); });
function showImgPreview(url) {
  const img = document.getElementById('imgPreview'), hint = document.querySelector('.img-hint');
  if (url) { img.src = proxyImg(url); img.classList.remove('hidden'); hint.style.display = 'none'; }
  else hideImgPreview();
}
function hideImgPreview() {
  const img = document.getElementById('imgPreview');
  img.classList.add('hidden'); img.src = '';
  document.querySelector('.img-hint').style.display = '';
}
document.getElementById('fTrailer').addEventListener('input', function() { updateYtLink(this.value.trim()); });
function updateYtLink(id) {
  const link = document.getElementById('ytPreviewLink');
  link.href = id ? 'https://www.youtube.com/watch?v=' + id : '#';
  link.style.opacity = id ? '1' : '0.4';
}
document.getElementById('modalOverlay').addEventListener('click', function(e) { if (e.target===this) closeModal(); });

document.getElementById('movieForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const title   = document.getElementById('fTitle').value.trim();
  const year    = parseInt(document.getElementById('fYear').value);
  const genre   = document.getElementById('fGenre').value.trim();
  const row     = document.getElementById('fRow').value;
  const desc    = document.getElementById('fDesc').value.trim();
  const img     = document.getElementById('fImg').value.trim();
  const trailer = document.getElementById('fTrailer').value.trim();
  if (!title || !year || !genre || !row || !img || !trailer) { showToast('Fill in all required fields.', 'error'); return; }
  if (editingId !== null) {
    for (const r of ['trending','action','comedy']) {
      const idx = db[r].findIndex(m => Number(m.id) === editingId);
      if (idx !== -1) { db[r].splice(idx, 1); break; }
    }
    db[row].push({id:editingId, title, year, genre, desc, img, trailer});
    showToast('"' + title + '" updated! Download data.js to publish.', 'success');
  } else {
    db[row].push({id:nextId++, title, year, genre, desc, img, trailer});
    showToast('"' + title + '" added! Download data.js to publish.', 'success');
  }
  hasUnsaved = true;
  updateBanner(true);
  closeModal();
  renderAll();
});

// ── EDIT / DELETE ─────────────────────────────────────────────────────────────
function startEdit(id) { openModal(id); }
window.startEdit = startEdit;
function startDelete(id) {
  deletingId = Number(id);
  const m = findMovie(deletingId);
  document.getElementById('deleteName').textContent = m ? m.title : 'this movie';
  document.getElementById('deleteOverlay').classList.add('open');
}
function closeDelete() { deletingId = null; document.getElementById('deleteOverlay').classList.remove('open'); }
window.startDelete = startDelete;
window.closeDelete = closeDelete;
document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
  if (deletingId === null) return;
  const m = findMovie(deletingId);
  deleteFromDB(deletingId);
  hasUnsaved = true; updateBanner(true);
  showToast('"' + (m ? m.title : 'Movie') + '" deleted! Download data.js to publish.', 'success');
  closeDelete(); renderAll();
});
document.getElementById('deleteOverlay').addEventListener('click', function(e) { if (e.target===this) closeDelete(); });

// ── TOAST ─────────────────────────────────────────────────────────────────────
let toastTimer;
function showToast(msg, type) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show ' + (type||'success');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.className = 'toast'; }, 4000);
}

// ── BOOT ──────────────────────────────────────────────────────────────────────
renderAll();
