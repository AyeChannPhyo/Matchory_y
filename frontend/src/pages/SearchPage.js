import "./SearchPage.css";
import "./HomePage.css";              // ← reuse Home's card styles for matching size
import { useEffect, useState } from "react";
import { useAuth } from "../AuthContext";

const BASE = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

const GENRES = ["", "로맨스", "액션", "판타지", "드라마", "스릴러", "개그", "일상", "스포츠", "감성", "무협/사극"];
const AGE_GROUPS = ["전체연령가", "12세 이용가", "15세 이용가", "18세 이용가"];

function SearchPage() {
  const { user } = useAuth();
  const [results, setResults] = useState([]);
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("");
  const [minRating, setMinRating] = useState("");
  const [ageGroup, setAgeGroup] = useState("전체연령가");
  const [completed, setCompleted] = useState("");
  const [loading, setLoading] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState([]);

  const search = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query)     params.append("q", query);
    if (genre)     params.append("genre", genre);
    if (minRating) params.append("min_rating", minRating);
    if (ageGroup)  params.append("age", ageGroup);
    if (completed) params.append("completed", completed);

    fetch(`${BASE}/search?${params}`)
      .then(r => r.json())
      .then(data => { setResults(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { search(); }, []);
  useEffect(() => { search(); }, [genre, ageGroup, completed]);

  // Load which webtoons are already bookmarked
  useEffect(() => {
    if (!user) return;
    fetch(`${BASE}/bookmarked-ids/${user.user_id}`)
      .then(r => r.json())
      .then(ids => setBookmarkedIds(Array.isArray(ids) ? ids : []))
      .catch(() => {});
  }, [user]);

  const toggleBookmark = async (webtoonId, isSaved) => {
    if (!user) return;
    if (isSaved) {
      const bk = await fetch(`${BASE}/my-bookmarks/${user.user_id}`).then(r => r.json());
      const found = bk.find(b => b.webtoon_id === webtoonId);
      if (found) {
        await fetch(`${BASE}/delete-bookmark/${found.bookmark_id}`, { method: "DELETE" });
        setBookmarkedIds(bookmarkedIds.filter(id => id !== webtoonId));
      }
    } else {
      await fetch(`${BASE}/add-bookmark`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.user_id, id: webtoonId })
      });
      setBookmarkedIds([...bookmarkedIds, webtoonId]);
    }
  };

  return (
    <div className="search-page">
      <h1 className="page-title">SEARCH</h1>
      <p className="page-subtitle">Find any webtoon</p>

      <div className="search-top">
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input
            className="search-bar"
            type="text"
            placeholder="Title or author..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && search()}
          />
        </div>
        <button className="btn btn-primary" onClick={search}>Search</button>
      </div>

      <div className="filters-row">
        <label className="filter-label">
          Genre
          <select value={genre} onChange={e => setGenre(e.target.value)}>
            {GENRES.map(g => <option key={g} value={g}>{g || "All genres"}</option>)}
          </select>
        </label>

        <label className="filter-label">
          Min. Rating
          <input
            type="number"
            placeholder="e.g. 8.5"
            value={minRating}
            min="0" max="10" step="0.5"
            onChange={e => setMinRating(e.target.value)}
          />
        </label>

        <label className="filter-label">
          Age Rating
          <select value={ageGroup} onChange={e => setAgeGroup(e.target.value)}>
            {AGE_GROUPS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </label>

        <label className="filter-label">
          Status
          <select value={completed} onChange={e => setCompleted(e.target.value)}>
            <option value="">Any</option>
            <option value="true">Completed</option>
            <option value="false">Ongoing</option>
          </select>
        </label>
      </div>

      {!loading && (
        <p className="results-count">
          <strong>{results.length}</strong> result{results.length !== 1 ? "s" : ""} found
        </p>
      )}

      {loading ? (
        <div className="no-results"><p>Loading...</p></div>
      ) : results.length === 0 ? (
        <div className="no-results">
          <p>🔍</p>
          <p>No webtoons found. Try different filters.</p>
        </div>
      ) : (
        <div className="webtoon-grid">
          {results.map(t => {
            const isSaved = bookmarkedIds.includes(t.id);
            return (
              <div
                className="webtoon-card"
                key={t.id}
                onClick={() => t.link && window.open(t.link, "_blank")}
                style={{ cursor: t.link ? "pointer" : "default" }}
              >
                <div className="webtoon-image">
                  <img
                    src={t.image_url || `https://placehold.co/300x420/6366f1/fff?text=${encodeURIComponent(t.title?.slice(0, 4) || "...")}`}
                    alt={t.title}
                  />
                </div>
                <div className="webtoon-info">
                  <div className="info-row">
                    <h3>{t.title}</h3>
                    <button
                      className={"bookmark-btn" + (isSaved ? " saved" : "")}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleBookmark(t.id, isSaved);
                      }}
                    >
                      <i className="ti ti-bookmark" aria-hidden="true"></i>
                    </button>
                  </div>
                  <div className="genre-tag">
                    {t.genre} {t.completed && <span className="completed-badge">Done</span>}
                  </div>
                  <div className="rating">★ {t.rating}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default SearchPage;