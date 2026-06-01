import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';

export default function StoreManagement() {
  const [stores, setStores] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [newStore, setNewStore] = useState('');
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const [{ data: sts }, { data: emps }] = await Promise.all([
      supabase.from('stores').select('*').order('name'),
      supabase.from('employees').select('id, name, store_name').order('name'),
    ]);
    setStores(sts || []);
    setEmployees(emps || []);
  };

  const flash = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  const addStore = async () => {
    const name = newStore.trim().toUpperCase();
    if (!name) return;
    const { error } = await supabase.from('stores').insert({ name });
    if (error) { flash('err', error.message); return; }
    setNewStore('');
    load();
  };

  const saveEdit = async () => {
    if (!editing?.name.trim()) return;
    const { error } = await supabase
      .from('stores')
      .update({ name: editing.name.toUpperCase() })
      .eq('id', editing.id);
    if (error) { flash('err', error.message); return; }
    setEditing(null);
    load();
  };

  const deleteStore = async (id, name) => {
    const assigned = employees.filter((e) => e.store_name === name);
    if (assigned.length > 0) {
      flash('err', `${assigned.map((e) => e.name).join(', ')} が所属中です。先にスタッフを移動してください。`);
      return;
    }
    if (!window.confirm(`店舗「${name}」を削除しますか？`)) return;
    await supabase.from('stores').delete().eq('id', id);
    load();
  };

  // Reassign employee to a different store
  const reassign = async (empId, newStoreName) => {
    await supabase.from('employees').update({ store_name: newStoreName }).eq('id', empId);
    load();
  };

  return (
    <section className="dashboard-band">
      <div className="section-heading">
        <p className="eyebrow">Admin — Stores</p>
        <h2>店舗管理</h2>
      </div>

      {msg && (
        <p className={`feedback ${msg.type === 'ok' ? 'correct' : 'wrong'}`}
           style={{ marginBottom: 16 }}>
          {msg.text}
        </p>
      )}

      {/* Add store */}
      <div className="staff-add-row" style={{ marginBottom: 20 }}>
        <input
          value={newStore}
          onChange={(e) => setNewStore(e.target.value)}
          placeholder="OMOTESANDO"
        />
        <button className="secondary-action" onClick={addStore} type="button">
          <Plus size={15} /> 追加
        </button>
      </div>

      {/* Store list */}
      <div className="staff-list" style={{ marginBottom: 28 }}>
        {stores.map((store) => (
          <div key={store.id} className="staff-row">
            {editing?.id === store.id ? (
              <>
                <input
                  className="staff-edit-input"
                  value={editing.name}
                  onChange={(e) => setEditing((p) => ({ ...p, name: e.target.value }))}
                />
                <div className="staff-actions">
                  <button className="icon-btn" onClick={saveEdit} type="button"><Save size={15} /></button>
                  <button className="icon-btn" onClick={() => setEditing(null)} type="button"><X size={15} /></button>
                </div>
              </>
            ) : (
              <>
                <span className="staff-name-col">{store.name}</span>
                <span className="staff-store-col" style={{ color: '#999', fontSize: 13 }}>
                  {employees.filter((e) => e.store_name === store.name).length} staff
                </span>
                <div className="staff-actions">
                  <button className="icon-btn" onClick={() => setEditing({ id: store.id, name: store.name })} type="button" title="名前変更">
                    <Edit2 size={15} />
                  </button>
                  <button className="icon-btn danger" onClick={() => deleteStore(store.id, store.name)} type="button" title="削除">
                    <Trash2 size={15} />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Staff store assignment */}
      <div className="section-heading" style={{ marginTop: 24 }}>
        <p className="eyebrow">配属変更</p>
        <h2 style={{ fontSize: 16 }}>スタッフの店舗を変更</h2>
      </div>
      <div className="staff-list">
        {employees.map((emp) => (
          <div key={emp.id} className="staff-row">
            <span className="staff-name-col">{emp.name}</span>
            <select
              value={emp.store_name}
              onChange={(e) => reassign(emp.id, e.target.value)}
              style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13 }}
            >
              {stores.map((s) => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </section>
  );
}
