import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Login from './components/Login.jsx';
import RecipeFeed from './components/RecipeFeed.jsx';
import UploadRecipe from './components/UploadRecipe.jsx';
import RecipeDetail from './components/RecipeDetail.jsx';

export default function App() {
  const { user, loading, logout } = useAuth();
  if (loading) return <main className="center">Loading…</main>;
  return <>
    <header><Link className="brand" to="/">SavorShare</Link><nav>
      <Link to="/">Recipes</Link>
      {user ? <><Link to="/upload">Share a recipe</Link><button className="link-button" onClick={logout}>Sign out</button></> : <Link to="/login">Sign in</Link>}
    </nav></header>
    <main><Routes>
      <Route path="/" element={<RecipeFeed />} />
      <Route path="/recipes/:id" element={<RecipeDetail />} />
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/upload" element={user ? <UploadRecipe /> : <Navigate to="/login" />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes></main>
  </>;
}

