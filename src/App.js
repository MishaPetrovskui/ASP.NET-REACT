import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Link } from 'react-router-dom';

const API = 'https://localhost:7134/Users';

function getToken() { 
  return localStorage.getItem('token'); 
}
function parseJwt(t) { 
  try { 
    return JSON.parse(atob(t.split('.')[1])); 
  } catch { 
    return null; 
  } 
}
function getRole(t) {
  const p = parseJwt(t);
  return p?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ?? p?.role ?? '';
}

function Navbar() {
  const navigate = useNavigate();
  const token = getToken();
  if (!token) return null;
  return (
    <div>
      <Link to="/">Головна</Link>{' | '}
      {getRole(token) === 'Admin' && <><Link to="/admin">Адмін</Link>{' | '}</>}
      <button onClick={() => { localStorage.removeItem('token'); navigate('/login'); }}>Вийти</button>
      <hr />
    </div>
  );
}

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => { if (getToken()) navigate('/', { replace: true }); }, []);

  async function submit(e) {
    e.preventDefault();
    setErr('');
    const res = await fetch(`${API}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass }),
    });
    if (!res.ok) { setErr('Невірний email або пароль'); return; }
    localStorage.setItem('token', await res.text());
    navigate('/', { replace: true });
  }

  return (
    <div>
      <h2>Вхід</h2>
      {err && <p style={{color:'red'}}>{err}</p>}
      <form onSubmit={submit}>
        <div><input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required /></div>
        <div><input type="password" placeholder="Пароль" value={pass} onChange={e => setPass(e.target.value)} required /></div>
        <div><button type="submit">Увійти</button></div>
      </form>
      <p><Link to="/register">Реєстрація</Link></p>
    </div>
  );
}

function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name:'', email:'', passwordHash:'', birthday:'', gender:'male' });
  const [err, setErr] = useState('');

  useEffect(() => { if (getToken()) navigate('/', { replace: true }); }, []);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setErr('');
    const res = await fetch(`${API}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 0, ...form }),
    });
    if (!res.ok) { setErr('Помилка реєстрації'); return; }
    navigate('/login', { replace: true });
  }

  return (
    <div>
      <h2>Реєстрація</h2>
      {err && <p style={{color:'red'}}>{err}</p>}
      <form onSubmit={submit}>
        <div><input type="text" placeholder="Імʼя" value={form.name} onChange={set('name')} required /></div>
        <div><input type="email" placeholder="Email" value={form.email} onChange={set('email')} required /></div>
        <div><input type="password" placeholder="Пароль" value={form.passwordHash} onChange={set('passwordHash')} required /></div>
        <div><input type="date" value={form.birthday} onChange={set('birthday')} required /></div>
        <div>
          <select value={form.gender} onChange={set('gender')}>
            <option value="male">Чоловіча</option>
            <option value="female">Жіноча</option>
          </select>
        </div>
        <div><button type="submit">Зареєструватися</button></div>
      </form>
      <p><Link to="/login">Вхід</Link></p>
    </div>
  );
}

function IndexPage() {
  const navigate = useNavigate();
  const [me, setMe] = useState(null);

  useEffect(() => {
    const token = getToken();
    if (!token) { navigate('/login', { replace: true }); return; }
    fetch(`${API}/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => {
        if (r.status === 401) { localStorage.removeItem('token'); navigate('/login', { replace: true }); return null; }
        return r.json();
      })
      .then(d => d && setMe(d));
  }, []);

  if (!me) return <p>Завантаження...</p>;
  return (
    <div>
      <h2>Головна</h2>
      <p>Імʼя: {me.name}</p>
      <p>Email: {me.email}</p>
      <p>Роль: {me.role}</p>
      <p>Стать: {me.gender}</p>
      <p>Дата народження: {me.birthday}</p>
    </div>
  );
}

function AdminPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    const token = getToken();
    if (!token) { navigate('/login', { replace: true }); return; }
    if (getRole(token) !== 'Admin') { navigate('/', { replace: true }); return; }
    fetch(`${API}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setUsers);
  }, []);

  function startEdit(u) { setEditing(u.id); setEditForm({ ...u }); }

  async function saveEdit() {
    const token = getToken();
    await fetch(`${API}/${editForm.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(editForm),
    });
    setUsers(u => u.map(x => x.id === editForm.id ? editForm : x));
    setEditing(null);
  }

  const setF = k => e => setEditForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div>
      <h2>Адмін-панель</h2>
      <table border="1" cellPadding="4">
        <thead>
          <tr><th>ID</th><th>Імʼя</th><th>Email</th><th>Роль</th><th>Стать</th><th>Дата нар.</th><th></th></tr>
        </thead>
        <tbody>
          {users.map(u => editing === u.id ? (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td><input value={editForm.name}  onChange={setF('name')} /></td>
              <td><input value={editForm.email} onChange={setF('email')} /></td>
              <td>
                <select value={editForm.roles} onChange={setF('roles')}>
                  <option value="User">User</option>
                  <option value="Admin">Admin</option>
                </select>
              </td>
              <td>
                <select value={editForm.gender} onChange={setF('gender')}>
                  <option value="male">male</option>
                  <option value="female">female</option>
                </select>
              </td>
              <td><input type="date" value={editForm.birthday?.split('T')[0] ?? ''} onChange={setF('birthday')} /></td>
              <td>
                <button onClick={saveEdit}>Зберегти</button>{' '}
                <button onClick={() => setEditing(null)}>Скасувати</button>
              </td>
            </tr>
          ) : (
            <tr key={u.id}>
              <td>{u.id}</td><td>{u.name}</td><td>{u.email}</td>
              <td>{u.roles}</td><td>{u.gender}</td>
              <td>{u.birthday?.split('T')[0] ?? u.birthday}</td>
              <td><button onClick={() => startEdit(u)}>Редагувати</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function App() {
  return (
    <div style={{ padding: 16 }}>
      <Navbar />
      <Routes>
        <Route path="/"         element={<IndexPage />} />
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/admin"    element={<AdminPage />} />
      </Routes>
    </div>
  );
}
