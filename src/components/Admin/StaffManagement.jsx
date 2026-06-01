import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, RefreshCw, Save, X } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';

export default function StaffManagement() {
  const [employees, setEmployees] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newStaff, setNewStaff] = useState({ name: '', store_name: '' });
  const [editing, setEditing] = useState(null); // { id, name, store_name }
  const [msg, setMsg] = useState(null); // { type: 'ok'|'err', text }

  useEffect(() => { load(); }, []);

  const load = async () => {
    const [{ data: emps }, { data: sts }] = await Promise.all([
      supabase.from('employees').select('*').order('name'),
      supabase.from('stores').select('*').order('name'),
    ]);
    setEmployees(emps || []);
    setStores(sts || []);
    setLoading(false);
  };

  const flash = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  // ── Add employee ──────────────────────────────────────────────────
  const addStaff = async () => {
    const name = newStaff.name.trim().toUpperCase();
    const storeName = newStaff.store_name || stores[0]?.name || 'GINZA';
    if (!name) return;

    const email = `${name.toLowerCase()}@nhmenswear.app`;

    const { error } = await supabase.from('employees').insert({
      name,
      store_name: storeName,
      email,
      role: 'staff',
    });

    if (error) { flash('err', `Error: ${error.message}`); return; }
    setNewStaff({ name: '', store_name: '' });
    flash('ok', `${name} を追加しました。次回ログイン時にパスワードを設定できます。`);
    load();
  };

  // ── Delete employee ───────────────────────────────────────────────
  const deleteStaff = async (id, name) => {
    if (!window.confirm(`${name} を削除しますか？`)) return;
    await supabase.from('employees').delete().eq('id', id);
    load();
  };

  // ── Save inline edit ──────────────────────────────────────────────
  const saveEdit = async () => {
    if (!editing?.name.trim()) return;
    const { error } = await supabase
      .from('employees')
      .update({ name: editing.name.toUpperCase(), store_name: editing.store_name })
      .eq('id', editing.id);
    if (error) { flash('err', error.message); return; }
    setEditing(null);
    load();
  };

  // ── Password reset ────────────────────────────────────────────────
  // Clears auth_id + rotates email so staff can re-register on next login.
  const resetPassword = async (emp) => {
    if (!window.confirm(`${emp.name} のパスワードをリセットしますか？\n次回ログイン時に新しいパスワードを設定できます。`)) return;
    const newEmail = `${emp.name.toLowerCase()}.r${Date.now()}@nhmenswear.app`;
    const { error } = await supabase
      .from('employees')
      .update({ auth_id: null, email: newEmail })
      .eq('id', emp.id);
    if (error) { flash('err', error.message); return; }
    flash('ok', `${emp.name} のパスワードをリセットしました。`);
    load();
  };

  if (loading) return <p style={{ padding: 24 }}>読み込み中...</p>;

  return (
    <section className="dashboard-band">
      <div className="section-heading">
        <p className="eyebrow">Admin — Staff</p>
        <h2>スタッフ管理</h2>
      </div>

      {msg && (
        <p className={`feedback ${msg.type === 'ok' ? 'correct' : 'wrong'}`}
           style={{ marginBottom: 16 }}>
          {msg.text}
        </p>
      )}

      {/* Add form */}
      <div className="staff-add-row">
        <input
          value={newStaff.name}
          onChange={(e) => setNewStaff((p) => ({ ...p, name: e.target.value }))}
          placeholder="SUZUKI"
        />
        <select
          value={newStaff.store_name}
          onChange={(e) => setNewStaff((p) => ({ ...p, store_name: e.target.value }))}
        >
          <option value="">店舗を選択</option>
          {stores.map((s) => (
            <option key={s.id} value={s.name}>{s.name}</option>
          ))}
        </select>
        <button className="secondary-action" onClick={addStaff} type="button">
          <Plus size={15} /> 追加
        </button>
      </div>

      {/* Employee list */}
      <div className="staff-list">
        {employees.map((emp) => (
          <div key={emp.id} className="staff-row">
            {editing?.id === emp.id ? (
              <>
                <input
                  className="staff-edit-input"
                  value={editing.name}
                  onChange={(e) => setEditing((p) => ({ ...p, name: e.target.value }))}
                />
                <select
                  className="staff-edit-select"
                  value={editing.store_name}
                  onChange={(e) => setEditing((p) => ({ ...p, store_name: e.target.value }))}
                >
                  {stores.map((s) => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
                <div className="staff-actions">
                  <button className="icon-btn" onClick={saveEdit} type="button" title="保存">
                    <Save size={15} />
                  </button>
                  <button className="icon-btn" onClick={() => setEditing(null)} type="button" title="キャンセル">
                    <X size={15} />
                  </button>
                </div>
              </>
            ) : (
              <>
                <span className="staff-name-col">{emp.name}</span>
                <span className="staff-store-col">{emp.store_name}</span>
                <span className={`staff-status ${emp.auth_id ? 'active' : 'pending'}`}>
                  {emp.auth_id ? 'Active' : 'Pending'}
                </span>
                <div className="staff-actions">
                  <button
                    className="icon-btn"
                    onClick={() => setEditing({ id: emp.id, name: emp.name, store_name: emp.store_name })}
                    type="button"
                    title="編集"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    className="icon-btn"
                    onClick={() => resetPassword(emp)}
                    type="button"
                    title="パスワードリセット"
                  >
                    <RefreshCw size={15} />
                  </button>
                  <button
                    className="icon-btn danger"
                    onClick={() => deleteStaff(emp.id, emp.name)}
                    type="button"
                    title="削除"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
