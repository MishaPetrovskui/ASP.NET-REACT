import './App.css';
import { useState, useEffect } from 'react';

const API = 'https://localhost:7134';

function Pagination({ page, pagesCount, onPageChange, pageSize, onPageSizeChange, totalCount }) {
  const pages = [];
  for (let i = 1; i <= pagesCount; i++) pages.push(i);

  return (
    <div className="mt-4 pt-3 border-top">
      <nav aria-label="Page navigation">
        <ul className="pagination pagination-lg justify-content-center">
          <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
            <button className="page-link" onClick={() => onPageChange(page - 1)}>Previous</button>
          </li>
          {pages.map(p => (
            <li key={p} className={`page-item ${p === page ? 'active' : ''}`}>
              <button className="page-link" onClick={() => onPageChange(p)}>{p}</button>
            </li>
          ))}
          <li className={`page-item ${page === pagesCount ? 'disabled' : ''}`}>
            <button className="page-link" onClick={() => onPageChange(page + 1)}>Next</button>
          </li>
        </ul>
      </nav>

      <div className="d-flex justify-content-between align-items-center mt-4 px-2">
        <div className="d-flex align-items-center gap-3">
          <label htmlFor="pageSize" className="form-label mb-0 fw-semibold">Rows per page:</label>
          <select
            id="pageSize"
            className="form-select form-select-sm"
            style={{ width: '80px' }}
            value={pageSize}
            onChange={e => onPageSizeChange(Number(e.target.value))}
          >
            {[1, 5, 10, 20, 30, 50].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <span className="text-secondary fw-semibold">
          {totalCount === 0 ? '0' : (page - 1) * pageSize + 1}-{Math.min(page * pageSize, totalCount)} of {totalCount}
        </span>
      </div>
    </div>
  );
}

function Table({ items, onDelete }) {
  if (!items || items.length === 0) {
    return (
      <div className="text-center py-5 text-muted">
        <p className="fs-5">No data available</p>
      </div>
    );
  }
  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle table-striped">
        <thead className="table-dark sticky-top">
          <tr>
            <th className="text-center" style={{ width: '60px' }}>ID</th>
            <th>Full Name</th>
            <th>Department</th>
            <th className="text-end">Salary</th>
            <th className="text-end">Bonus</th>
            <th>Specializations</th>
            <th className="text-center" style={{ width: '200px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map(doc => (
            <tr key={doc.id}>
              <td className="text-center fw-bold text-primary">{doc.id}</td>
              <td><strong className="text-dark">{doc.surname} {doc.name}</strong></td>
              <td>
                <span className="badge bg-info text-dark">{doc.departmentName || doc.departmentId}</span>
              </td>
              <td className="text-end">{Number(doc.salary).toLocaleString('en-US')} UAH</td>
              <td className="text-end">{Number(doc.premium).toLocaleString('en-US')} UAH</td>
              <td>
                {doc.specializations && doc.specializations.length > 0
                  ? doc.specializations.map(s => (
                      <span key={s.id} className="badge bg-success me-1 mb-1 d-inline-block">{s.name}</span>
                    ))
                  : <span className="text-muted">—</span>
                }
              </td>
              <td className="text-center">
                <button className="btn btn-sm btn-outline-warning me-2">Edit</button>
                <button className="btn btn-sm btn-outline-danger" onClick={() => onDelete(doc.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const emptyForm = { name: '', surname: '', salary: '', premium: '', departmentId: '' };

function AddDoctorModal({ onSaved, onClose }) {
  const [form, setForm] = useState(emptyForm);
  const [departments, setDepartments] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API}/Departments?page=1&size=100`)
      .then(r => r.json())
      .then(d => setDepartments(d.items || []))
      .catch(() => {});
  }, []);

  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.surname.trim() || !form.departmentId) {
      setError("Заповніть всі обов'язкові поля");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API}/Doctors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          surname: form.surname,
          salary: parseFloat(form.salary) || 0,
          premium: parseFloat(form.premium) || 0,
          departmentId: parseInt(form.departmentId),
        }),
      });
      if (!res.ok) throw new Error(`Помилка: ${res.status}`);
      onSaved();
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Додати лікаря</h5>
            <button className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body">
            {error && <div className="alert alert-danger py-2">{error}</div>}
            <div className="mb-3">
              <label className="form-label">Ім'я *</label>
              <input className="form-control" name="name" value={form.name} onChange={handleChange} />
            </div>
            <div className="mb-3">
              <label className="form-label">Прізвище *</label>
              <input className="form-control" name="surname" value={form.surname} onChange={handleChange} />
            </div>
            <div className="mb-3">
              <label className="form-label">Відділ *</label>
              <select className="form-select" name="departmentId" value={form.departmentId} onChange={handleChange}>
                <option value="">— оберіть відділ —</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label">Оклад (грн)</label>
              <input className="form-control" type="number" name="salary" value={form.salary} onChange={handleChange} />
            </div>
            <div className="mb-3">
              <label className="form-label">Премія (грн)</label>
              <input className="form-control" type="number" name="premium" value={form.premium} onChange={handleChange} />
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>Скасувати</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving ? 'Збереження…' : 'Зберегти'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [pagesCount, setPagesCount] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const fetchDoctors = async (p, size) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/Doctors?page=${p}&size=${size}`);
      if (!res.ok) throw new Error(`Помилка: ${res.status}`);
      const data = await res.json();
      setItems(data.items);
      setPagesCount(data.pagesCount);
      setTotalCount(data.totalCount);
      setPage(data.page);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors(page, pageSize);
  }, [page, pageSize]);

  const handleDelete = async (id) => {
    if (!window.confirm('Видалити лікаря?')) return;
    try {
      await fetch(`${API}/Doctors/${id}`, { method: 'DELETE' });
      fetchDoctors(page, pageSize);
    } catch {
      alert('Помилка видалення');
    }
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setPage(1);
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="mb-0">Список лікарів</h2>
        <button className="btn btn-success" onClick={() => setShowModal(true)}>+ Додати лікаря</button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="text-center my-4">
          <div className="spinner-border" role="status" />
        </div>
      ) : (
        <>
          <Table items={items} onDelete={handleDelete} />
          <Pagination
            page={page}
            pagesCount={pagesCount}
            onPageChange={setPage}
            pageSize={pageSize}
            onPageSizeChange={handlePageSizeChange}
            totalCount={totalCount}
          />
        </>
      )}

      {showModal && (
        <AddDoctorModal
          onSaved={() => fetchDoctors(page, pageSize)}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

export default App;
