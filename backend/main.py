from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
from pydantic import BaseModel
from datetime import datetime
import os

app = FastAPI()

# =========================================
# CORS
# =========================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================================
# DATABASE CONNECTION
# =========================================

def get_connection():
    db_url = os.environ.get("DATABASE_URL")
    if db_url:
        conn = psycopg2.connect(db_url)
    else:
        conn = psycopg2.connect(
            host="localhost",
            database="Matchory",
            user="postgres",
            password="1234"
        )
    return conn


# =========================================
# HOME
# =========================================

@app.get("/")
def home():
    return {"message": "Matchory Backend Running!"}


# =========================================
# TRENDING
# =========================================

@app.get("/trending")
def trending():

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
    SELECT
        id,
        title,
        genre,
        rating,
        image_url,
        link
    FROM webtoons
    ORDER BY rating DESC
    LIMIT 9
""")

    rows = cur.fetchall()

    result = []

    for row in rows:

        result.append({
            "id": row[0],
            "title": row[1],
            "genre": row[2],
            "rating": float(row[3]),
            "image_url": row[4] or "",
            "link": row[5] or ""
        })

    cur.close()
    conn.close()

    return result


# =========================================
# RECOMMENDED
# =========================================

@app.get("/recommended")
def recommended():

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT
            id,
            title,
            genre,
            rating
        FROM webtoons
        ORDER BY rating DESC
        LIMIT 6
    """)

    rows = cur.fetchall()

    result = []

    for row in rows:

        result.append({
            "id": row[0],
            "title": row[1],
            "genre": row[2],
            "rating": float(row[3]),

            "image": "https://placehold.co/300x420"
        })

    cur.close()
    conn.close()

    return result

# =========================================
# TOP RATED
# =========================================

@app.get("/top-rated")
def top_rated():

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
    SELECT
        id,
        title,
        genre,
        rating,
        image_url,
        link
    FROM webtoons
    ORDER BY rating DESC
    LIMIT 9
""")

    rows = cur.fetchall()

    result = []

    for row in rows:

        result.append({
            "id": row[0],
            "title": row[1],
            "genre": row[2],
            "rating": float(row[3]),
            "image_url": row[4] or "",
            "link": row[5] or ""
        })

    cur.close()
    conn.close()

    return result


@app.get("/bookmarks/{user_id}")
def get_bookmarks(user_id: int):

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT
            b.bookmark_id,
            w.id,
            w.title,
            w.genre,
            w.rating,
            w.image_url,
            w.link
        FROM bookmarks b
        JOIN webtoons w
        ON b.id = w.id
        WHERE b.user_id = %s
        ORDER BY b.saved_at DESC
    """, (user_id,))

    rows = cur.fetchall()

    result = []

    for row in rows:
        result.append({
            "bookmark_id": row[0],
            "id": row[1],
            "title": row[2],
            "genre": row[3],
            "rating": float(row[4]),
            "image_url": row[5] or "",
            "link": row[6] or ""
        })

    cur.close()
    conn.close()

    return result


@app.delete("/delete-bookmark/{bookmark_id}")
def delete_bookmark(bookmark_id: int):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM bookmarks WHERE bookmark_id = %s", (bookmark_id,))
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Bookmark removed"}

#-----------------------------------
# REVIEW MODEL
# -----------------------------------

class Review(BaseModel):
    user_id: int
    id: int
    rating: float
    comment: str

# -----------------------------------
# GET REVIEWS
# -----------------------------------

@app.get("/reviews/{user_id}")
def get_reviews(user_id: int):

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT
            r.review_id,
            r.score,
            r.comment,
            r.created_at,
            w.id,
            w.title,
            w.genre,
            w.rating,
            w.image_url

        FROM reviews r
        JOIN webtoons w
        ON r.id = w.id
        WHERE r.user_id = %s
        ORDER BY r.created_at DESC
    """, (user_id,))

    rows = cur.fetchall()

    reviews = []

    for row in rows:

        reviews.append({
            "review_id": row[0],
            "score": float(row[1]),
            "comment": row[2],
            "created_at": str(row[3]),
            "webtoon_id": row[4],
            "title": row[5],
            "genre": row[6],
            "webtoon_rating": float(row[7]),
            "image_url": row[8] or ""
        })

    cur.close()
    conn.close()

    return reviews
# -----------------------------------
# ADD REVIEW
# -----------------------------------

@app.post("/add-review")
def add_review(review: Review):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO reviews (user_id, id, score, comment, created_at)
        VALUES (%s, %s, %s, %s, NOW())
    """, (review.user_id, review.id, review.rating, review.comment))
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Review added successfully"}

# -----------------------------------
# DELETE REVIEW
# -----------------------------------

@app.delete("/delete-review/{review_id}")
def delete_review(review_id: int):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM reviews WHERE review_id = %s", (review_id,))
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Review deleted"}

# =========================================
# SEARCH & FILTER
# =========================================

@app.get("/search")
def search_webtoons(
    q: str = "",
    genre: str = "",
    min_rating: float = 0,
    age: str = "",
    completed: str = ""
):
    conn = get_connection()
    cur = conn.cursor()

    sql = "SELECT id, title, author, genre, rating, completed, age, image_url, link FROM webtoons WHERE 1=1"
    params = []

    if q:
        sql += " AND (title ILIKE %s OR author ILIKE %s)"
        params += [f"%{q}%", f"%{q}%"]
    if genre:
        sql += " AND genre ILIKE %s"
        params.append(f"%{genre}%")
    if min_rating:
        sql += " AND rating >= %s"
        params.append(min_rating)
    if age:
        sql += " AND age = %s"
        params.append(age)
    if completed in ("true", "false"):
        sql += " AND completed = %s"
        params.append(completed == "true")

    sql += " ORDER BY rating DESC"
    cur.execute(sql, params)
    rows = cur.fetchall()

    result = [{
        "id": r[0], "title": r[1], "author": r[2],
        "genre": r[3], "rating": float(r[4]) if r[4] else 0,
        "completed": r[5], "age": r[6],
         "image_url": r[7] or "",
         "link": r[8] or ""
    } for r in rows]

    cur.close()
    conn.close()
    return result

# =========================================
# AUTH MODELS
# =========================================

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str
    preferred_genre: str = ""
    age_group: str = ""

class LoginRequest(BaseModel):
    email: str
    password: str

# =========================================
# AUTH — REGISTER
# =========================================

import hashlib

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

@app.post("/register")
def register(req: RegisterRequest):
    conn = get_connection()
    cur = conn.cursor()

    # Check if email already exists
    cur.execute("SELECT user_id FROM users WHERE email = %s", (req.email,))
    if cur.fetchone():
        cur.close()
        conn.close()
        return {"success": False, "message": "Email already registered"}

    # Check if username already exists
    cur.execute("SELECT user_id FROM users WHERE username = %s", (req.username,))
    if cur.fetchone():
        cur.close()
        conn.close()
        return {"success": False, "message": "Username already taken"}

    hashed = hash_password(req.password)

    cur.execute("""
        INSERT INTO users (username, email, password, preferred_genre, age_group, joined_at)
        VALUES (%s, %s, %s, %s, %s, NOW())
        RETURNING user_id, username, email, preferred_genre, age_group, joined_at
    """, (req.username, req.email, hashed, req.preferred_genre, req.age_group))

    row = cur.fetchone()
    conn.commit()

    user = {
        "user_id": row[0],
        "username": row[1],
        "email": row[2],
        "preferred_genre": row[3],
        "age_group": row[4],
        "joined_at": str(row[5])
    }

    cur.close()
    conn.close()

    return {"success": True, "message": "Account created!", "user": user}

# =========================================
# AUTH — LOGIN
# =========================================

@app.post("/login")
def login(req: LoginRequest):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT user_id, username, email, preferred_genre, age_group, joined_at, password
        FROM users
        WHERE email = %s
    """, (req.email,))
    row = cur.fetchone()
    cur.close()
    conn.close()

    if not row:
        return {"success": False, "message": "Invalid email or password"}

    stored_password = row[6]
    if req.password != stored_password:
        return {"success": False, "message": "Invalid email or password"}

    return {
        "success": True,
        "user": {
            "user_id": row[0],
            "username": row[1],
            "email": row[2],
            "preferred_genre": row[3],
            "age_group": row[4],
            "joined_at": str(row[5]) if row[5] else ""
        }
    }

# =========================================
# AUTH — GET USER PROFILE (by user_id)
# =========================================

@app.get("/profile/{user_id}")
def get_user_profile(user_id: int):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT user_id, username, email, preferred_genre, age_group, joined_at
        FROM users WHERE user_id = %s
    """, (user_id,))
    row = cur.fetchone()

    if not row:
        cur.close()
        conn.close()
        return {"success": False, "message": "User not found"}

    # Count reviews
    cur.execute("SELECT COUNT(*) FROM reviews WHERE user_id = %s", (user_id,))
    total_reviews = cur.fetchone()[0]

    # Count bookmarks
    cur.execute("SELECT COUNT(*) FROM bookmarks WHERE user_id = %s", (user_id,))
    total_bookmarks = cur.fetchone()[0]

    # Average rating given
    cur.execute("SELECT ROUND(AVG(score),1) FROM reviews WHERE user_id = %s", (user_id,))
    avg_rating = cur.fetchone()[0]

    cur.close()
    conn.close()

    return {
        "success": True,
        "user": {
            "user_id": row[0],
            "username": row[1],
            "email": row[2],
            "preferred_genre": row[3],
            "age_group": row[4],
            "joined_at": str(row[5]),
        },
        "stats": {
            "total_reviews": total_reviews,
            "total_bookmarks": total_bookmarks,
            "avg_rating": float(avg_rating) if avg_rating else 0,
        }
    }


# =========================================
# HOME PAGE — MOOD PICKS (genre mood map)
# =========================================

@app.get("/mood-picks")
def mood_picks(genres: str = ""):
    conn = get_connection()
    cur = conn.cursor()

    genre_list = [g.strip() for g in genres.split(",") if g.strip()]

    if not genre_list:
        cur.close()
        conn.close()
        return []

    placeholders = ", ".join(["%s"] * len(genre_list))
    cur.execute(f"""
        SELECT id, title, genre, rating, author, completed, image_url, link
        FROM webtoons
        WHERE genre ILIKE ANY(ARRAY[{", ".join(["%s"] * len(genre_list))}])
        ORDER BY rating DESC
        LIMIT 20
    """, [f"%{g}%" for g in genre_list])

    rows = cur.fetchall()
    result = [{
        "id": r[0], "title": r[1], "genre": r[2],
        "rating": float(r[3]) if r[3] else 0,
        "author": r[4], "completed": r[5],
        "image_url": r[6] or "",
        "link": r[7] or ""
    } for r in rows]

    cur.close()
    conn.close()
    return result


# =========================================
# HOME PAGE — USER STATS
# =========================================

@app.get("/user-stats/{user_id}")
def user_stats(user_id: int):
    conn = get_connection()
    cur = conn.cursor()

    # Bookmark count
    cur.execute("SELECT COUNT(*) FROM bookmarks WHERE user_id = %s", (user_id,))
    total_bookmarks = cur.fetchone()[0]

    # Review count
    cur.execute("SELECT COUNT(*) FROM reviews WHERE user_id = %s", (user_id,))
    total_reviews = cur.fetchone()[0]

    # Average rating given
    cur.execute("SELECT ROUND(AVG(score)::numeric, 1) FROM reviews WHERE user_id = %s", (user_id,))
    row = cur.fetchone()
    avg_rating = float(row[0]) if row[0] else 0

    # Distinct genres reviewed
    cur.execute("""
        SELECT COUNT(DISTINCT w.genre)
        FROM reviews r
        JOIN webtoons w ON r.webtoon_id = w.id
        WHERE r.user_id = %s
    """, (user_id,))
    genre_count = cur.fetchone()[0]

    cur.close()
    conn.close()

    return {
        "total_bookmarks": total_bookmarks,
        "total_reviews": total_reviews,
        "avg_rating": avg_rating,
        "genre_count": genre_count
    }

# =========================================
# ACTIVITY TIMELINE (reviews + bookmarks combined)
# =========================================

@app.get("/activity/{user_id}")
def get_activity(user_id: int, filter: str = "all"):
    conn = get_connection()
    cur = conn.cursor()

    items = []

    # Get reviews
    if filter in ("all", "reviews"):
        cur.execute("""
            SELECT r.review_id, w.id, w.title, w.genre, r.score, r.comment, r.created_at, w.author
            FROM reviews r
            JOIN webtoons w ON r.webtoon_id = w.id
            WHERE r.user_id = %s
            ORDER BY r.created_at DESC
            LIMIT 20
        """, (user_id,))
        for row in cur.fetchall():
            items.append({
                "type": "review",
                "id": f"r-{row[0]}",
                "webtoon_id": row[1],
                "title": row[2],
                "genre": row[3],
                "score": row[4],
                "comment": row[5],
                "date": str(row[6]) if row[6] else "",
                "author": row[7]
            })

    # Get bookmarks
    if filter in ("all", "bookmarks"):
        cur.execute("""
            SELECT b.bookmark_id, w.id, w.title, w.genre, b.saved_at, w.author, w.rating
            FROM bookmarks b
            JOIN webtoons w ON b.webtoon_id = w.id
            WHERE b.user_id = %s
            ORDER BY b.saved_at DESC
            LIMIT 20
        """, (user_id,))
        for row in cur.fetchall():
            items.append({
                "type": "bookmark",
                "id": f"b-{row[0]}",
                "webtoon_id": row[1],
                "title": row[2],
                "genre": row[3],
                "date": str(row[4]) if row[4] else "",
                "author": row[5],
                "rating": float(row[6]) if row[6] else 0
            })

    # Sort by date descending
    items.sort(key=lambda x: x.get("date", ""), reverse=True)

    cur.close()
    conn.close()
    return items


# =========================================
# ACTIVITY STATS
# =========================================

@app.get("/activity-stats/{user_id}")
def get_activity_stats(user_id: int):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("SELECT COUNT(*) FROM reviews WHERE user_id = %s", (user_id,))
    total_reviews = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM bookmarks WHERE user_id = %s", (user_id,))
    total_bookmarks = cur.fetchone()[0]

    cur.execute("SELECT ROUND(AVG(score)::numeric, 1) FROM reviews WHERE user_id = %s", (user_id,))
    row = cur.fetchone()
    avg_score = float(row[0]) if row[0] else 0

    cur.execute("""
        SELECT COUNT(DISTINCT w.genre)
        FROM reviews r
        JOIN webtoons w ON r.webtoon_id = w.id
        WHERE r.user_id = %s
    """, (user_id,))
    genres_explored = cur.fetchone()[0]

    cur.close()
    conn.close()

    return {
        "total_reviews": total_reviews,
        "total_bookmarks": total_bookmarks,
        "avg_score": avg_score,
        "genres_explored": genres_explored
    }

# =========================================
# PROFILE — MY REVIEWS (with webtoon details)
# =========================================

@app.get("/my-reviews/{user_id}")
def my_reviews(user_id: int):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT r.review_id, r.score, r.comment, r.created_at,
               w.id, w.title, w.genre, w.rating, w.image_url, w.link
        FROM reviews r
        JOIN webtoons w ON r.id = w.id
        WHERE r.user_id = %s
        ORDER BY r.created_at DESC
        LIMIT 20
    """, (user_id,))

    rows = cur.fetchall()
    result = [{
        "review_id": r[0],
        "score": r[1],
        "comment": r[2],
        "created_at": str(r[3]) if r[3] else "",
        "webtoon_id": r[4],
        "title": r[5],
        "genre": r[6],
        "rating": float(r[7]) if r[7] else 0,
        "image_url": r[8] or "",
        "link": r[9] or ""
    } for r in rows]

    cur.close()
    conn.close()
    return result


# =========================================
# PROFILE — MY BOOKMARKS (with webtoon details)
# =========================================

@app.get("/my-bookmarks/{user_id}")
def my_bookmarks(user_id: int):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT b.bookmark_id, b.saved_at,
               w.id, w.title, w.genre, w.rating, w.image_url, w.link
        FROM bookmarks b
        JOIN webtoons w ON b.id = w.id
        WHERE b.user_id = %s
        ORDER BY b.saved_at DESC
        LIMIT 20
    """, (user_id,))

    rows = cur.fetchall()
    result = [{
        "bookmark_id": r[0],
        "saved_at": str(r[1]) if r[1] else "",
        "webtoon_id": r[2],
        "title": r[3],
        "genre": r[4],
        "rating": float(r[5]) if r[5] else 0,
        "image_url": r[6] or "",
        "link": r[7] or ""
    } for r in rows]

    cur.close()
    conn.close()
    return result

# =========================================
# ADD BOOKMARK
# =========================================
class BookmarkRequest(BaseModel):
    user_id: int
    id: int
@app.post("/add-bookmark")
def add_bookmark(data: BookmarkRequest):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute(
        "SELECT bookmark_id FROM bookmarks WHERE user_id = %s AND id = %s",
        (data.user_id, data.id)
    )
    if cur.fetchone():
        cur.close()
        conn.close()
        return {"success": False, "message": "Already bookmarked"}

    cur.execute(
        "INSERT INTO bookmarks (user_id, id, saved_at) VALUES (%s, %s, NOW())",
        (data.user_id, data.id)
    )
    conn.commit()
    cur.close()
    conn.close()
    return {"success": True, "message": "Bookmarked!"}


# =========================================
# GET BOOKMARKED IDS (for toggle state)
# =========================================

@app.get("/bookmarked-ids/{user_id}")
def bookmarked_ids(user_id: int):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT id FROM bookmarks WHERE user_id = %s", (user_id,))
    ids = [row[0] for row in cur.fetchall()]
    cur.close()
    conn.close()
    return ids