import { useState } from 'react';
import { confirmSignUp, signIn, signUp } from 'aws-amplify/auth';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const [mode, setMode] = useState('signin');
  const [form, setForm] = useState({ username: '', email: '', password: '', code: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { refresh } = useAuth();
  const navigate = useNavigate();
  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function submit(e) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      if (mode === 'signup') {
        const result = await signUp({ username: form.email, password: form.password, options: { userAttributes: { email: form.email, preferred_username: form.username } } });
        setMode(result.nextStep.signUpStep === 'DONE' ? 'signin' : 'confirm');
      } else if (mode === 'confirm') {
        await confirmSignUp({ username: form.email, confirmationCode: form.code }); setMode('signin');
      } else {
        await signIn({ username: form.email, password: form.password }); await refresh(); navigate('/');
      }
    } catch (err) { setError(err.message || 'Authentication failed'); } finally { setBusy(false); }
  }
  return <section className="auth card"><h1>{mode === 'signup' ? 'Create account' : mode === 'confirm' ? 'Check your email' : 'Welcome back'}</h1>
    <form onSubmit={submit}>
      {mode === 'signup' && <label>Display name<input name="username" value={form.username} onChange={update} required /></label>}
      <label>Email<input name="email" type="email" value={form.email} onChange={update} required disabled={mode === 'confirm'} /></label>
      {mode === 'confirm' ? <label>Confirmation code<input name="code" value={form.code} onChange={update} required /></label> :
        <label>Password<input name="password" type="password" minLength="8" value={form.password} onChange={update} required /></label>}
      {error && <p className="error">{error}</p>}<button disabled={busy}>{busy ? 'Working…' : 'Continue'}</button>
    </form>
    {mode !== 'confirm' && <button className="text-button" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
      {mode === 'signin' ? 'New here? Create an account' : 'Already have an account? Sign in'}
    </button>}
  </section>;
}

