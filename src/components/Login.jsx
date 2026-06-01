import { useState } from 'react';
import { LogIn, Lock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const STAFF_NAMES = ['FUJIMURA', 'ONISHI', 'KIM', 'SAKATA'];
const STORES = ['GINZA', 'SHIBUYA', 'SHINJUKU'];

export default function Login() {
  const { login, setupPassword } = useAuth();

  // login form state
  const [name, setName] = useState('');
  const [storeName, setStoreName] = useState('GINZA');
  const [password, setPassword] = useState('');

  // first-login setup state
  const [step, setStep] = useState('login'); // 'login' | 'setup'
  const [pendingEmployee, setPendingEmployee] = useState(null);
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ── Step 1: normal login ──────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    const normalized = name.trim().toUpperCase();
    if (!normalized || !password) return;

    setSubmitting(true);
    const result = await login({ name: normalized, password });
    setSubmitting(false);

    if (result.firstLogin) {
      setPendingEmployee(result.employee);
      setPassword('');
      setStep('setup');
      return;
    }

    if (result.error === 'not_registered') {
      setError('この名前は登録されていません。マネージャーに連絡してください。');
    } else if (result.error === 'wrong_password') {
      setError('パスワードが違います。');
    } else if (result.error) {
      setError(result.error);
    }
  };

  // ── Step 2: first-login password setup ───────────────────────────
  const handleSetup = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('パスワードは6文字以上にしてください。');
      return;
    }
    if (password !== confirmPassword) {
      setError('パスワードが一致しません。');
      return;
    }

    setSubmitting(true);
    const result = await setupPassword({ employee: pendingEmployee, password });
    setSubmitting(false);

    if (result.error) setError(result.error);
  };

  // ── First-login screen ────────────────────────────────────────────
  if (step === 'setup') {
    return (
      <main className="login-shell">
        <section className="login-panel">
          <p className="eyebrow">n.h ginza</p>
          <h1>パスワード設定</h1>
          <p className="login-copy">
            {pendingEmployee?.name} さん、初回ログインです。<br />
            パスワードを設定してください。
          </p>
          <form onSubmit={handleSetup} className="login-form">
            <label>新しいパスワード</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6文字以上"
              autoFocus
            />
            <label>パスワード確認</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="もう一度入力"
            />
            {error && <p className="feedback wrong">{error}</p>}
            <button
              className="primary-action"
              type="submit"
              disabled={submitting || !password || !confirmPassword}
            >
              <Lock size={18} />
              {submitting ? '設定中...' : 'パスワードを設定してログイン'}
            </button>
          </form>
          <button
            className="text-action"
            type="button"
            onClick={() => { setStep('login'); setError(''); }}
          >
            ← 戻る
          </button>
        </section>
      </main>
    );
  }

  // ── Normal login screen ───────────────────────────────────────────
  return (
    <main className="login-shell">
      <section className="login-panel" aria-labelledby="login-title">
        <p className="eyebrow">n.h ginza</p>
        <h1 id="login-title">Language Trainer</h1>
        <p className="login-copy">Retail English practice for menswear service.</p>

        <form onSubmit={handleLogin} className="login-form">
          <label htmlFor="staff-name">名前</label>
          <input
            id="staff-name"
            type="text"
            placeholder="FUJIMURA"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />

          <label htmlFor="store-name">店舗</label>
          <select
            id="store-name"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
          >
            {STORES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <div className="quick-logins" aria-label="クイックログイン">
            {STAFF_NAMES.map((n) => (
              <button key={n} type="button" onClick={() => setName(n)}>
                {n}
              </button>
            ))}
          </div>

          <label htmlFor="password">パスワード</label>
          <input
            id="password"
            type="password"
            placeholder="••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <p className="feedback wrong">{error}</p>}

          <button
            className="primary-action"
            type="submit"
            disabled={submitting || !name.trim() || !password}
          >
            <LogIn size={18} />
            {submitting ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>

        {/* Manager login — intentionally subtle */}
        <button
          className="manager-hint"
          type="button"
          onClick={() => setName('MANAGER')}
        >
          manager
        </button>
      </section>
    </main>
  );
}
