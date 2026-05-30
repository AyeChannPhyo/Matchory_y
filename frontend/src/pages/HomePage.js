import "./HomePage.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import DiscoverBanner from "./DiscoverBanner";

const BASE = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

const safeFetch = (url) =>
  fetch(url)
    .then(r => r.json())
    .then(data => Array.isArray(data) ? data : [])
    .catch(() => []);

const safeFetchObj = (url) =>
  fetch(url)
    .then(r => r.json())
    .then(data => (typeof data === "object" && !Array.isArray(data)) ? data : {})
    .catch(() => ({}));

const MOODS = [
  { id: "excited",   label: "Excited",    icon: "ti-flame",       color: "#e24b4a", genres: ["액션", "스릴러"] },
  { id: "romantic",  label: "Romantic",   icon: "ti-heart",       color: "#d4537e", genres: ["로맨스", "드라마"] },
  { id: "escape",    label: "Escape",     icon: "ti-wand",        color: "#5b4fff", genres: ["무협/사극", "감성"] },
  { id: "relaxed",   label: "Relaxed",    icon: "ti-mood-smile",  color: "#639922", genres: ["개그", "일상"] },
  { id: "thinker",   label: "Thoughtful", icon: "ti-brain",       color: "#ba7517", genres: ["감성", "스릴러"] },
  { id: "chills",    label: "Chills",     icon: "ti-ghost",       color: "#5f5e5a", genres: ["스릴러", "액션"] },
];

function WebtoonCard({ toon, bookmarkedIds, onToggleBookmark }) {
  const isSaved = bookmarkedIds?.includes(toon.id);

  return (
    <div className="webtoon-card" onClick={() => toon.link && window.open(toon.link, "_blank")} style={{ cursor: toon.link ? "pointer" : "default" }}>
      <div className="webtoon-image">
        <img
          src={toon.image_url || `https://placehold.co/300x420/6366f1/fff?text=${encodeURIComponent(toon.title?.slice(0, 4) || "...")}`}
          alt={toon.title}
        />
      </div>
      <div className="webtoon-info">
        <div className="info-row">
          <h3>{toon.title}</h3>
          <button
            className={"bookmark-btn" + (isSaved ? " saved" : "")}
            onClick={(e) => {
              e.stopPropagation();
              onToggleBookmark && onToggleBookmark(toon.id, isSaved);
            }}
          >
            <i className="ti ti-bookmark" aria-hidden="true"></i>
          </button>
        </div>
        <div className="genre-tag">{toon.genre}</div>
        <div className="rating">{toon.rating}</div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [trending, setTrending] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [mightLike, setMightLike] = useState([]);
  const [stats, setStats] = useState({});
  const [moodPicks, setMoodPicks] = useState([]);
  const [activeMood, setActiveMood] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookmarkedIds, setBookmarkedIds] = useState([]);

  // Load trending + top rated (always)
  useEffect(() => {
    Promise.all([
      safeFetch(`${BASE}/trending`),
      safeFetch(`${BASE}/top-rated`),
    ]).then(([t, top]) => {
      setTrending(t);
      setTopRated(top);
      setLoading(false);
    });
  }, []);

  // Load user-specific data when logged in
  useEffect(() => {
    if (!user) return;
    safeFetchObj(`${BASE}/user-stats/${user.user_id}`).then(setStats);
    safeFetch(`${BASE}/you-might-like/${user.user_id}`).then(setMightLike);
    safeFetch(`${BASE}/bookmarked-ids/${user.user_id}`).then(setBookmarkedIds);
  }, [user]);

  // Mood pick handler
  const pickMood = (mood) => {
    if (activeMood?.id === mood.id) {
      setActiveMood(null);
      setMoodPicks([]);
      return;
    }
    setActiveMood(mood);
    safeFetch(`${BASE}/mood-picks?genres=${mood.genres.join(",")}`).then(setMoodPicks);
  };

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
  // Time-based greeting
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="home-page">
      {/* TOP BAR */}
      <div className="top-bar">
        <div className="greeting">
          <h1>
            {user
              ? <>{timeGreeting}, <strong>{user.username}</strong></>
              : <>Welcome to <strong>Matchory</strong></>
            }
          </h1>
          {user && user.preferred_genre && (
            <p>Your preferred genre: {user.preferred_genre}</p>
          )}
        </div>
        <div className="search-wrap">
          <input
            className="search-bar"
            type="text"
            placeholder="Search webtoons..."
            onKeyDown={e => e.key === "Enter" && navigate("/search")}
          />
        </div>
      </div>

      {/* MOOD MAP */}
      <div className="mood-section">
        <h2>How are you feeling?</h2>
        <p>Pick a vibe and we'll find webtoons that match.</p>
        <div className="mood-grid">
          {MOODS.map(mood => (
            <div
              key={mood.id}
              className={"mood-card" + (activeMood?.id === mood.id ? " active" : "")}
              onClick={() => pickMood(mood)}
            >
              <i className={"ti " + mood.icon} style={{ color: mood.color }} aria-hidden="true"></i>
              <div className="mood-label">{mood.label}</div>
              <div className="mood-genres">{mood.genres.join(", ")}</div>
            </div>
          ))}
        </div>

        {activeMood && (
          <div className="mood-results">
            <h3>{activeMood.label} picks for you</h3>
            {moodPicks.length === 0 ? (
              <div className="empty-state">No results found for this mood.</div>
            ) : (
              <div className="webtoon-grid">
                {moodPicks.slice(0, 20).map(t => <WebtoonCard key={t.id} toon={t} bookmarkedIds={bookmarkedIds} onToggleBookmark={toggleBookmark} />)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* TRENDING */}
      <div className="section">
        <div className="section-header">
          <h2>Trending now</h2>
          <span onClick={() => navigate("/search")}>See all</span>
        </div>
        {loading ? (
          <p className="loading-text">Loading...</p>
        ) : (
          <div className="webtoon-grid">
            {trending.slice(0, 9).map(t => <WebtoonCard key={t.id} toon={t} bookmarkedIds={bookmarkedIds} onToggleBookmark={toggleBookmark} />)}
          </div>
        )}
      </div>

      {/* DISCOVER BANNER */}
      <DiscoverBanner />
    </div>
  );
}