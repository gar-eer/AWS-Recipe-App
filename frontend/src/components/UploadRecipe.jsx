import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';

export default function UploadRecipe() {
  const [form, setForm] = useState({ title: '', description: '', ingredients: '', instructions: '', image: null });
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const navigate = useNavigate();
  async function submit(e) {
    e.preventDefault(); setBusy(true); setError('');
    const data = new FormData();
    data.append('title', form.title); data.append('description', form.description);
    data.append('ingredients', JSON.stringify(form.ingredients.split('\n').map((v) => v.trim()).filter(Boolean)));
    data.append('instructions', form.instructions); data.append('image', form.image);
    try { const recipe = await api('/recipes', { method: 'POST', body: data }, true); navigate(`/recipes/${recipe.recipe_id}`); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return <section className="form-page"><h1>Share your recipe</h1><p>Give each ingredient its own line.</p><form className="card" onSubmit={submit}>
    <label>Title<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required maxLength="200" /></label>
    <label>Short description<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows="3" /></label>
    <label>Ingredients<textarea value={form.ingredients} onChange={(e) => setForm({ ...form, ingredients: e.target.value })} rows="8" required placeholder={'2 cups flour\n1 tsp salt'} /></label>
    <label>Instructions<textarea value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} rows="10" required /></label>
    <label>Recipe photo<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(e) => setForm({ ...form, image: e.target.files[0] })} required /></label>
    {error && <p className="error">{error}</p>}<button disabled={busy}>{busy ? 'Publishing…' : 'Publish recipe'}</button>
  </form></section>;
}

