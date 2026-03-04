import { useState, useEffect, useCallback } from 'react';

const API = 'https://localhost:7134';
const COLORS = ['','#0d6efd','#198754','#dc3545','#6f42c1','#fd7e14','#20c997','#000','#6c757d'];

function Cell({ row, col, state, onOpen, onFlag, gameOver }) {
  const handleClick = () => {
    if (!gameOver && state.status === 'closed') onOpen(row, col);
  };
  const handleRight = (e) => {
    e.preventDefault();
    if (!gameOver) onFlag(row, col);
  };

  let bgClass = 'bg-secondary';
  let content = '';
  let colorStyle = {};

  if (state.status === 'open') {
    bgClass = 'bg-light';
    content = state.number > 0 ? state.number : '';
    if (state.number > 0) {
      colorStyle.color = COLORS[state.number] || '#000';
      colorStyle.fontWeight = 'bold';
    }
  } else if (state.status === 'flag') {
    bgClass = 'bg-secondary';
    content = '🚩';
  } else if (state.status === 'mine') {
    bgClass = 'bg-danger';
    content = '💣';
  } else if (state.status === 'mine-safe') {
    bgClass = 'bg-light';
    content = '💣';
    colorStyle.opacity = 0.4;
  }

  return (
    <td
      onClick={handleClick}
      onContextMenu={handleRight}
      className={`${bgClass} border`}
      style={{
        width: 40, height: 40,
        cursor: gameOver ? 'default' : 'pointer',
        userSelect: 'none',
        textAlign: 'center',
        verticalAlign: 'middle',
        fontSize: '1rem',
        fontWeight: '500',
        boxShadow: state.status === 'closed' ? 'inset 0 1px 3px rgba(0,0,0,0.3), inset 0 -1px 0 rgba(255,255,255,0.2)' : 'none',
        ...colorStyle
      }}
    >
      {content}
    </td>
  );
}

function Board({ rows, cols, cells, onOpen, onFlag, gameOver }) {
  return (
    <table className="table-bordered" style={{ borderCollapse: 'collapse', margin: '0 auto' }}>
      <tbody>
        {Array.from({ length: rows }, (_, r) => (
          <tr key={r}>
            {Array.from({ length: cols }, (_, c) => (
              <Cell
                key={c}
                row={r} col={c}
                state={cells[r]?.[c] || { status: 'closed' }}
                onOpen={onOpen}
                onFlag={onFlag}
                gameOver={gameOver}
              />
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function HistoryModal({ onClose, onResume }) {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [pagesCount, setPagesCount] = useState(1);

  useEffect(() => {
    fetch(`${API}/Minesweeper/history?page=${page}&size=8`)
      .then(r => r.json())
      .then(d => { setItems(d.items); setPagesCount(d.pagesCount); });
  }, [page]);

  const statusBadge = (s) => ({
    playing: <span className="badge bg-primary">Грається</span>,
    won: <span className="badge bg-success">Перемога</span>,
    lost: <span className="badge bg-danger">Програш</span>,
  }[s]);

  return (
    <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white border-0">
            <h6 className="modal-title fw-bold">Історія ігор</h6>
            <button className="btn-close btn-close-white" onClick={onClose} />
          </div>
          <div className="modal-body p-3">
            <table className="table table-sm table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th className="fw-bold">Код</th>
                  <th className="fw-bold">Поле</th>
                  <th className="fw-bold">Міни</th>
                  <th className="fw-bold">Статус</th>
                  <th className="fw-bold d-none d-sm-table-cell">Дата</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map(g => (
                  <tr key={g.id}>
                    <td className="fw-bold text-primary"><code>{g.code}</code></td>
                    <td>{g.rows}×{g.cols}</td>
                    <td>{g.minesCount}</td>
                    <td>{statusBadge(g.status)}</td>
                    <td className="text-muted small d-none d-sm-table-cell">{(g.createdAt)}</td>
                    <td>
                      {g.status === 'playing' && (
                        <button className="btn btn-sm btn-outline-primary" onClick={() => onResume(g.code)}>
                          Продовжити
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pagesCount > 1 && (
            <div className="modal-footer border-0 justify-content-center">
              <nav><ul className="pagination pagination-sm mb-0">
                {Array.from({ length: pagesCount }, (_, i) => (
                  <li key={i} className={`page-item ${page === i+1 ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => setPage(i+1)}>{i+1}</button>
                  </li>
                ))}
              </ul></nav>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Minesweeper() {
  const [rows, setRows] = useState(9);
  const [cols, setCols] = useState(9);
  const [mines, setMines] = useState(10);
  const [code, setCode] = useState('');
  const [cells, setCells] = useState({});
  const [gameStatus, setGameStatus] = useState(null);
  const [flagsLeft, setFlagsLeft] = useState(0);
  const [gameRows, setGameRows] = useState(0);
  const [gameCols, setGameCols] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [resumeCode, setResumeCode] = useState('');
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    if (gameStatus !== 'playing') return;
    const t = setInterval(() => setTimer(p => p + 1), 1000);
    return () => clearInterval(t);
  }, [gameStatus]);

  const buildCells = (r, c) => {
    const grid = {};
    for (let i = 0; i < r; i++) { 
      grid[i] = {}; 
      for (let j = 0; j < c; j++) 
        grid[i][j] = { status: 'closed' }; 
    }
    return grid;
  };

  const applyOpened = (grid, openedArr) => {
    openedArr.forEach(o => { 
      if (grid[o.row]) 
        grid[o.row][o.col] = { 
          status: 'open', 
          number: o.number 
        }; 
      });
  };

  const applyFlags = (grid, flagsArr) => {
    flagsArr.forEach(f => { 
      if (grid[f.row] && grid[f.row][f.col]?.status === 'closed') 
        grid[f.row][f.col] = { 
          status: 'flag' 
        }; 
      });
  };

  const applyMines = (grid, minesArr, lost) => {
    minesArr?.forEach(m => {
      if (grid[m.row]) {
        const cur = grid[m.row][m.col];
        grid[m.row][m.col] = { 
          status: lost && cur?.status !== 'flag' ? 'mine' : 'mine-safe' 
        };
      }
    });
  };

  const startGame = async () => {
    setLoading(true);
    const res = await fetch(`${API}/Minesweeper/new?rows=${rows}&cols=${cols}&mines=${mines}`, { method: 'POST' });
    const data = await res.json();
    setCode(data.code);
    setGameRows(data.rows);
    setGameCols(data.cols);
    setFlagsLeft(data.minesCount);
    setGameStatus(data.status);
    setCells(buildCells(data.rows, data.cols));
    setTimer(0);
    setLoading(false);
  };

  const loadGame = useCallback(async (c) => {
    setLoading(true);
    const res = await fetch(`${API}/Minesweeper/${c}`);
    if (!res.ok) { alert('Гру не знайдено'); setLoading(false); return; }
    const data = await res.json();
    const grid = buildCells(data.rows, data.cols);
    applyOpened(grid, data.opened);
    applyFlags(grid, data.flags);
    if (data.status !== 'playing') applyMines(grid, data.mines, data.status === 'lost');
    setCode(data.code);
    setGameRows(data.rows);
    setGameCols(data.cols);
    setFlagsLeft(data.minesCount - (data.flags?.length || 0));
    setGameStatus(data.status);
    setCells({ ...grid });
    setTimer(0);
    setLoading(false);
  }, []);

  const handleOpen = async (row, col) => {
    if (gameStatus !== 'playing' && gameStatus !== 'waiting') return;

    const res = await fetch(`${API}/Minesweeper/${code}/open`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ row, col, player: 'player1' })
    });

    if (!res.ok) {
      const text = await res.text();
      console.warn('Server error:', text);
      return;
    }

    const data = await res.json();
    setGameStatus(data.status);
    setCells(prev => {
      const grid = JSON.parse(JSON.stringify(prev));
      data.newOpened?.forEach(o => { grid[o.row][o.col] = { status: 'open', number: o.number }; });
      if (data.status !== 'playing') applyMines(grid, data.mines, data.status === 'lost');
      return grid;
    });
    setGameStatus(data.status);
  };

  const handleFlag = async (row, col) => {
    if (gameStatus !== 'playing') return;
    const res = await fetch(`${API}/Minesweeper/${code}/flag`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ row, col, player: 'player1' })
    });
    const data = await res.json();

    setCells(prev => {
      const grid = JSON.parse(JSON.stringify(prev));
      for (let r = 0; r < gameRows; r++)
        for (let c = 0; c < gameCols; c++)
          if (grid[r][c]?.status === 'flag') grid[r][c] = { status: 'closed' };
      applyFlags(grid, data.flags);
      return grid;
    });
    setFlagsLeft(mines - (data.flags?.length || 0));
  };

  const fmtTime = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  return (
    <div className="bg-body-secondary min-vh-100">
      <div className="bg-primary text-white py-3 shadow-sm mb-4">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center">
            <h1 className="h4 mb-0 fw-bold">Сапер</h1>
            <button className="btn btn-outline-light btn-sm fw-semibold"
              onClick={() => setShowHistory(true)}>Історія</button>
          </div>
        </div>
      </div>

      <div className="container pb-5">
        <div className="row g-3">
          <div className="col-lg-3">
            <div className="card shadow-sm border-0">
              <div className="card-body p-3">
                <h6 className="card-title fw-bold mb-3">Нова гра</h6>

                <div className="mb-3">
                  <label className="form-label form-label-sm fw-semibold">Рядків</label>
                  <input className="form-control form-control-sm" type="number" min={2} max={20}
                    value={rows} onChange={e => setRows(+e.target.value)} />
                </div>
                <div className="mb-3">
                  <label className="form-label form-label-sm fw-semibold">Стовпців</label>
                  <input className="form-control form-control-sm" type="number" min={2} max={20}
                    value={cols} onChange={e => setCols(+e.target.value)} />
                </div>
                <div className="mb-3">
                  <label className="form-label form-label-sm fw-semibold">Мін</label>
                  <input className="form-control form-control-sm" type="number" min={1} max={rows*cols-1}
                    value={mines} onChange={e => setMines(+e.target.value)} />
                </div>

                <button className="btn btn-primary w-100 fw-semibold btn-sm mb-3"
                  onClick={startGame} disabled={loading}>
                  {loading ? 'Загрузка...' : 'Почати'}
                </button>

                <hr className="my-2" />

                <h6 className="fw-bold mb-2 small">Продовжити</h6>
                <input className="form-control form-control-sm mb-2"
                  placeholder="Код гри"
                  value={resumeCode}
                  onChange={e => setResumeCode(e.target.value.toUpperCase())}
                />
                <button className="btn btn-outline-primary btn-sm w-100 fw-semibold"
                  onClick={() => loadGame(resumeCode)} disabled={!resumeCode}>
                  Завантажити
                </button>
              </div>
            </div>
          </div>

          <div className="col-lg-9">
            {!gameStatus ? (
              <div className="card shadow-sm border-0 text-center">
                <div className="card-body py-5">
                  <p className="text-muted fw-semibold mb-0">Налаштуй параметри та почни гру</p>
                </div>
              </div>
            ) : (
              <div className="card shadow-sm border-0">
                <div className="card-body p-3">
                  <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                    <div className="d-flex gap-2 align-items-center flex-wrap">
                      <span className="badge bg-danger"><strong>💣</strong> {flagsLeft}</span>
                      <span className="badge bg-info"><strong>⏱ </strong>{fmtTime(timer)}</span>
                      <span className="badge bg-light text-dark"><code>{code}</code></span>
                    </div>

                    <div>
                      {gameStatus === 'won' && <span className="badge bg-success">✓ Перемога</span>}
                      {gameStatus === 'lost' && <span className="badge bg-danger">✗ Програш</span>}
                      {gameStatus === 'playing' && <span className="badge bg-success">◆ Грається</span>}
                    </div>
                  </div>

                  <div className="d-flex justify-content-center mb-3">
                    <div style={{ overflowX: 'auto' }}>
                      <Board
                        rows={gameRows}
                        cols={gameCols}
                        cells={cells}
                        onOpen={handleOpen}
                        onFlag={handleFlag}
                        gameOver={gameStatus !== 'playing' && gameStatus !== 'waiting'}
                      />
                    </div>
                  </div>

                  <p className="text-muted small text-center mb-0">
                    ЛКМ — відкрити · ПКМ — прапорець
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {showHistory && (
        <HistoryModal
          onClose={() => setShowHistory(false)}
          onResume={(c) => { setShowHistory(false); loadGame(c); }}
        />
      )}
    </div>
  );
}
