import { useState } from 'react';
import { LogIn } from 'lucide-react';

const STAFF_NAMES = ['TARO', 'KEN', 'MARK', 'YUKI'];

export default function Login({ onLogin }) {
  const [name, setName] = useState('');
  const [storeName, setStoreName] = useState('GINZA');

  const handleSubmit = (event) => {
    event.preventDefault();
    const normalized = name.trim().toUpperCase();
    if (!normalized) return;
    onLogin({
      name: normalized,
      storeName,
      role: normalized === 'MANAGER' || normalized === 'ADMIN' ? 'manager' : 'staff',
    });
  };

  return (
    <main className="login-shell">
      <section className="login-panel" aria-labelledby="login-title">
        <p className="eyebrow">n.h ginza</p>
        <h1 id="login-title">Language Trainer</h1>
        <p className="login-copy">Retail English practice for menswear service.</p>

        <form onSubmit={handleSubmit} className="login-form">
          <label htmlFor="staff-name">English name</label>
          <input
            id="staff-name"
            type="text"
            placeholder="TARO"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoFocus
          />

          <label htmlFor="store-name">Store</label>
          <select
            id="store-name"
            value={storeName}
            onChange={(event) => setStoreName(event.target.value)}
          >
            <option value="GINZA">GINZA</option>
            <option value="SHIBUYA">SHIBUYA</option>
            <option value="SHINJUKU">SHINJUKU</option>
          </select>

          <div className="quick-logins" aria-label="Quick login">
            {STAFF_NAMES.map((staff) => (
              <button key={staff} type="button" onClick={() => setName(staff)}>
                {staff}
              </button>
            ))}
            <button type="button" onClick={() => setName('MANAGER')}>
              MANAGER
            </button>
          </div>

          <button className="primary-action" type="submit" disabled={!name.trim()}>
            <LogIn size={18} />
            Login
          </button>
        </form>
      </section>
    </main>
  );
}
