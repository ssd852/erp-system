import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, supabaseReady } from '../config/supabaseClient';

const Login = () => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [mounted, setMounted] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Trigger entrance animation
        setTimeout(() => setMounted(true), 50);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccessMsg('');

        try {
            // Block attempt if keys are still placeholders
            if (!supabaseReady) {
                throw new Error('ENV_NOT_CONFIGURED');
            }

            if (isRegistering) {
                // --- SIGN UP LOGIC ---
                const { data, error } = await supabase.auth.signUp({
                    email: email,
                    password: password,
                });

                if (error) throw error;
                
                setSuccessMsg('تم إنشاء الحساب بنجاح! جاري تسجيل الدخول...');
                setTimeout(() => {
                    navigate('/');
                }, 1500);

            } else {
                // --- LOGIN LOGIC ---
                const { data, error } = await supabase.auth.signInWithPassword({
                    email: email,
                    password: password,
                });

                if (error) throw error;

                if (data.user) {
                    navigate('/');
                }
            }
        } catch (err) {
            if (err.message === 'ENV_NOT_CONFIGURED') {
                setError('⚙️ مفاتيح Supabase غير مُعدَّة بعد. أدخلها في ملف .env.local ثم أعد تشغيل الخادم.');
            } else if (
                err.message === 'Invalid login credentials' ||
                err.message === 'invalid_credentials'
            ) {
                setError('بيانات الدخول غير صحيحة. تأكد من البريد وكلمة المرور.');
            } else if (err.message?.includes('already registered')) {
                setError('هذا البريد الإلكتروني مسجل بالفعل.');
            } else if (err.message?.includes('Password should be at least')) {
                setError('كلمة المرور ضعيفة. يجب أن تكون 6 أحرف على الأقل.');
            } else if (err.message?.includes('Email not confirmed')) {
                setError('يرجى تأكيد بريدك الإلكتروني أولاً.');
            } else if (
                err.message?.includes('fetch') ||
                err.message?.includes('network') ||
                err.message?.includes('Failed to fetch')
            ) {
                setError('تعذّر الوصول لخادم Supabase — تحقق من الاتصال أو من صحة VITE_SUPABASE_URL في .env.local');
            } else {
                setError('حدث خطأ غير متوقع: ' + err.message);
                console.error('[Supabase Auth Error]', err);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            dir="rtl"
            style={{
                minHeight: '100vh',
                background: 'radial-gradient(ellipse at 20% 50%, #0d1b40 0%, #0B1120 50%, #050d1a 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                fontFamily: "'Segoe UI', 'Tahoma', 'Arial', sans-serif",
            }}
        >
            {/* ── Animated particle dots ── */}
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        style={{
                            position: 'absolute',
                            width: Math.random() * 3 + 1 + 'px',
                            height: Math.random() * 3 + 1 + 'px',
                            background: i % 3 === 0 ? '#3b82f6' : i % 3 === 1 ? '#8b5cf6' : '#10b981',
                            borderRadius: '50%',
                            top: Math.random() * 100 + '%',
                            left: Math.random() * 100 + '%',
                            opacity: Math.random() * 0.6 + 0.2,
                            animation: `float ${Math.random() * 8 + 6}s ease-in-out infinite`,
                            animationDelay: Math.random() * 5 + 's',
                        }}
                    />
                ))}
            </div>

            {/* ── Ambient glow orbs ── */}
            <div style={{
                position: 'absolute', top: '-8%', left: '-8%',
                width: '520px', height: '520px',
                background: 'radial-gradient(circle, rgba(139,92,246,0.22) 0%, transparent 70%)',
                borderRadius: '50%',
                filter: 'blur(60px)',
                animation: 'pulse-orb 8s ease-in-out infinite',
                pointerEvents: 'none',
            }} />
            <div style={{
                position: 'absolute', bottom: '-8%', right: '-8%',
                width: '480px', height: '480px',
                background: 'radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%)',
                borderRadius: '50%',
                filter: 'blur(60px)',
                animation: 'pulse-orb 10s ease-in-out infinite reverse',
                pointerEvents: 'none',
            }} />
            <div style={{
                position: 'absolute', top: '25%', right: '55%',
                width: '360px', height: '360px',
                background: 'radial-gradient(circle, rgba(16,185,129,0.14) 0%, transparent 70%)',
                borderRadius: '50%',
                filter: 'blur(50px)',
                animation: 'pulse-orb 12s ease-in-out infinite',
                animationDelay: '3s',
                pointerEvents: 'none',
            }} />

            {/* ── Grid overlay ── */}
            <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                backgroundImage: 'linear-gradient(rgba(148,163,184,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.03) 1px, transparent 1px)',
                backgroundSize: '60px 60px',
            }} />

            {/* ── Glassmorphism Card ── */}
            <div
                style={{
                    position: 'relative',
                    zIndex: 10,
                    width: '100%',
                    maxWidth: '440px',
                    margin: '1rem',
                    background: 'rgba(15, 23, 42, 0.65)',
                    backdropFilter: 'blur(32px)',
                    WebkitBackdropFilter: 'blur(32px)',
                    border: '1px solid rgba(148, 163, 184, 0.12)',
                    borderRadius: '28px',
                    padding: '2.5rem',
                    boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.06)',
                    transform: mounted ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.97)',
                    opacity: mounted ? 1 : 0,
                    transition: 'transform 0.6s cubic-bezier(0.16,1,0.3,1), opacity 0.6s ease',
                }}
            >
                {/* Top accent bar */}
                <div style={{
                    position: 'absolute', top: 0, left: '10%', right: '10%', height: '1px',
                    background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.8), rgba(59,130,246,0.8), transparent)',
                    borderRadius: '999px',
                }} />

                {/* ── Config warning banner (only shown when keys are missing) ── */}
                {!supabaseReady && (
                    <div style={{
                        marginBottom: '1.5rem',
                        background: 'rgba(251,191,36,0.08)',
                        border: '1px solid rgba(251,191,36,0.35)',
                        borderRadius: '14px',
                        padding: '12px 16px',
                        display: 'flex', gap: '10px', alignItems: 'flex-start',
                    }}>
                        <i className="pi pi-exclamation-triangle" style={{ color: '#fbbf24', fontSize: '1rem', marginTop: '2px', flexShrink: 0 }} />
                        <div>
                            <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: '0.8rem', marginBottom: '4px' }}>
                                إعداد Supabase مطلوب
                            </div>
                            <div style={{ color: '#94a3b8', fontSize: '0.73rem', lineHeight: 1.6, fontFamily: 'monospace' }}>
                                افتح ملف <span style={{ color: '#e2e8f0', background: 'rgba(30,41,59,0.8)', padding: '1px 6px', borderRadius: '4px' }}>.env.local</span> وأضف:<br />
                                <span style={{ color: '#34d399' }}>VITE_SUPABASE_URL</span>=https://xxxx.supabase.co<br />
                                <span style={{ color: '#34d399' }}>VITE_SUPABASE_ANON_KEY</span>=eyJh...<br />
                                <span style={{ color: '#64748b' }}>ثم أعد تشغيل: npm run dev</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Header ── */}
                <div style={{ textAlign: 'center', marginBottom: '2.2rem' }}>
                    {/* Logo Icon */}
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: '72px', height: '72px', borderRadius: '20px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                        boxShadow: '0 8px 32px rgba(139,92,246,0.4), 0 0 0 1px rgba(255,255,255,0.1)',
                        marginBottom: '1.2rem',
                        position: 'relative',
                    }}>
                        <i className={`pi ${isRegistering ? 'pi-user-plus' : 'pi-box'}`} style={{ fontSize: '2rem', color: 'white' }}></i>
                        {/* Glow ring */}
                        <div style={{
                            position: 'absolute', inset: '-4px',
                            borderRadius: '24px',
                            border: '1px solid rgba(139,92,246,0.3)',
                            animation: 'ring-pulse 2s ease-in-out infinite',
                        }} />
                    </div>

                    <h1 style={{
                        fontSize: '2rem', fontWeight: 900, color: '#f8fafc',
                        margin: '0 0 0.4rem',
                        letterSpacing: '-0.03em',
                        lineHeight: 1,
                    }}>
                        {isRegistering ? 'إنشاء حساب جديد' : <>SmartCore <span style={{ color: '#60a5fa' }}>ERP</span></>}
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0, fontWeight: 500 }}>
                        {isRegistering ? 'أدخل بياناتك لتسجيل حسابك في النظام' : 'نظام تخطيط موارد المؤسسات المتقدم'}
                    </p>
                </div>

                {/* ── Form ── */}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                    {/* Username */}
                    <div>
                        <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem', marginRight: '2px' }}>
                            اسم المستخدم
                        </label>
                        <div style={{ position: 'relative' }}>
                            <span style={{
                                position: 'absolute', top: '50%', right: '14px', transform: 'translateY(-50%)',
                                color: '#475569', fontSize: '0.95rem', pointerEvents: 'none',
                                transition: 'color 0.2s',
                            }}>
                                <i className="pi pi-user"></i>
                            </span>
                            <input
                                type="text"
                                value={email}
                                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                                placeholder="أدخل admin"
                                required
                                style={{
                                    width: '100%', boxSizing: 'border-box',
                                    background: 'rgba(30, 41, 59, 0.6)',
                                    border: '1px solid rgba(51,65,85,0.8)',
                                    borderRadius: '14px',
                                    color: '#f1f5f9',
                                    fontSize: '0.95rem',
                                    padding: '0.8rem 2.8rem 0.8rem 1rem',
                                    outline: 'none',
                                    transition: 'border-color 0.2s, box-shadow 0.2s',
                                }}
                                onFocus={e => {
                                    e.target.style.borderColor = '#3b82f6';
                                    e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.15)';
                                }}
                                onBlur={e => {
                                    e.target.style.borderColor = 'rgba(51,65,85,0.8)';
                                    e.target.style.boxShadow = 'none';
                                }}
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem', marginRight: '2px' }}>
                            كلمة المرور
                        </label>
                        <div style={{ position: 'relative' }}>
                            <span style={{
                                position: 'absolute', top: '50%', right: '14px', transform: 'translateY(-50%)',
                                color: '#475569', fontSize: '0.95rem', pointerEvents: 'none',
                            }}>
                                <i className="pi pi-lock"></i>
                            </span>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); setError(''); setSuccessMsg(''); }}
                                placeholder="6 أحرف على الأقل"
                                minLength="6"
                                required
                                style={{
                                    width: '100%', boxSizing: 'border-box',
                                    background: 'rgba(30, 41, 59, 0.6)',
                                    border: '1px solid rgba(51,65,85,0.8)',
                                    borderRadius: '14px',
                                    color: '#f1f5f9',
                                    fontSize: '0.95rem',
                                    padding: '0.8rem 2.8rem 0.8rem 3rem',
                                    outline: 'none',
                                    transition: 'border-color 0.2s, box-shadow 0.2s',
                                }}
                                onFocus={e => {
                                    e.target.style.borderColor = '#3b82f6';
                                    e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.15)';
                                }}
                                onBlur={e => {
                                    e.target.style.borderColor = 'rgba(51,65,85,0.8)';
                                    e.target.style.boxShadow = 'none';
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute', top: '50%', left: '14px', transform: 'translateY(-50%)',
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    color: '#475569', fontSize: '0.95rem', padding: '4px',
                                    transition: 'color 0.2s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.color = '#94a3b8'}
                                onMouseLeave={e => e.currentTarget.style.color = '#475569'}
                            >
                                <i className={`pi ${showPassword ? 'pi-eye-slash' : 'pi-eye'}`}></i>
                            </button>
                        </div>
                    </div>

                    {/* Options row */}
                    {!isRegistering && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#64748b' }}>
                                <input
                                    type="checkbox"
                                    style={{
                                        width: '16px', height: '16px',
                                        accentColor: '#3b82f6',
                                        cursor: 'pointer',
                                    }}
                                />
                                تذكرني
                            </label>
                            <a href="#" style={{
                                color: '#60a5fa', fontWeight: 700, textDecoration: 'none',
                                transition: 'color 0.2s',
                            }}
                                onMouseEnter={e => e.currentTarget.style.color = '#93c5fd'}
                                onMouseLeave={e => e.currentTarget.style.color = '#60a5fa'}
                            >
                                نسيت كلمة المرور؟
                            </a>
                        </div>
                    )}

                    {/* Error message */}
                    {error && (
                        <div style={{
                            background: 'rgba(239,68,68,0.1)',
                            border: '1px solid rgba(239,68,68,0.4)',
                            borderRadius: '12px',
                            padding: '0.75rem 1rem',
                            display: 'flex', alignItems: 'center', gap: '10px',
                            color: '#f87171', fontSize: '0.875rem',
                            animation: 'shake 0.4s ease',
                        }}>
                            <i className="pi pi-exclamation-circle"></i>
                            {error}
                        </div>
                    )}

                    {/* Success message */}
                    {successMsg && (
                        <div style={{
                            background: 'rgba(16,185,129,0.1)',
                            border: '1px solid rgba(16,185,129,0.4)',
                            borderRadius: '12px',
                            padding: '0.75rem 1rem',
                            display: 'flex', alignItems: 'center', gap: '10px',
                            color: '#34d399', fontSize: '0.875rem',
                            animation: 'upw-fade-in 0.4s ease',
                        }}>
                            <i className="pi pi-check-circle"></i>
                            {successMsg}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{
                            width: '100%',
                            padding: '0.9rem',
                            borderRadius: '14px',
                            border: 'none',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            background: isLoading
                                ? 'linear-gradient(135deg, #334155, #1e293b)'
                                : 'linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #2563eb 100%)',
                            backgroundSize: '200% 100%',
                            color: 'white',
                            fontWeight: 800,
                            fontSize: '1rem',
                            fontFamily: 'inherit',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                            boxShadow: isLoading ? 'none' : '0 4px 24px rgba(99,102,241,0.4)',
                            transition: 'all 0.3s ease',
                            animation: isLoading ? 'none' : 'gradient-shift 3s ease infinite',
                            position: 'relative',
                            overflow: 'hidden',
                        }}
                        onMouseEnter={e => {
                            if (!isLoading) {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 8px 32px rgba(99,102,241,0.55)';
                            }
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = isLoading ? 'none' : '0 4px 24px rgba(99,102,241,0.4)';
                        }}
                    >
                        {/* Shine overlay */}
                        {!isLoading && (
                            <div style={{
                                position: 'absolute', inset: 0,
                                background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 50%, transparent 60%)',
                                animation: 'shine 3s ease infinite',
                            }} />
                        )}
                        {isLoading ? (
                            <>
                                <i className="pi pi-spinner pi-spin"></i>
                                <span>جاري المعالجة...</span>
                            </>
                        ) : (
                            <>
                                <span>{isRegistering ? 'إنشاء الحساب' : 'دخول للنظام'}</span>
                                <i className={`pi ${isRegistering ? 'pi-user-plus' : 'pi-arrow-left'}`}></i>
                            </>
                        )}
                    </button>
                </form>

                {/* ── Toggle Register/Login ── */}
                <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                    <button
                        onClick={() => { setIsRegistering(!isRegistering); setError(''); setSuccessMsg(''); }}
                        style={{
                            background: 'none', border: 'none',
                            color: '#94a3b8', fontSize: '0.85rem', fontWeight: 700,
                            cursor: 'pointer', transition: 'color 0.2s',
                            borderBottom: '1px dashed #475569', paddingBottom: '2px',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#f8fafc'; e.currentTarget.style.borderBottomColor = '#cbd5e1'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderBottomColor = '#475569'; }}
                    >
                        {isRegistering ? 'لديك حساب بالفعل؟ قم بتسجيل الدخول' : 'ليس لديك حساب؟ سجل كمستخدم جديد'}
                    </button>
                </div>

                {/* ── Footer ── */}
                <div style={{
                    marginTop: '2rem', paddingTop: '1.25rem',
                    borderTop: '1px solid rgba(30,41,59,0.8)',
                    textAlign: 'center',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '0.6rem' }}>
                        <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#10b981' }}></div>
                        <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600 }}>
                            مشروع تخرج: قاعدة البيانات وإدارتها
                        </span>
                        <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#10b981' }}></div>
                    </div>
                    <p style={{ color: '#475569', fontSize: '0.72rem', margin: 0 }}>
                        إعداد: محمد أنور &nbsp;·&nbsp; محمد مزهر &nbsp;·&nbsp; مالك قباجة
                    </p>
                </div>
            </div>

            {/* ── Global CSS Animations ── */}
            <style>{`
                @keyframes pulse-orb {
                    0%, 100% { transform: scale(1) translate(0, 0); opacity: 1; }
                    50% { transform: scale(1.15) translate(20px, -20px); opacity: 0.7; }
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-18px); }
                }
                @keyframes ring-pulse {
                    0%, 100% { opacity: 0.5; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.08); }
                }
                @keyframes gradient-shift {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                @keyframes shine {
                    0% { transform: translateX(-100%); }
                    60%, 100% { transform: translateX(200%); }
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    20% { transform: translateX(-6px); }
                    40% { transform: translateX(6px); }
                    60% { transform: translateX(-4px); }
                    80% { transform: translateX(4px); }
                }
                input::placeholder { color: #334155; }
                input:-webkit-autofill {
                    -webkit-box-shadow: 0 0 0 30px #1e293b inset !important;
                    -webkit-text-fill-color: #f1f5f9 !important;
                }
            `}</style>
        </div>
    );
};

export default Login;
