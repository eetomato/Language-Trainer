import { LogOut } from 'lucide-react';

export default function Layout({ user, onLogout, children }) {
  return (
    <div className="app-shell">
      <header className="top-bar">
        <div>
          <h1>Menswear Language Trainer</h1>
        </div>
        <div className="user-chip">
          <span>{user.name}</span>
          <small>{user.role === 'manager' ? 'Manager' : user.storeName}</small>
          <button type="button" onClick={onLogout} aria-label="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </header>
      <main className="workspace">{children}</main>
    </div>
  );
}
