import "./DiscoverPage.css";
import "./HomePage.css";              // reuse the webtoon-card styles
import { useState } from "react";
import { useAuth } from "../AuthContext";

const BASE = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

// Step 1: your existing 6 moods, each maps to genres
const MOODS = [
  { id: "excited",   label: "Excited",    icon: "ti-flame",      genres: ["액션", "스릴러"] },
  { id: "romantic",  label: "Romantic",   icon: "ti-heart",      genres: ["로맨스", "드라마"] },
  { id: "escape",    label: "Escape",     icon: "ti-wand",       genres: ["무협/사극", "감성"] },
  { id: "relaxed",   label: "Relaxed",    icon: "ti-mood-smile", genres: ["개그", "일상"] },
  { id: "thinker",   label: "Thoughtful", icon: "ti-brain",      genres: ["감성", "스릴러"] },
  { id: "chills",    label: "Chills",     icon: "ti-ghost",      genres: ["스릴러", "액션"] },
];

// Step 2: light vs intense (just affects min rating here; tweak as you like)
const INTENSITY = [
  { id: "light",   label: "Light & easy",      icon: "ti-feather" },
  { id: "intense", label: "Intense & gripping", icon: "ti-flame" },
];

// Step 3: status
const STATUS = [
  { id: "completed", label: "Completed", icon: "ti-check",         completed: "true" },
  { id: "ongoing",   label: "Ongoing",   icon: "ti-player-play",   completed: "false" },
  { id: "either",    label: "Either",    icon: "ti-arrows-shuffle", completed: "" },
];

export default function DiscoverPage() {
  const { user } = useAuth();

  const [step, setStep] = useState(1);          // 1, 2, 3, or 4 (results)
  const [mood, setMood] = useState(null);
  const [intensity, setIntensity] = useState(null);
  const [status, setStatus] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState([]);

  // Load which webtoons are already bookmarked (for the heart/bookmark state)
  const loadBookmarks = () => {
    if (!user) return;
    fetch(`${BASE}/bookmarked-ids/${user.user_id}`)
      .then(r => r.json())
      .then(ids => setBookmarkedIds(Array.isArray(ids) ? ids : []))
      .catch(() => {});
  };

  // Final step: fetch results from /search using the chosen filters
  const runSearch = (chosenMood, chosenIntensity, chosenStatus) => {
    setLoading(true);
    setStep(4);
    loadBookmarks();

    // Use the first genre of the mood as the genre filter
    const genre = chosenMood.genres[0];
    const params = new URLSearchParams();
    params.append("genre", genre);
    if (chosenIntensity.id === "intense") params.append("min_rating", "9");
    if (chosenStatus.completed) params.append("completed", chosenStatus.completed);

    fetch(`${BASE}/search?${params}`)
      .then(r => r.json())
      .then(data => { setResults(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const pickMood = (m) => { setMood(m); setStep(2); };
  const pickIntensity = (i) => { setIntensity(i); setStep(3); };
  const pickStatus = (s) => { setStatus(s); runSearch(mood, intensity, s); };

  const startOver = () => {
    setStep(1); setMood(null); setIntensity(null); setStatus(null); setResults([]);
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

  const progress = step === 1 ? 33 : step === 2 ? 66 : 100;

  return (
    <div className="discover-page">
      <div className="discover-header">
        <div>
          <h1>DISCOVER</h1>
          <p>Tell us your vibe, we'll find your webtoon.</p>
        </div>
        {step === 4 && (
          <button className="startover-btn" onClick={startOver}>
            <i className="ti ti-refresh" aria-hidden="true"></i> Start over
          </button>
        )}
      </div>

      {/* chips showing locked-in answers */}
      {step > 1 && (
        <div className="chips">
          {mood && <span className="chip">{mood.label} <i className="ti ti-check" aria-hidden="true"></i></span>}
          {intensity && step > 2 && <span className="chip">{intensity.label} <i className="ti ti-check" aria-hidden="true"></i></span>}
          {status && step > 3 && <span className="chip">{status.label} <i className="ti ti-check" aria-hidden="true"></i></span>}
        </div>
      )}

      {/* QUESTION STATES */}
      {step < 4 && (
        <div className="quiz-card">
          <div className="step-label">Step {step} of 3</div>
          <div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%` }}></div></div>

          {step === 1 && (
            <>
              <h2 className="question">How are you feeling?</h2>
              <div className="option-grid four">
                {MOODS.map(m => (
                  <button key={m.id} className="option-btn" onClick={() => pickMood(m)}>
                    <i className={"ti " + m.icon} aria-hidden="true"></i>
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="question">Light or intense?</h2>
              <div className="option-grid two">
                {INTENSITY.map(i => (
                  <button key={i.id} className="option-btn" onClick={() => pickIntensity(i)}>
                    <i className={"ti " + i.icon} aria-hidden="true"></i>
                    <span>{i.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="question">Finished or ongoing?</h2>
              <div className="option-grid three">
                {STATUS.map(s => (
                  <button key={s.id} className="option-btn" onClick={() => pickStatus(s)}>
                    <i className={"ti " + s.icon} aria-hidden="true"></i>
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* RESULTS STATE */}
      {step === 4 && (
        <div className="results-block">
          {loading ? (
            <p className="loading-text">Finding your picks...</p>
          ) : results.length === 0 ? (
            <div className="empty-state">
              <i className="ti ti-mood-empty" aria-hidden="true"></i>
              <p>No matches for that combo. Try "Start over" with different choices.</p>
            </div>
          ) : (
            <>
              <p className="results-title">Here's what we found for you</p>
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
                            onClick={(e) => { e.stopPropagation(); toggleBookmark(t.id, isSaved); }}
                          >
                            <i className="ti ti-bookmark" aria-hidden="true"></i>
                          </button>
                        </div>
                        <div className="genre-tag">{t.genre}</div>
                        <div className="rating">★ {t.rating}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}