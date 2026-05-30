import "./App.css";
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext";
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import SearchPage from "./pages/SearchPage";
import BookmarksPage from "./pages/BookmarksPage";
import ReviewsPage from "./pages/ReviewsPage";
import DiscoverPage from "./pages/DiscoverPage";
import ProfilePage from "./pages/ProfilePage";

const navItems = [
  { to: "/",          label: "Home" },
  { to: "/search",    label: "Search" },
  { to: "/bookmarks", label: "Bookmarks" },
  { to: "/reviews",   label: "Reviews" },
  { to: "/discover",   label: "Discover" },
  { to: "/profile",   label: "Profile" },
];

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="sidebar">
      <Link to="/" style={{ textDecoration: "none" }}>
        <h1 className="logo">MATCHORY</h1>
      </Link>
      <nav className="menu">
        {navItems.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            className={"menuItem" + (location.pathname === to ? " active" : "")}
          >
            {label}
          </Link>
        ))}
      </nav>
      <div className="sidebar-spacer" />
      {user ? (
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {user.username?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-username">{user.username}</div>
            <div className="sidebar-email">{user.email}</div>
          </div>
          <button className="sidebar-logout" onClick={logout} title="Sign out">
            Sign out
          </button>
        </div>
      ) : (
        <Link to="/login" className="sidebar-signin-btn">Sign In</Link>
      )}
    </div>
  );
}

function AppLayout() {
  const location = useLocation();
  if (location.pathname === "/login") {
    return <AuthPage />;
  }
  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/bookmarks" element={<ProtectedRoute><BookmarksPage /></ProtectedRoute>} />
          <Route path="/reviews" element={<ProtectedRoute><ReviewsPage /></ProtectedRoute>} />
          <Route path="/discover" element={<ProtectedRoute><DiscoverPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<AuthPage />} />
          <Route path="/*" element={<AppLayout />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;