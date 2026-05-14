import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';
import { Plus, Edit, Trash2, X, Search } from 'lucide-react';

const n = (v) => parseFloat(String(v||0).replace(/[^0-9.-]+/g,''))||0;

const Payroll = () => {
    const [items, setItems] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState({ employee_id: '', month: '', basic_salary: '', allowances: '', deductions: '', net_salary: '' });

    const fetchData = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }
        const { data } = await supabase.from('payroll').select('*, employees(full_name)').eq('user_id', user.id).order('id', { ascending: false });
        setItems(data || []);
        const { data: eData } = await supabase.from('employees').select('id, full_name').eq('user_id', user.id);
        setEmployees(eData || []);
        setLoading(false);
    };
    useEffect(() => { fetchData(); }, []);

    const calcNet = (f) => n(f.basic_salary) + n(f.allowances) - n(f.deductions);
    const openAdd = () => { setForm({ employee_id: '', month: '', basic_salary: '', allowances: '', deductions: '', net_salary: '' }); setIsEditing(false); setShowModal(true); };
    const openEdit = (item) => { setForm({ id: item.id, employee_id: item.employee_id||'', month: item.month||'', basic_salary: item.basic_salary||'', allowances: item.allowances||'', deductions: item.deductions||'', net_salary: item.net_salary||'' }); setIsEditing(true); setShowModal(true); };
    const updateForm = (field, val) => setForm(prev => { const next={...prev,[field]:val}; next.net_salary=calcNet(next); return next; });

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const payload = { employee_id: form.employee_id, month: form.month, basic_salary: n(form.basic_salary), allowances: n(form.allowances), deductions: n(form.deductions), net_salary: n(form.net_salary), user_id: user.id };
        if (isEditing) await supabase.from('payroll').update(payload).eq('id', form.id);
        else await supabase.from('payroll').insert([payload]);
        setShowModal(false); fetchData();
    };

    const handleDelete = async () => {
        if (!itemToDelete) return;
        await supabase.from('payroll').delete().eq('id', itemToDelete.id);
        setDeleteModal(false); setItemToDelete(null); fetchData();
    };

    const filtered = items.filter(i => (i.employees?.full_name||'').toLowerCase().includes(searchTerm.toLowerCase()) || (i.month||'').toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="p-6 w-full min-h-screen bg-[#0B1120]" dir="rtl">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-extrabold text-white tracking-tight">مسيرات الرواتب</h1>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <input type="text" placeholder="بحث عن راتب..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                            className="bg-[#1E293B] border border-slate-700 text-white rounded-xl py-2.5 px-4 pl-10 w-64 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all text-sm" />
                        <Search size={15} className="absolute left-3 top-3 text-slate-500" />
                    </div>
                    <button onClick={openAdd} className="bg-[#22C55E] hover:bg-[#16a34a] text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold text-sm transition-all shadow-lg shadow-green-900/30">
                        <Plus size={17} /> صرف راتب
                    </button>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-[#1E293B] sticky top-0">
                            <tr>
                                {['#','الموظف','الشهر','الأساسي','البدلات','الخصومات','الصافي','إجراءات'].map(h => (
                                    <th key={h} className="p-4 text-slate-300 font-semibold uppercase tracking-wider text-xs whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-[#0F172A] divide-y divide-slate-800/50">
                            {loading ? (
                                <tr><td colSpan={8} className="p-12 text-center text-slate-600">جاري التحميل...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={8} className="p-12 text-center text-slate-600">لا توجد بيانات.</td></tr>
                            ) : filtered.map((item) => (
                                <tr key={item.id} className="hover:bg-[#1E293B]/50 transition-colors duration-150">
                                    <td className="p-4 text-slate-600 font-mono text-xs">{item.id}</td>
                                    <td className="p-4 font-bold text-white">{item.employees?.full_name||'—'}</td>
                                    <td className="p-4 text-slate-400">{item.month||'—'}</td>
                                    <td className="p-4 font-mono text-emerald-400">${Number(item.basic_salary||0).toLocaleString()}</td>
                                    <td className="p-4 font-mono text-blue-400">${Number(item.allowances||0).toLocaleString()}</td>
                                    <td className="p-4 font-mono text-red-400">${Number(item.deductions||0).toLocaleString()}</td>
                                    <td className="p-4 font-mono font-bold text-emerald-400">${Number(item.net_salary||0).toLocaleString()}</td>
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
                            <h2 className="text-lg font-extrabold text-white">{isEditing ? 'تعديل مسير الراتب' : 'إضافة مسير راتب'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"><X size={18}/></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">الموظف *</label>
                                <select required value={form.employee_id} onChange={e => setForm({...form, employee_id: e.target.value})} className="w-full bg-[#0B1120] border border-slate-700 text-white rounded-xl p-3 outline-none focus:border-blue-500 transition-all appearance-none">
                                    <option value="">اختر الموظف...</option>
                                    {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">الشهر</label>
                                <input type="text" placeholder="مثال: مايو 2026" value={form.month} onChange={e => setForm({...form, month: e.target.value})} className="w-full bg-[#0B1120] border border-slate-700 text-white rounded-xl p-3 outline-none focus:border-blue-500 transition-all" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">الراتب الأساسي</label>
                                    <input type="text" value={form.basic_salary} onChange={e => updateForm('basic_salary', e.target.value)} className="w-full bg-[#0B1120] border border-slate-700 text-white rounded-xl p-3 outline-none focus:border-blue-500 transition-all" dir="ltr" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">البدلات</label>
                                    <input type="text" value={form.allowances} onChange={e => updateForm('allowances', e.target.value)} className="w-full bg-[#0B1120] border border-slate-700 text-white rounded-xl p-3 outline-none focus:border-blue-500 transition-all" dir="ltr" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">الخصومات</label>
                                    <input type="text" value={form.deductions} onChange={e => updateForm('deductions', e.target.value)} className="w-full bg-[#0B1120] border border-slate-700 text-white rounded-xl p-3 outline-none focus:border-blue-500 transition-all" dir="ltr" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">الصافي (تلقائي)</label>
                                    <input type="text" value={form.net_salary} readOnly className="w-full bg-[#1E293B] border border-emerald-900/50 text-emerald-400 font-bold rounded-xl p-3 outline-none cursor-not-allowed" dir="ltr" />
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
                        <p className="text-slate-400 text-sm mb-6">هل أنت متأكد من حذف مسير الراتب هذا؟</p>
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
export default Payroll;
