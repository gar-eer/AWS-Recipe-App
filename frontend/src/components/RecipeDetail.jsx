import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function RecipeDetail() {
  const { id } = useParams(); const { user } = useAuth(); const [recipe, setRecipe] = useState(null);
  const [review, setReview] = useState({ rating: 5, comment: '' }); const [error, setError] = useState('');
  const load = useCallback(() => api(`/recipes/${id}`).then(setRecipe).catch((e) => setError(e.message)), [id]);
  useEffect(() => { load(); }, [load]);
  async function submit(e) { e.preventDefault(); setError(''); try { await api(`/recipes/${id}/reviews`, { method: 'POST', body: JSON.stringify(review) }, true); setReview({ rating: 5, comment: '' }); await load(); } catch (e) { setError(e.message); } }
  if (error && !recipe) return <p className="error">{error}</p>; if (!recipe) return <div className="center">Loading…</div>;
  return <article className="detail"><img className="detail-image" src={recipe.image_url} alt={recipe.title} /><div className="detail-head"><p className="eyebrow">By {recipe.username}</p><h1>{recipe.title}</h1>
    <p>{recipe.description}</p><strong className="rating">★ {Number(recipe.average_rating).toFixed(1)} from {recipe.review_count} reviews</strong></div>
    <section><h2>Ingredients</h2><ul>{recipe.ingredients.map((item, i) => <li key={i}>{item}</li>)}</ul></section>
    <section><h2>Instructions</h2><p className="instructions">{recipe.instructions}</p></section>
    <section><h2>Ratings & comments</h2>{user ? <form className="review-form" onSubmit={submit}><label>Rating<select value={review.rating} onChange={(e) => setReview({ ...review, rating: Number(e.target.value) })}>{[5,4,3,2,1].map((n) => <option key={n} value={n}>{n} stars</option>)}</select></label>
      <label>Comment<textarea value={review.comment} onChange={(e) => setReview({ ...review, comment: e.target.value })} rows="3" /></label><button>Post review</button></form> : <p>Sign in to leave a review.</p>}
      {error && <p className="error">{error}</p>}<div className="reviews">{recipe.reviews.map((item) => <div key={item.review_id}><strong>{item.username} · <span className="rating">{'★'.repeat(item.rating)}</span></strong><p>{item.comment}</p></div>)}</div>
    </section>
  </article>;
}

