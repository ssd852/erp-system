import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';
import { Plus, Edit, Trash2, X, Search } from 'lucide-react';

const n = (v) => parseFloat(String(v||0).replace(/[^0-9.-]+/g,''))||0;
const statusStyle = (s) => s==='Paid' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : s==='Overdue' ? 'bg-red-500/15 text-red-400 border border-red-500/20' : 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20';
const statusLabel = (s) => s==='Paid' ? 'مدفوع' : s==='Overdue' ? 'متأخر' : 'معلق';

const Invoices = () => {
    const [items, setItems] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState({ customer_id: '', date: '', due_date: '', total_amount: '', tax_rate: '', amount_paid: '', status: 'Pending' });

    const fetchData = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }
        const { data } = await supabase.from('invoices').select('*, customers(name)').eq('user_id', user.id).order('id', { ascending: false });
        setItems(data || []);
        const { data: cData } = await supabase.from('customers').select('id, name').eq('user_id', user.id);
        setCustomers(cData || []);
        setLoading(false);
    };
    useEffect(() => { fetchData(); }, []);

    const openAdd = () => { setForm({ customer_id: '', date: new Date().toISOString().split('T')[0], due_date: '', total_amount: '', tax_rate: '', amount_paid: '', status: 'Pending' }); setIsEditing(false); setShowModal(true); };
    const openEdit = (item) => { setForm({ id: item.id, customer_id: item.customer_id||'', date: item.invoice_date||item.date||'', due_date: item.due_date||'', total_amount: item.total_amount||'', tax_rate: item.tax_rate||'', amount_paid: item.amount_paid||'', status: item.status||'Pending' }); setIsEditing(true); setShowModal(true); };

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
            customer_id: form.customer_id,
            invoice_date: form.date || null,
            due_date: form.due_date || null,
            total_amount: cleanNum(form.total_amount),
            tax_rate: cleanNum(form.tax_rate),
            amount_paid: cleanNum(form.amount_paid),
            status: form.status,
            user_id: user.id
        };

        try {
            let error;
            if (isEditing) {
                const { error: updateError } = await supabase.from('invoices').update(payload).eq('id', form.id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase.from('invoices').insert([payload]);
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
        await supabase.from('invoices').delete().eq('id', itemToDelete.id);
        setDeleteModal(false); setItemToDelete(null); fetchData();
    };

    const filtered = items.filter(i => (i.customers?.name||'').toLowerCase().includes(searchTerm.toLowerCase()) || String(i.id||'').includes(searchTerm));

    return (
        <div className="p-6 w-full min-h-screen bg-[#0B1120]" dir="rtl">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-extrabold text-white tracking-tight">إدارة الفواتير</h1>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <input type="text" placeholder="بحث عن فاتورة..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                            className="bg-[#1E293B] border border-slate-700 text-white rounded-xl py-2.5 px-4 pl-10 w-64 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all text-sm" />
                        <Search size={15} className="absolute left-3 top-3 text-slate-500" />
                    </div>
                    <button onClick={openAdd} className="bg-[#22C55E] hover:bg-[#16a34a] text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold text-sm transition-all shadow-lg shadow-green-900/30">
                        <Plus size={17} /> إصدار فاتورة
                    </button>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-[#1E293B] sticky top-0">
                            <tr>
                                {['#','العميل','التاريخ','الإجمالي','المدفوع','الحالة','إجراءات'].map(h => (
                                    <th key={h} className="p-4 text-slate-300 font-semibold uppercase tracking-wider text-xs whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-[#0F172A] divide-y divide-slate-800/50">
                            {loading ? (
                                <tr><td colSpan={7} className="p-12 text-center text-slate-600">جاري التحميل...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={7} className="p-12 text-center text-slate-600">لا توجد فواتير.</td></tr>
                            ) : filtered.map((item) => (
                                <tr key={item.id} className="hover:bg-[#1E293B]/50 transition-colors duration-150">
                                    <td className="p-4 text-slate-600 font-mono text-xs">{item.id}</td>
                                    <td className="p-4 font-bold text-white">{item.customers?.name||'—'}</td>
                                    <td className="p-4 text-slate-400">{item.invoice_date||item.date||'—'}</td>
                                    <td className="p-4 font-mono font-bold text-emerald-400">${Number(item.total_amount||0).toLocaleString()}</td>
                                    <td className="p-4 font-mono text-blue-400">${Number(item.amount_paid||0).toLocaleString()}</td>
                                    <td className="p-4"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyle(item.status)}`}>{statusLabel(item.status)}</span></td>
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
                    <div className="bg-[#0F172A] border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-5 border-b border-slate-800">
                            <h2 className="text-lg font-extrabold text-white">{isEditing ? 'تعديل الفاتورة' : 'إصدار فاتورة جديدة'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"><X size={18}/></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">العميل *</label>
                                <select required value={form.customer_id} onChange={e => setForm({...form, customer_id: e.target.value})} className="w-full bg-[#0B1120] border border-slate-700 text-white rounded-xl p-3 outline-none focus:border-blue-500 transition-all appearance-none">
                                    <option value="">اختر العميل...</option>
                                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">تاريخ الفاتورة</label>
                                    <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full bg-[#0B1120] border border-slate-700 text-white rounded-xl p-3 outline-none focus:border-blue-500 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">الاستحقاق</label>
                                    <input type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} className="w-full bg-[#0B1120] border border-slate-700 text-white rounded-xl p-3 outline-none focus:border-blue-500 transition-all" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">الإجمالي</label>
                                    <input type="text" value={form.total_amount} onChange={e => setForm({...form, total_amount: e.target.value})} className="w-full bg-[#0B1120] border border-slate-700 text-white rounded-xl p-3 outline-none focus:border-blue-500 transition-all" dir="ltr" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">المدفوع</label>
                                    <input type="text" value={form.amount_paid} onChange={e => setForm({...form, amount_paid: e.target.value})} className="w-full bg-[#0B1120] border border-slate-700 text-white rounded-xl p-3 outline-none focus:border-blue-500 transition-all" dir="ltr" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">الضريبة (%)</label>
                                    <input type="text" value={form.tax_rate} onChange={e => setForm({...form, tax_rate: e.target.value})} className="w-full bg-[#0B1120] border border-slate-700 text-white rounded-xl p-3 outline-none focus:border-blue-500 transition-all" dir="ltr" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">الحالة</label>
                                    <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full bg-[#0B1120] border border-slate-700 text-white rounded-xl p-3 outline-none focus:border-blue-500 transition-all appearance-none">
                                        <option value="Pending">معلق</option>
                                        <option value="Paid">مدفوع</option>
                                        <option value="Overdue">متأخر</option>
                                    </select>
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
                        <p className="text-slate-400 text-sm mb-6">هل أنت متأكد من حذف الفاتورة رقم <span className="text-white font-bold">#{itemToDelete?.id}</span>؟</p>
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
export default Invoices;
