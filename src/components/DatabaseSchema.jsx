import React, { useState } from 'react';

/* ─────────────────────────────────────────────
   DDL Definitions — hardcoded for academic presentation
   ───────────────────────────────────────────── */
const tables = [
  {
    id: 'customers',
    name: 'Customers',
    arabicName: 'العملاء',
    icon: '👥',
    color: '#6366f1',
    description: 'يخزن بيانات العملاء الأساسية المرتبطة بكل مستخدم في النظام.',
    sql: `CREATE TABLE customers (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT          NOT NULL,
  email       TEXT,
  phone       TEXT,
  address     TEXT,
  city        TEXT,
  balance     NUMERIC(15,2) NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Index for fast per-user lookups
CREATE INDEX idx_customers_user_id ON customers(user_id);`,
  },
  {
    id: 'suppliers',
    name: 'Suppliers',
    arabicName: 'الموردون',
    icon: '🚚',
    color: '#8b5cf6',
    description: 'يخزن بيانات الموردين وأرصدتهم المستحقة.',
    sql: `CREATE TABLE suppliers (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT          NOT NULL,
  email       TEXT,
  phone       TEXT,
  address     TEXT,
  city        TEXT,
  balance     NUMERIC(15,2) NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX idx_suppliers_user_id ON suppliers(user_id);`,
  },
  {
    id: 'employees',
    name: 'Employees',
    arabicName: 'الموظفون',
    icon: '🪪',
    color: '#22d3ee',
    description: 'يخزن بيانات الموظفين بما فيها الراتب الأساسي والمسمى الوظيفي.',
    sql: `CREATE TABLE employees (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT          NOT NULL,
  job_title       TEXT,
  department      TEXT,
  base_salary     NUMERIC(15,2) NOT NULL DEFAULT 0,
  hire_date       DATE,
  national_id     TEXT,
  phone           TEXT,
  email           TEXT,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX idx_employees_user_id ON employees(user_id);`,
  },
  {
    id: 'inventory',
    name: 'Inventory',
    arabicName: 'المخزون',
    icon: '📦',
    color: '#f59e0b',
    description: 'يخزن بنود المخزون مع تكلفة الوحدة وسعر البيع والكمية المتاحة.',
    sql: `CREATE TABLE inventory (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT          NOT NULL,
  sku           TEXT,
  category      TEXT,
  unit          TEXT          DEFAULT 'قطعة',
  quantity      NUMERIC(15,3) NOT NULL DEFAULT 0,
  cost_price    NUMERIC(15,2) NOT NULL DEFAULT 0,
  selling_price NUMERIC(15,2) NOT NULL DEFAULT 0,
  reorder_level NUMERIC(15,3) DEFAULT 0,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX idx_inventory_user_id ON inventory(user_id);`,
  },
  {
    id: 'invoices',
    name: 'Invoices',
    arabicName: 'فواتير المبيعات',
    icon: '🧾',
    color: '#10b981',
    description: 'فواتير المبيعات المرتبطة بالعملاء مع إجمالي المبلغ وحالة الدفع.',
    sql: `CREATE TABLE invoices (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id    UUID          REFERENCES customers(id) ON DELETE SET NULL,
  invoice_date   DATE          NOT NULL DEFAULT CURRENT_DATE,
  due_date       DATE,
  status         TEXT          NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('pending','paid','partial','cancelled')),
  subtotal       NUMERIC(15,2) NOT NULL DEFAULT 0,
  tax_rate       NUMERIC(5,2)  NOT NULL DEFAULT 0,
  tax_amount     NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_amount   NUMERIC(15,2) NOT NULL DEFAULT 0,
  amount_paid    NUMERIC(15,2) NOT NULL DEFAULT 0,
  notes          TEXT,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX idx_invoices_user_id    ON invoices(user_id);
CREATE INDEX idx_invoices_customer   ON invoices(customer_id);
CREATE INDEX idx_invoices_date       ON invoices(invoice_date);`,
  },
  {
    id: 'invoice_items',
    name: 'Invoice Items',
    arabicName: 'بنود الفواتير',
    icon: '📋',
    color: '#06b6d4',
    description: 'بنود تفصيلية لكل فاتورة مبيعات، مرتبطة بالمخزون.',
    sql: `CREATE TABLE invoice_items (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_id    UUID          NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  inventory_id  UUID          REFERENCES inventory(id) ON DELETE SET NULL,
  description   TEXT          NOT NULL,
  quantity      NUMERIC(15,3) NOT NULL DEFAULT 1,
  unit_price    NUMERIC(15,2) NOT NULL DEFAULT 0,
  discount      NUMERIC(5,2)  NOT NULL DEFAULT 0,
  total         NUMERIC(15,2) NOT NULL DEFAULT 0
);

CREATE INDEX idx_invoice_items_invoice    ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_user_id    ON invoice_items(user_id);`,
  },
  {
    id: 'chart_of_accounts',
    name: 'Chart of Accounts',
    arabicName: 'دليل الحسابات',
    icon: '📒',
    color: '#a78bfa',
    description: 'الشجرة المحاسبية الهرمية التي تُشكّل أساس القيود اليومية.',
    sql: `CREATE TABLE chart_of_accounts (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code          TEXT          NOT NULL,
  name          TEXT          NOT NULL,
  account_type  TEXT          NOT NULL
                              CHECK (account_type IN (
                                'asset','liability','equity','revenue','expense'
                              )),
  parent_id     UUID          REFERENCES chart_of_accounts(id) ON DELETE SET NULL,
  is_header     BOOLEAN       NOT NULL DEFAULT false,
  balance       NUMERIC(15,2) NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
  UNIQUE (user_id, code)
);

CREATE INDEX idx_coa_user_id   ON chart_of_accounts(user_id);
CREATE INDEX idx_coa_parent    ON chart_of_accounts(parent_id);`,
  },
  {
    id: 'journal_entries',
    name: 'Journal Entries',
    arabicName: 'القيود اليومية',
    icon: '📔',
    color: '#f43f5e',
    description: 'القيود المحاسبية اليومية مع التحقق من توازن المدين والدائن.',
    sql: `CREATE TABLE journal_entries (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date     DATE          NOT NULL DEFAULT CURRENT_DATE,
  description    TEXT          NOT NULL,
  reference      TEXT,
  debit_account  UUID          REFERENCES chart_of_accounts(id) ON DELETE SET NULL,
  credit_account UUID          REFERENCES chart_of_accounts(id) ON DELETE SET NULL,
  amount         NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  is_posted      BOOLEAN       NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Enforce balanced entries at DB level (optional trigger shown separately)
CREATE INDEX idx_journal_user_id  ON journal_entries(user_id);
CREATE INDEX idx_journal_date     ON journal_entries(entry_date);`,
  },
  {
    id: 'payroll',
    name: 'Payroll',
    arabicName: 'مسيرات الرواتب',
    icon: '💰',
    color: '#fb923c',
    description: 'سجلات صرف الرواتب الشهرية مع الإضافات والاستقطاعات.',
    sql: `CREATE TABLE payroll (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id     UUID          NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  pay_period      TEXT          NOT NULL,   -- e.g. '2026-05'
  base_salary     NUMERIC(15,2) NOT NULL DEFAULT 0,
  allowances      NUMERIC(15,2) NOT NULL DEFAULT 0,
  deductions      NUMERIC(15,2) NOT NULL DEFAULT 0,
  net_salary      NUMERIC(15,2) NOT NULL DEFAULT 0,
  paid_at         DATE,
  status          TEXT          NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending','paid')),
  notes           TEXT,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX idx_payroll_user_id    ON payroll(user_id);
CREATE INDEX idx_payroll_employee   ON payroll(employee_id);`,
  },
  {
    id: 'fixed_assets',
    name: 'Fixed Assets',
    arabicName: 'الأصول الثابتة',
    icon: '🏗️',
    color: '#84cc16',
    description: 'الأصول الثابتة مع بيانات الاستهلاك السنوي.',
    sql: `CREATE TABLE fixed_assets (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name                TEXT          NOT NULL,
  category            TEXT,
  purchase_date       DATE,
  purchase_cost       NUMERIC(15,2) NOT NULL DEFAULT 0,
  salvage_value       NUMERIC(15,2) NOT NULL DEFAULT 0,
  useful_life_years   INTEGER       NOT NULL DEFAULT 5,
  depreciation_method TEXT          NOT NULL DEFAULT 'straight_line'
                                    CHECK (depreciation_method IN ('straight_line','declining_balance')),
  accumulated_depr    NUMERIC(15,2) NOT NULL DEFAULT 0,
  book_value          NUMERIC(15,2) NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX idx_assets_user_id ON fixed_assets(user_id);`,
  },
];

/* ─────────────────────────────────────────────
   Token-level syntax colouring (no external lib)
   ───────────────────────────────────────────── */
const KEYWORDS = new Set([
  'CREATE','TABLE','INDEX','ON','PRIMARY','KEY','DEFAULT','NOT','NULL',
  'REFERENCES','DELETE','CASCADE','SET','UNIQUE','CHECK','IN',
]);
const TYPES = new Set([
  'UUID','TEXT','DATE','BOOLEAN','INTEGER','NUMERIC','TIMESTAMPTZ',
  'BIGINT','SMALLINT','SERIAL','JSONB',
]);
const FUNCS = new Set([
  'gen_random_uuid','now','CURRENT_DATE',
]);

function tokenize(sql) {
  // Split preserving delimiters
  const tokens = sql.split(/(\s+|[(),;]|'[^']*'|--[^\n]*/g)).filter(Boolean);
  return tokens.map((tok, i) => {
    const upper = tok.toUpperCase().replace(/[(),;]/g, '');
    if (KEYWORDS.has(upper))   return <span key={i} style={{ color: '#818cf8', fontWeight: 700 }}>{tok}</span>;
    if (TYPES.has(upper))      return <span key={i} style={{ color: '#34d399' }}>{tok}</span>;
    if (FUNCS.has(tok))        return <span key={i} style={{ color: '#fbbf24' }}>{tok}</span>;
    if (/^'[^']*'$/.test(tok)) return <span key={i} style={{ color: '#f87171' }}>{tok}</span>;
    if (/^--/.test(tok))       return <span key={i} style={{ color: '#475569', fontStyle: 'italic' }}>{tok}</span>;
    if (/^\d+(\.\d+)?$/.test(tok)) return <span key={i} style={{ color: '#fb923c' }}>{tok}</span>;
    return <span key={i} style={{ color: '#e2e8f0' }}>{tok}</span>;
  });
}

/* ─────────────────────────────────────────────
   Single table card
   ───────────────────────────────────────────── */
function TableCard({ table }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(table.sql).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      id={`table-${table.id}`}
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        border: `1px solid ${table.color}33`,
        borderRadius: '1rem',
        overflow: 'hidden',
        marginBottom: '2rem',
        boxShadow: `0 4px 32px ${table.color}11`,
        transition: 'box-shadow 0.2s',
      }}
    >
      {/* Card Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1.25rem 1.5rem',
        borderBottom: `1px solid ${table.color}22`,
        background: `linear-gradient(90deg, ${table.color}18 0%, transparent 100%)`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.5rem' }}>{table.icon}</span>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#f1f5f9' }}>
              {table.arabicName}
            </h3>
            <code style={{
              fontSize: '0.75rem',
              color: table.color,
              background: `${table.color}18`,
              padding: '1px 6px',
              borderRadius: '4px',
              letterSpacing: '0.05em',
            }}>
              {table.name.toLowerCase().replace(' ', '_')}
            </code>
          </div>
        </div>

        {/* Copy Button */}
        <button
          onClick={handleCopy}
          title="نسخ الكود"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.4rem 0.9rem',
            borderRadius: '0.5rem',
            border: `1px solid ${copied ? '#10b981' : table.color}55`,
            background: copied ? '#10b98122' : `${table.color}18`,
            color: copied ? '#10b981' : table.color,
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: 600,
            transition: 'all 0.2s',
            fontFamily: 'inherit',
          }}
        >
          <i className={`pi ${copied ? 'pi-check' : 'pi-copy'}`} />
          {copied ? 'تم النسخ!' : 'نسخ الكود'}
        </button>
      </div>

      {/* Description */}
      <p style={{
        margin: 0,
        padding: '0.75rem 1.5rem 0',
        fontSize: '0.8rem',
        color: '#64748b',
        direction: 'rtl',
        textAlign: 'right',
      }}>
        {table.description}
      </p>

      {/* Code block */}
      <pre style={{
        margin: '0.75rem 1.5rem 1.25rem',
        padding: '1.25rem',
        background: '#020617',
        border: '1px solid #1e293b',
        borderRadius: '0.75rem',
        overflowX: 'auto',
        fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
        fontSize: '0.8rem',
        lineHeight: 1.7,
        tabSize: 2,
        whiteSpace: 'pre',
      }}>
        <code>{tokenize(table.sql)}</code>
      </pre>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main Page Component
   ───────────────────────────────────────────── */
export default function DatabaseSchema() {
  const [search, setSearch] = useState('');

  const filtered = tables.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.arabicName.includes(search) ||
    t.id.includes(search.toLowerCase())
  );

  const scrollTo = (id) => {
    document.getElementById(`table-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div style={{
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      color: '#e2e8f0',
      minHeight: '100vh',
      direction: 'rtl',
    }}>
      {/* ── Hero Header ── */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 50%, #0c4a6e 100%)',
        border: '1px solid #1e293b',
        borderRadius: '1.25rem',
        padding: '2.5rem 2rem',
        marginBottom: '2rem',
        position: 'relative',
        overflow: 'hidden',
        textAlign: 'center',
      }}>
        {/* Decorative glow */}
        <div style={{
          position: 'absolute', top: '-60px', left: '50%', transform: 'translateX(-50%)',
          width: '400px', height: '200px',
          background: 'radial-gradient(ellipse, #6366f133 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: '#6366f122', border: '1px solid #6366f144',
            borderRadius: '2rem', padding: '0.3rem 1rem',
            fontSize: '0.75rem', color: '#818cf8', marginBottom: '1rem',
            letterSpacing: '0.08em',
          }}>
            <i className="pi pi-database" />
            ACADEMIC PRESENTATION · DDL SCRIPTS
          </div>

          <h1 style={{
            margin: '0 0 0.5rem',
            fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
            fontWeight: 800,
            background: 'linear-gradient(to left, #818cf8, #22d3ee)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            أكواد إنشاء الجداول — DDL Scripts
          </h1>

          <p style={{ margin: '0 0 1.5rem', color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6 }}>
            جميع أوامر <code style={{ color: '#818cf8', background: '#6366f118', padding: '1px 5px', borderRadius: '3px' }}>CREATE TABLE</code> المستخدمة لبناء قاعدة البيانات في نظام ERP.
            كل جدول يحتوي على عمود <code style={{ color: '#22d3ee', background: '#0891b218', padding: '1px 5px', borderRadius: '3px' }}>user_id UUID</code> لعزل بيانات كل مستخدم.
          </p>

          {/* Stats pills */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { label: 'جدول', value: tables.length, color: '#6366f1' },
              { label: 'عمود user_id', value: tables.length, color: '#22d3ee' },
              { label: 'قيود مرجعية', value: '12+', color: '#10b981' },
              { label: 'فهارس مُحسَّنة', value: '15+', color: '#f59e0b' },
            ].map((s, i) => (
              <div key={i} style={{
                background: `${s.color}15`,
                border: `1px solid ${s.color}33`,
                borderRadius: '0.75rem',
                padding: '0.5rem 1rem',
                fontSize: '0.8rem',
                color: s.color,
                fontWeight: 600,
              }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>{s.value}</span>
                {' '}{s.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Two-Column Layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '1.5rem', alignItems: 'start' }}>

        {/* LEFT: Table of Contents (sticky) */}
        <aside style={{
          position: 'sticky',
          top: '1rem',
          background: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '1rem',
          padding: '1rem',
        }}>
          <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.75rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            📑 فهرس الجداول
          </h4>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {tables.map(t => (
              <li key={t.id}>
                <button
                  onClick={() => scrollTo(t.id)}
                  style={{
                    width: '100%', textAlign: 'right', background: 'transparent',
                    border: 'none', cursor: 'pointer', padding: '0.35rem 0.5rem',
                    borderRadius: '0.4rem', color: '#94a3b8', fontSize: '0.8rem',
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    transition: 'background 0.15s, color 0.15s',
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#1e293b'; e.currentTarget.style.color = '#e2e8f0'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}
                >
                  <span>{t.icon}</span>
                  <span style={{ fontSize: '0.75rem' }}>{t.arabicName}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* RIGHT: Main content */}
        <div>
          {/* Search */}
          <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
            <i className="pi pi-search" style={{
              position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)',
              color: '#475569', fontSize: '0.9rem', pointerEvents: 'none',
            }} />
            <input
              type="text"
              placeholder="ابحث عن جدول..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: '#1e293b', border: '1px solid #334155',
                borderRadius: '0.75rem', padding: '0.75rem 2.5rem 0.75rem 1rem',
                color: '#e2e8f0', fontSize: '0.875rem',
                outline: 'none', direction: 'rtl', fontFamily: 'inherit',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = '#6366f1'}
              onBlur={e => e.target.style.borderColor = '#334155'}
            />
          </div>

          {/* Table Cards */}
          {filtered.length > 0 ? filtered.map(t => (
            <TableCard key={t.id} table={t} />
          )) : (
            <div style={{ textAlign: 'center', color: '#475569', padding: '3rem 0', fontSize: '0.9rem' }}>
              <i className="pi pi-search" style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }} />
              لا توجد نتائج للبحث عن «{search}»
            </div>
          )}

          {/* Footer note */}
          <div style={{
            marginTop: '1rem',
            padding: '1rem 1.5rem',
            background: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: '0.75rem',
            fontSize: '0.75rem',
            color: '#475569',
            textAlign: 'center',
            lineHeight: 1.8,
          }}>
            🔒 جميع الجداول محمية بسياسة <strong style={{ color: '#818cf8' }}>Row Level Security (RLS)</strong> عبر Supabase.
            &nbsp;|&nbsp; المنصة: <strong style={{ color: '#22d3ee' }}>PostgreSQL 15</strong>
            &nbsp;|&nbsp; الإطار: <strong style={{ color: '#10b981' }}>React + Vite</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
