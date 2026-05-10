import React, { useState, useRef } from 'react';
import { Card } from 'primereact/card';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Message } from 'primereact/message';
import { supabase } from '../config/supabaseClient';
import { useToast } from '../context/ToastContext';

const SqlEngine = () => {
  const [query,        setQuery]        = useState('SELECT * FROM chart_of_accounts;');
  const [results,      setResults]      = useState(null);
  const [error,        setError]        = useState(null);
  const [columns,      setColumns]      = useState([]);
  const { showToast } = useToast();
  const [queryHistory, setQueryHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('sql_query_history');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  // ─── Save a successful query to the persistent audit trail ───────
  const saveToHistory = (executedQuery) => {
    if (!executedQuery.trim()) return;
    setQueryHistory(prev => {
      const deduped = [executedQuery, ...prev.filter(q => q !== executedQuery)].slice(0, 10);
      try { localStorage.setItem('sql_query_history', JSON.stringify(deduped)); } catch {}
      return deduped;
    });
  };

  const clearHistory = () => {
    setQueryHistory([]);
    try { localStorage.removeItem('sql_query_history'); } catch {}
  };

  const runQuery = async (overrideQuery) => {
    const activeQuery = typeof overrideQuery === 'string' ? overrideQuery : query;
    setError(null);
    setResults(null);
    setColumns([]);

    if (!activeQuery.trim()) {
      setError('يرجى إدخال استعلام SQL.');
      return;
    }

    saveToHistory(activeQuery.trim());
    
    try {
      const { data, error } = await supabase.rpc('exec_raw_sql', { sql_query: activeQuery });
      
      if (error) {
        setError(error.message);
        showToast('error', 'خطأ في الاستعلام', error.message);
        return;
      }
      
      if (Array.isArray(data)) {
        setResults(data);
        if (data.length > 0) {
          const generatedCols = Object.keys(data[0]).map(key => ({ field: key, header: key }));
          setColumns(generatedCols);
        }
      } else if (data && data.status === 'success') {
        setResults('SUCCESS_ACTION');
        showToast('success', 'نجاح', 'تم تنفيذ الاستعلام بنجاح');
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'حدث خطأ غير متوقع.');
    }
  };

  const tables = ['inventory', 'invoices', 'customers', 'suppliers', 'chart_of_accounts',
                   'journal_entries', 'employees', 'payroll', 'checks',
                   'fixed_assets', 'purchase_invoices', 'departments'];

  const handleTableClick = (tableName) => {
    const q = `SELECT * FROM ${tableName}`;
    setQuery(q);
    runQuery(q);
  };

  const clearQuery = () => {
    setQuery('');
    setResults(null);
    setError(null);
    setColumns([]);
  };

  const dt = useRef(null);

  const exportCSV = () => {
    // Ensure we have data
    if (!results || results.length === 0) {
        alert("لا توجد بيانات لتصديرها");
        return;
    }

    // 1. Extract Headers
    const headers = Object.keys(results[0]);
    
    // 2. Build CSV using Semicolon (;) for Excel compatibility
    const csvRows = [];
    csvRows.push(headers.join(';')); // Header row

    results.forEach(row => {
        const values = headers.map(header => {
            let val = row[header];
            if (val === null || val === undefined) val = '';
            // Escape quotes and wrap in quotes to prevent delimiter breaks
            const escaped = ('' + val).replace(/"/g, '""');
            return `"${escaped}"`;
        });
        csvRows.push(values.join(';')); // Data rows
    });

    // 3. Add UTF-8 BOM (\uFEFF) so Excel forces correct encoding
    const csvString = '\uFEFF' + csvRows.join('\n');

    // 4. Create Download Link
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'SQL_Report.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const tableHeader = (
    <div className="flex justify-between items-center bg-slate-800 p-2 rounded-t-lg border-b border-slate-700">
      <span className="text-slate-300 font-bold">نتائج الاستعلام</span>
      <button 
        type="button" 
        onClick={exportCSV} 
        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-500 transition-colors shadow-md text-sm font-bold"
        title="تصدير إلى CSV"
      >
        <i className="pi pi-file-excel text-lg"></i>
        تصدير البيانات (CSV)
      </button>
    </div>
  );

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <Card title="محرك استعلامات SQL" className="shadow-sm border border-slate-200">
        <div className="mb-4 text-slate-600">
          يمكنك كتابة وتنفيذ استعلامات SQL حقيقية هنا. جرب استعلام <code>SELECT * FROM departments;</code>
        </div>
        
        <div className="mb-4 bg-slate-800 p-4 rounded-xl border border-slate-700">
          <h3 className="text-sm font-bold text-slate-300 mb-3"><i className="pi pi-database ml-2"></i> الجداول المتاحة (انقر للاستعراض السريع):</h3>
          <div className="flex flex-wrap gap-3 mt-4 mb-2 justify-end" dir="ltr">
            {tables.map(table => (
              <button 
                key={table}
                onClick={() => handleTableClick(table)}
                className="px-4 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-md hover:bg-blue-500/20 hover:text-blue-300 transition-all font-mono text-sm cursor-pointer whitespace-nowrap shadow-sm"
              >
                {table}
              </button>
            ))}
          </div>
        </div>

        <InputTextarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          rows={6}
          className="w-full font-mono bg-slate-900 text-green-400 p-4 rounded-lg focus:ring-2 focus:ring-green-500 text-left"
          dir="ltr"
          placeholder="اكتب استعلام SQL هنا..."
          spellCheck={false}
        />
        
        <div className="flex gap-4 mt-4">
          <Button 
            label="تنفيذ الاستعلام" 
            icon="pi pi-play" 
            severity="success" 
            onClick={runQuery} 
          />
          <Button 
            label="مسح" 
            icon="pi pi-refresh" 
            severity="secondary" 
            outlined 
            onClick={clearQuery} 
          />
        </div>
      </Card>

      {/* ── QUERY HISTORY (AUDIT TRAIL) ── */}
      {queryHistory.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(30,27,75,0.6) 100%)',
          border: '1px solid #1e293b',
          borderRadius: '0.85rem',
          padding: '1.1rem 1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}>
          {/* Panel header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{
                width: '1.8rem', height: '1.8rem', borderRadius: '0.4rem',
                background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.8rem',
                boxShadow: '0 0 10px rgba(99,102,241,0.35)',
              }}>
                <i className="pi pi-history" style={{ color: '#fff' }} />
              </div>
              <div>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#a5b4fc' }}>
                  سجل الاستعلامات (Audit Trail)
                </span>
                <span style={{
                  marginRight: '0.5rem',
                  fontSize: '0.65rem', color: '#475569',
                  background: 'rgba(99,102,241,0.12)',
                  border: '1px solid rgba(99,102,241,0.2)',
                  padding: '0.1rem 0.45rem',
                  borderRadius: '9999px',
                  fontFamily: 'monospace',
                }}>
                  localStorage → sql_query_history
                </span>
              </div>
            </div>
            <button
              onClick={clearHistory}
              title="حذف كل السجل"
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: '0.4rem',
                color: '#f87171',
                fontSize: '0.72rem',
                padding: '0.25rem 0.65rem',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.3rem',
                transition: 'background 0.15s',
              }}
            >
              <i className="pi pi-trash" style={{ fontSize: '0.7rem' }} />
              مسح السجل
            </button>
          </div>

          {/* Timeline entries */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', position: 'relative' }}>
            {/* Vertical line */}
            <div style={{
              position: 'absolute',
              right: '0.6rem',
              top: '0.5rem',
              bottom: '0.5rem',
              width: '2px',
              background: 'linear-gradient(to bottom, #6366f1, transparent)',
              borderRadius: '1px',
            }} />

            {queryHistory.map((q, idx) => (
              <button
                key={idx}
                onClick={() => { setQuery(q); runQuery(q); }}
                title="انقر للتنفيذ مجدداً"
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  textAlign: 'right',
                  background: idx === 0
                    ? 'rgba(99,102,241,0.1)'
                    : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${idx === 0 ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.05)'}`,
                  borderRadius: '0.5rem',
                  padding: '0.55rem 0.75rem 0.55rem 0.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  width: '100%',
                }}
              >
                {/* Index dot */}
                <span style={{
                  flexShrink: 0,
                  marginTop: '0.1rem',
                  width: '1.4rem', height: '1.4rem',
                  borderRadius: '50%',
                  background: idx === 0
                    ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
                    : 'rgba(99,102,241,0.15)',
                  border: '1px solid rgba(99,102,241,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.6rem', fontWeight: 700,
                  color: idx === 0 ? '#fff' : '#818cf8',
                  fontFamily: 'monospace',
                }}>
                  {idx + 1}
                </span>

                {/* Query text */}
                <span style={{
                  flex: 1,
                  fontFamily: 'monospace',
                  fontSize: '0.78rem',
                  color: idx === 0 ? '#c7d2fe' : '#64748b',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  textAlign: 'left',
                  direction: 'ltr',
                  lineHeight: 1.5,
                }}>
                  {q}
                </span>

                {/* Re-run icon */}
                <i
                  className="pi pi-play-circle"
                  style={{
                    flexShrink: 0,
                    fontSize: '0.9rem',
                    color: idx === 0 ? '#818cf8' : '#334155',
                    marginTop: '0.15rem',
                    transition: 'color 0.15s',
                  }}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {(error || results) && (
        <Card title="النتائج" className="shadow-sm border border-slate-200">
          {error && (
            <Message severity="error" text={error} className="w-full justify-start" />
          )}

          {results === 'SUCCESS_ACTION' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Message severity="success" text="✓ تم تنفيذ الاستعلام بنجاح على قاعدة البيانات السحابية." className="w-full justify-start" />
              <div style={{ fontSize: '0.72rem', color: '#64748b', textAlign: 'right', paddingRight: '0.5rem' }}>
                <i className="pi pi-cloud" style={{ marginLeft: '0.35rem', color: '#22c55e' }} />
                Supabase → Cloud-Native DB
              </div>
            </div>
          )}

          {Array.isArray(results) && results.length === 0 && (
            <Message severity="info" text="لا توجد بيانات مطابقة." className="w-full justify-start" />
          )}

          {Array.isArray(results) && results.length > 0 && (
            <div className="overflow-x-auto mt-2 border border-slate-200 rounded-lg">
              <DataTable 
                ref={dt}
                value={results} 
                header={tableHeader}
                paginator 
                rows={5} 
                rowsPerPageOptions={[5, 10, 25, 50]}
                emptyMessage="لا توجد بيانات."
                stripedRows
                className="p-datatable-sm border border-slate-700 rounded-lg overflow-hidden"
                responsiveLayout="scroll"
                size="normal"
              >
                {columns.map((col, index) => (
                  <Column 
                    key={index} 
                    field={col.field} 
                    header={col.header} 
                    sortable 
                    headerStyle={{ padding: '1rem', borderBottom: '1px solid #334155', whiteSpace: 'nowrap' }} 
                    bodyStyle={{ padding: '1rem', borderBottom: '1px solid #1e293b' }} 
                    style={{ minWidth: '150px' }} 
                  />
                ))}
              </DataTable>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default SqlEngine;
