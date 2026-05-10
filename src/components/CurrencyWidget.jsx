import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';

/* ─── tiny animated rate row ─────────────────────────────────────── */
const RateRow = ({ label, value, color, loading }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.55rem 0.75rem',
    borderRadius: '0.5rem',
    backgroundColor: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.07)',
  }}>
    <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600, direction: 'rtl' }}>
      {label}
    </span>
    <span style={{
      fontSize: '1.05rem',
      fontWeight: 800,
      color,
      fontFamily: 'monospace',
      letterSpacing: '0.04em',
      minWidth: '3.5rem',
      textAlign: 'left',
      transition: 'opacity 0.4s',
      opacity: loading ? 0.3 : 1,
    }}>
      {loading ? '——' : value}
    </span>
  </div>
);

/* ─── main component ─────────────────────────────────────────────── */
const CurrencyWidget = () => {
  const [visible,   setVisible]   = useState(true);
  const [rates,     setRates]     = useState({ usdToIls: null, usdToJod: null, jodToIls: null });
  const [loading,   setLoading]   = useState(true);
  const [lastFetch, setLastFetch] = useState(null);
  const [error,     setError]     = useState(false);

  const fetchRates = async () => {
    try {
      setLoading(true);
      setError(false);
      const res  = await fetch('https://open.er-api.com/v6/latest/USD');
      const data = await res.json();
      if (data?.rates) {
        const ils = data.rates.ILS;
        const jod = data.rates.JOD;
        setRates({
          usdToIls: ils.toFixed(3),
          usdToJod: jod.toFixed(4),
          jodToIls: (ils / jod).toFixed(4),
        });
        setLastFetch(new Date().toLocaleTimeString('ar-JO'));
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
    const id = setInterval(fetchRates, 3_600_000); // refresh hourly
    return () => clearInterval(id);
  }, []);

  /* ── dialog header ── */
  const header = (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: '0.5rem', direction: 'rtl',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{
          width: '1.8rem', height: '1.8rem', borderRadius: '0.4rem',
          background: 'linear-gradient(135deg,#059669,#10b981)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.85rem',
        }}>💱</div>
        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#10b981' }}>
          أسعار الصرف
        </span>
      </div>
      <button
        onClick={fetchRates}
        title="تحديث الآن"
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: loading ? '#334155' : '#64748b', fontSize: '0.8rem',
          padding: '0.15rem 0.3rem', borderRadius: '0.25rem',
          transition: 'color 0.2s',
        }}
      >
        <i className={`pi pi-refresh ${loading ? 'pi-spin' : ''}`} />
      </button>
    </div>
  );

  return (
    <>
      {/* Re-open button when widget is dismissed */}
      {!visible && (
        <Button
          icon="pi pi-dollar"
          rounded
          title="أسعار الصرف"
          onClick={() => setVisible(true)}
          style={{
            position: 'fixed',
            bottom: '1.25rem',
            left: '1.25rem',
            zIndex: 9999,
            background: 'linear-gradient(135deg,#059669,#10b981)',
            border: 'none',
            boxShadow: '0 4px 20px rgba(16,185,129,0.35)',
            width: '2.8rem',
            height: '2.8rem',
          }}
        />
      )}

      <Dialog
        header={header}
        visible={visible}
        onHide={() => setVisible(false)}
        position="bottom-left"
        modal={false}
        draggable={true}
        resizable={false}
        style={{
          width: '17rem',
          borderRadius: '0.85rem',
          overflow: 'hidden',
          border: '1px solid rgba(16,185,129,0.2)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
        }}
        pt={{
          root:    { style: { zIndex: 9000 } },
          header:  { style: {
            backgroundColor: '#020617',
            borderBottom: '1px solid #1e293b',
            padding: '0.6rem 0.85rem',
            cursor: 'move',
          }},
          content: { style: {
            backgroundColor: '#0a0f1e',
            padding: '0.75rem',
            direction: 'rtl',
          }},
          closeButton: { style: { color: '#475569' } },
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>

          <RateRow
            label="دولار  →  شيكل"
            value={rates.usdToIls}
            color="#34d399"
            loading={loading}
          />
          <RateRow
            label="دولار  →  دينار"
            value={rates.usdToJod}
            color="#60a5fa"
            loading={loading}
          />
          <RateRow
            label="دينار  →  شيكل"
            value={rates.jodToIls}
            color="#fb923c"
            loading={loading}
          />

          {/* Status row */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginTop: '0.25rem', fontSize: '0.65rem', color: '#334155',
          }}>
            {error ? (
              <span style={{ color: '#ef4444' }}>⚠ فشل الاتصال بالخادم</span>
            ) : lastFetch ? (
              <span>آخر تحديث: {lastFetch}</span>
            ) : (
              <span>جارٍ التحميل...</span>
            )}
            <span style={{ color: '#1e3a2f', fontSize: '0.6rem' }}>open.er-api.com</span>
          </div>

        </div>
      </Dialog>
    </>
  );
};

export default CurrencyWidget;
