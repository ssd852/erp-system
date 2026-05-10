import React, { useState, useRef, useEffect } from 'react';

// ─── Suggested quick-prompts shown on first load ───────────────────────────
const SUGGESTIONS = [
    'كيف حال المبيعات هذا الشهر؟',
    'هل يوجد نواقص في المخزون؟',
    'ما هي الفواتير غير المسددة؟',
    'اعطني ملخصاً مالياً سريعاً',
];

// ─── Mock responses (simulation mode when no API key) ─────────────────────
const getMockReply = (text) => {
    const t = text.toLowerCase();
    if (t.includes('أرباح') || t.includes('مبيعات') || t.includes('ايرادات') || t.includes('إيرادات')) {
        return 'بناءً على تحليلي لقاعدة البيانات، أداء المبيعات جيد هذا الشهر. أنصحك بمراجعة تقرير "فواتير المبيعات" للاطلاع على الأرقام الدقيقة ومقارنتها بالأشهر السابقة.';
    }
    if (t.includes('مخزون') || t.includes('منتجات') || t.includes('نواقص') || t.includes('بضاعة')) {
        return 'رصدت بعض المنتجات التي اقتربت من حد إعادة الطلب. أنصح بمراجعة قسم "الإمداد والمخزون" وتوليد تقرير النواقص لتجنب أي انقطاع في التوريد.';
    }
    if (t.includes('فاتورة') || t.includes('ديون') || t.includes('مستحق') || t.includes('شيك')) {
        return 'وفقاً لسجلات العملاء، هناك عدة فواتير مستحقة الدفع. يمكنك تتبعها بدقة عبر محرك SQL باستخدام: SELECT * FROM SalesInvoices WHERE Status = "pending"';
    }
    if (t.includes('موظف') || t.includes('راتب') || t.includes('رواتب') || t.includes('الموارد')) {
        return 'يمكنني مساعدتك في تحليل بيانات الرواتب. توجه إلى قسم "مسيرات الرواتب" لعرض تفاصيل الرواتب، أو استخدم محرك SQL لاستعلامات مخصصة.';
    }
    if (t.includes('تقرير') || t.includes('تحليل') || t.includes('إحصاء') || t.includes('احصاء')) {
        return 'يوفر النظام تقارير شاملة في قسم "التقارير". يمكنك طباعة تقارير المبيعات، المشتريات، الرواتب، والأصول الثابتة بضغطة زر.';
    }
    if (t.includes('مساعد') || t.includes('ملخص') || t.includes('ماذا') || t.includes('كيف')) {
        return 'أنا SmartCore، المساعد الذكي المدمج في نظام ERP الخاص بك. يمكنني مساعدتك في: تحليل البيانات المالية، الاستعلام عن المخزون، متابعة العملاء والموردين، وتوجيهك لأي قسم في النظام. ماذا تريد أن تعرف؟';
    }
    return 'أنا أعمل حالياً في وضع المحاكاة (Simulation Mode). يمكنني توجيهك لأقسام النظام وتقديم تحليلات عامة. لتفعيل الذكاء الاصطناعي الكامل، أضف مفتاح API في متغيرات البيئة (VITE_OPENROUTER_API_KEY).';
};

// ─── Component ─────────────────────────────────────────────────────────────
const AiAssistant = () => {
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: 'مرحباً! أنا SmartCore، المساعد المالي والذكاء الاصطناعي الخاص بك. كيف يمكنني مساعدتك في إدارة نظامك اليوم؟',
        },
    ]);
    const [input, setInput]       = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef           = useRef(null);
    const inputRef                 = useRef(null);

    // Read API key from Vite env variable (set VITE_OPENROUTER_API_KEY in .env)
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY || '';
    const isSimulation = !apiKey;

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async (text) => {
        const userMsg = (text || input).trim();
        if (!userMsg) return;

        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsLoading(true);
        inputRef.current?.focus();

        // ── SIMULATION MODE ──────────────────────────────────────────────
        if (isSimulation) {
            setTimeout(() => {
                setMessages(prev => [...prev, { role: 'assistant', content: getMockReply(userMsg) }]);
                setIsLoading(false);
            }, 1200 + Math.random() * 600);
            return;
        }

        // ── REAL AI MODE (OpenRouter / OpenAI-compatible) ─────────────────
        try {
            const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'openai/gpt-4o-mini',
                    messages: [
                        {
                            role: 'system',
                            content: 'أنت SmartCore، مساعد ذكاء اصطناعي خبير في أنظمة ERP المالية والمحاسبية. تتحدث باللغة العربية بأسلوب مهني وودّي. تساعد المستخدم في تحليل البيانات المالية وإدارة المخزون والرواتب والعملاء والموردين.',
                        },
                        ...messages.map(m => ({ role: m.role, content: m.content })),
                        { role: 'user', content: userMsg },
                    ],
                }),
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            const reply = data.choices?.[0]?.message?.content || 'عذراً، لم أتلقَّ ردًّا صالحاً.';
            setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
        } catch (err) {
            console.error('SmartCore AI error:', err);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'حدث خطأ في الاتصال بخادم الذكاء الاصطناعي. يرجى التحقق من مفتاح API أو الاتصال بالإنترنت.',
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = (e) => { e.preventDefault(); sendMessage(); };

    // ─── Inline style objects (failsafe — no Tailwind dependency) ──────────
    const S = {
        wrapper:   { display:'flex', flexDirection:'column', height:'calc(100vh - 64px)', background:'#0B1120', color:'#e2e8f0', direction:'rtl', fontFamily:"'Segoe UI', Tahoma, sans-serif", overflow:'hidden' },
        header:    { background:'#0F172A', borderBottom:'1px solid #1e293b', padding:'16px 24px', display:'flex', alignItems:'center', gap:16, flexShrink:0, boxShadow:'0 4px 20px rgba(0,0,0,0.4)' },
        avatar:    { width:48, height:48, borderRadius:'50%', background:'linear-gradient(135deg,#6366f1,#a855f7)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, color:'white', boxShadow:'0 4px 15px rgba(139,92,246,0.4)', flexShrink:0 },
        statusDot: { width:8, height:8, borderRadius:'50%', background:'#22c55e', display:'inline-block', marginLeft:6, animation:'pulse 2s infinite' },
        chatArea:  { flex:1, overflowY:'auto', padding:'24px 32px', display:'flex', flexDirection:'column', gap:20, background:'linear-gradient(180deg,#0B1120 0%,#0F172A 100%)' },
        userBubble:{ maxWidth:'65%', alignSelf:'flex-start', background:'linear-gradient(135deg,#2563eb,#4f46e5)', color:'white', padding:'12px 18px', borderRadius:'18px 18px 18px 4px', lineHeight:1.7, fontSize:14, boxShadow:'0 4px 15px rgba(79,70,229,0.3)' },
        aiBubble:  { maxWidth:'72%', alignSelf:'flex-end', background:'#1E293B', border:'1px solid #334155', color:'#e2e8f0', padding:'12px 18px', borderRadius:'18px 18px 4px 18px', lineHeight:1.7, fontSize:14, boxShadow:'0 4px 15px rgba(0,0,0,0.3)' },
        msgMeta:   { fontSize:11, opacity:0.6, marginBottom:6, fontWeight:'bold', display:'flex', alignItems:'center', gap:6 },
        footer:    { background:'#0F172A', borderTop:'1px solid #1e293b', padding:'16px 24px', flexShrink:0 },
        form:      { display:'flex', gap:12, maxWidth:900, margin:'0 auto' },
        inputBox:  { flex:1, background:'#0B1120', border:'1px solid #334155', color:'white', borderRadius:12, padding:'12px 20px', fontSize:14, outline:'none', fontFamily:'inherit', transition:'border-color 0.2s' },
        sendBtn:   { background:'linear-gradient(135deg,#2563eb,#7c3aed)', color:'white', border:'none', borderRadius:12, padding:'12px 24px', fontSize:14, fontWeight:'bold', cursor:'pointer', display:'flex', alignItems:'center', gap:8, whiteSpace:'nowrap', boxShadow:'0 4px 15px rgba(124,58,237,0.4)', transition:'opacity 0.2s' },
        suggestions:{ display:'flex', gap:8, flexWrap:'wrap', maxWidth:900, margin:'0 auto 12px', padding:'0 0 0 4px' },
        chip:      { background:'rgba(99,102,241,0.12)', border:'1px solid rgba(99,102,241,0.3)', color:'#a5b4fc', padding:'6px 14px', borderRadius:20, fontSize:12, cursor:'pointer', transition:'background 0.2s', whiteSpace:'nowrap' },
        simBadge:  { display:'inline-flex', alignItems:'center', gap:6, background:'rgba(245,158,11,0.15)', border:'1px solid rgba(245,158,11,0.35)', color:'#fbbf24', padding:'4px 12px', borderRadius:20, fontSize:11, marginTop:4 },
        dotWrap:   { display:'flex', gap:6, alignItems:'center', padding:'4px 0' },
        dot:       { width:8, height:8, borderRadius:'50%', background:'#a855f7' },
    };

    return (
        <div style={S.wrapper}>
            {/* ── Header ─────────────────────────────────────────────── */}
            <div style={S.header}>
                <div style={S.avatar}>
                    <i className="pi pi-bolt"></i>
                </div>
                <div>
                    <div style={{ margin:0, fontSize:18, fontWeight:'bold', color:'white', letterSpacing:'0.5px' }}>
                        المساعد الذكي — SmartCore
                    </div>
                    <div style={{ fontSize:12, color:'#94a3b8', marginTop:4, display:'flex', alignItems:'center' }}>
                        <span style={S.statusDot}></span>
                        {isSimulation
                            ? <span style={{ color:'#fbbf24' }}>وضع المحاكاة — Simulation Mode</span>
                            : <span style={{ color:'#22c55e' }}>متصل بـ OpenRouter AI</span>
                        }
                    </div>
                </div>
                {isSimulation && (
                    <div style={{ marginRight:'auto' }}>
                        <span style={S.simBadge}>
                            <i className="pi pi-info-circle"></i>
                            لا يوجد مفتاح API — النظام يعمل بالمحاكاة
                        </span>
                    </div>
                )}
            </div>

            {/* ── Chat Messages ───────────────────────────────────────── */}
            <div style={S.chatArea}>
                {messages.map((msg, idx) => {
                    const isUser = msg.role === 'user';
                    return (
                        <div key={idx} style={{ display:'flex', flexDirection:'column', alignItems: isUser ? 'flex-start' : 'flex-end' }}>
                            <div style={S.msgMeta}>
                                <i className={`pi ${isUser ? 'pi-user' : 'pi-sparkles'}`} style={{ fontSize:11 }}></i>
                                <span>{isUser ? 'أنت' : 'SmartCore AI'}</span>
                            </div>
                            <div style={isUser ? S.userBubble : S.aiBubble}>
                                <p style={{ margin:0, whiteSpace:'pre-wrap' }}>{msg.content}</p>
                            </div>
                        </div>
                    );
                })}

                {/* Typing indicator */}
                {isLoading && (
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end' }}>
                        <div style={{ ...S.aiBubble, padding:'14px 20px' }}>
                            <div style={S.dotWrap}>
                                {[0, 0.2, 0.4].map((delay, i) => (
                                    <span key={i} style={{ ...S.dot, animationDelay:`${delay}s`, animation:'bounce 1s infinite' }}></span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* ── Input Area ──────────────────────────────────────────── */}
            <div style={S.footer}>
                {/* Quick suggestion chips — shown only at start */}
                {messages.length <= 1 && (
                    <div style={S.suggestions}>
                        {SUGGESTIONS.map((s, i) => (
                            <button
                                key={i}
                                style={S.chip}
                                onClick={() => sendMessage(s)}
                                onMouseEnter={e => e.currentTarget.style.background='rgba(99,102,241,0.25)'}
                                onMouseLeave={e => e.currentTarget.style.background='rgba(99,102,241,0.12)'}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={S.form}>
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="اسألني عن التحليلات المالية أو إدارة النظام..."
                        style={S.inputBox}
                        disabled={isLoading}
                        onFocus={e  => e.target.style.borderColor = '#6366f1'}
                        onBlur={e   => e.target.style.borderColor = '#334155'}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        style={{ ...S.sendBtn, opacity: (isLoading || !input.trim()) ? 0.5 : 1 }}
                    >
                        <span>إرسال</span>
                        <i className="pi pi-send"></i>
                    </button>
                </form>
            </div>

            {/* Keyframe animations injected once */}
            <style>{`
                @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
                @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
            `}</style>
        </div>
    );
};

export default AiAssistant;
