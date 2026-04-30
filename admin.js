// ── AUTH / PASSWORD GATE ──────────────────────────────────────────────────────
// Password is stored as a SHA-256 hash — never the plain text.
// Default password: myflix2024
// To change it: open browser console and run setAdminPassword('yournewpassword')

const AUTH_KEY   = 'myflix_auth_token';
const HASH_KEY   = 'myflix_pw_hash';
const SESSION_MS = 8 * 60 * 60 * 1000; // 8 hours

// Default hash of "myflix2024"
const DEFAULT_HASH = 'dcb820a04659def4de2d0e4b5bfab1a2b722798d48f46ac9ce0fcb4780b4ddae';

async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function getStoredHash() {
  return localStorage.getItem(HASH_KEY) || DEFAULT_HASH;
}

function isSessionValid() {
  try {
    const tok = JSON.parse(localStorage.getItem(AUTH_KEY) || '{}');
    return tok.expires && Date.now() < tok.expires;
  } catch { return false; }
}

function grantSession() {
  localStorage.setItem(AUTH_KEY, JSON.stringify({ expires: Date.now() + SESSION_MS }));
}

function logout() {
  localStorage.removeItem(AUTH_KEY);
  location.reload();
}

// Expose logout globally
window.adminLogout = logout;

// Allow changing password from console: setAdminPassword('newpass')
window.setAdminPassword = async function(newPass) {
  if (!newPass || newPass.length < 4) { console.warn('Password too short (min 4 chars)'); return; }
  const hash = await sha256(newPass);
  localStorage.setItem(HASH_KEY, hash);
  console.log('%c✅ Password updated! New hash stored.', 'color:lime');
};

// Gate DOM refs
const gate      = document.getElementById('gate');
const gateInput = document.getElementById('gateInput');
const gateBtn   = document.getElementById('gateBtn');
const gateError = document.getElementById('gateError');

async function tryUnlock() {
  const pw = gateInput.value.trim();
  if (!pw) { shakeGate(); return; }
  const hash = await sha256(pw);
  if (hash === getStoredHash()) {
    grantSession();
    gate.classList.add('hidden');
    gateError.textContent = '';
  } else {
    gateError.textContent = '✕  Incorrect password. Try again.';
    gateInput.value = '';
    gateInput.focus();
    shakeGate();
  }
}

function shakeGate() {
  const box = document.querySelector('.gate-box');
  box.style.animation = 'none';
  requestAnimationFrame(() => { box.style.animation = 'shake 0.4s ease'; });
}

gateBtn.addEventListener('click', tryUnlock);
gateInput.addEventListener('keydown', e => { if (e.key === 'Enter') tryUnlock(); });

// Inject shake keyframe
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `@keyframes shake {
  0%,100%{transform:translateX(0)}
  20%{transform:translateX(-10px)}
  40%{transform:translateX(10px)}
  60%{transform:translateX(-7px)}
  80%{transform:translateX(7px)}
}`;
document.head.appendChild(shakeStyle);

// Check session on load
if (isSessionValid()) {
  gate.classList.add('hidden');
} else {
  // Make sure body content is inaccessible until unlocked
  document.querySelector('.sidebar').style.visibility = 'hidden';
  document.querySelector('.main').style.visibility = 'hidden';
  gate.addEventListener('transitionend', () => {
    document.querySelector('.sidebar').style.visibility = '';
    document.querySelector('.main').style.visibility = '';
  }, { once: true });
}

// Add logout button to sidebar footer
document.addEventListener('DOMContentLoaded', () => {
  const footer = document.querySelector('.sidebar-footer');
  const logoutBtn = document.createElement('button');
  logoutBtn.className = 'view-site-btn';
  logoutBtn.style.cssText = 'border-color:#3a1a1a;color:#ff4d57;margin-top:8px;width:100%;background:rgba(229,9,20,0.06);cursor:pointer;font-family:inherit;';
  logoutBtn.textContent = '🔒 Lock Admin';
  logoutBtn.onclick = logout;
  footer.appendChild(logoutBtn);
});

// ── DEFAULT DATA ─────────────────────────────────────────────────────────────
const DEFAULT_DATA = {
  trending: [
    { id: 1, title: "Dune: Part Two", year: 2024, genre: "Sci-Fi", desc: "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.", img: "https://wsrv.nl/?url=image.tmdb.org/t/p/w500/&w=3008b8R8l88Qje9dn9OE8PY05Nxl1X.jpg", trailer: "Way9ZtDmGSY" },
    { id: 2, title: "Oppenheimer", year: 2023, genre: "Drama", desc: "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during WWII.", img: "https://wsrv.nl/?url=image.tmdb.org/t/p/w500/&w=3008Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg", trailer: "uYPbbksJxIg" },
    { id: 3, title: "Poor Things", year: 2023, genre: "Fantasy", desc: "The incredible tale of Bella Baxter, a young woman brought back to life by the brilliant and unorthodox scientist Dr. Godwin Baxter.", img: "https://wsrv.nl/?url=image.tmdb.org/t/p/w500/&w=300kCGlIMHnOm8JPXIf6ChkDLhm2IW.jpg", trailer: "RlbR5N6veqw" },
    { id: 4, title: "The Zone of Interest", year: 2023, genre: "Drama", desc: "A Nazi officer and his wife build their dream life next to the walls of Auschwitz.", img: "https://wsrv.nl/?url=image.tmdb.org/t/p/w500/&w=300hUu9zyZmKuCcJBgB56jHqMpUWN9.jpg", trailer: "p9GMMV2WVTI" },
    { id: 5, title: "Saltburn", year: 2023, genre: "Thriller", desc: "A student at Oxford University finds himself drawn into the world of a charming and aristocratic classmate.", img: "https://wsrv.nl/?url=image.tmdb.org/t/p/w500/&w=300qitIosKd0cRS0OniMWMHdS8DKly.jpg", trailer: "VJuhyf9GEdA" },
    { id: 6, title: "Killers of the Flower Moon", year: 2023, genre: "Crime", desc: "Members of the Osage Nation are murdered under mysterious circumstances in 1920s Oklahoma.", img: "https://wsrv.nl/?url=image.tmdb.org/t/p/w500/&w=300dB6Krk806zeqd0YNp2ngQ9zXteH.jpg", trailer: "EG0si5bSd6I" },
  ],
  action: [
    { id: 7, title: "Mad Max: Fury Road", year: 2015, genre: "Action", desc: "In a post-apocalyptic wasteland, Max teams up with a mysterious woman, Furiosa, to flee from a cult-leader and his army.", img: "https://wsrv.nl/?url=image.tmdb.org/t/p/w500/&w=3008tZYtuWezp8JbcsvHYO0O46tFbo.jpg", trailer: "hEJnMQG9ev8" },
    { id: 8, title: "Top Gun: Maverick", year: 2022, genre: "Action", desc: "After more than thirty years of service as a top naval aviator, Pete Mitchell is pushing the limits as a courageous test pilot.", img: "https://wsrv.nl/?url=image.tmdb.org/t/p/w500/&w=30062HCnUTziyWcpDaBO2i1DX17ljH.jpg", trailer: "qSqVVswa420" },
    { id: 9, title: "Everything Everywhere All at Once", year: 2022, genre: "Action", desc: "An aging Chinese immigrant is swept up in an insane adventure where she alone can save existence by exploring other universes.", img: "https://wsrv.nl/?url=image.tmdb.org/t/p/w500/&w=300w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg", trailer: "wxN1T1uxQ2g" },
    { id: 10, title: "Mission: Impossible – Dead Reckoning", year: 2023, genre: "Action", desc: "Ethan Hunt and the IMF team must track down a dangerous weapon before it falls into the wrong hands.", img: "https://wsrv.nl/?url=image.tmdb.org/t/p/w500/&w=300NNxYkU70HPurnNCSiCjYAmacwm.jpg", trailer: "avz06PDqDbM" },
    { id: 11, title: "John Wick: Chapter 4", year: 2023, genre: "Action", desc: "John Wick uncovers a path to defeating the High Table, but before he can earn his freedom he must face a new enemy.", img: "https://wsrv.nl/?url=image.tmdb.org/t/p/w500/&w=300vZloFAK7NmvMGKE7VkF5UHaz0I.jpg", trailer: "yjui7DoNFNk" },
    { id: 12, title: "The Batman", year: 2022, genre: "Action", desc: "When the Riddler targets Gotham's elite, Batman ventures into the city's underworld to uncover corruption.", img: "https://wsrv.nl/?url=image.tmdb.org/t/p/w500/&w=30074xTEgt7R36Fpooo50r9T25onhq.jpg", trailer: "mqqft2x_Aa4" },
  ],
  comedy: [
    { id: 13, title: "The Grand Budapest Hotel", year: 2014, genre: "Comedy", desc: "The adventures of Gustave H, a legendary concierge, and Zero, his lobby boy, involving the theft of a painting.", img: "https://wsrv.nl/?url=image.tmdb.org/t/p/w500/&w=300eWdyYQreja6JrobOf2XFmalanden.jpg", trailer: "1Fg0RDlHBNQ" },
    { id: 14, title: "Knives Out", year: 2019, genre: "Mystery", desc: "A detective investigates the death of a patriarch of an eccentric, combative family.", img: "https://wsrv.nl/?url=image.tmdb.org/t/p/w500/&w=300pThyQovXQrws2Y4e7IVOqMt04gI.jpg", trailer: "qGqiHJTsRkQ" },
    { id: 15, title: "Barbie", year: 2023, genre: "Comedy", desc: "Barbie and Ken leave their perfect utopia and venture into the real world, discovering human nature.", img: "https://wsrv.nl/?url=image.tmdb.org/t/p/w500/&w=300iuFNMS8vlzmfa8TxfjbLQDKPEdM.jpg", trailer: "pBk4NYhWNMM" },
    { id: 16, title: "The Menu", year: 2022, genre: "Dark Comedy", desc: "A young couple travels to an exclusive island restaurant where the chef has prepared a unique menu with shocking surprises.", img: "https://wsrv.nl/?url=image.tmdb.org/t/p/w500/&w=300v5H9m64tOLqyjPpOuFXK3sFQYwl.jpg", trailer: "uh7XP3HWqcE" },
    { id: 17, title: "Glass Onion", year: 2022, genre: "Mystery", desc: "Benoit Blanc travels to Greece to peel back the layers of a mystery among a group of friends.", img: "https://wsrv.nl/?url=image.tmdb.org/t/p/w500/&w=300vDGr1YdrlfbU9wxTOdpf3zChmv9.jpg", trailer: "9K0nAaVfAzE" },
    { id: 18, title: "Triangle of Sadness", year: 2022, genre: "Dark Comedy", desc: "A celebrity couple is placed on a luxury cruise for the ultra-rich. What starts as a dream vacation soon becomes a nightmare.", img: "https://wsrv.nl/?url=image.tmdb.org/t/p/w500/&w=300nFCJGhUMRqAOaEWcRCJjDwHFPsN.jpg", trailer: "VDvfFIZQIuQ" },
  ]
};

// ── STATE ─────────────────────────────────────────────────────────────────────
let db = loadDB();
let nextId = computeNextId();
let editingId = null;
let deletingId = null;

// ── DB HELPERS ────────────────────────────────────────────────────────────────
function loadDB() {
  try {
    const raw = localStorage.getItem('myflix_db');
    return raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(DEFAULT_DATA));
  } catch { return JSON.parse(JSON.stringify(DEFAULT_DATA)); }
}

function saveDB() {
  localStorage.setItem('myflix_db', JSON.stringify(db));
}

function computeNextId() {
  const all = [...db.trending, ...db.action, ...db.comedy];
  return all.length ? Math.max(...all.map(m => m.id)) + 1 : 1;
}

function allMovies() {
  return [
    ...db.trending.map(m => ({ ...m, row: 'trending' })),
    ...db.action.map(m => ({ ...m, row: 'action' })),
    ...db.comedy.map(m => ({ ...m, row: 'comedy' })),
  ];
}

function findMovie(id) {
  for (const row of ['trending', 'action', 'comedy']) {
    const m = db[row].find(m => m.id === id);
    if (m) return { ...m, row };
  }
  return null;
}

function deleteMovie(id) {
  for (const row of ['trending', 'action', 'comedy']) {
    db[row] = db[row].filter(m => m.id !== id);
  }
  saveDB();
}

// ── RENDER ────────────────────────────────────────────────────────────────────
function renderAll() {
  updateStats();
  renderTable('recentBody', allMovies().slice(-6).reverse(), true);
  renderTable('allBody', allMovies(), true);
  renderTable('bodyTrending', db.trending.map(m => ({ ...m, row: 'trending' })));
  renderTable('bodyAction', db.action.map(m => ({ ...m, row: 'action' })));
  renderTable('bodyComedy', db.comedy.map(m => ({ ...m, row: 'comedy' })));
}

function updateStats() {
  document.getElementById('statTotal').textContent = allMovies().length;
  document.getElementById('statTrending').textContent = db.trending.length;
  document.getElementById('statAction').textContent = db.action.length;
  document.getElementById('statComedy').textContent = db.comedy.length;
}

function renderTable(tbodyId, movies, showRow = false) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;

  if (!movies.length) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="7">No movies found.</td></tr>`;
    return;
  }

  tbody.innerHTML = movies.map(m => `
    <tr>
      <td>
        <img class="poster-thumb" src="${m.img}" alt="${m.title}"
          onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2258%22><rect width=%2240%22 height=%2258%22 fill=%22%231a1a1a%22/><text x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-size=%228%22 fill=%22%23555%22>IMG</text></svg>'">
      </td>
      <td class="movie-title-cell">
        ${m.title}
        <small>${m.desc ? m.desc.substring(0, 60) + '…' : '—'}</small>
      </td>
      <td>${m.year}</td>
      <td>${m.genre}</td>
      ${showRow ? `<td><span class="row-badge ${m.row}">${m.row}</span></td>` : ''}
      <td>
        <a class="yt-link" href="https://youtube.com/watch?v=${m.trailer}" target="_blank">
          ▶ ${m.trailer}
        </a>
      </td>
      <td>
        <div class="action-btns">
          <button class="btn-edit" onclick="startEdit(${m.id})">✏ Edit</button>
          <button class="btn-delete" onclick="startDelete(${m.id})">🗑 Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ── NAVIGATION ────────────────────────────────────────────────────────────────
const pageTitles = {
  dashboard: 'Dashboard',
  movies: 'All Movies',
  trending: '🔥 Trending',
  action: '⚡ Action',
  comedy: '😄 Comedy',
};

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', e => {
    e.preventDefault();
    const page = item.dataset.page;
    switchPage(page);
    // Close sidebar on mobile
    document.getElementById('sidebar').classList.remove('open');
  });
});

function switchPage(page) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === page));
  document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id === `page-${page}`));
  document.getElementById('topbarTitle').textContent = pageTitles[page] || page;
  renderAll();
}

// Sidebar toggle (mobile)
document.getElementById('sidebarToggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

// ── SEARCH ────────────────────────────────────────────────────────────────────
document.getElementById('searchInput').addEventListener('input', function () {
  const q = this.value.toLowerCase().trim();
  const filtered = allMovies().filter(m =>
    m.title.toLowerCase().includes(q) ||
    m.genre.toLowerCase().includes(q) ||
    m.year.toString().includes(q)
  );
  renderTable('allBody', filtered, true);
});

// ── ADD / EDIT MODAL ──────────────────────────────────────────────────────────
function openModal(id = null) {
  editingId = id;
  const form = document.getElementById('movieForm');
  form.reset();
  hideImgPreview();

  if (id) {
    const m = findMovie(id);
    if (!m) return;
    document.getElementById('modalTitle').textContent = 'Edit Movie';
    document.getElementById('formSubmitBtn').textContent = 'Save Changes';
    document.getElementById('fId').value = m.id;
    document.getElementById('fTitle').value = m.title;
    document.getElementById('fYear').value = m.year;
    document.getElementById('fGenre').value = m.genre;
    document.getElementById('fRow').value = m.row;
    document.getElementById('fDesc').value = m.desc || '';
    document.getElementById('fImg').value = m.img;
    document.getElementById('fTrailer').value = m.trailer;
    showImgPreview(m.img);
    updateYtLink(m.trailer);
  } else {
    document.getElementById('modalTitle').textContent = 'Add Movie';
    document.getElementById('formSubmitBtn').textContent = 'Add Movie';
  }

  document.getElementById('modalOverlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  editingId = null;
}

window.openModal = openModal;
window.closeModal = closeModal;

// Image preview
document.getElementById('fImg').addEventListener('input', function () {
  showImgPreview(this.value.trim());
});

function showImgPreview(url) {
  const img = document.getElementById('imgPreview');
  const hint = document.querySelector('.img-hint');
  if (url) {
    img.src = url;
    img.classList.remove('hidden');
    hint.style.display = 'none';
  } else {
    hideImgPreview();
  }
}

function hideImgPreview() {
  document.getElementById('imgPreview').classList.add('hidden');
  document.getElementById('imgPreview').src = '';
  document.querySelector('.img-hint').style.display = '';
}

// YouTube preview link
document.getElementById('fTrailer').addEventListener('input', function () {
  updateYtLink(this.value.trim());
});

function updateYtLink(id) {
  const link = document.getElementById('ytPreviewLink');
  link.href = id ? `https://www.youtube.com/watch?v=${id}` : '#';
  link.style.opacity = id ? '1' : '0.4';
}

// Close modal on overlay click
document.getElementById('modalOverlay').addEventListener('click', function (e) {
  if (e.target === this) closeModal();
});

// Form submit
document.getElementById('movieForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const id      = editingId;
  const title   = document.getElementById('fTitle').value.trim();
  const year    = parseInt(document.getElementById('fYear').value);
  const genre   = document.getElementById('fGenre').value.trim();
  const row     = document.getElementById('fRow').value;
  const desc    = document.getElementById('fDesc').value.trim();
  const img     = document.getElementById('fImg').value.trim();
  const trailer = document.getElementById('fTrailer').value.trim();

  if (!title || !year || !genre || !row || !img || !trailer) {
    showToast('Please fill in all required fields.', 'error');
    return;
  }

  if (id) {
    // Edit: remove from old row, insert updated into chosen row
    for (const r of ['trending', 'action', 'comedy']) {
      const idx = db[r].findIndex(m => m.id === id);
      if (idx !== -1) { db[r].splice(idx, 1); break; }
    }
    db[row].push({ id, title, year, genre, desc, img, trailer });
    showToast(`"${title}" updated successfully.`, 'success');
  } else {
    // Add
    db[row].push({ id: nextId++, title, year, genre, desc, img, trailer });
    showToast(`"${title}" added to ${row}.`, 'success');
  }

  saveDB();
  closeModal();
  renderAll();
});

// ── EDIT ──────────────────────────────────────────────────────────────────────
function startEdit(id) {
  openModal(id);
}
window.startEdit = startEdit;

// ── DELETE ────────────────────────────────────────────────────────────────────
function startDelete(id) {
  deletingId = id;
  const m = findMovie(id);
  document.getElementById('deleteName').textContent = m ? m.title : 'this movie';
  document.getElementById('deleteOverlay').classList.add('open');
}

function closeDelete() {
  deletingId = null;
  document.getElementById('deleteOverlay').classList.remove('open');
}

window.startDelete = startDelete;
window.closeDelete = closeDelete;

document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
  if (deletingId === null) return;
  const m = findMovie(deletingId);
  deleteMovie(deletingId);
  showToast(`"${m?.title}" deleted.`, 'success');
  closeDelete();
  renderAll();
});

document.getElementById('deleteOverlay').addEventListener('click', function (e) {
  if (e.target === this) closeDelete();
});

// ── TOAST ─────────────────────────────────────────────────────────────────────
let toastTimer;
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.className = 'toast'; }, 3000);
}

// ── RESET (for dev convenience — exposed on window) ───────────────────────────
window.resetMyflixDB = function () {
  localStorage.removeItem('myflix_db');
  db = JSON.parse(JSON.stringify(DEFAULT_DATA));
  nextId = computeNextId();
  renderAll();
  showToast('Database reset to defaults.', 'success');
};

// ── BOOT ──────────────────────────────────────────────────────────────────────
renderAll();
