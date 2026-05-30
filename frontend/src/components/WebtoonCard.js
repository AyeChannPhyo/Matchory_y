import "./WebtoonCard.css";

function WebtoonCard({ toon }) {

  return (

    <div className="card">

      <div className="thumbnail">
        WEBTOON
      </div>

      <h3>{toon.title}</h3>

      <p>
        <strong>Author:</strong> {toon.author}
      </p>

      <p>
        <strong>Genre:</strong> {toon.genre}
      </p>

      <p>
        ⭐ {toon.rating}
      </p>

      <button className="bookmarkBtn">
        ❤️ Bookmark
      </button>

    </div>
  );
}

export default WebtoonCard;