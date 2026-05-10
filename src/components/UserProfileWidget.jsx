import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../config/supabaseClient';

/* ─── tiny keyframe injected once ─── */
const injectStyles = () => {
    if (document.getElementById('upw-styles')) return;
    const s = document.createElement('style');
    s.id = 'upw-styles';
    s.textContent = `
        @keyframes upw-fade-in {
            from { opacity: 0; transform: translateY(-8px) scale(0.97); }
            to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
        .upw-dropdown { animation: upw-fade-in 0.18s cubic-bezier(0.16,1,0.3,1) both; }
        .upw-menu-btn {
            display: flex; align-items: center; gap: 12px;
            width: 100%; padding: 10px 14px; border: none; border-radius: 10px;
            background: transparent; cursor: pointer; text-align: right;
            font-size: 0.875rem; transition: background 0.15s, color 0.15s;
            font-family: inherit; color: #94a3b8;
        }
        .upw-menu-btn:hover { background: rgba(51,65,85,0.6); color: #f1f5f9; }
        .upw-logout-btn {
            display: flex; align-items: center; gap: 12px;
            width: 100%; padding: 10px 14px; border: none; border-radius: 10px;
            background: transparent; cursor: pointer; text-align: right;
            font-size: 0.875rem; font-weight: 700; transition: background 0.15s, color 0.15s;
            font-family: inherit; color: #f87171;
        }
        .upw-logout-btn:hover { background: rgba(239,68,68,0.15); color: #fca5a5; }
        .upw-trigger {
            display: flex; align-items: center; gap: 10px;
            background: rgba(30,41,59,0.8); border: 1px solid rgba(51,65,85,0.8);
            border-radius: 999px; padding: 5px 12px 5px 5px;
            cursor: pointer; transition: background 0.2s, border-color 0.2s, box-shadow 0.2s;
        }
        .upw-trigger:hover {
            background: rgba(51,65,85,0.9);
            border-color: rgba(99,102,241,0.5);
            box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
        }
    `;
    document.head.appendChild(s);
};

const UserProfileWidget = () => {
    const [user, setUser]     = useState(null);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const containerRef         = useRef(null);

    useEffect(() => {
        injectStyles();

        // Fetch current session
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setUser(user);
        };
        fetchUser();

        // Keep in sync if session changes (e.g. token refresh)
        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => listener?.subscription?.unsubscribe();
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [isOpen]);

    const handleLogout = async () => {
        setLoading(true);
        localStorage.clear();
        sessionStorage.clear();
        await supabase.auth.signOut();
        window.location.href = '/login';
    };

    // Use demo user as fallback so widget is always visible (even without Supabase session)
    const activeUser = user ?? {
        email: 'admin@smartcore.erp',
        user_metadata: { full_name: 'مدير النظام' },
    };

    const initials = (activeUser.email?.[0] ?? 'م').toUpperCase();
    const displayName = activeUser.user_metadata?.full_name || activeUser.email?.split('@')[0] || 'المستخدم';

    return (
        <div ref={containerRef} style={{ position: 'relative', zIndex: 50 }} className="no-print">

            {/* ── Trigger button ── */}
            <button className="upw-trigger" onClick={() => setIsOpen(o => !o)}>
                {/* Avatar circle */}
                <div style={{
                    width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 700, fontSize: '0.95rem',
                    boxShadow: '0 2px 8px rgba(16,185,129,0.35)',
                }}>
                    {initials}
                </div>

                {/* Name */}
                <div style={{ textAlign: 'right', lineHeight: 1.3 }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>مرحباً</div>
                    <div style={{
                        fontSize: '0.8rem', color: '#e2e8f0', fontWeight: 700,
                        maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                        {displayName}
                    </div>
                </div>

                {/* Chevron */}
                <i className="pi pi-chevron-down" style={{
                    fontSize: '0.65rem', color: '#64748b',
                    transition: 'transform 0.2s',
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                }} />
            </button>

            {/* ── Dropdown ── */}
            {isOpen && (
                <div className="upw-dropdown" style={{
                    position: 'absolute', left: 0, top: 'calc(100% + 10px)',
                    width: '270px',
                    background: 'rgba(15,23,42,0.95)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(51,65,85,0.8)',
                    borderRadius: '16px',
                    boxShadow: '0 24px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
                    overflow: 'hidden',
                }}>

                    {/* Header */}
                    <div style={{
                        padding: '16px', borderBottom: '1px solid rgba(30,41,59,0.8)',
                        background: 'rgba(30,41,59,0.5)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {/* Big avatar */}
                            <div style={{
                                width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
                                background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#fff', fontWeight: 800, fontSize: '1.1rem',
                                boxShadow: '0 4px 12px rgba(16,185,129,0.4)',
                            }}>
                                {initials}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '0.9rem', marginBottom: '2px' }}>
                                    {displayName}
                                </div>
                                <div style={{
                                    color: '#34d399', fontSize: '0.72rem', fontFamily: 'monospace',
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                }}>
                                    {activeUser.email}
                                </div>
                            </div>
                        </div>

                        {/* Verified badge */}
                        <div style={{
                            marginTop: '10px',
                            display: 'flex', alignItems: 'center', gap: '6px',
                            background: 'rgba(16,185,129,0.08)',
                            border: '1px solid rgba(16,185,129,0.2)',
                            borderRadius: '8px', padding: '5px 10px',
                            fontSize: '0.7rem', color: '#6ee7b7',
                        }}>
                            <i className="pi pi-verified" style={{ color: '#34d399', fontSize: '0.75rem' }} />
                            موثق عبر Supabase Authentication
                        </div>
                    </div>

                    {/* Menu items */}
                    <div style={{ padding: '8px' }}>
                        <button className="upw-menu-btn">
                            <i className="pi pi-cog" style={{ width: '16px' }} />
                            إعدادات النظام
                        </button>
                        <button className="upw-menu-btn">
                            <i className="pi pi-shield" style={{ width: '16px' }} />
                            سجل الصلاحيات
                        </button>

                        <div style={{ height: '1px', background: 'rgba(30,41,59,0.8)', margin: '6px 0' }} />

                        <button className="upw-logout-btn" onClick={handleLogout} disabled={loading}>
                            <i className={`pi ${loading ? 'pi-spinner pi-spin' : 'pi-sign-out'}`} style={{ width: '16px' }} />
                            {loading ? 'جاري الخروج...' : 'تسجيل الخروج'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserProfileWidget;
