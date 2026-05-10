import React, { useState } from 'react';

const TEAM = ['محمد انور ناصر الدين', 'محمد مزهر', 'مالك قباجة'];

const S = {
  page:       { minHeight:'calc(100vh - 64px)', background:'#f1f5f9', padding:24, direction:'rtl', fontFamily:"'Segoe UI',Tahoma,sans-serif" },
  card:       { maxWidth:1100, margin:'0 auto', background:'white', borderRadius:16, boxShadow:'0 20px 60px rgba(0,0,0,0.12)', border:'1px solid #e2e8f0', overflow:'hidden' },
  hdr:        { background:'linear-gradient(to left,#0f172a,#1e293b)', padding:'32px 40px', display:'flex', justifyContent:'space-between', alignItems:'center', color:'white' },
  hdrTitle:   { margin:'0 0 6px 0', fontSize:26, fontWeight:900, display:'flex', alignItems:'center', gap:12 },
  hdrSub:     { margin:0, fontSize:14, color:'#94a3b8', fontWeight:600 },
  printBtn:   { background:'#059669', border:'none', color:'white', padding:'12px 24px', borderRadius:10, fontWeight:'bold', fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', gap:8, boxShadow:'0 4px 15px rgba(5,150,105,0.4)', transition:'background 0.2s', flexShrink:0 },
  body:       { display:'flex', minHeight:500 },
  sidebar:    { width:220, background:'#f8fafc', borderRight:'1px solid #e2e8f0', padding:16, flexShrink:0 },
  sideLabel:  { fontSize:11, color:'#94a3b8', fontWeight:'bold', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:12, padding:'0 8px' },
  tabBtn:     (active) => ({ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:10, border: active ? '1px solid #a7f3d0' : '1px solid transparent', background: active ? '#ecfdf5' : 'transparent', color: active ? '#065f46' : '#64748b', fontWeight:'bold', fontSize:13, cursor:'pointer', width:'100%', textAlign:'right', marginBottom:4, transition:'all 0.15s' }),
  content:    { flex:1, padding:'36px 40px', background:'white' },
  h2:         { fontSize:22, fontWeight:900, color:'#0f172a', margin:'0 0 20px 0', paddingBottom:10, borderBottom:'3px solid #10b981', display:'inline-block' },
  p:          { color:'#374151', lineHeight:1.85, fontSize:15, textAlign:'justify', margin:'0 0 14px 0' },
  grid2:      { display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginTop:16 },
  infoCard:   (color) => ({ background:'#f8fafc', border:`1px solid #e2e8f0`, borderRadius:12, padding:20, borderTop:`3px solid ${color}` }),
  infoTitle:  (color) => ({ fontSize:17, fontWeight:'bold', color, margin:'0 0 10px 0', display:'flex', alignItems:'center', gap:8 }),
  normBox:    { background:'#f0fdf4', borderRight:'4px solid #10b981', padding:24, borderRadius:8 },
  normList:   { listStyle:'none', padding:0, margin:0 },
  normItem:   { padding:'8px 0', borderBottom:'1px solid #d1fae5', fontSize:14, color:'#374151', fontWeight:600 },
  codeBox:    { background:'#0f172a', color:'#94a3b8', padding:20, borderRadius:10, fontFamily:'monospace', fontSize:13, marginTop:16, border:'1px solid #1e293b', direction:'ltr', lineHeight:1.7 },
  grid3:      { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20, marginTop:16 },
  teamCard:   { background:'linear-gradient(180deg,#f8fafc,#fff)', border:'1px solid #e2e8f0', borderRadius:14, padding:24, textAlign:'center', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' },
  teamAvatar: { width:60, height:60, borderRadius:'50%', background:'#dbeafe', border:'2px solid #93c5fd', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', fontSize:22, color:'#2563eb' },
  teamName:   { fontWeight:'bold', fontSize:16, color:'#0f172a', margin:'0 0 6px 0' },
  teamRole:   { fontSize:12, color:'#64748b', fontWeight:600 },
  techRow:    { display:'flex', flexWrap:'wrap', gap:10, marginTop:12 },
  techBadge:  (color) => ({ background: color+'22', border:`1px solid ${color}55`, color, padding:'6px 14px', borderRadius:20, fontSize:13, fontWeight:'bold' }),
};

const sections = [
  {
    id: 'sec-summary',
    title: 'الملخص التنفيذي',
    icon: 'pi pi-book',
    render: () => (
      <div>
        <h2 style={S.h2}>١. الملخص التنفيذي للمشروع</h2>
        <p style={S.p}>يُقدم هذا المشروع نموذجاً عملياً متكاملاً لتطبيق مفاهيم <strong>مساق قاعدة البيانات وإدارتها</strong>. تم بناء النظام ليكون نظاماً لتخطيط موارد المؤسسات (ERP) يعتمد على بنية قواعد البيانات العلائقية (Relational Databases).</p>
        <p style={S.p}>يتجاوز المشروع مجرد تصميم الجداول، ليقدم واجهة تفاعلية قادرة على معالجة البيانات، تنفيذ استعلامات SQL المعقدة ديناميكياً، وتطبيق شروط التكامل المرجعي (Referential Integrity) وقواعد التطبيع (Normalization) لحماية البيانات من الشذوذ.</p>
        <p style={S.p}>يستهدف النظام بيئة عمل متكاملة تشمل: إدارة العملاء والموردين، دورة الفواتير الكاملة (مشتريات ومبيعات)، الرواتب والموارد البشرية، القيود المحاسبية اليومية، والأصول الثابتة — كل ذلك من خلال واجهة ويب حديثة مبنية بتقنية React.js.</p>
        <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:10, padding:20, marginTop:20 }}>
          <p style={{ ...S.p, margin:0, color:'#1e40af', fontWeight:600 }}>🎯 الهدف الأكاديمي: إثبات القدرة على تصميم قاعدة بيانات علائقية مُطبَّعة بالكامل وتضمينها في تطبيق ويب إنتاجي قابل للنشر الفعلي.</p>
        </div>
      </div>
    ),
  },
  {
    id: 'sec-erd',
    title: 'التصميم والمخطط العلائقي',
    icon: 'pi pi-sitemap',
    render: () => (
      <div>
        <h2 style={S.h2}>٢. هندسة قواعد البيانات (ERD & Schema)</h2>
        <div style={S.grid2}>
          <div style={S.infoCard('#3b82f6')}>
            <h3 style={S.infoTitle('#2563eb')}><i className="pi pi-box"></i> الكيانات (Entities)</h3>
            <p style={{ ...S.p, margin:0, fontSize:14 }}>تم تحديد الكيانات الأساسية بناءً على دورة حياة النظام المالي: (العملاء، الموردون، الفواتير، المخزون، القيود اليومية). يمتلك كل كيان مفتاحاً أساسياً (Primary Key) فريداً لا يتكرر.</p>
          </div>
          <div style={S.infoCard('#8b5cf6')}>
            <h3 style={S.infoTitle('#7c3aed')}><i className="pi pi-link"></i> العلاقات (Relationships)</h3>
            <p style={{ ...S.p, margin:0, fontSize:14 }}>تم ربط الكيانات باستخدام المفاتيح الأجنبية (Foreign Keys) مع تحديد نوع العلاقة: (1:N) مثل علاقة العميل بفواتيره، و (M:N) مثل علاقة الفواتير بالمنتجات التي فُكِّكت بجداول وسيطة (Junction Tables).</p>
          </div>
        </div>
        <div style={{ marginTop:20, background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:10, padding:20 }}>
          <h3 style={{ fontWeight:'bold', color:'#0f172a', marginBottom:12, fontSize:16 }}>جداول النظام (11 جدول)</h3>
          <div style={S.techRow}>
            {['Customers','Suppliers','SalesInvoices','PurchaseInvoices','Inventory','ChartOfAccounts','JournalEntries','Employees','Payroll','FixedAssets','CheckPayments'].map(t => (
              <span key={t} style={S.techBadge('#0f172a')}>{t}</span>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'sec-norm',
    title: 'التطبيع (Normalization)',
    icon: 'pi pi-check-circle',
    render: () => (
      <div>
        <h2 style={S.h2}>٣. تسوية البيانات والتطبيع (Normalization)</h2>
        <p style={S.p}>لضمان عدم تكرار البيانات (Data Redundancy) وتجنب شذوذات التعديل والإضافة والحذف (Update/Insert/Delete Anomalies)، تم إخضاع المخطط الكامل لقواعد التطبيع:</p>
        <div style={S.normBox}>
          <ul style={S.normList}>
            {[
              ['1NF — الصيغة الطبيعية الأولى','ضمان أن جميع القيم ذرية (Atomic) ولا توجد مجموعات متكررة في أي جدول. كل خلية تحتوي على قيمة واحدة فقط.','#10b981'],
              ['2NF — الصيغة الطبيعية الثانية','إزالة الاعتمادات الجزئية (Partial Dependencies)؛ كل حقل غير مفتاحي يعتمد على المفتاح الأساسي بالكامل وليس جزءاً منه.','#3b82f6'],
              ['3NF — الصيغة الطبيعية الثالثة','التخلص من الاعتمادات المتعدية (Transitive Dependencies)؛ بيانات العميل مستقلة في جدولها ولا تُكرَّر داخل جدول الفواتير.','#8b5cf6'],
            ].map(([label, desc, color]) => (
              <li key={label} style={{ ...S.normItem, display:'flex', gap:12, alignItems:'flex-start' }}>
                <span style={{ color, flexShrink:0, fontWeight:900 }}>✓</span>
                <span><strong style={{ color }}>{label}:</strong> {desc}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: 'sec-sql',
    title: 'التخزين والاستعلام',
    icon: 'pi pi-database',
    render: () => (
      <div>
        <h2 style={S.h2}>٤. التخزين المستدام ومحرك SQL</h2>
        <p style={S.p}>يتميز هذا النظام بتطبيق مفهوم (Offline-First Persistence). تم بناء محرك قاعدة بيانات مصغر يعمل في متصفح العميل باستخدام LocalStorage، مع محاكاة كاملة لعمليات SQL الأساسية (SELECT / INSERT / UPDATE / DELETE).</p>
        <div style={S.codeBox}>
          <div style={{ color:'#6ee7b7', marginBottom:8 }}>-- نموذج لاستعلام ربط الجداول (INNER JOIN)</div>
          <div><span style={{ color:'#f472b6' }}>SELECT</span> invoices.id, customers.name, invoices.total</div>
          <div><span style={{ color:'#f472b6' }}>FROM</span> invoices</div>
          <div><span style={{ color:'#f472b6' }}>INNER JOIN</span> customers <span style={{ color:'#f472b6' }}>ON</span> invoices.cust_id = customers.id</div>
          <div><span style={{ color:'#f472b6' }}>WHERE</span> invoices.status = <span style={{ color:'#fbbf24' }}>'pending'</span>;</div>
        </div>
        <div style={{ marginTop:20 }}>
          <h3 style={{ fontWeight:'bold', color:'#0f172a', marginBottom:10, fontSize:15 }}>مكدس التقنيات المستخدم</h3>
          <div style={S.techRow}>
            {[['React.js 18','#61dafb'],['Vite','#646cff'],['TailwindCSS','#06b6d4'],['PrimeReact','#3B82F6'],['LocalStorage DB','#10b981'],['Vercel Deploy','#000000']].map(([t,c]) => (
              <span key={t} style={S.techBadge(c)}>{t}</span>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'sec-team',
    title: 'فريق العمل',
    icon: 'pi pi-users',
    render: () => (
      <div>
        <h2 style={S.h2}>٥. فريق تطوير المشروع</h2>
        <p style={{ ...S.p, marginBottom:24 }}>تم إنجاز هذا المشروع بجهود مشتركة وتوزيع للمهام الهندسية والبرمجية لضمان خروج النظام بأعلى معايير الجودة الأكاديمية.</p>
        <div style={S.grid3}>
          {TEAM.map((name, i) => (
            <div key={i} style={S.teamCard}>
              <div style={S.teamAvatar}><i className="pi pi-user"></i></div>
              <h3 style={S.teamName}>{name}</h3>
              <p style={S.teamRole}>مطور قاعدة بيانات وواجهات</p>
            </div>
          ))}
        </div>
        <div style={{ marginTop:28, background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:10, padding:20 }}>
          <h3 style={{ fontWeight:'bold', color:'#0f172a', marginBottom:8, fontSize:15 }}>معلومات المساق</h3>
          <p style={{ ...S.p, margin:0, fontSize:14 }}>المساق: قاعدة البيانات وإدارتها &nbsp;|&nbsp; المستوى الجامعي &nbsp;|&nbsp; العام الدراسي 2025–2026</p>
        </div>
      </div>
    ),
  },
];

const ComprehensiveReport = () => {
  const [active, setActive] = useState(0);

  return (
    <div style={S.page}>
      <div id="comprehensive-report" style={S.card}>

        {/* Header */}
        <div style={S.hdr} className="report-header">
          <div>
            <h1 style={S.hdrTitle}>
              <i className="pi pi-book" style={{ color:'#34d399', fontSize:24 }}></i>
              التقرير الشامل لمشروع قاعدة البيانات
            </h1>
            <p style={S.hdrSub}>مساق قاعدة البيانات وإدارتها — ERP Enterprise</p>
          </div>
          <button
            onClick={() => window.print()}
            style={S.printBtn}
            className="no-print"
            onMouseEnter={e => e.currentTarget.style.background='#047857'}
            onMouseLeave={e => e.currentTarget.style.background='#059669'}
          >
            <i className="pi pi-print"></i> طباعة التقرير الكامل
          </button>
        </div>

        <div style={S.body}>
          {/* Sidebar — hidden on print */}
          <div style={S.sidebar} className="no-print">
            <div style={S.sideLabel}>محتويات التقرير</div>
            {sections.map((s, i) => (
              <button key={i} onClick={() => setActive(i)} style={S.tabBtn(active === i)}>
                <i className={s.icon} style={{ fontSize:14, color: active === i ? '#059669' : '#94a3b8' }}></i>
                <span>{s.title}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={S.content}>
            {/* Screen: active section only */}
            <div className="screen-only">{sections[active].render()}</div>

            {/* Print: all sections sequentially */}
            <div className="print-only" style={{ display:'none' }}>
              {sections.map((s, i) => (
                <div key={i} id={s.id} style={{ marginBottom:48, paddingBottom:32, borderBottom: i < sections.length-1 ? '1px dashed #cbd5e1' : 'none' }}>
                  {s.render()}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scoped print styles for this report */}
      <style>{`
        @media print {
          /* Hide the main app shell */
          body > #root > div > aside,
          body > #root > div > main > header { display: none !important; }

          /* Full-width report card */
          #comprehensive-report {
            position: fixed !important;
            top: 0 !important; left: 0 !important; right: 0 !important;
            width: 100vw !important;
            max-width: 100vw !important;
            border-radius: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
            overflow: visible !important;
            z-index: 99999 !important;
          }

          /* Header becomes black-on-white */
          .report-header {
            background: white !important;
            color: #0f172a !important;
            border-bottom: 4px solid #0f172a !important;
            padding: 20px 32px !important;
          }
          .report-header h1, .report-header p { color: #0f172a !important; }

          /* Hide sidebar & print button */
          .no-print { display: none !important; }

          /* Toggle section visibility */
          .screen-only { display: none !important; }
          .print-only  { display: block !important; }

          /* Color accuracy */
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }

          /* Body layout for the report */
          #comprehensive-report > div:last-child { flex-direction: column !important; }
          #comprehensive-report > div:last-child > div:last-child { width: 100% !important; padding: 32px !important; }
        }
      `}</style>
    </div>
  );
};

export default ComprehensiveReport;
