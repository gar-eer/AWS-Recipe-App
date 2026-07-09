import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';

export default function RecipeFeed() {
  const [recipes, setRecipes] = useState([]); const [error, setError] = useState(''); const [loading, setLoading] = useState(true);
  useEffect(() => { api('/recipes').then(setRecipes).catch((e) => setError(e.message)).finally(() => setLoading(false)); }, []);
  if (loading) return <div className="center">Gathering recipes…</div>;
  if (error) return <p className="error">{error}</p>;
  return <><section className="hero"><p className="eyebrow">Cook · share · discover</p><h1>Recipes worth passing around.</h1></section>
    <section className="grid">{recipes.map((recipe) => <Link className="recipe-card" to={`/recipes/${recipe.recipe_id}`} key={recipe.recipe_id}>
      <img src={recipe.image_url} alt="" /><div><span className="rating">★ {Number(recipe.average_rating).toFixed(1)} ({recipe.review_count})</span>
      <h2>{recipe.title}</h2><p>{recipe.description}</p><small>by {recipe.username}</small></div></Link>)}</section>
    {!recipes.length && <p className="empty">No recipes yet. Be the first to share one.</p>}
  </>;
}

