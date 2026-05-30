import "./ProfilePage.css";
import { useEffect, useState } from "react";
import { useAuth } from "../AuthContext";
import { useNavigate } from "react-router-dom";

const BASE = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

function renderStars(score) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(i <= score ? "★" : "☆");
  }
  return stars.join("");
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [reviews, setReviews] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Fetch stats
    fetch(`${BASE}/profile/${user.user_id}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) setStats(data.stats);
      })
      .catch(() => {});

    // Fetch user's reviews
    fetch(`${BASE}/my-reviews/${user.user_id}`)
      .then(r => r.json())
      .then(data => Array.isArray(data) ? setReviews(data) : setReviews([]))
      .catch(() => setReviews([]));

    // Fetch user's bookmarks
    fetch(`${BASE}/my-bookmarks/${user.user_id}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setBookmarks(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user]);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="profile-page">
      {/* HEADER */}
      <div className="profile-top">
        <div className="profile-avatar">
          {user.username?.charAt(0).toUpperCase() || "U"}
        </div>
        <div className="profile-info">
          <h1>{user.username?.toUpperCase()}</h1>
          <div className="email">{user.email}</div>
          {user.preferred_genre && (
            <span className="genre-tag">{user.preferred_genre}</span>
          )}
          <div className="joined">
            Member since {user.joined_at?.split("T")[0] || user.joined_at?.split(" ")[0] || "—"}
          </div>
        </div>
        <button className="signout-btn" onClick={handleLogout}>Sign out</button>
      </div>

      {/* STATS */}
      <div className="profile-stats">
        <div className="p-stat">
          <div className="value">{stats.total_reviews ?? 0}</div>
          <div className="label">Reviews</div>
        </div>
        <div className="p-stat">
          <div className="value">{stats.total_bookmarks ?? 0}</div>
          <div className="label">Bookmarks</div>
        </div>
        <div className="p-stat">
          <div className="value">{stats.avg_rating ?? 0}</div>
          <div className="label">Avg. rating</div>
        </div>
      </div>

      {/* TWO COLUMNS */}
      {loading ? (
        <div className="profile-loading">Loading...</div>
      ) : (
        <div className="profile-columns">
          {/* REVIEWS */}
          <div className="profile-box">
            <h2>My reviews <span className="count">{reviews.length}</span></h2>
            {reviews.length === 0 ? (
              <div className="profile-empty">No reviews yet. Go rate some webtoons!</div>
            ) : (
              reviews.map(r => (
                <div className="rv-item" key={r.review_id}>
                  <div className="rv-thumb">
                    <img
                      src={r.image_url || `https://placehold.co/80x104/6366f1/fff?text=${encodeURIComponent(r.title?.slice(0, 2) || "...")}`}
                      alt={r.title}
                    />
                  </div>
                  <div className="rv-body">
                    <h4>{r.title}</h4>
                    <div className="genre">{r.genre}</div>
                    <div className="rv-stars">{renderStars(r.score)}</div>
                    {r.comment && <div className="rv-comment">"{r.comment}"</div>}
                  </div>
                  <div className="rv-date">{formatDate(r.created_at)}</div>
                </div>
              ))
            )}
          </div>

          {/* BOOKMARKS */}
          <div className="profile-box">
            <h2>My bookmarks <span className="count">{bookmarks.length}</span></h2>
            {bookmarks.length === 0 ? (
              <div className="profile-empty">No bookmarks yet. Save webtoons you like!</div>
            ) : (
              bookmarks.map(b => (
                <div
                  className="bk-item"
                  key={b.bookmark_id}
                  onClick={() => b.link && window.open(b.link, "_blank")}
                >
                  <div className="bk-thumb">
                    <img
                      src={b.image_url || `https://placehold.co/80x104/6366f1/fff?text=${encodeURIComponent(b.title?.slice(0, 2) || "...")}`}
                      alt={b.title}
                    />
                  </div>
                  <div className="bk-body">
                    <h4>{b.title}</h4>
                    <div className="genre">{b.genre}</div>
                  </div>
                  <div className="bk-rating">{b.rating}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}