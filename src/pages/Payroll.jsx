import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';
import { Plus, Edit, Trash2, X, Search } from 'lucide-react';

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

    const n = (v) => parseFloat(String(v || 0).replace(/[^0-9.-]+/g, '')) || 0;

    const calcNet = (f) => n(f.basic_salary) + n(f.allowances) - n(f.deductions);

    const openAdd = () => { setForm({ employee_id: '', month: '', basic_salary: '', allowances: '', deductions: '', net_salary: '' }); setIsEditing(false); setShowModal(true); };
    const openEdit = (item) => { setForm({ id: item.id, employee_id: item.employee_id || '', month: item.month || '', basic_salary: item.basic_salary || '', allowances: item.allowances || '', deductions: item.deductions || '', net_salary: item.net_salary || '' }); setIsEditing(true); setShowModal(true); };

    const updateForm = (field, val) => setForm(prev => { const next = { ...prev, [field]: val }; next.net_salary = calcNet(next); return next; });

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const payload = { employee_id: form.employee_id, month: form.month, basic_salary: n(form.basic_salary), allowances: n(form.allowances), deductions: n(form.deductions), net_salary: n(form.net_salary), user_id: user.id };
        if (isEditing) { await supabase.from('payroll').update(payload).eq('id', form.id); }
        else { await supabase.from('payroll').insert([payload]); }
        setShowModal(false); fetchData();
    };

    const handleDelete = async () => {
        if (!itemToDelete) return;
        await supabase.from('payroll').delete().eq('id', itemToDelete.id);
        setDeleteModal(false); setItemToDelete(null); fetchData();
    };

    const filtered = items.filter(i => (i.employees?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (i.month || '').toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="p-6 w-full min-h-screen bg-[#0B1120]" dir="rtl">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">مسيرات الرواتب</h2>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <input type="text" placeholder="بحث..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-slate-800 border border-slate-700 text-white rounded-lg py-2.5 px-4 pl-10 w-64 outline-none focus:border-blue-500 transition-colors" />
                        <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                    </div>
                    <button onClick={openAdd} className="bg-[#22C55E] hover:bg-[#16a34a] text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-bold transition-colors">
                        <Plus size={18} /> صرف راتب
                    </button>
                </div>
            </div>

            <div className="bg-[#0F172A] rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-slate-800/60 text-slate-400 border-b border-slate-800">
                            <tr>
                                <th className="p-4 font-semibold">#</th>
                                <th className="p-4 font-semibold">الموظف</th>
                                <th className="p-4 font-semibold">الشهر</th>
                                <th className="p-4 font-semibold">الأساسي</th>
                                <th className="p-4 font-semibold">البدلات</th>
                                <th className="p-4 font-semibold">الخصومات</th>
                                <th className="p-4 font-semibold">الصافي</th>
                                <th className="p-4 font-semibold text-center">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/70">
                            {loading ? (
                                <tr><td colSpan={8} className="p-10 text-center text-slate-500">جاري التحميل...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={8} className="p-10 text-center text-slate-500">لا توجد مسيرات.</td></tr>
                            ) : filtered.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="p-4 text-slate-500">{item.id}</td>
                                    <td className="p-4 font-semibold text-white">{item.employees?.full_name || '-'}</td>
                                    <td className="p-4 text-slate-300">{item.month || '-'}</td>
                                    <td className="p-4 text-emerald-400 font-mono">${Number(item.basic_salary || 0).toLocaleString()}</td>
                                    <td className="p-4 text-blue-400 font-mono">${Number(item.allowances || 0).toLocaleString()}</td>
                                    <td className="p-4 text-red-400 font-mono">${Number(item.deductions || 0).toLocaleString()}</td>
                                    <td className="p-4 text-emerald-400 font-mono font-bold">${Number(item.net_salary || 0).toLocaleString()}</td>
                                    <td className="p-4">
                                        <div className="flex gap-2 justify-center">
                                            <button onClick={() => openEdit(item)} className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"><Edit size={15} /></button>
                                            <button onClick={() => { setItemToDelete(item); setDeleteModal(true); }} className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"><Trash2 size={15} /></button>
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
                    <div className="bg-[#0F172A] border border-slate-700 rounded-xl w-full max-w-lg shadow-2xl">
                        <div className="flex items-center justify-between p-5 border-b border-slate-800">
                            <h3 className="text-lg font-bold text-white">{isEditing ? 'تعديل المسير' : 'إضافة مسير راتب'}</h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1.5">الموظف *</label>
                                <select required value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })} className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-3 outline-none focus:border-blue-500 transition-colors appearance-none">
                                    <option value="">اختر الموظف...</option>
                                    {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1.5">الشهر</label>
                                <input type="text" placeholder="مثال: مايو 2026" value={form.month} onChange={e => setForm({ ...form, month: e.target.value })} className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-3 outline-none focus:border-blue-500 transition-colors" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1.5">الراتب الأساسي</label>
                                    <input type="text" value={form.basic_salary} onChange={e => updateForm('basic_salary', e.target.value)} className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-3 outline-none focus:border-blue-500 transition-colors" dir="ltr" />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1.5">البدلات</label>
                                    <input type="text" value={form.allowances} onChange={e => updateForm('allowances', e.target.value)} className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-3 outline-none focus:border-blue-500 transition-colors" dir="ltr" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1.5">الخصومات</label>
                                    <input type="text" value={form.deductions} onChange={e => updateForm('deductions', e.target.value)} className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-3 outline-none focus:border-blue-500 transition-colors" dir="ltr" />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1.5">الصافي (تلقائي)</label>
                                    <input type="text" value={form.net_salary} readOnly className="w-full bg-slate-700 border border-slate-600 text-emerald-400 font-bold rounded-lg p-3 outline-none cursor-not-allowed" dir="ltr" />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="submit" className="flex-1 bg-[#22C55E] hover:bg-[#16a34a] text-white font-bold py-3 rounded-lg transition-colors">حفظ</button>
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-lg border border-slate-700 transition-colors">إلغاء</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {deleteModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-[#0F172A] border border-slate-700 rounded-xl w-full max-w-sm shadow-2xl p-6 text-center">
                        <div className="w-14 h-14 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-4"><Trash2 size={28} className="text-red-400" /></div>
                        <h3 className="text-lg font-bold text-white mb-2">تأكيد الحذف</h3>
                        <p className="text-slate-400 mb-6 text-sm">هل أنت متأكد من حذف مسير الراتب هذا؟</p>
                        <div className="flex gap-3">
                            <button onClick={handleDelete} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-lg transition-colors">نعم، احذف</button>
                            <button onClick={() => setDeleteModal(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-lg border border-slate-700 transition-colors">إلغاء</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Payroll;
