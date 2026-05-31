import React, { useEffect, useState } from "react";
import "./BookmarksPage.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

const BASE = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";


function BookmarksPage() {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {

  if (!user?.user_id) return

  fetch(`${BASE}/bookmarks/${user?.user_id}`)
    .then(res => res.json())
    .then(data => {
      setBookmarks(data);
      setLoading(false);
    })
    .catch(() => setLoading(false));

}, [user]);

  const filtered = bookmarks.filter(b =>
    b.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bookmark-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">BOOKMARKS</h1>
          <p className="page-subtitle">{bookmarks.length} saved webtoons</p>
        </div>
        <div className="page-controls">
          <input
            type="text"
            placeholder="Search bookmarks..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select>
            <option>Recently Added</option>
            <option>Top Rated</option>
            <option>A–Z</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="empty-grid"><p>Loading...</p></div>
      ) : filtered.length === 0 ? (
        <div className="empty-grid">
          <p>🎟️</p>
          <p>{search ? "No matches found." : "No bookmarks yet. Start exploring!"}</p>
        </div>
      ) : (
        <div className="bookmark-grid">
          {filtered.map(toon => (
            <div className="bookmark-card" key={toon.id}>
              <div className="bookmark-image">
                <img src={toon.image_url || "https://placehold.co/300x420/1c1c21/888?text=..."} alt={toon.title} />
                <button className="heart-btn">💜</button>
              </div>
              <div className="bookmark-content">
                <h3>{toon.title}</h3>
                <p className="genre">{toon.genre1}{toon.genre2 ? `, ${toon.genre2}` : ""}</p>
                <div className="rating">★ {toon.rating}</div>
                <button className="remove-btn" onClick={(e) => {
                  e.stopPropagation();
                  fetch(`${BASE}/delete-bookmarks/${toon.bookmark_id}`, { method: "DELETE" })
                    .then(() => setBookmarks(bookmarks.filter(b => b.bookmark_id !== toon.bookmark_id)));
                }}>✕ Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="discover-banner">
        <div>
          <h2>DISCOVER MORE WEBTOONS</h2>
          <p>Find your next favourite story.</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate("/search")}>Explore →</button>
      </div>
    </div>
  );
}

export default BookmarksPage;