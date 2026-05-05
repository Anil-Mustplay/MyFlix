bash

cat > /home/claude/admin.js << 'ADMINEOF'
// ── AUTH / PASSWORD GATE ──────────────────────────────────────────────────────
const AUTH_KEY = 'myflix_auth_token';
const HASH_KEY = 'myflix_pw_hash';
const DB_KEY   = 'myflix_db';
const GH_KEY   = 'myflix_gh_settings';
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
  console.log('%c✅ Password updated!', 'color:lime');
};

const gate = document.getElementById('gate');
const gateInput = document.getElementById('gateInput');
const gateBtn   = document.getElementById('gateBtn');
const gateError = document.getElementById('gateError');

async function tryUnlock() {
  const pw = gateInput.value.trim();
  if (!pw) { shakeGate(); return; }
  if (await sha256(pw) === getStoredHash()) {
    grantSession(); gate.classList.add('hidden'); gateError.textContent = '';
  } else {
    gateError.textContent = '✕ Incorrect password. Try again.';
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
  const lockBtn = document.createElement('button');
  lockBtn.className = 'view-site-btn';
  lockBtn.style.cssText = 'border-color:#3a1a1a;color:#ff4d57;margin-top:8px;width:100%;background:rgba(229,9,20,0.06);cursor:pointer;font-family:inherit;';
  lockBtn.textContent = '🔒 Lock Admin';
  lockBtn.onclick = logout;
  footer.appendChild(lockBtn);
  updateGithubBtnState();
});

// ── IMAGE PROXY ───────────────────────────────────────────────────────────────
function proxyImg(url) {
  if (!url || url.includes('wsrv.nl')) return url;
  return 'https://wsrv.nl/?url=' + encodeURIComponent(url.replace(/^https?:\/\//, '')) + '&w=400&output=jpg';
}

// ── DATA ──────────────────────────────────────────────────────────────────────
function loadDB() {
  try {
    const saved = localStorage.getItem(DB_KEY);
    if (saved) {
      const p = JSON.parse(saved);
      if (p && p.trending && p.action && p.comedy) return p;
    }
  } catch(e) {}
  if (typeof MYFLIX_DATA !== 'undefined') return JSON.parse(JSON.stringify(MYFLIX_DATA));
  return { trending:[], action:[], comedy:[] };
}
function saveDB() {
  try { localStorage.setItem(DB_KEY, JSON.stringify(db)); return true; }
  catch(e) { showToast('Save failed: ' + e.message, 'error'); return false; }
}

let db = loadDB();
let nextId = computeNextId();
let editingId  = null;
let deletingId = null;

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
  for (const row of ['trending','action','comedy']) db[row] = db[row].filter(m => Number(m.id) !== nid);
}

// ── GITHUB AUTO-PUSH ──────────────────────────────────────────────────────────
function getGHSettings() {
  try { return JSON.parse(localStorage.getItem(GH_KEY) || 'null'); } catch { return null; }
}
function saveGithubSettings() {
  const user   = document.getElementById('ghUser').value.trim();
  const repo   = document.getElementById('ghRepo').value.trim();
  const branch = document.getElementById('ghBranch').value.trim() || 'main';
  const token  = document.getElementById('ghToken').value.trim();
  if (!user || !repo || !token) { showGHResult('Please fill in all fields.', false); return; }
  localStorage.setItem(GH_KEY, JSON.stringify({ user, repo, branch, token }));
  updateGithubBtnState();
  closeGithubSettings();
  showToast('GitHub connected! Changes will auto-push.', 'success');
}
window.saveGithubSettings = saveGithubSettings;

function loadGithubSettingsForm() {
  const s = getGHSettings();
  if (!s) return;
  document.getElementById('ghUser').value   = s.user   || '';
  document.getElementById('ghRepo').value   = s.repo   || '';
  document.getElementById('ghBranch').value = s.branch || 'main';
  document.getElementById('ghToken').value  = s.token  || '';
}
function openGithubSettings()  {
  loadGithubSettingsForm();
  document.getElementById('ghTestResult').textContent = '';
  document.getElementById('githubOverlay').classList.add('open');
}
function closeGithubSettings() { document.getElementById('githubOverlay').classList.remove('open'); }
window.openGithubSettings  = openGithubSettings;
window.closeGithubSettings = closeGithubSettings;
document.getElementById('githubOverlay').addEventListener('click', function(e) { if (e.target===this) closeGithubSettings(); });

function updateGithubBtnState() {
  const btn = document.querySelector('.github-btn');
  if (!btn) return;
  const s = getGHSettings();
  if (s && s.token) {
    btn.classList.add('connected');
    btn.innerHTML = '&#10003; GitHub';
    btn.title = 'Connected to ' + s.user + '/' + s.repo + ' — click to change';
  } else {
    btn.classList.remove('connected');
    btn.innerHTML = '&#9881; GitHub';
    btn.title = 'Click to connect GitHub for auto-push';
  }
}

async function testGithubConnection() {
  const user   = document.getElementById('ghUser').value.trim();
  const repo   = document.getElementById('ghRepo').value.trim();
  const token  = document.getElementById('ghToken').value.trim();
  if (!user || !repo || !token) { showGHResult('Fill in all fields first.', false); return; }
  showGHResult('⏳ Testing...', null);
  try {
    const res = await fetch('https://api.github.com/repos/' + user + '/' + repo, {
      headers: { 'Authorization': 'Bearer ' + token, 'Accept': 'application/vnd.github.v3+json' }
    });
    if (res.ok) {
      const data = await res.json();
      showGHResult('✅ Connected! Repo: ' + data.full_name, true);
    } else if (res.status === 401) {
      showGHResult('❌ Invalid token. Check your PAT.', false);
    } else if (res.status === 404) {
      showGHResult('❌ Repo not found. Check username/repo name.', false);
    } else {
      showGHResult('❌ Error ' + res.status + '. Check settings.', false);
    }
  } catch(e) {
    showGHResult('❌ Network error: ' + e.message, false);
  }
}
window.testGithubConnection = testGithubConnection;

function showGHResult(msg, ok) {
  const el = document.getElementById('ghTestResult');
  el.textContent = msg;
  el.style.color = ok === true ? '#22c55e' : ok === false ? '#ff4d57' : '#888';
}

// Build the data.js file content
function buildDataJS() {
  const now = new Date().toISOString().slice(0,19).replace('T',' ');
  return '// MyFlix Movie Database\n// Auto-updated: ' + now + '\n\nconst MYFLIX_DATA = ' + JSON.stringify(db, null, 2) + ';\n';
}

// Push data.js to GitHub via API
async function pushToGitHub() {
  const s = getGHSettings();
  if (!s || !s.token) return; // No GitHub connected, skip silently

  setPushStatus('pushing', '⏳ Pushing to GitHub...');

  const content = buildDataJS();
  const encoded = btoa(unescape(encodeURIComponent(content))); // base64 encode (handles UTF-8)
  const apiUrl  = 'https://api.github.com/repos/' + s.user + '/' + s.repo + '/contents/data.js';
  const headers = {
    'Authorization': 'Bearer ' + s.token,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json'
  };

  try {
    // Step 1: Get current file SHA (required for update)
    let sha = null;
    const getRes = await fetch(apiUrl + '?ref=' + s.branch, { headers });
    if (getRes.ok) {
      const fileData = await getRes.json();
      sha = fileData.sha;
    } else if (getRes.status !== 404) {
      throw new Error('Failed to fetch file: ' + getRes.status);
    }

    // Step 2: Create or update the file
    const body = {
      message: 'Update data.js via Admin Panel',
      content: encoded,
      branch: s.branch
    };
    if (sha) body.sha = sha; // Required for update, omit for create

    const putRes = await fetch(apiUrl, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body)
    });

    if (putRes.ok) {
      setPushStatus('success', '✅ Pushed to GitHub!');
      setTimeout(() => setPushStatus('', ''), 4000);
    } else {
      const err = await putRes.json();
      throw new Error(err.message || putRes.status);
    }
  } catch(e) {
    setPushStatus('error', '❌ Push failed: ' + e.message);
    setTimeout(() => setPushStatus('', ''), 6000);
    console.error('GitHub push error:', e);
  }
}

function setPushStatus(state, msg) {
  const el = document.getElementById('pushStatus');
  if (!el) return;
  el.className = 'push-status' + (state ? ' ' + state : '');
  el.textContent = msg;
}

// Combined save: localStorage + GitHub push
function saveAndPush() {
  saveDB();
  pushToGitHub(); // fire and forget — doesn't block UI
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
  tbody.innerHTML = movies.map(m =>
    '<tr>' +
    '<td><img class="poster-thumb" src="' + proxyImg(m.img) + '" alt="' + m.title + '" onerror="this.style.background=\'#1a1a1a\'"></td>' +
    '<td class="movie-title-cell">' + m.title + '<small>' + (m.desc ? m.desc.substring(0,60)+'...' : '') + '</small></td>' +
    '<td>' + m.year + '</td><td>' + m.genre + '</td>' +
    (showRow ? '<td><span class="row-badge ' + m.row + '">' + m.row + '</span></td>' : '') +
    '<td><a class="yt-link" href="https://youtube.com/watch?v=' + m.trailer + '" target="_blank">&#9654; ' + m.trailer + '</a></td>' +
    '<td><div class="action-btns">' +
    '<button class="btn-edit" onclick="startEdit(' + m.id + ')">&#9998; Edit</button>' +
    '<button class="btn-delete" onclick="startDelete(' + m.id + ')">&#128465; Delete</button>' +
    '</div></td></tr>'
  ).join('');
}

// ── NAVIGATION ────────────────────────────────────────────────────────────────
const pageTitles = {dashboard:'Dashboard',movies:'All Movies',trending:'🔥 Trending',action:'⚡ Action',comedy:'😄 Comedy'};
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', e => {
    e.preventDefault(); switchPage(item.dataset.page);
    document.getElementById('sidebar').classList.remove('open');
  });
});
function switchPage(page) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === page));
  document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id === 'page-'+page));
  document.getElementById('topbarTitle').textContent = pageTitles[page] || page;
  renderAll();
}
document.getElementById('sidebarToggle').addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));

// ── SEARCH ────────────────────────────────────────────────────────────────────
document.getElementById('searchInput').addEventListener('input', function() {
  const q = this.value.toLowerCase().trim();
  renderTable('allBody', allMovies().filter(m =>
    m.title.toLowerCase().includes(q) || m.genre.toLowerCase().includes(q) || String(m.year).includes(q)
  ), true);
});

// ── MODAL ─────────────────────────────────────────────────────────────────────
function openModal(id) {
  editingId = (id != null) ? Number(id) : null;
  document.getElementById('movieForm').reset(); hideImgPreview();
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
    showImgPreview(m.img); updateYtLink(m.trailer);
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
  if (url) { img.src = proxyImg(url); img.classList.remove('hidden'); hint.style.display='none'; } else hideImgPreview();
}
function hideImgPreview() {
  const img = document.getElementById('imgPreview');
  img.classList.add('hidden'); img.src=''; document.querySelector('.img-hint').style.display='';
}
document.getElementById('fTrailer').addEventListener('input', function() { updateYtLink(this.value.trim()); });
function updateYtLink(id) {
  const l = document.getElementById('ytPreviewLink');
  l.href = id ? 'https://www.youtube.com/watch?v='+id : '#'; l.style.opacity = id?'1':'0.4';
}
document.getElementById('modalOverlay').addEventListener('click', function(e) { if(e.target===this) closeModal(); });

document.getElementById('movieForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const title   = document.getElementById('fTitle').value.trim();
  const year    = parseInt(document.getElementById('fYear').value);
  const genre   = document.getElementById('fGenre').value.trim();
  const row     = document.getElementById('fRow').value;
  const desc    = document.getElementById('fDesc').value.trim();
  const img     = document.getElementById('fImg').value.trim();
  const trailer = document.getElementById('fTrailer').value.trim();
  if (!title||!year||!genre||!row||!img||!trailer) { showToast('Fill in all required fields.','error'); return; }

  if (editingId !== null) {
    for (const r of ['trending','action','comedy']) {
      const idx = db[r].findIndex(m => Number(m.id)===editingId);
      if (idx!==-1) { db[r].splice(idx,1); break; }
    }
    db[row].push({id:editingId,title,year,genre,desc,img,trailer});
    showToast('"'+title+'" updated!','success');
  } else {
    db[row].push({id:nextId++,title,year,genre,desc,img,trailer});
    showToast('"'+title+'" added to '+row+'!','success');
  }
  saveAndPush(); closeModal(); renderAll();
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
function closeDelete() { deletingId=null; document.getElementById('deleteOverlay').classList.remove('open'); }
window.startDelete = startDelete; window.closeDelete = closeDelete;

document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
  if (deletingId===null) return;
  const m = findMovie(deletingId);
  deleteFromDB(deletingId); saveAndPush();
  showToast('"'+(m?m.title:'Movie')+'" deleted.','success');
  closeDelete(); renderAll();
});
document.getElementById('deleteOverlay').addEventListener('click', function(e) { if(e.target===this) closeDelete(); });

// ── TOAST ─────────────────────────────────────────────────────────────────────
let toastTimer;
function showToast(msg, type) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className='toast show '+(type||'success');
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>{t.className='toast';},4000);
}

// ── BOOT ──────────────────────────────────────────────────────────────────────
renderAll();
ADMINEOF
Output

exit code 0
