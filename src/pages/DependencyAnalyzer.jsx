import React, { useState, useCallback, useRef } from 'react';

// ─────────────────────────────────────────────
//  CORE ALGORITHM  (ported 1-to-1 from Java)
// ─────────────────────────────────────────────

/**
 * Parse a CSV string into an array of row-objects.
 * First line = headers.
 * Auto-detects delimiter: ';' (Excel/Arabic) or ',' (standard).
 */
function parseCsv(text) {
  // Strip UTF-8 BOM if present
  const clean = text.charAt(0) === '\uFEFF' ? text.slice(1) : text;
  const lines = clean.trim().split(/\r?\n/).filter(l => l.trim() !== '');
  if (lines.length < 2) return { headers: [], rows: [] };

  // Smart delimiter detection — check header line
  const delimiter = lines[0].includes(';') ? ';' : ',';

  // Strip surrounding double-quotes from a value
  const unquote = (v) => v.trim().replace(/^"|"$/g, '').replace(/""/g, '"');

  const headers = lines[0].split(delimiter).map(unquote);
  const rows = lines.slice(1).map((line) => {
    const vals = line.split(delimiter).map(unquote);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = vals[i] ?? ''; });
    return obj;
  });
  return { headers, rows };
}

/**
 * Java logic: for every ordered pair (x, y) of distinct columns,
 * check whether x → y holds.
 * Returns an array of dependency result objects.
 */
function checkFunctionalDependencies(headers, rows) {
  const results = [];

  for (let xi = 0; xi < headers.length; xi++) {
    for (let yi = 0; yi < headers.length; yi++) {
      if (xi === yi) continue;
      const x = headers[xi];
      const y = headers[yi];

      const map = {}; // x-value → first seen y-value
      let isDependent = true;
      let conflictX = null, conflictY1 = null, conflictY2 = null;

      for (const row of rows) {
        const xVal = row[x];
        const yVal = row[y];
        if (xVal in map) {
          if (map[xVal] !== yVal) {
            isDependent = false;
            conflictX = xVal;
            conflictY1 = map[xVal];
            conflictY2 = yVal;
            break;
          }
        } else {
          map[xVal] = yVal;
        }
      }

      results.push({ x, y, isDependent, conflictX, conflictY1, conflictY2 });
    }
  }

  return results;
}

/**
 * Normalization split for X → Y:
 *   Table 1: distinct (X, Y) pairs
 *   Table 2: original table WITHOUT column Y
 */
function normalizeTables(rows, headers, dep) {
  const { x, y } = dep;

  // Table 1 – unique (x, y) pairs
  const seen = new Set();
  const table1 = [];
  for (const row of rows) {
    const key = `${row[x]}||${row[y]}`;
    if (!seen.has(key)) {
      seen.add(key);
      table1.push({ [x]: row[x], [y]: row[y] });
    }
  }

  // Table 2 – original minus y column
  const table2Headers = headers.filter((h) => h !== y);
  const table2 = rows.map((row) => {
    const obj = {};
    table2Headers.forEach((h) => { obj[h] = row[h]; });
    return obj;
  });

  return { table1, table1Headers: [x, y], table2, table2Headers };
}

// ─────────────────────────────────────────────
//  TINY TABLE COMPONENT  (no PrimeReact needed)
// ─────────────────────────────────────────────

function MiniTable({ headers, rows, accentColor }) {
  if (!rows || rows.length === 0) return null;
  return (
    <div style={{ overflowX: 'auto', borderRadius: '0.5rem', border: `1px solid ${accentColor}33` }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
        <thead>
          <tr style={{ backgroundColor: `${accentColor}22` }}>
            {headers.map((h) => (
              <th key={h} style={{
                padding: '0.5rem 0.75rem',
                textAlign: 'right',
                color: accentColor,
                fontWeight: 700,
                borderBottom: `1px solid ${accentColor}44`,
                whiteSpace: 'nowrap',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{ backgroundColor: ri % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.03)' }}>
              {headers.map((h) => (
                <td key={h} style={{
                  padding: '0.45rem 0.75rem',
                  color: '#cbd5e1',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                }}>{row[h]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────
//  DEPENDENCY CARD
// ─────────────────────────────────────────────

function DependencyCard({ dep, rows, headers }) {
  const [expanded, setExpanded] = useState(false);
  const isSuccess = dep.isDependent;
  const borderColor = isSuccess ? '#22c55e' : '#ef4444';
  const bgGlow = isSuccess ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)';
  const badgeColor = isSuccess ? '#16a34a' : '#b91c1c';

  const norm = isSuccess ? normalizeTables(rows, headers, dep) : null;

  return (
    <div style={{
      border: `1px solid ${borderColor}55`,
      borderLeft: `4px solid ${borderColor}`,
      borderRadius: '0.75rem',
      backgroundColor: bgGlow,
      padding: '1rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      transition: 'box-shadow 0.2s',
      boxShadow: expanded ? `0 0 20px ${borderColor}22` : 'none',
    }}>
      {/* Card header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            fontSize: '1rem', fontWeight: 800, color: '#f1f5f9',
            fontFamily: 'monospace', letterSpacing: '0.05em',
          }}>
            {dep.x}
          </span>
          <span style={{ color: '#818cf8', fontSize: '1.1rem', fontWeight: 700 }}>→</span>
          <span style={{
            fontSize: '1rem', fontWeight: 800, color: '#f1f5f9',
            fontFamily: 'monospace', letterSpacing: '0.05em',
          }}>
            {dep.y}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{
            padding: '0.2rem 0.6rem',
            borderRadius: '9999px',
            backgroundColor: badgeColor,
            color: '#fff',
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}>
            {isSuccess ? '✓ تبعية صحيحة' : '✗ تعارض'}
          </span>
          {isSuccess && (
            <button
              onClick={() => setExpanded((p) => !p)}
              style={{
                background: 'rgba(129,140,248,0.15)',
                border: '1px solid #4f46e5',
                borderRadius: '0.4rem',
                color: '#818cf8',
                fontSize: '0.72rem',
                padding: '0.2rem 0.6rem',
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
            >
              {expanded ? '▲ إخفاء التطبيع' : '▼ عرض التطبيع'}
            </button>
          )}
        </div>
      </div>

      {/* Conflict details */}
      {!isSuccess && (
        <div style={{
          fontSize: '0.75rem', color: '#fca5a5',
          backgroundColor: 'rgba(239,68,68,0.1)',
          borderRadius: '0.4rem',
          padding: '0.4rem 0.75rem',
          fontFamily: 'monospace',
        }}>
          تعارض: <strong>{dep.x}</strong> = <code>{dep.conflictX}</code> يشير إلى &nbsp;
          <code style={{ color: '#fbbf24' }}>{dep.conflictY1}</code> و <code style={{ color: '#f87171' }}>{dep.conflictY2}</code>
        </div>
      )}

      {/* Normalization tables */}
      {isSuccess && expanded && norm && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '0.25rem' }}>

          {/* ── NORMALIZATION BANNER ── */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(6,78,59,0.2) 100%)',
            border: '1px solid rgba(16,185,129,0.35)',
            borderRight: '4px solid #10b981',
            borderRadius: '0.65rem',
            padding: '0.9rem 1.1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.45rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{
                width: '2rem', height: '2rem', borderRadius: '0.4rem',
                background: 'linear-gradient(135deg,#059669,#10b981)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.95rem', flexShrink: 0,
                boxShadow: '0 0 12px rgba(16,185,129,0.35)',
              }}>
                <i className="pi pi-database" style={{ color: '#fff' }} />
              </div>
              <h2 style={{
                margin: 0,
                fontSize: '0.95rem',
                fontWeight: 800,
                background: 'linear-gradient(to left, #6ee7b7, #34d399)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '0.02em',
              }}>
                مرحلة التطبيع وتسوية البيانات&nbsp;
                <span style={{
                  WebkitTextFillColor: '#6ee7b7',
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                }}>
                  (Database Normalization)
                </span>
              </h2>
            </div>

            <p style={{
              margin: 0,
              fontSize: '0.78rem',
              color: '#94a3b8',
              lineHeight: 1.65,
              borderTop: '1px solid rgba(16,185,129,0.15)',
              paddingTop: '0.5rem',
            }}>
              بناءً على خوارزمية الاعتمادية الوظيفية{' '}
              <span style={{ color: '#34d399', fontWeight: 700 }}>(Functional Dependencies)</span>،
              تم تطبيق قواعد{' '}
              <strong style={{ color: '#6ee7b7' }}>التطبيع (Normalization)</strong>{' '}
              تلقائياً. تم تقسيم الجدول الرئيسي إلى جداول فرعية مرتبطة لمنع{' '}
              <span style={{ color: '#fbbf24' }}>تكرار البيانات (Data Redundancy)</span>{' '}
              وضمان تكاملها وحمايتها من{' '}
              <span style={{ color: '#f87171' }}>شذوذ التعديل والحذف (Anomalies)</span>.
            </p>

            {/* Academic tag row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', paddingTop: '0.25rem' }}>
              {['1NF', '2NF', '3NF', 'BCNF', 'FD Analysis', 'Decomposition'].map(tag => (
                <span key={tag} style={{
                  padding: '0.15rem 0.5rem',
                  borderRadius: '9999px',
                  border: '1px solid rgba(16,185,129,0.3)',
                  backgroundColor: 'rgba(16,185,129,0.08)',
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  color: '#6ee7b7',
                  fontFamily: 'monospace',
                  letterSpacing: '0.06em',
                }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* ── SPLIT TABLES ── */}
          <div>
            <p style={{ margin: '0 0 0.35rem', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
              🗂 الجدول الأول — الأزواج الفريدة ({dep.x} → {dep.y})
            </p>
            <MiniTable headers={norm.table1Headers} rows={norm.table1} accentColor="#22c55e" />
          </div>
          <div>
            <p style={{ margin: '0 0 0.35rem', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
              🗂 الجدول الثاني — البيانات بدون عمود {dep.y}
            </p>
            <MiniTable headers={norm.table2Headers} rows={norm.table2} accentColor="#60a5fa" />
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  MAIN PAGE
// ─────────────────────────────────────────────

export default function DependencyAnalyzer() {
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [dependencies, setDependencies] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'success' | 'error'
  const fileInputRef = useRef(null);

  const processFile = useCallback((file) => {
    if (!file || !file.name.endsWith('.csv')) {
      alert('يرجى رفع ملف CSV فقط.');
      return;
    }
    setFileName(file.name);
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const { headers: h, rows: r } = parseCsv(e.target.result);
      const deps = checkFunctionalDependencies(h, r);
      setHeaders(h);
      setRows(r);
      setDependencies(deps);
      setIsProcessing(false);
      setFilter('all');
    };
    reader.readAsText(file, 'UTF-8');
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    processFile(file);
  }, [processFile]);

  const handleFileChange = (e) => processFile(e.target.files[0]);

  const successCount = dependencies.filter((d) => d.isDependent).length;
  const errorCount = dependencies.filter((d) => !d.isDependent).length;

  const filtered = dependencies.filter((d) => {
    if (filter === 'success') return d.isDependent;
    if (filter === 'error') return !d.isDependent;
    return true;
  });

  return (
    <div dir="rtl" style={{ minHeight: '100%', color: '#e2e8f0', fontFamily: "'Segoe UI', sans-serif" }}>

      {/* ── PAGE HEADER ── */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 60%, #042f2e 100%)',
        borderRadius: '1rem',
        padding: '2rem',
        marginBottom: '1.5rem',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid #312e81',
      }}>
        {/* Decorative blobs */}
        <div style={{
          position: 'absolute', width: '300px', height: '300px',
          background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
          top: '-80px', left: '-60px', borderRadius: '50%', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', width: '200px', height: '200px',
          background: 'radial-gradient(circle, rgba(34,197,94,0.1) 0%, transparent 70%)',
          bottom: '-50px', right: '10%', borderRadius: '50%', pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <div style={{
              width: '3rem', height: '3rem', borderRadius: '0.75rem',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.4rem', boxShadow: '0 0 20px rgba(99,102,241,0.4)',
            }}>
              <i className="pi pi-sitemap" />
            </div>
            <div>
              <h1 style={{
                margin: 0, fontSize: '1.5rem', fontWeight: 800,
                background: 'linear-gradient(to left, #a5b4fc, #34d399)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                محرك تحليل الاعتماديات
              </h1>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#6366f1', fontWeight: 600, letterSpacing: '0.1em' }}>
                Java Algorithm Port — Cloud Ready
              </p>
            </div>
          </div>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem', maxWidth: '600px' }}>
            ارفع ملف CSV وسيقوم المحرك بفحص جميع الاعتماديات الدالية (FD) تلقائياً وتقسيم الجداول وفق قواعد التطبيع — مُنقول حرفياً من خوارزمية Java.
          </p>
        </div>
      </div>

      {/* ── UPLOAD AREA ── */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? '#818cf8' : '#334155'}`,
          borderRadius: '1rem',
          padding: '2.5rem 1rem',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s',
          backgroundColor: dragOver ? 'rgba(99,102,241,0.07)' : 'rgba(15,23,42,0.6)',
          marginBottom: '1.5rem',
          position: 'relative',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <div style={{
          width: '3.5rem', height: '3.5rem',
          background: dragOver
            ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
            : 'rgba(99,102,241,0.15)',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1rem',
          fontSize: '1.4rem', color: '#818cf8',
          transition: 'all 0.2s',
          boxShadow: dragOver ? '0 0 24px rgba(99,102,241,0.4)' : 'none',
        }}>
          <i className="pi pi-upload" />
        </div>
        {fileName ? (
          <p style={{ margin: 0, color: '#22c55e', fontWeight: 700, fontSize: '0.95rem' }}>
            <i className="pi pi-file" style={{ marginLeft: '0.4rem' }} />
            {fileName}
          </p>
        ) : (
          <>
            <p style={{ margin: '0 0 0.25rem', color: '#e2e8f0', fontWeight: 600 }}>
              اسحب ملف CSV هنا أو انقر للاختيار
            </p>
            <p style={{ margin: 0, color: '#475569', fontSize: '0.8rem' }}>
              يدعم: CSV بترميز UTF-8 مع رأس عمود في السطر الأول
            </p>
          </>
        )}

        {isProcessing && (
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '1rem',
            backgroundColor: 'rgba(15,23,42,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '0.75rem', color: '#818cf8', fontWeight: 600,
          }}>
            <i className="pi pi-spin pi-spinner" style={{ fontSize: '1.2rem' }} />
            جاري تحليل البيانات...
          </div>
        )}
      </div>

      {/* ── STATS + FILTER BAR ── */}
      {dependencies.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem',
        }}>
          {/* Stats */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {[
              { label: 'إجمالي الفحوص', value: dependencies.length, color: '#818cf8', bg: 'rgba(99,102,241,0.12)' },
              { label: 'تبعيات صحيحة', value: successCount, color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
              { label: 'تعارضات', value: errorCount, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
              { label: 'أعمدة', value: headers.length, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
              { label: 'صفوف', value: rows.length, color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
            ].map((s) => (
              <div key={s.label} style={{
                padding: '0.5rem 1rem', borderRadius: '0.6rem',
                backgroundColor: s.bg, border: `1px solid ${s.color}33`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '80px',
              }}>
                <span style={{ fontSize: '1.3rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</span>
                <span style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '2px' }}>{s.label}</span>
              </div>
            ))}
          </div>

          {/* Filter buttons */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {[
              { key: 'all', label: 'الكل', icon: 'pi-list' },
              { key: 'success', label: 'الصحيحة', icon: 'pi-check-circle' },
              { key: 'error', label: 'التعارضات', icon: 'pi-times-circle' },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: '0.5rem',
                  border: `1px solid ${filter === f.key ? '#6366f1' : '#334155'}`,
                  backgroundColor: filter === f.key ? 'rgba(99,102,241,0.2)' : 'transparent',
                  color: filter === f.key ? '#a5b4fc' : '#64748b',
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                  fontWeight: filter === f.key ? 700 : 400,
                  transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', gap: '0.35rem',
                }}
              >
                <i className={`pi ${f.icon}`} style={{ fontSize: '0.8rem' }} />
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── DEPENDENCY CARDS GRID ── */}
      {filtered.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
          gap: '0.85rem',
        }}>
          {filtered.map((dep, i) => (
            <DependencyCard key={i} dep={dep} rows={rows} headers={headers} />
          ))}
        </div>
      ) : dependencies.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '4rem 2rem',
          color: '#334155', fontSize: '0.9rem',
        }}>
          <i className="pi pi-sitemap" style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block', opacity: 0.3 }} />
          <p style={{ margin: 0 }}>ارفع ملف CSV لبدء التحليل</p>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#475569' }}>
          لا توجد نتائج للفلتر المحدد.
        </div>
      )}
    </div>
  );
}
