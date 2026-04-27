// ── DATA ────────────────────────────────────────────────────────────────────
// Uses TMDB image CDN + free YouTube trailers (no API key needed for embeds)
const movies = {
  trending: [
    { id: 1, title: "Dune: Part Two", year: 2024, genre: "Sci-Fi", desc: "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.", img: "https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg", trailer: "Way9ZtDmGSY" },
    { id: 2, title: "Oppenheimer", year: 2023, genre: "Drama", desc: "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during WWII.", img: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg", trailer: "uYPbbksJxIg" },
    { id: 3, title: "Poor Things", year: 2023, genre: "Fantasy", desc: "The incredible tale of Bella Baxter, a young woman brought back to life by the brilliant and unorthodox scientist Dr. Godwin Baxter.", img: "https://image.tmdb.org/t/p/w500/kCGlIMHnOm8JPXIf6ChkDLhm2IW.jpg", trailer: "RlbR5N6veqw" },
    { id: 4, title: "The Zone of Interest", year: 2023, genre: "Drama", desc: "A Nazi officer and his wife build their dream life next to the walls of Auschwitz.", img: "https://image.tmdb.org/t/p/w500/hUu9zyZmKuCcJBgB56jHqMpUWN9.jpg", trailer: "p9GMMV2WVTI" },
    { id: 5, title: "Saltburn", year: 2023, genre: "Thriller", desc: "A student at Oxford University finds himself drawn into the world of a charming and aristocratic classmate.", img: "https://image.tmdb.org/t/p/w500/qitIosKd0cRS0OniMWMHdS8DKly.jpg", trailer: "VJuhyf9GEdA" },
    { id: 6, title: "Killers of the Flower Moon", year: 2023, genre: "Crime", desc: "Members of the Osage Nation are murdered under mysterious circumstances in 1920s Oklahoma.", img: "https://image.tmdb.org/t/p/w500/dB6Krk806zeqd0YNp2ngQ9zXteH.jpg", trailer: "EG0si5bSd6I" },
  ],
  action: [
    { id: 7, title: "Mad Max: Fury Road", year: 2015, genre: "Action", desc: "In a post-apocalyptic wasteland, Max teams up with a mysterious woman, Furiosa, to flee from a cult-leader and his army.", img: "https://image.tmdb.org/t/p/w500/8tZYtuWezp8JbcsvHYO0O46tFbo.jpg", trailer: "hEJnMQG9ev8" },
    { id: 8, title: "Top Gun: Maverick", year: 2022, genre: "Action", desc: "After more than thirty years of service as a top naval aviator, Pete Mitchell is pushing the limits as a courageous test pilot.", img: "https://image.tmdb.org/t/p/w500/62HCnUTziyWcpDaBO2i1DX17ljH.jpg", trailer: "qSqVVswa420" },
    { id: 9, title: "Everything Everywhere All at Once", year: 2022, genre: "Action", desc: "An aging Chinese immigrant is swept up in an insane adventure where she alone can save existence by exploring other universes.", img: "https://image.tmdb.org/t/p/w500/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg", trailer: "wxN1T1uxQ2g" },
    { id: 10, title: "Mission: Impossible – Dead Reckoning", year: 2023, genre: "Action", desc: "Ethan Hunt and the IMF team must track down a dangerous weapon before it falls into the wrong hands.", img: "https://image.tmdb.org/t/p/w500/NNxYkU70HPurnNCSiCjYAmacwm.jpg", trailer: "avz06PDqDbM" },
    { id: 11, title: "John Wick: Chapter 4", year: 2023, genre: "Action", desc: "John Wick uncovers a path to defeating the High Table, but before he can earn his freedom he must face a new enemy.", img: "https://image.tmdb.org/t/p/w500/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg", trailer: "yjui7DoNFNk" },
    { id: 12, title: "The Batman", year: 2022, genre: "Action", desc: "When the Riddler targets Gotham's elite, Batman ventures into the city's underworld to uncover corruption.", img: "https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg", trailer: "mqqft2x_Aa4" },
  ],
  comedy: [
    { id: 13, title: "The Grand Budapest Hotel", year: 2014, genre: "Comedy", desc: "The adventures of Gustave H, a legendary concierge, and Zero, his lobby boy, involving the theft of a painting.", img: "https://image.tmdb.org/t/p/w500/eWdyYQreja6JrobOf2XFmalanden.jpg", trailer: "qGqiHJTsRkQ" },
    { id: 14, title: "Knives Out", year: 2019, genre: "Mystery", desc: "A detective investigates the death of a patriarch of an eccentric, combative family.", img: "https://image.tmdb.org/t/p/w1280/t47INT1sSNiJwJHJqxxQ7Vt3DE9.jpg", trailer: "qGqiHJTsRkQ" },
    { id: 15, title: "Barbie", year: 2023, genre: "Comedy", desc: "Barbie and Ken leave their perfect utopia and venture into the real world, discovering human nature.", img: "https://image.tmdb.org/t/p/w500/iuFNMS8vlzmfa8TxfjbLQDKPEdM.jpg", trailer: "pBk4NYhWNMM" },
    { id: 16, title: "The Menu", year: 2022, genre: "Dark Comedy", desc: "A young couple travels to an exclusive island restaurant where the chef has prepared a unique menu with shocking surprises.", img: "https://image.tmdb.org/t/p/w1280/fPtUgMcLIboqlTlPrq0bQpKK8eq.jpg", trailer: "uh7XP3HWqcE" },
    { id: 17, title: "Glass Onion", year: 2022, genre: "Mystery", desc: "Benoit Blanc travels to Greece to peel back the layers of a mystery among a group of friends.", img: "https://image.tmdb.org/t/p/w500/vDGr1YdrlfbU9wxTOdpf3zChmv9.jpg", trailer: "9K0nAaVfAzE" },
    { id: 18, title: "Triangle of Sadness", year: 2022, genre: "Dark Comedy", desc: "A celebrity couple is placed on a luxury cruise for the ultra-rich. What starts as a dream vacation soon becomes a nightmare.", img: "https://image.tmdb.org/t/p/w500/nFCJGhUMRqAOaEWcRCJjDwHFPsN.jpg", trailer: "VDvfFIZQIuQ" },
  ]
};

// ── STATE ───────────────────────────────────────────────────────────────────
let bannerMovie = movies.trending[0];
let closeBtn;

// ── INIT ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  setupHeader();
  setupBanner();
  renderRow('trending', movies.trending);
  renderRow('action', movies.action);
  renderRow('comedy', movies.comedy);
  setupCloseButton();
  addFooter();
});

// ── HEADER SCROLL ───────────────────────────────────────────────────────────
function setupHeader() {
  const header = document.querySelector('.header');
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });
}

// ── BANNER ──────────────────────────────────────────────────────────────────
function setupBanner() {
  // Pick a random trending movie for the banner
  bannerMovie = movies.trending[Math.floor(Math.random() * movies.trending.length)];
  updateBanner(bannerMovie);
}

function updateBanner(movie) {
  bannerMovie = movie;
  const banner = document.getElementById('banner');
  // Large backdrop image
  const backdropId = movie.img.replace('/w500/', '/original/');
  banner.style.backgroundImage = `url(${movie.img.replace('/w500/', '/w1280/')})`;
  document.getElementById('title').textContent = movie.title;
  document.getElementById('desc').textContent = movie.desc;

  // Re-trigger animation
  const content = banner.querySelector('.banner-content');
  content.style.animation = 'none';
  requestAnimationFrame(() => {
    content.style.animation = '';
  });
}

// ── PLAY BANNER ──────────────────────────────────────────────────────────────
function playBanner() {
  openPlayer(bannerMovie.trailer);
}
window.playBanner = playBanner;

// ── RENDER ROW ───────────────────────────────────────────────────────────────
function renderRow(containerId, movieList) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  movieList.forEach((movie, i) => {
    const card = createCard(movie, i);
    container.appendChild(card);
  });
}

function createCard(movie, index) {
  const card = document.createElement('div');
  card.className = 'card';
  card.style.animationDelay = `${index * 60}ms`;

  card.innerHTML = `
    <img src="${movie.img}" alt="${movie.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/200x300/161616/444?text=No+Image'">
    <div class="card-info">
      <h3>${movie.title}</h3>
      <span>${movie.year} · ${movie.genre}</span>
      <div class="card-play">▶</div>
    </div>
  `;

  card.addEventListener('click', () => {
    updateBanner(movie);
    openPlayer(movie.trailer);
  });

  // Hover: update banner without playing
  card.addEventListener('mouseenter', () => updateBanner(movie));

  return card;
}

// ── PLAYER ───────────────────────────────────────────────────────────────────
function setupCloseButton() {
  closeBtn = document.createElement('button');
  closeBtn.id = 'close-player';
  closeBtn.innerHTML = '✕';
  closeBtn.title = 'Close';
  closeBtn.addEventListener('click', closePlayer);
  document.body.appendChild(closeBtn);
}

function openPlayer(trailerId) {
  const player = document.getElementById('player');
  player.src = `https://www.youtube.com/embed/${trailerId}?autoplay=1&rel=0&modestbranding=1`;
  player.classList.add('active');
  closeBtn.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closePlayer() {
  const player = document.getElementById('player');
  player.src = '';
  player.classList.remove('active');
  closeBtn.classList.remove('active');
  document.body.style.overflow = '';
}

// Close on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closePlayer();
});

// ── FOOTER ───────────────────────────────────────────────────────────────────
function addFooter() {
  const footer = document.createElement('footer');
  footer.innerHTML = 'MYFLIX &nbsp;·&nbsp; FOR DEMO PURPOSES ONLY';
  document.body.appendChild(footer);
}
