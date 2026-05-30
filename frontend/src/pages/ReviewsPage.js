import "./ReviewsPage.css";
import { useAuth } from "../AuthContext";
import { useEffect, useState } from "react";

const BASE = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

function StarPicker({ value, onChange }) {
  return (
    <div className="star-picker">
      {[1,2,3,4,5].map(n => (
        <button
          key={n}
          className={n <= value ? "lit" : ""}
          onClick={() => onChange(n)}
          type="button"
        >★</button>
      ))}
    </div>
  );
}

function ReviewsPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);

  // --- review form state ---
  const [query, setQuery] = useState("");          // what the user types
  const [matches, setMatches] = useState([]);       // dropdown options
  const [picked, setPicked] = useState(null);       // the chosen webtoon {id, title}
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadReviews = () => {
    fetch(`${BASE}/reviews/${user?.user_id}`)
      .then(r => r.json())
      .then(data => { setReviews(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { loadReviews(); }, []);

  // search titles as the user types (skips if they've already picked one)
  useEffect(() => {
    if (picked || query.trim().length < 1) { setMatches([]); return; }
    const t = setTimeout(() => {
      fetch(`${BASE}/search?q=${encodeURIComponent(query)}`)
        .then(r => r.json())
        .then(data => setMatches(Array.isArray(data) ? data.slice(0, 6) : []))
        .catch(() => setMatches([]));
    }, 250);
    return () => clearTimeout(t);
  }, [query, picked]);

  const pickWebtoon = (toon) => {
    setPicked(toon);
    setQuery(toon.title);
    setMatches([]);
  };

  const clearPick = () => {
    setPicked(null);
    setQuery("");
    setMatches([]);
  };

  const addReview = async () => {
    if (!picked || !rating || !comment.trim()) return;
    setSubmitting(true);
    await fetch(`${BASE}/add-review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: user?.user_id || 1,
        id: picked.id,                 // ← was webtoon_id, now id
        rating: parseFloat(rating),
        comment
      }),
    }).catch(() => {});
    loadReviews();
    clearPick(); setRating(0); setComment("");
    setSubmitting(false);
  };

  const deleteReview = async (id) => {
    await fetch(`${BASE}/delete-review/${id}`, { method: "DELETE" }).catch(() => {});
    loadReviews();
  };

  return (
    <div className="reviews-page">
      <h1 className="page-title">MY REVIEWS</h1>
      <p className="page-subtitle">{reviews.length} reviews written</p>

      <div className="reviews-layout">
        {/* LEFT: review list */}
        <div>
          {loading ? (
            <div className="empty-reviews"><p>Loading...</p></div>
          ) : reviews.length === 0 ? (
            <div className="empty-reviews">
              <p>💬</p>
              <p>No reviews yet. Write your first one!</p>
            </div>
          ) : (
            <div className="reviews-grid">
              {reviews.map(r => (
                <div className="review-card" key={r.review_id}>
                  <img
                    src={r.image_url || `https://placehold.co/300x400/6366f1/fff?text=${encodeURIComponent(r.title?.slice(0, 3) || "...")}`}
                    alt="cover"
                  />
                  <div className="review-card-body">
                    <h2>{r.title || `Webtoon #${r.webtoon_id}`}</h2>
                    <div className="review-stars">
                      {[1,2,3,4,5].map(n => (
                        <span key={n} className={n <= r.score ? "star-filled" : "star-empty"}>★</span>
                      ))}
                    </div>
                    <p className="review-comment">{r.comment}</p>
                    <div className="review-meta">
                      <span className="review-date">{r.created_at}</span>
                      <button className="btn btn-danger" onClick={() => deleteReview(r.review_id)}>
                        X Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: write panel */}
        <div className="write-panel">
          <h2>WRITE A REVIEW</h2>

          <div className="field">
            <label>Webtoon</label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                placeholder="Type a webtoon title..."
                value={query}
                onChange={e => { setQuery(e.target.value); setPicked(null); }}
              />
              {picked && (
                <button
                  type="button"
                  onClick={clearPick}
                  style={{ position: "absolute", right: 8, top: 8, background: "none", border: "none", cursor: "pointer" }}
                  aria-label="Clear selection"
                >✕</button>
              )}
              {matches.length > 0 && (
                <div style={{
                  position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10,
                  background: "#fff", border: "1px solid #eee", borderRadius: 8,
                  marginTop: 4, maxHeight: 220, overflowY: "auto",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.08)"
                }}>
                  {matches.map(m => (
                    <div
                      key={m.id}
                      onClick={() => pickWebtoon(m)}
                      style={{ padding: "10px 12px", cursor: "pointer", borderBottom: "1px solid #f4f4f4" }}
                    >
                      <div style={{ fontWeight: 500 }}>{m.title}</div>
                      <div style={{ fontSize: 13, color: "#888" }}>{m.genre} · ★ {m.rating}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {picked && (
              <div style={{ fontSize: 13, color: "#6366f1", marginTop: 6 }}>
                Selected: {picked.title}
              </div>
            )}
          </div>

          <div className="field">
            <label>Rating</label>
            <StarPicker value={rating} onChange={setRating} />
          </div>

          <div className="field">
            <label>Comment</label>
            <textarea
              placeholder="What did you think?"
              value={comment}
              onChange={e => setComment(e.target.value)}
            />
          </div>

          <button
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center" }}
            onClick={addReview}
            disabled={submitting || !picked || !rating || !comment.trim()}
          >
            {submitting ? "Submitting..." : "Submit Review"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReviewsPage;