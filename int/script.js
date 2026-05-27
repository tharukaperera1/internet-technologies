// -------------------- CONFIGURATION --------------------
// OMDb API Key (free tier - works for educational purposes)
// You can replace with your own key from https://www.omdbapi.com/
const API_KEY = "1c768e4f";
const BASE_URL = "https://www.omdbapi.com/";

// Helper fetch function
async function fetchOMDb(params) {
  const url = new URL(BASE_URL);
  url.searchParams.append("apikey", API_KEY);
  for (let [key, val] of Object.entries(params)) {
    if (val) url.searchParams.append(key, val);
  }
  try {
    const response = await fetch(url.toString());
    const data = await response.json();
    if (data.Response === "False") {
      throw new Error(data.Error || "No results found");
    }
    return data;
  } catch (err) {
    console.error("API Error:", err);
    throw err;
  }
}

// Show modal with full movie details
async function showMovieDetails(imdbID) {
  try {
    const movie = await fetchOMDb({ i: imdbID, plot: "full" });
    renderModalContent(movie);
  } catch (error) {
    alert("Movie details error: " + error.message);
  }
}

function renderModalContent(movie) {
  const modalDiv = document.getElementById("modalDynamicContent");
  modalDiv.innerHTML = `
    <div style="display: flex; flex-wrap: wrap; gap: 20px;">
      <img src="${movie.Poster !== "N/A" ? movie.Poster : "https://via.placeholder.com/300x450?text=No+Poster"}" 
           class="detail-poster" alt="${movie.Title}" style="width: 180px; border-radius: 24px;">
      <div style="flex:1;">
        <h2>${movie.Title} (${movie.Year})</h2>
        <div class="detail-meta">
          <span>⭐ ${movie.imdbRating || "N/A"}/10</span>
          <span>🎭 ${movie.Genre || "N/A"}</span>
          <span>📅 ${movie.Released || movie.Year}</span>
          <span>⏳ ${movie.Runtime || "N/A"}</span>
        </div>
        <div class="detail-meta">
          <span>🎬 Director: ${movie.Director || "N/A"}</span>
          <span>✍️ Writer: ${movie.Writer || "N/A"}</span>
        </div>
        <p><strong>Actors:</strong> ${movie.Actors || "N/A"}</p>
        <p class="plot"><strong>Plot:</strong> ${movie.Plot || "No plot available"}</p>
        <p><strong>Country:</strong> ${movie.Country || "—"} | <strong>Awards:</strong> ${movie.Awards || "—"}</p>
        <p><strong>IMDb ID:</strong> ${movie.imdbID} &nbsp; <button class="small-btn" style="margin-top:8px; width:auto; background:#ffc857;" id="closeModalBtn">Close</button></p>
      </div>
    </div>
  `;
  const modal = document.getElementById("movieModal");
  modal.style.display = "flex";
  document.getElementById("closeModalBtn")?.addEventListener("click", () => { modal.style.display = "none"; });
}

// Modal close handlers
document.querySelector(".close-modal").addEventListener("click", () => {
  document.getElementById("movieModal").style.display = "none";
});
window.addEventListener("click", (e) => {
  const modal = document.getElementById("movieModal");
  if (e.target === modal) modal.style.display = "none";
});

// Create movie card for grid
function createMovieCard(movie) {
  if (!movie || !movie.imdbID) return null;
  const card = document.createElement("div");
  card.className = "movie-card";
  card.addEventListener("click", () => showMovieDetails(movie.imdbID));
  const poster = (movie.Poster && movie.Poster !== "N/A") ? movie.Poster : "https://via.placeholder.com/300x450?text=No+Image";
  const year = movie.Year || "—";
  const title = movie.Title || "Untitled";
  card.innerHTML = `
    <img class="movie-poster" src="${poster}" alt="${title}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x450?text=Poster+Missing'">
    <div class="movie-info">
      <div class="movie-title">${title}</div>
      <div class="movie-year">${year}</div>
      <div class="rating-badge">🔍 click for details</div>
    </div>
  `;
  return card;
}

// ==================== FEATURE 1: Search by Title ====================
document.getElementById("searchTitleBtn").addEventListener("click", async () => {
  const title = document.getElementById("titleInput").value.trim();
  if (!title) return alert("Enter a movie title");
  try {
    const movie = await fetchOMDb({ t: title, plot: "short" });
    renderModalContent(movie);
  } catch (err) {
    alert(`Movie not found: ${err.message}`);
  }
});

// ==================== FEATURE 2: Random Movie Generator ====================
document.getElementById("randomMovieBtn").addEventListener("click", async () => {
  const randomWords = ["love", "star", "king", "dark", "space", "world", "time", "dream", "secret", "life", "good", "bad", "great"];
  const randWord = randomWords[Math.floor(Math.random() * randomWords.length)];
  try {
    const data = await fetchOMDb({ s: randWord, type: "movie" });
    if (data.Search && data.Search.length > 0) {
      const randomIndex = Math.floor(Math.random() * data.Search.length);
      const randomMovie = data.Search[randomIndex];
      await showMovieDetails(randomMovie.imdbID);
    } else {
      const fallback = await fetchOMDb({ t: "Inception" });
      renderModalContent(fallback);
    }
  } catch (err) {
    alert("Random movie failed: " + err.message);
  }
});

// ==================== FEATURE 3: Search by Keyword ====================
document.getElementById("searchKeywordBtn").addEventListener("click", async () => {
  const keyword = document.getElementById("keywordInput").value.trim();
  if (!keyword) return alert("Enter keyword e.g., batman");
  try {
    const data = await fetchOMDb({ s: keyword, type: "movie" });
    const movies = data.Search || [];
    const grid = document.getElementById("keywordResultsGrid");
    const titleSection = document.getElementById("keywordResultTitle");
    if (movies.length === 0) {
      grid.innerHTML = `<div style="grid-column:1/-1; text-align:center;">No movies found for "${keyword}"</div>`;
      titleSection.style.display = "block";
      return;
    }
    titleSection.style.display = "block";
    grid.innerHTML = "";
    movies.forEach(movie => {
      const card = createMovieCard(movie);
      if (card) grid.appendChild(card);
    });
    titleSection.scrollIntoView({ behavior: "smooth" });
  } catch (err) {
    alert("Keyword search error: " + err.message);
  }
});

// ==================== FEATURE 4: Browse by IMDb ID ====================
document.getElementById("searchImdbBtn").addEventListener("click", async () => {
  let imdb = document.getElementById("imdbIdInput").value.trim();
  if (!imdb) return alert("Enter IMDb ID like tt1375666");
  if (!imdb.startsWith("tt")) imdb = "tt" + imdb;
  try {
    const movie = await fetchOMDb({ i: imdb, plot: "short" });
    renderModalContent(movie);
  } catch (err) {
    alert(`IMDb ID not found: ${err.message}`);
  }
});

// ==================== FEATURE 5 & 6: Top Rated / Popular Movies ====================
const TOP_IMDB_IDS = [
  "tt0111161",  // The Shawshank Redemption
  "tt0068646",  // The Godfather
  "tt0468569",  // The Dark Knight
  "tt1375666",  // Inception
  "tt0133093",  // The Matrix
  "tt0816692",  // Interstellar
  "tt7286456",  // Joker
  "tt4154796",  // Avengers Endgame
  "tt0120737",  // The Lord of the Rings: Fellowship
  "tt0241527",  // Harry Potter Sorcerer's Stone
  "tt1877830",  // The Batman 2022
  "tt6723592",  // Tenet
  "tt8579674",  // 1917
  "tt6966692",  // Green Book
  "tt5311514"   // Your Name
];

async function loadTopRatedMovies() {
  const gridContainer = document.getElementById("popularMoviesGrid");
  gridContainer.innerHTML = '<div class="loader">Loading top movies...</div>';
  try {
    const moviePromises = TOP_IMDB_IDS.map(id => fetchOMDb({ i: id, plot: "short" }).catch(err => null));
    const movies = await Promise.all(moviePromises);
    const validMovies = movies.filter(m => m && m.Response !== "False");
    gridContainer.innerHTML = "";
    if (validMovies.length === 0) {
      gridContainer.innerHTML = "<div>Could not load curated movies. Check API key or network.</div>";
      return;
    }
    validMovies.forEach(movie => {
      const card = createMovieCard(movie);
      if (card) gridContainer.appendChild(card);
    });
  } catch (err) {
    gridContainer.innerHTML = `<div>Error loading top movies: ${err.message}</div>`;
  }
}

// Refresh top rated section on button click
document.getElementById("topRatedBtn").addEventListener("click", () => {
  loadTopRatedMovies();
  document.getElementById("popularMoviesGrid").scrollIntoView({ behavior: "smooth" });
});

// Enter key support
const titleInput = document.getElementById("titleInput");
titleInput.addEventListener("keypress", (e) => { if(e.key === "Enter") document.getElementById("searchTitleBtn").click(); });
const keywordInput = document.getElementById("keywordInput");
keywordInput.addEventListener("keypress", (e) => { if(e.key === "Enter") document.getElementById("searchKeywordBtn").click(); });
const imdbInput = document.getElementById("imdbIdInput");
imdbInput.addEventListener("keypress", (e) => { if(e.key === "Enter") document.getElementById("searchImdbBtn").click(); });

// Initialize app
loadTopRatedMovies();
console.log("CineScout ready — OMDb Movie Discovery");