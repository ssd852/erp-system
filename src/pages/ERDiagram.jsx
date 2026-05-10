import React, { useState } from 'react';

const NODE_WIDTH = 240;
const NODE_HEIGHT = 90;

const themes = {
    amber:  { border: '#fbbf24', text: '#fcd34d', glow: 'rgba(251,191,36,0.35)'  },
    blue:   { border: '#60a5fa', text: '#93c5fd', glow: 'rgba(96,165,250,0.35)'  },
    purple: { border: '#c084fc', text: '#d8b4fe', glow: 'rgba(192,132,252,0.35)' },
};

const nodesData = [
    { id: 'suppliers',  label: 'الموردون',          className: 'Supplier',        moduleName: 'الإمداد والمخزون',  theme: themes.amber,  icon: 'fa-solid fa-truck',               x: 1150, y: 100,
      attributes: [{ name:'Supplier_ID',  ar:'الرقم',             key:'PK', type:'INT'     },{ name:'Company_Name',  ar:'الشركة',           key:'',   type:'VARCHAR' },{ name:'Contact_Person',ar:'جهة الاتصال',      key:'',   type:'VARCHAR' },{ name:'Email',         ar:'البريد الإلكتروني',key:'',   type:'VARCHAR' },{ name:'Category',      ar:'الفئة',            key:'',   type:'VARCHAR' }],
      methods: ['addSupplier(): Void','getStatement(): Report'] },

    { id: 'purchases',  label: 'فواتير المشتريات',  className: 'PurchaseInvoice', moduleName: 'الإمداد والمخزون',  theme: themes.amber,  icon: 'fa-solid fa-cart-shopping',       x: 800,  y: 100,
      attributes: [{ name:'Invoice_ID',   ar:'رقم الفاتورة',      key:'PK', type:'INT'     },{ name:'Supplier_ID',   ar:'المورد',           key:'FK', type:'INT'     },{ name:'Invoice_Date',  ar:'التاريخ',          key:'',   type:'DATE'    },{ name:'Total_Amount',  ar:'المبلغ الإجمالي',  key:'',   type:'DECIMAL' },{ name:'Status',        ar:'الحالة',           key:'',   type:'VARCHAR' }],
      methods: ['createInvoice(): Invoice','postToAccounts(): Boolean'] },

    { id: 'inventory',  label: 'المخزون',           className: 'InventoryItem',   moduleName: 'الإمداد والمخزون',  theme: themes.amber,  icon: 'fa-solid fa-box',                 x: 450,  y: 100,
      attributes: [{ name:'Item_ID',      ar:'الرقم',             key:'PK', type:'INT'     },{ name:'Item_Name',     ar:'اسم المنتج',       key:'',   type:'VARCHAR' },{ name:'Category',      ar:'الفئة',            key:'',   type:'VARCHAR' },{ name:'Unit_Price',    ar:'السعر',            key:'',   type:'DECIMAL' },{ name:'Quantity',      ar:'الكمية',           key:'',   type:'INT'     }],
      methods: ['updateStock(qty: Int): Boolean','checkReorderLevel(): Void'] },

    { id: 'accounts',   label: 'دليل الحسابات',     className: 'ChartOfAccount',  moduleName: 'المالية والمبيعات', theme: themes.blue,   icon: 'fa-solid fa-database',            x: 1150, y: 350,
      attributes: [{ name:'Account_ID',   ar:'الرقم',             key:'PK', type:'INT'     },{ name:'Account_Name',  ar:'اسم الحساب',       key:'',   type:'VARCHAR' },{ name:'Type',          ar:'نوع الحساب',       key:'',   type:'VARCHAR' },{ name:'Balance',       ar:'الرصيد',           key:'',   type:'DECIMAL' }],
      methods: ['createAccount(): Void','getBalance(): Decimal'] },

    { id: 'journals',   label: 'القيود اليومية',    className: 'JournalEntry',    moduleName: 'المالية والمبيعات', theme: themes.blue,   icon: 'fa-solid fa-book-open',           x: 800,  y: 350,
      attributes: [{ name:'Entry_ID',     ar:'رقم القيد',         key:'PK', type:'INT'     },{ name:'Date',          ar:'التاريخ',          key:'',   type:'DATE'    },{ name:'Description',   ar:'البيان',           key:'',   type:'VARCHAR' },{ name:'Debit',         ar:'مدين',             key:'',   type:'DECIMAL' },{ name:'Credit',        ar:'دائن',             key:'',   type:'DECIMAL' }],
      methods: ['postEntry(): Boolean','validateEquation(): Boolean'] },

    { id: 'sales',      label: 'فواتير المبيعات',   className: 'SalesInvoice',    moduleName: 'المالية والمبيعات', theme: themes.blue,   icon: 'fa-solid fa-file-invoice-dollar', x: 450,  y: 350,
      attributes: [{ name:'Invoice_ID',   ar:'رقم الفاتورة',      key:'PK', type:'INT'     },{ name:'Customer_ID',   ar:'العميل',           key:'FK', type:'INT'     },{ name:'Invoice_Date',  ar:'التاريخ',          key:'',   type:'DATE'    },{ name:'Amount',        ar:'المبلغ',           key:'',   type:'DECIMAL' },{ name:'Status',        ar:'الحالة',           key:'',   type:'VARCHAR' }],
      methods: ['generate(): Boolean','printInvoice(): PDF'] },

    { id: 'customers',  label: 'العملاء',            className: 'Customer',        moduleName: 'المالية والمبيعات', theme: themes.blue,   icon: 'fa-solid fa-users',               x: 100,  y: 350,
      attributes: [{ name:'Customer_ID',  ar:'الرقم',             key:'PK', type:'INT'     },{ name:'Name',          ar:'اسم العميل',       key:'',   type:'VARCHAR' },{ name:'Email',         ar:'البريد الإلكتروني',key:'',   type:'VARCHAR' },{ name:'Phone',         ar:'الهاتف',           key:'',   type:'VARCHAR' },{ name:'Company',       ar:'الشركة',           key:'',   type:'VARCHAR' }],
      methods: ['registerCustomer(): Void','checkCreditLimit(): Boolean'] },

    { id: 'assets',     label: 'الأصول الثابتة',    className: 'FixedAsset',      moduleName: 'المالية والمبيعات', theme: themes.blue,   icon: 'fa-solid fa-building',            x: 1150, y: 600,
      attributes: [{ name:'Asset_ID',     ar:'الرقم',             key:'PK', type:'INT'     },{ name:'Asset_Name',    ar:'اسم الأصل',        key:'',   type:'VARCHAR' },{ name:'Purchase_Date', ar:'تاريخ الشراء',     key:'',   type:'DATE'    },{ name:'Value',         ar:'القيمة',           key:'',   type:'DECIMAL' },{ name:'Depreciation',  ar:'الإهلاك',          key:'',   type:'DECIMAL' }],
      methods: ['calculateDepreciation(): Decimal'] },

    { id: 'payroll',    label: 'مسيرات الرواتب',    className: 'Payroll',         moduleName: 'الموارد البشرية',   theme: themes.purple, icon: 'fa-solid fa-money-bill-wave',     x: 800,  y: 600,
      attributes: [{ name:'Payroll_ID',   ar:'الرقم',             key:'PK', type:'INT'     },{ name:'Emp_ID',        ar:'اسم الموظف',       key:'FK', type:'INT'     },{ name:'Month_Year',    ar:'الشهر',            key:'',   type:'VARCHAR' },{ name:'Basic_Salary',  ar:'الراتب الأساسي',   key:'',   type:'DECIMAL' },{ name:'Deductions',    ar:'الخصومات',         key:'',   type:'DECIMAL' },{ name:'Net_Salary',    ar:'صافي الراتب',      key:'',   type:'DECIMAL' }],
      methods: ['generatePayroll(): Boolean','postToFinance(): Void'] },

    { id: 'employees',  label: 'الموظفون',           className: 'Employee',        moduleName: 'الموارد البشرية',   theme: themes.purple, icon: 'fa-solid fa-user-tie',            x: 450,  y: 600,
      attributes: [{ name:'Emp_ID',       ar:'الرقم',             key:'PK', type:'INT'     },{ name:'Name',          ar:'الاسم',            key:'',   type:'VARCHAR' },{ name:'Position',      ar:'المنصب',           key:'',   type:'VARCHAR' },{ name:'Department',    ar:'القسم',            key:'',   type:'VARCHAR' },{ name:'Salary',        ar:'الراتب',           key:'',   type:'DECIMAL' }],
      methods: ['hireEmployee(): Void','updateSalary(): Void'] },

    { id: 'checks',     label: 'الشيكات',            className: 'CheckPayment',    moduleName: 'المالية والمبيعات', theme: themes.blue,   icon: 'fa-solid fa-money-check-dollar',  x: 100,  y: 600,
      attributes: [{ name:'Check_ID',     ar:'الرقم',             key:'PK', type:'INT'     },{ name:'Check_Number',  ar:'رقم الشيك',        key:'',   type:'VARCHAR' },{ name:'Bank_Name',     ar:'البنك',            key:'',   type:'VARCHAR' },{ name:'Due_Date',      ar:'تاريخ الاستحقاق',  key:'',   type:'DATE'    },{ name:'Amount',        ar:'المبلغ',           key:'',   type:'DECIMAL' },{ name:'Type',          ar:'النوع',            key:'',   type:'VARCHAR' }],
      methods: ['depositCheck(): Void','clearCheck(): Boolean'] },
];

const edgesData = [
    { id:'e1',  from:'suppliers', to:'purchases',  label:'1:N' },
    { id:'e2',  from:'purchases', to:'inventory',  label:'M:N' },
    { id:'e3',  from:'purchases', to:'journals',   label:'1:1' },
    { id:'e4',  from:'accounts',  to:'journals',   label:'1:N' },
    { id:'e5',  from:'assets',    to:'journals',   label:'1:N' },
    { id:'e6',  from:'sales',     to:'journals',   label:'1:1' },
    { id:'e7',  from:'sales',     to:'inventory',  label:'M:N' },
    { id:'e8',  from:'customers', to:'sales',      label:'1:N' },
    { id:'e9',  from:'customers', to:'checks',     label:'1:N' },
    { id:'e10', from:'checks',    to:'journals',   label:'N:1' },
    { id:'e11', from:'employees', to:'payroll',    label:'1:N' },
    { id:'e12', from:'payroll',   to:'journals',   label:'1:1' },
];

const ERDiagram = () => {
    const [selectedNode, setSelectedNode] = useState(null);
    const [transform, setTransform]       = useState({ x: 50, y: 50, scale: 0.8 });
    const [isDragging, setIsDragging]     = useState(false);
    const [dragStart, setDragStart]       = useState({ x: 0, y: 0 });

    const handlePointerDown = (e) => {
        if (e.target.closest('.erd-node') || e.target.closest('.erd-controls') || e.target.closest('.erd-sidebar')) return;
        setIsDragging(true);
        setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    };
    const handlePointerMove = (e) => {
        if (!isDragging) return;
        setTransform(prev => ({ ...prev, x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }));
    };
    const handlePointerUp = () => setIsDragging(false);
    const handleZoom = (delta) => setTransform(prev => ({ ...prev, scale: Math.min(Math.max(0.3, prev.scale + delta), 2.5) }));

    const renderEdges = () => edgesData.map(edge => {
        const from = nodesData.find(n => n.id === edge.from);
        const to   = nodesData.find(n => n.id === edge.to);
        if (!from || !to) return null;

        const sx = from.x + NODE_WIDTH / 2, sy = from.y + NODE_HEIGHT / 2;
        const ex = to.x   + NODE_WIDTH / 2, ey = to.y   + NODE_HEIGHT / 2;
        const isHl = selectedNode && (selectedNode.id === edge.from || selectedNode.id === edge.to);
        const color = isHl ? '#3b82f6' : '#475569';
        const w     = isHl ? 4 : 2;
        const mx = sx + (ex - sx) / 2, my = sy + (ey - sy) / 2;

        return (
            <g key={edge.id}>
                <path d={`M ${sx} ${sy} C ${sx+(ex-sx)/2} ${sy}, ${sx+(ex-sx)/2} ${ey}, ${ex} ${ey}`} fill="none" stroke={color} strokeWidth={w} markerEnd="url(#erd-arrow)" style={{transition:'stroke 0.3s'}} />
                <rect x={mx-16} y={my-10} width={32} height={20} fill="#0F172A" rx={4} stroke={color} strokeWidth={1} />
                <text x={mx} y={my+4} fill="#94A3B8" fontSize={10} textAnchor="middle" fontWeight="bold" style={{fontFamily:'Tahoma',pointerEvents:'none'}}>{edge.label}</text>
            </g>
        );
    });

    return (
        <div className="erd-wrapper">

            {/* ── Canvas ────────────────────────────────── */}
            <main
                className="erd-canvas-area"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            >
                {/* Header badge */}
                <div className="erd-controls" style={{ top: 16, right: 16, alignItems: 'center' }}>
                    <div style={{ background:'rgba(59,130,246,0.15)', padding:'8px 12px', borderRadius:8, border:'1px solid rgba(59,130,246,0.3)' }}>
                        <i className="fa-solid fa-diagram-project" style={{ color:'#3b82f6', fontSize:22 }}></i>
                    </div>
                    <div style={{ paddingRight:8 }}>
                        <div style={{ margin:0, fontSize:15, color:'white', fontWeight:'bold' }}>مخطط النظام (ER Diagram)</div>
                        <div style={{ margin:0, fontSize:11, color:'#94a3b8' }}>انقر على أي كيان • اسحب للتنقل • كبّر/صغّر</div>
                    </div>
                </div>

                {/* Zoom controls */}
                <div className="erd-controls" style={{ bottom:24, right:24, flexDirection:'column' }}>
                    <button className="erd-btn" onClick={() => handleZoom(0.1)}  title="تكبير"><i className="fa-solid fa-plus"></i></button>
                    <button className="erd-btn" onClick={() => setTransform({ x:50, y:50, scale:0.8 })} title="إعادة ضبط"><i className="fa-solid fa-expand"></i></button>
                    <button className="erd-btn" onClick={() => handleZoom(-0.1)} title="تصغير"><i className="fa-solid fa-minus"></i></button>
                </div>

                {/* Transformable layer */}
                <div style={{ position:'absolute', transformOrigin:'top left', transform:`translate(${transform.x}px,${transform.y}px) scale(${transform.scale})`, transition: isDragging ? 'none' : 'transform 0.08s linear' }}>
                    <div className="erd-grid-bg" />

                    {/* SVG edges */}
                    <svg style={{ position:'absolute', top:0, left:0, overflow:'visible', pointerEvents:'none' }}>
                        <defs>
                            <marker id="erd-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                                <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748B" />
                            </marker>
                        </defs>
                        {renderEdges()}
                    </svg>

                    {/* Entity nodes */}
                    {nodesData.map(node => {
                        const isSel = selectedNode?.id === node.id;
                        return (
                            <div
                                key={node.id}
                                className={`erd-node${isSel ? ' erd-node-selected' : ''}`}
                                onClick={() => setSelectedNode(node)}
                                style={{
                                    left: node.x, top: node.y,
                                    width: NODE_WIDTH, height: NODE_HEIGHT,
                                    borderColor: node.theme.border,
                                    boxShadow: isSel
                                        ? `0 0 0 3px #0B1120, 0 0 0 5px ${node.theme.border}, 0 0 24px ${node.theme.glow}`
                                        : '0 8px 20px rgba(0,0,0,0.5)',
                                    zIndex: isSel ? 40 : 10,
                                }}
                            >
                                <div className="erd-node-header" style={{ color: node.theme.text }}>
                                    <span>{node.className}</span>
                                    <i className={node.icon} style={{ fontSize:13 }}></i>
                                </div>
                                <div className="erd-node-body">{node.label}</div>
                            </div>
                        );
                    })}
                </div>
            </main>

            {/* ── Detail sidebar ────────────────────────── */}
            <aside className="erd-sidebar">
                {selectedNode ? (
                    <div>
                        {/* Node identity */}
                        <div className="erd-panel">
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
                                <div style={{ background:'rgba(30,41,59,0.8)', padding:12, borderRadius:12, border:`2px solid ${selectedNode.theme.border}` }}>
                                    <i className={selectedNode.icon} style={{ fontSize:30, color:selectedNode.theme.text }}></i>
                                </div>
                                <button onClick={() => setSelectedNode(null)} style={{ background:'transparent', border:'none', color:'#94a3b8', cursor:'pointer', fontSize:20, padding:4 }}>
                                    <i className="fa-solid fa-xmark"></i>
                                </button>
                            </div>
                            <h2 style={{ margin:'0 0 4px 0', color:'white', fontSize:22, fontWeight:'bold' }}>{selectedNode.label}</h2>
                            <div style={{ fontSize:13, color:'#94a3b8', fontFamily:'monospace', marginBottom:12 }}>{selectedNode.className}</div>
                            <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(51,65,85,0.4)', padding:'5px 12px', borderRadius:6, fontSize:12, color:'#cbd5e1', border:'1px solid #334155' }}>
                                <i className="fa-solid fa-layer-group" style={{ color:selectedNode.theme.text }}></i>
                                {selectedNode.moduleName}
                            </div>
                        </div>

                        {/* Attributes */}
                        <div className="erd-panel">
                            <h3 style={{ fontSize:14, color:'#94a3b8', margin:'0 0 14px 0', display:'flex', alignItems:'center', gap:8 }}>
                                <i className="fa-solid fa-table-columns"></i> الخصائص (Attributes)
                            </h3>
                            {selectedNode.attributes.map((attr, i) => (
                                <div key={i} className="erd-attr-row">
                                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                                        <span style={{ fontWeight:'bold', color:'#f8fafc' }}>{attr.ar}</span>
                                        {attr.key === 'PK' && <span style={{ fontSize:10, background:'rgba(245,158,11,0.2)', color:'#fbbf24', padding:'2px 7px', borderRadius:4, border:'1px solid #fbbf24' }}>PK</span>}
                                        {attr.key === 'FK' && <span style={{ fontSize:10, background:'rgba(99,102,241,0.2)', color:'#818cf8', padding:'2px 7px', borderRadius:4, border:'1px solid #818cf8' }}>FK</span>}
                                    </div>
                                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#94a3b8', fontFamily:'monospace' }}>
                                        <span>{attr.name}</span>
                                        <span style={{ color:'#10b981' }}>{attr.type}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Methods */}
                        <div className="erd-panel" style={{ borderBottom:'none' }}>
                            <h3 style={{ fontSize:14, color:'#94a3b8', margin:'0 0 14px 0', display:'flex', alignItems:'center', gap:8 }}>
                                <i className="fa-solid fa-code"></i> العمليات (Methods)
                            </h3>
                            <div style={{ background:'#0A0F18', borderRadius:10, padding:16, border:'1px solid #1e293b' }}>
                                {selectedNode.methods.map((m, i) => (
                                    <div key={i} className="erd-method-row">
                                        <span style={{ color:'#a78bfa' }}>+</span>
                                        <span>{m}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="erd-empty">
                        <i className="fa-solid fa-arrow-pointer" style={{ fontSize:52, opacity:0.35 }}></i>
                        <div>
                            <h3 style={{ color:'#cbd5e1', margin:'0 0 8px 0', fontSize:17 }}>اختر كياناً</h3>
                            <p style={{ fontSize:13, lineHeight:1.7, maxWidth:200, margin:'0 auto' }}>انقر على أي جدول في مساحة الرسم لعرض خصائصه والعمليات المرتبطة به.</p>
                        </div>
                    </div>
                )}
            </aside>
        </div>
    );
};

export default ERDiagram;
