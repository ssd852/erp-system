import React from 'react';

// ─── Enterprise-grade A4 Print Wrapper ──────────────────────────────────────
// Uses only inline styles and a <style> block — immune to Tailwind purge.
// The parent CSS hides #print-template on screen and reveals it only on print.

const PrintWrapper = ({ data = [], columns = [], title = 'تقرير النظام' }) => {
  const now       = new Date();
  const dateStr   = now.toLocaleDateString('ar-EG', { year:'numeric', month:'long', day:'numeric' });
  const timeStr   = now.toLocaleTimeString('ar-EG');
  const docId     = `RPT-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${String(Math.floor(Math.random()*9000)+1000)}`;

  // ── Style objects ─────────────────────────────────────────────────────────
  const s = {
    root:        { position:'relative', background:'#ffffff', color:'#000000', fontFamily:"'Segoe UI',Tahoma,Arial,sans-serif", direction:'rtl', padding:'20mm 15mm', minHeight:'297mm', boxSizing:'border-box' },
    watermark:   { position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%) rotate(-30deg)', fontSize:'18rem', color:'rgba(0,0,0,0.025)', pointerEvents:'none', userSelect:'none', zIndex:0, lineHeight:1 },
    body:        { position:'relative', zIndex:1 },
    header:      { display:'flex', justifyContent:'space-between', alignItems:'flex-end', borderBottom:'4px solid #0f172a', paddingBottom:20, marginBottom:28 },
    logoBox:     { width:80, height:80, background:'#0f172a', border:'2px solid #334155', borderRadius:12, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'white', fontSize:11, fontWeight:'bold', gap:4, flexShrink:0 },
    orgName:     { fontSize:22, fontWeight:900, color:'#0f172a', margin:'0 0 6px 0' },
    orgSub:      { fontSize:12, color:'#475569', margin:'2px 0' },
    reportBox:   { background:'#f8fafc', border:'1px solid #cbd5e1', borderRadius:8, padding:'14px 20px', textAlign:'left', minWidth:240 },
    reportTitle: { fontSize:16, fontWeight:'bold', color:'#0f172a', margin:'0 0 10px 0', paddingBottom:8, borderBottom:'1px solid #cbd5e1' },
    reportMeta:  { fontSize:11, color:'#475569', margin:'4px 0', fontWeight:'bold' },
    metaBar:     { display:'flex', justifyContent:'space-between', background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:6, padding:'10px 16px', marginBottom:24, fontSize:12 },
    metaItem:    { display:'flex', flexDirection:'column', gap:3 },
    metaLabel:   { fontSize:10, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.05em' },
    metaValue:   { fontWeight:'bold', color:'#0f172a', fontFamily:'monospace' },
    table:       { width:'100%', borderCollapse:'collapse', marginBottom:32, fontSize:12 },
    th:          { background:'#0f172a', color:'#ffffff', fontWeight:'bold', padding:'10px 12px', textAlign:'right', border:'1px solid #1e293b', fontSize:12, whiteSpace:'nowrap' },
    tdEven:      { background:'#f8fafc', padding:'9px 12px', border:'1px solid #e2e8f0', color:'#1e293b', verticalAlign:'middle' },
    tdOdd:       { background:'#ffffff',  padding:'9px 12px', border:'1px solid #e2e8f0', color:'#1e293b', verticalAlign:'middle' },
    noData:      { textAlign:'center', color:'#94a3b8', padding:32, fontStyle:'italic' },
    footerBar:   { marginTop:40, paddingTop:20, borderTop:'2px solid #94a3b8', display:'flex', justifyContent:'space-between', alignItems:'flex-end' },
    sigBlock:    { textAlign:'center', flex:1 },
    sigLabel:    { fontSize:13, fontWeight:'bold', color:'#1e293b', marginBottom:32, display:'block' },
    sigLine:     { borderBottom:'1px solid #94a3b8', width:160, margin:'0 auto', marginBottom:4 },
    stampCircle: { width:80, height:80, borderRadius:'50%', border:'2px dashed #94a3b8', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto', fontSize:10, color:'#94a3b8' },
    pageNote:    { textAlign:'center', fontSize:10, color:'#94a3b8', marginTop:24, paddingTop:12, borderTop:'1px solid #e2e8f0' },
  };

  return (
    <div id="print-template" dir="rtl">
      <div style={s.root}>

        {/* ── Watermark ─────────────────────────────────────────── */}
        <div style={s.watermark} aria-hidden="true">⬡</div>

        <div style={s.body}>

          {/* ── Corporate Header ────────────────────────────────── */}
          <div style={s.header}>
            <div style={{ display:'flex', alignItems:'center', gap:20 }}>
              <div style={s.logoBox}>
                <i className="pi pi-box" style={{ fontSize:28 }}></i>
                <span>SmartCore</span>
              </div>
              <div>
                <h1 style={s.orgName}>مؤسسة النظام المتقدم للأعمال</h1>
                <p style={s.orgSub}>نظام تخطيط موارد المؤسسات (ERP Enterprise)</p>
                <p style={s.orgSub}>الرقم الضريبي: 300456789100003 &nbsp;|&nbsp; هاتف: 0599-000-000</p>
                <p style={s.orgSub}>ص.ب 12345، الرياض 11564، المملكة العربية السعودية</p>
              </div>
            </div>

            <div style={s.reportBox}>
              <p style={s.reportTitle}>{title}</p>
              <p style={s.reportMeta}>📅 تاريخ الإصدار: {dateStr}</p>
              <p style={s.reportMeta}>🕐 وقت الإصدار: {timeStr}</p>
              <p style={s.reportMeta}>🔖 رقم المستند: {docId}</p>
              <p style={s.reportMeta}>👤 بواسطة: النظام الآلي — SmartCore AI</p>
            </div>
          </div>

          {/* ── Document Metadata Bar ────────────────────────────── */}
          <div style={s.metaBar}>
            <div style={s.metaItem}>
              <span style={s.metaLabel}>إجمالي السجلات</span>
              <span style={s.metaValue}>{data.length} سجل</span>
            </div>
            <div style={s.metaItem}>
              <span style={s.metaLabel}>حالة التقرير</span>
              <span style={{ ...s.metaValue, color:'#16a34a' }}>✓ موثق ومعتمد</span>
            </div>
            <div style={s.metaItem}>
              <span style={s.metaLabel}>رقم المستند</span>
              <span style={s.metaValue}>{docId}</span>
            </div>
            <div style={s.metaItem}>
              <span style={s.metaLabel}>النظام</span>
              <span style={s.metaValue}>SmartCore ERP v2.0</span>
            </div>
          </div>

          {/* ── Data Table ──────────────────────────────────────── */}
          {data.length > 0 ? (
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={{ ...s.th, width:40, textAlign:'center' }}>#</th>
                  {columns.map((col, i) => (
                    <th key={i} style={s.th}>{col.header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, rowIdx) => {
                  const tdStyle = rowIdx % 2 === 0 ? s.tdEven : s.tdOdd;
                  return (
                    <tr key={rowIdx}>
                      <td style={{ ...tdStyle, textAlign:'center', color:'#94a3b8', fontSize:11 }}>{rowIdx + 1}</td>
                      {columns.map((col, colIdx) => {
                        const val = row[col.field];
                        const display = col.type === 'number' && typeof val === 'number'
                          ? val.toLocaleString('ar-EG')
                          : (val ?? '—');
                        return <td key={colIdx} style={tdStyle}>{display}</td>;
                      })}
                    </tr>
                  );
                })}
              </tbody>
              {/* Summary row */}
              <tfoot>
                <tr>
                  <td colSpan={columns.length + 1} style={{ padding:'8px 12px', background:'#f1f5f9', fontSize:11, color:'#475569', borderTop:'2px solid #cbd5e1', textAlign:'left' }}>
                    إجمالي عدد السجلات: <strong>{data.length}</strong> — نهاية التقرير
                  </td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <div style={s.noData}>لا توجد بيانات لعرضها في هذا التقرير.</div>
          )}

          {/* ── Signature Footer ─────────────────────────────────── */}
          <div style={s.footerBar}>
            <div style={s.sigBlock}>
              <span style={s.sigLabel}>توقيع المحاسب / المُعد</span>
              <div style={s.sigLine}></div>
              <span style={{ fontSize:11, color:'#94a3b8' }}>الاسم والتوقيع</span>
            </div>

            <div style={s.sigBlock}>
              <span style={s.sigLabel}>ختم المؤسسة المعتمد</span>
              <div style={s.stampCircle}>مكان الختم</div>
            </div>

            <div style={s.sigBlock}>
              <span style={s.sigLabel}>اعتماد المدير المالي</span>
              <div style={s.sigLine}></div>
              <span style={{ fontSize:11, color:'#94a3b8' }}>الاسم والتوقيع</span>
            </div>
          </div>

          {/* ── Page Footer Note ─────────────────────────────────── */}
          <div style={s.pageNote}>
            هذا التقرير صادر آلياً من نظام SmartCore ERP — {docId} — {dateStr}
            &nbsp;|&nbsp; جميع البيانات سرية وخاصة بالمؤسسة
          </div>

        </div>
      </div>
    </div>
  );
};

export default PrintWrapper;
