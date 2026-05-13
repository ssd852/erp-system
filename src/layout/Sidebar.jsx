import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
  const menuGroups = [
    {
      header: '📊 لوحة القيادة',
      items: [
        { label: 'الرئيسية', icon: 'pi pi-home', path: '/' },
      ]
    },
    {
      header: '📦 الإمداد والمخزون',
      items: [
        { label: 'المخزون',           icon: 'pi pi-box',           path: '/inventory' },
        { label: 'فواتير المشتريات', icon: 'pi pi-shopping-cart',  path: '/purchases' },
        { label: 'الموردون',          icon: 'pi pi-truck',          path: '/suppliers' },
      ]
    },
    {
      header: '💰 المالية والمبيعات',
      items: [
        { label: 'فواتير المبيعات', icon: 'pi pi-file',     path: '/invoices' },
        { label: 'العملاء',          icon: 'pi pi-users',    path: '/customers' },
        { label: 'الشيكات',          icon: 'pi pi-ticket',   path: '/checks' },
        { label: 'دليل الحسابات',   icon: 'pi pi-wallet',   path: '/accounts' },
        { label: 'القيود اليومية',  icon: 'pi pi-book',     path: '/journal' },
        { label: 'الأصول الثابتة', icon: 'pi pi-building',  path: '/assets' },
      ]
    },
    {
      header: '👥 الموارد البشرية',
      items: [
        { label: 'الموظفون',         icon: 'pi pi-id-card',    path: '/employees' },
        { label: 'مسيرات الرواتب',  icon: 'pi pi-money-bill', path: '/payroll' },
      ]
    },
    {
      header: '🛠️ النظام الذكي',
      items: [
        { label: 'التقارير الشاملة', icon: 'pi pi-print',    path: '/reports' },
        { label: 'محرك SQL',         icon: 'pi pi-database', path: '/sql' },
        { label: 'المساعد الذكي',   icon: 'pi pi-sparkles', path: '/ai' },
        { label: 'محلل البيانات',       icon: 'pi pi-sitemap',  path: '/analyzer' },
        { label: 'المخطط الهيكلي (ERD)', icon: 'pi pi-sitemap',  path: '/erd' },
        { label: 'التقرير الأكاديمي',    icon: 'pi pi-database', path: '/academic-report' },
        { label: 'أكواد إنشاء الجداول', icon: 'pi pi-code',     path: '/db-schema' },
      ]
    }
  ];

  return (
    /* Root element — no width/height/position set here; the Grid parent owns those */
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Brand */}
      <div style={{
        padding: '1.5rem 1rem',
        borderBottom: '1px solid #1e293b',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
      }}>
        <h1 style={{
          margin: 0,
          fontSize: '1.125rem',
          fontWeight: 700,
          background: 'linear-gradient(to left, #818cf8, #22d3ee)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '0.05em',
        }}>
          المحاسب الذكي
        </h1>
        <span style={{ fontSize: '0.65rem', color: '#475569', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          ERP Enterprise
        </span>
      </div>

      {/* Nav — scrollable */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '1rem 0.75rem 5rem' }}>
        {menuGroups.map((group, groupIdx) => (
          <div key={groupIdx} style={{ marginBottom: '1.5rem' }}>
            <h2 style={{
              margin: '0 0 0.5rem 0',
              fontSize: '0.65rem',
              fontWeight: 700,
              color: '#475569',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              padding: '0 0.5rem',
            }}>
              {group.header}
            </h2>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {group.items.map((item, index) => (
                <li key={index}>
                  <NavLink
                    to={item.path}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.625rem',
                      padding: '0.5rem 0.625rem',
                      borderRadius: '0.5rem',
                      textDecoration: 'none',
                      fontSize: '0.875rem',
                      transition: 'background 0.15s, color 0.15s',
                      backgroundColor: isActive ? 'rgba(99,102,241,0.85)' : 'transparent',
                      color: isActive ? '#fff' : '#94a3b8',
                      fontWeight: isActive ? 700 : 400,
                    })}
                  >
                    <i className={`${item.icon}`} style={{ fontSize: '0.9rem', width: '1rem', textAlign: 'center' }} />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{
        padding: '0.75rem 1rem',
        borderTop: '1px solid #1e293b',
        textAlign: 'center',
        fontSize: '0.7rem',
        color: '#334155',
      }}>
        &copy; 2026 ERP System
      </div>
    </div>
  );
};

export default Sidebar;
