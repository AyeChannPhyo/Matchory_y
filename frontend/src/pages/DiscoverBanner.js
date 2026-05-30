import { Link } from "react-router-dom";
import "./DiscoverBanner.css";

export default function DiscoverBanner() {
  return (
    <Link to="/discover" className="discover-banner">
      <div className="discover-banner-left">
        <div className="discover-banner-icon">
          <i className="ti ti-wand" aria-hidden="true"></i>
        </div>
        <div>
          <h2 className="discover-banner-title">Find your vibe</h2>
          <p className="discover-banner-sub">Tell us your mood, we'll find your webtoon.</p>
        </div>
      </div>
      <span className="discover-banner-btn">
        Start <i className="ti ti-arrow-right" aria-hidden="true"></i>
      </span>
    </Link>
  );
}