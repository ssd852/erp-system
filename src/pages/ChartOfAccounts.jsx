import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';
import { Plus, Edit, Trash2, X, Search } from 'lucide-react';

const ChartOfAccounts = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState({ account_name: '', account_type: '', balance: '' });

    const fetchData = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }
        const { data } = await supabase.from('chart_of_accounts').select('*').eq('user_id', user.id).order('id', { ascending: false });
        setItems(data || []);
        setLoading(false);
    };
    useEffect(() => { fetchData(); }, []);

    const openAdd = () => { setForm({ account_name: '', account_type: '', balance: '' }); setIsEditing(false); setShowModal(true); };
    const openEdit = (item) => { setForm({ id: item.id, account_name: item.account_name||'', account_type: item.account_type||'', balance: item.balance||'' }); setIsEditing(true); setShowModal(true); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            console.error("Auth Error:", authError);
            alert("Error: User not authenticated.");
            return;
        }

        const cleanNum = (val) => parseFloat(String(val).replace(/[^0-9.-]+/g,"")) || 0;

        const payload = {
            account_name: form.account_name,
            account_type: form.account_type,
            balance: cleanNum(form.balance),
            user_id: user.id
        };

        try {
            let error;
            if (isEditing) {
                const { error: updateError } = await supabase.from('chart_of_accounts').update(payload).eq('id', form.id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase.from('chart_of_accounts').insert([payload]);
                error = insertError;
            }

            if (error) {
                console.error("Detailed Error:", error.message, error.details, error.hint);
                alert("Error: " + error.message);
                return;
            }

            setShowModal(false);
            fetchData();
        } catch (err) {
            console.error("Unexpected Error:", err);
            alert("An unexpected error occurred.");
        }
    };

    const handleDelete = async () => {
        if (!itemToDelete) return;
        await supabase.from('chart_of_accounts').delete().eq('id', itemToDelete.id);
        setDeleteModal(false); setItemToDelete(null); fetchData();
    };

    const filtered = items.filter(i => (i.account_name||'').toLowerCase().includes(searchTerm.toLowerCase()) || (i.account_type||'').toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="p-6 w-full min-h-screen bg-[#0B1120]" dir="rtl">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-extrabold text-white tracking-tight">دليل الحسابات</h1>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <input type="text" placeholder="بحث عن حساب..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                            className="bg-[#1E293B] border border-slate-700 text-white rounded-xl py-2.5 px-4 pl-10 w-64 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all text-sm" />
                        <Search size={15} className="absolute left-3 top-3 text-slate-500" />
                    </div>
                    <button onClick={openAdd} className="bg-[#22C55E] hover:bg-[#16a34a] text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold text-sm transition-all shadow-lg shadow-green-900/30">
                        <Plus size={17} /> إضافة حساب
                    </button>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-[#1E293B] sticky top-0">
                            <tr>
                                {['#','اسم الحساب','النوع','الرصيد','إجراءات'].map(h => (
                                    <th key={h} className="p-4 text-slate-300 font-semibold uppercase tracking-wider text-xs whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-[#0F172A] divide-y divide-slate-800/50">
                            {loading ? (
                                <tr><td colSpan={5} className="p-12 text-center text-slate-600">جاري التحميل...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={5} className="p-12 text-center text-slate-600">لا توجد حسابات.</td></tr>
                            ) : filtered.map((item, idx) => (
                                <tr key={item.id} className="hover:bg-[#1E293B]/50 transition-colors duration-150">
                                    <td className="p-4 text-slate-600 font-mono text-xs">{idx+1}</td>
                                    <td className="p-4 font-bold text-white">{item.account_name}</td>
                                    <td className="p-4 text-slate-400">{item.account_type||'—'}</td>
                                    <td className="p-4 font-mono font-bold text-emerald-400">${Number(item.balance||0).toLocaleString()}</td>
                                    <td className="p-4">
                                        <div className="flex gap-2 justify-center">
                                            <button onClick={() => openEdit(item)} className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/25 transition-colors"><Edit size={14}/></button>
                                            <button onClick={() => { setItemToDelete(item); setDeleteModal(true); }} className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/25 transition-colors"><Trash2 size={14}/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-[#0F172A] border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl">
                        <div className="flex items-center justify-between p-5 border-b border-slate-800">
                            <h2 className="text-lg font-extrabold text-white">{isEditing ? 'تعديل الحساب' : 'إضافة حساب جديد'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"><X size={18}/></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">اسم الحساب *</label>
                                <input required type="text" value={form.account_name} onChange={e => setForm({...form, account_name: e.target.value})} className="w-full bg-[#0B1120] border border-slate-700 text-white rounded-xl p-3 outline-none focus:border-blue-500 transition-all" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">النوع</label>
                                    <input type="text" placeholder="أصول، خصوم، إيرادات..." value={form.account_type} onChange={e => setForm({...form, account_type: e.target.value})} className="w-full bg-[#0B1120] border border-slate-700 text-white rounded-xl p-3 outline-none focus:border-blue-500 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">الرصيد</label>
                                    <input type="text" value={form.balance} onChange={e => setForm({...form, balance: e.target.value})} className="w-full bg-[#0B1120] border border-slate-700 text-white rounded-xl p-3 outline-none focus:border-blue-500 transition-all" dir="ltr" />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="submit" className="flex-1 bg-[#22C55E] hover:bg-[#16a34a] text-white font-bold py-3 rounded-xl transition-colors">حفظ</button>
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl border border-slate-700 transition-colors">إلغاء</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {deleteModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-[#0F172A] border border-slate-700/80 rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center">
                        <div className="w-14 h-14 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-4"><Trash2 size={26} className="text-red-400"/></div>
                        <h3 className="text-lg font-extrabold text-white mb-2">تأكيد الحذف</h3>
                        <p className="text-slate-400 text-sm mb-6">هل أنت متأكد من حذف <span className="text-white font-bold">{itemToDelete?.account_name}</span>؟</p>
                        <div className="flex gap-3">
                            <button onClick={handleDelete} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-xl transition-colors">نعم، احذف</button>
                            <button onClick={() => setDeleteModal(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl border border-slate-700 transition-colors">إلغاء</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default ChartOfAccounts;
