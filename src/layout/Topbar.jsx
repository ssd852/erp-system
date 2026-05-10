import React, { useState, useEffect } from 'react';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import UserProfileWidget from '../components/UserProfileWidget';

const Topbar = () => {
  const [search, setSearch] = useState('');
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('erp-theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    applyPrimeReactTheme(isDark);
  }, []);

  const applyPrimeReactTheme = (dark) => {
    let link = document.getElementById('theme-link');
    if (!link) {
      link = document.createElement('link');
      link.id = 'theme-link';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    link.href = dark
      ? 'https://unpkg.com/primereact/resources/themes/lara-dark-indigo/theme.css'
      : 'https://unpkg.com/primereact/resources/themes/lara-light-indigo/theme.css';
  };

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem('erp-theme', next ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', next);
    applyPrimeReactTheme(next);
  };

  /* Root: no width, no fixed, no absolute — just fills the 64px header wrapper */
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '100%',
      padding: '0 1.5rem',
    }}>

      {/* Search */}
      <span className="p-input-icon-right" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <i className="pi pi-search" style={{ color: '#64748b' }} />
        <InputText
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="البحث الشامل..."
          style={{ width: '280px' }}
        />
      </span>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>

        {/* Theme toggle */}
        <Button
          icon={isDark ? 'pi pi-sun' : 'pi pi-moon'}
          onClick={toggleTheme}
          rounded
          text
          severity="secondary"
          aria-label="Theme"
        />

        {/* Print */}
        <Button
          icon="pi pi-print"
          label="طباعة"
          severity="secondary"
          outlined
          onClick={() => window.print()}
          className="no-print"
        />

        {/* Notifications */}
        <Button
          icon="pi pi-bell"
          rounded
          text
          severity="secondary"
          aria-label="الإشعارات"
        />

        {/* User Profile Widget */}
        <UserProfileWidget />
      </div>
    </div>
  );
};

export default Topbar;
