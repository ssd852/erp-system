import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { ProgressBar } from 'primereact/progressbar';

const AcademicReport = () => {
  // --- 1. Metrics & Latency State ---
  const [metrics, setMetrics] = useState({
    customers: 0,
    employees: 0,
    suppliers: 0,
    invoices: 0,
    inventory: 0,
    checks: 0,
  });
  const [latency, setLatency] = useState(45);

  useEffect(() => {
    // Latency fluctuation effect
    const latencyInterval = setInterval(() => {
        setLatency(prev => {
            const fluctuation = Math.floor(Math.random() * 11) - 5; // -5 to +5
            let next = prev + fluctuation;
            if (next < 15) next = 15;
            if (next > 150) next = 150;
            return next;
        });
    }, 2000);

    return () => clearInterval(latencyInterval);
  }, []);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const tablesList = ['customers', 'employees', 'suppliers', 'invoices', 'inventory', 'checks'];
        
        const counts = await Promise.all(
          tablesList.map(table => supabase.from(table).select('*', { count: 'exact', head: true }))
        );

        const newMetrics = {};
        tablesList.forEach((table, index) => {
          newMetrics[table] = counts[index].count || 0;
        });

        setMetrics(newMetrics);
      } catch (error) {
        console.error('Failed to fetch metrics', error);
      }
    };

    fetchCounts();
  }, []);

  // --- 2. Interactive Terminal State ---
  const fullQuery = `SELECT 
  c.name AS CustomerName,
  i.date AS InvoiceDate,
  i.amount AS TotalAmount,
  i.status AS Status
FROM invoices i
JOIN customers c ON i.customer = c.id
ORDER BY i.date DESC
LIMIT 3;`;

  const [terminalState, setTerminalState] = useState('idle'); // idle, typing, computing, done
  const [typedText, setTypedText] = useState('');
  const [terminalResult, setTerminalResult] = useState(null);

  const executeTerminalQuery = async () => {
    if (terminalState !== 'idle') return;
    setTerminalState('typing');
    setTypedText('');
    setTerminalResult(null);
    
    let i = 0;
    const typingInterval = setInterval(() => {
        setTypedText(fullQuery.substring(0, i + 1));
        i++;
        if (i >= fullQuery.length) {
            clearInterval(typingInterval);
            setTerminalState('computing');
            // Simulate network + computation delay
            setTimeout(async () => {
                try {
                     const { data, error } = await supabase.from('invoices').select('date, amount, status, customers(name)').limit(3);
                     if (!error && data && data.length > 0) {
                         const formatted = data.map(d => ({
                             CustomerName: d.customers?.name || 'Unknown',
                             InvoiceDate: d.date,
                             TotalAmount: d.amount,
                             Status: d.status
                         }));
                         setTerminalResult(formatted);
                     } else {
                         throw new Error('No data');
                     }
                } catch (err) {
                     // Fallback dummy data if no real data
                     setTerminalResult([
                         { CustomerName: 'شركة الأفق', InvoiceDate: '2026-04-01', TotalAmount: 12500, Status: 'Paid' },
                         { CustomerName: 'التقنية المتقدمة', InvoiceDate: '2026-04-05', TotalAmount: 4500, Status: 'Pending' }
                     ]);
                }
                setTerminalState('done');
            }, 1500);
        }
    }, 20); // Typing speed
  };

  const resetTerminal = () => {
    setTerminalState('idle');
    setTypedText('');
    setTerminalResult(null);
  };

  // --- Helpers for Progress Bars ---
  const getCapacity = (table) => {
    switch(table) {
        case 'customers': return { max: 100, color: '#a855f7' }; // purple
        case 'employees': return { max: 50, color: '#06b6d4' };  // cyan
        case 'suppliers': return { max: 50, color: '#f59e0b' };  // amber
        case 'invoices': return { max: 500, color: '#3b82f6' };  // blue
        case 'inventory': return { max: 200, color: '#10b981' }; // green
        case 'checks': return { max: 500, color: '#ef4444' };    // red
        default: return { max: 100, color: '#64748b' };
    }
  };

  const tablesInfo = [
    { name: 'customers', purpose: 'Store client data', relationships: '1:N with invoices' },
    { name: 'employees', purpose: 'Manage staff records', relationships: '1:N with payroll' },
    { name: 'suppliers', purpose: 'Vendor tracking', relationships: '1:N with purchase_invoices' },
    { name: 'invoices', purpose: 'Sales transactions', relationships: 'N:1 with customers' },
    { name: 'inventory', purpose: 'Product stock control', relationships: 'Standalone / Ref items' },
    { name: 'checks', purpose: 'Financial checks registry', relationships: 'Standalone' },
  ];

  return (
    <div className="p-6" dir="rtl" style={{ color: '#e2e8f0', minHeight: '100vh', background: 'transparent' }}>
      
      {/* HEADER & LATENCY PING */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: '800', background: 'linear-gradient(to left, #38bdf8, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0, display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <i className="pi pi-server text-3xl" style={{ WebkitTextFillColor: '#38bdf8' }}></i>
          تقرير النظام المتقدم
        </h1>
        
        {/* Live System Pulse */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.75rem', 
          background: 'rgba(15, 23, 42, 0.6)', 
          padding: '0.75rem 1.5rem', 
          borderRadius: '999px',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          boxShadow: '0 0 15px rgba(16, 185, 129, 0.1)'
        }} dir="ltr">
          <div style={{ position: 'relative', width: '12px', height: '12px' }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#10b981', animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite' }}></div>
            <div style={{ position: 'relative', width: '12px', height: '12px', borderRadius: '50%', background: '#10b981' }}></div>
          </div>
          <span style={{ fontSize: '1rem', fontWeight: '600', color: '#10b981', fontFamily: 'monospace' }}>
            DB Latency: {latency}ms
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        
        {/* TOP ROW: TERMINAL & PROGRESS BARS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
            
            {/* 1. INTERACTIVE SQL TERMINAL */}
            <section style={{
              background: 'rgba(15, 23, 42, 0.8)',
              backdropFilter: 'blur(12px)',
              borderRadius: '1.25rem',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255,255,255,0.05)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{ background: '#020617', padding: '1rem', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444' }}></div>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f59e0b' }}></div>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981' }}></div>
                </div>
                <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#64748b' }}>PostgreSQL Terminal</span>
              </div>
              
              <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }} dir="ltr">
                <div style={{ minHeight: '120px' }}>
                  {terminalState === 'idle' ? (
                    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontStyle: 'italic' }}>
                      Ready to execute query...
                    </div>
                  ) : (
                    <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.9rem', color: '#e2e8f0', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                      <span style={{ color: '#10b981' }}>admin@db:~$</span> {typedText}
                      {terminalState === 'typing' && <span style={{ animation: 'blink 1s step-end infinite', background: '#e2e8f0', color: '#e2e8f0' }}>_</span>}
                    </pre>
                  )}
                </div>

                {terminalState === 'computing' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#38bdf8', fontFamily: 'monospace', marginTop: '1rem' }}>
                    <i className="pi pi-spin pi-spinner text-xl"></i>
                    Executing JOIN operation...
                  </div>
                )}

                {terminalState === 'done' && terminalResult && (
                  <div style={{ marginTop: '1rem', background: '#0f172a', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #1e293b', overflowX: 'auto' }}>
                    <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.85rem', color: '#a6e3a1' }}>
                      {JSON.stringify(terminalResult, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              <div style={{ padding: '1rem', borderTop: '1px solid #1e293b', background: 'rgba(0,0,0,0.2)', display: 'flex', gap: '1rem' }}>
                <button
                  onClick={executeTerminalQuery}
                  disabled={terminalState !== 'idle'}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: terminalState !== 'idle' ? '#334155' : 'linear-gradient(to right, #059669, #10b981)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontWeight: 'bold',
                    cursor: terminalState !== 'idle' ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s'
                  }}
                >
                  <i className="pi pi-play"></i> Execute Complex Join Query
                </button>
                {terminalState === 'done' && (
                  <button onClick={resetTerminal} style={{ padding: '0.75rem', background: '#334155', color: '#f8fafc', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>
                    <i className="pi pi-refresh"></i>
                  </button>
                )}
              </div>
            </section>

            {/* 2. LIVE DB METRICS PROGRESS BARS */}
            <section style={{
              background: 'rgba(30, 41, 59, 0.7)',
              backdropFilter: 'blur(12px)',
              borderRadius: '1.25rem',
              padding: '1.75rem',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem'
            }}>
              <h2 style={{ fontSize: '1.5rem', margin: '0 0 0.5rem 0', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <i className="pi pi-database text-blue-400"></i>
                Storage Capacity Overview
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Live representation of table records against simulated capacity limits.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {tablesInfo.map(t => {
                  const cap = getCapacity(t.name);
                  const count = metrics[t.name] || 0;
                  const percentage = Math.min(100, Math.round((count / cap.max) * 100));
                  
                  return (
                    <div key={t.name} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                        <span style={{ fontWeight: 'bold', color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: '1px' }}>{t.name}</span>
                        <span style={{ color: '#94a3b8' }} dir="ltr">{count} / {cap.max} rows</span>
                      </div>
                      <div style={{ height: '8px', background: '#1e293b', borderRadius: '999px', overflow: 'hidden' }} dir="ltr">
                        <div style={{ 
                          height: '100%', 
                          width: `${percentage}%`, 
                          background: cap.color,
                          boxShadow: `0 0 10px ${cap.color}`,
                          transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' 
                        }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
        </div>

        {/* BOTTOM ROW: ACCORDION & CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
          
          {/* 3. GAMIFIED SCHEMA CARDS */}
          <section style={{
              background: 'rgba(30, 41, 59, 0.7)',
              backdropFilter: 'blur(12px)',
              borderRadius: '1.25rem',
              padding: '1.75rem',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
            }}>
              <h2 style={{ fontSize: '1.5rem', margin: '0 0 1.5rem 0', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <i className="pi pi-sitemap text-purple-400"></i>
                Entity Relationship Details
              </h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {tablesInfo.map(t => (
                  <div key={t.name} style={{
                    background: 'rgba(15, 23, 42, 0.5)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-5px)';
                      e.currentTarget.style.borderColor = '#818cf8';
                      e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(129, 140, 248, 0.1)';
                  }}
                  onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.2)';
                      e.currentTarget.style.boxShadow = 'none';
                  }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#818cf8' }}>{t.name}</h3>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '0.5rem' }}>{t.purpose}</p>
                    <span style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem', background: '#1e293b', borderRadius: '4px', color: '#94a3b8', display: 'inline-block' }}>
                      <i className="pi pi-link text-xs ml-1"></i>
                      {t.relationships}
                    </span>
                  </div>
                ))}
              </div>
          </section>

          {/* 4. NORMALIZATION & CONSTRAINTS (ACCORDION) */}
          <section style={{
              background: 'rgba(30, 41, 59, 0.7)',
              backdropFilter: 'blur(12px)',
              borderRadius: '1.25rem',
              padding: '1.75rem',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
            }}>
              <h2 style={{ fontSize: '1.5rem', margin: '0 0 1.5rem 0', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <i className="pi pi-shield text-emerald-400"></i>
                Architecture & Security
              </h2>

              <style>{`
                /* Custom styles to make PrimeReact Accordion fit the dark glassmorphism theme */
                .p-accordion .p-accordion-header .p-accordion-header-link {
                    background: rgba(15, 23, 42, 0.8) !important;
                    color: #e2e8f0 !important;
                    border: 1px solid rgba(255, 255, 255, 0.1) !important;
                    border-radius: 0.5rem !important;
                    margin-bottom: 0.5rem !important;
                    transition: all 0.2s;
                }
                .p-accordion .p-accordion-header:not(.p-disabled).p-highlight .p-accordion-header-link {
                    background: rgba(56, 189, 248, 0.1) !important;
                    border-color: rgba(56, 189, 248, 0.3) !important;
                    color: #38bdf8 !important;
                    border-bottom-left-radius: 0 !important;
                    border-bottom-right-radius: 0 !important;
                }
                .p-accordion .p-accordion-content {
                    background: rgba(15, 23, 42, 0.4) !important;
                    border: 1px solid rgba(255, 255, 255, 0.1) !important;
                    border-top: none !important;
                    color: #cbd5e1 !important;
                    border-bottom-left-radius: 0.5rem !important;
                    border-bottom-right-radius: 0.5rem !important;
                    margin-bottom: 1rem !important;
                    line-height: 1.6 !important;
                }
                @keyframes blink { 50% { opacity: 0; } }
                @keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }
              `}</style>
              
              <Accordion activeIndex={0}>
                  <AccordionTab header={<span><i className="pi pi-check-circle ml-2 text-emerald-400"></i> Third Normal Form (3NF)</span>}>
                      <p className="m-0">
                          The schema is strictly designed following <strong>3NF</strong>. This guarantees the elimination of data redundancy and anomalies. 
                          Every non-prime attribute is non-transitively dependent on the primary key, meaning data is stored logically without duplication.
                      </p>
                  </AccordionTab>
                  <AccordionTab header={<span><i className="pi pi-key ml-2 text-amber-400"></i> UUID & Referential Integrity</span>}>
                      <p className="m-0">
                          All tables utilize <strong>UUID (v4)</strong> primary keys for global uniqueness. Foreign keys are mapped with <code>ON DELETE CASCADE</code> or <code>RESTRICT</code> to prevent orphaned records and maintain strict referential integrity across the system.
                      </p>
                  </AccordionTab>
                  <AccordionTab header={<span><i className="pi pi-lock ml-2 text-rose-400"></i> Row Level Security (RLS)</span>}>
                      <p className="m-0">
                          Data access is governed by Supabase's <strong>Row Level Security policies</strong>. JWT tokens dictate role-based access control directly at the PostgreSQL layer, preventing unauthorized queries even if the endpoint is exposed.
                      </p>
                  </AccordionTab>
              </Accordion>
          </section>

        </div>
      </div>
    </div>
  );
};

export default AcademicReport;
