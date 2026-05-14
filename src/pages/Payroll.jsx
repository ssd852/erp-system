import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';
import { Plus, Edit, Trash2, X, Search } from 'lucide-react';

const Payroll = () => {
    const [items, setItems] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ employee_id: '', month: '', basic_salary: 0, allowances: 0, deductions: 0, net_salary: 0 });

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

    const calcNet = (f) => {
        const b = parseFloat(String(f.basic_salary || 0).replace(/[^0-9.-]+/g, '')) || 0;
        const a = parseFloat(String(f.allowances || 0).replace(/[^0-9.-]+/g, '')) || 0;
        const d = parseFloat(String(f.deductions || 0).replace(/[^0-9.-]+/g, '')) || 0;
        return b + a - d;
    };

    const openAdd = () => {
        setFormData({ employee_id: '', month: '', basic_salary: 0, allowances: 0, deductions: 0, net_salary: 0 });
        setIsEditing(false);
        setShowModal(true);
    };

    const openEdit = (item) => {
        setFormData({ id: item.id, employee_id: item.employee_id || '', month: item.month || '', basic_salary: item.basic_salary || 0, allowances: item.allowances || 0, deductions: item.deductions || 0, net_salary: item.net_salary || 0 });
        setIsEditing(true);
        setShowModal(true);
    };

    const updateForm = (field, val) => {
        setFormData(prev => {
            const next = { ...prev, [field]: val };
            next.net_salary = calcNet(next);
            return next;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const payload = {
            employee_id: formData.employee_id,
            month: formData.month,
            basic_salary: parseFloat(String(formData.basic_salary || 0).replace(/[^0-9.-]+/g, '')) || 0,
            allowances: parseFloat(String(formData.allowances || 0).replace(/[^0-9.-]+/g, '')) || 0,
            deductions: parseFloat(String(formData.deductions || 0).replace(/[^0-9.-]+/g, '')) || 0,
            net_salary: parseFloat(String(formData.net_salary || 0).replace(/[^0-9.-]+/g, '')) || 0,
            user_id: user.id
        };
        if (isEditing) {
            await supabase.from('payroll').update(payload).eq('id', formData.id);
        } else {
            await supabase.from('payroll').insert([payload]);
        }
        setShowModal(false);
        fetchData();
    };

    const handleDelete = async () => {
        if (!itemToDelete) return;
        await supabase.from('payroll').delete().eq('id', itemToDelete.id);
        setDeleteDialogVisible(false);
        setItemToDelete(null);
        fetchData();
    };

    const filtered = items.filter(i =>
        (i.employees?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (i.month || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 w-full" dir="rtl">
            <div className="bg-[#0F172A] rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between p-5 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <button onClick={openAdd} className="flex items-center gap-2 bg-[#22C55E] hover:bg-green-600 text-white font-bold px-4 py-2.5 rounded-lg transition-colors">
                            <Plus size={18} /> صرف راتب
                        </button>
                        <div className="relative">
                            <input type="text" placeholder="بحث..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                className="bg-slate-800 border border-slate-700 text-white rounded-lg py-2.5 px-4 pl-10 w-60 outline-none focus:border-blue-500" />
                            <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                        </div>
                    </div>
                    <h2 className="text-xl font-bold text-white">مسيرات الرواتب</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-slate-800/50 text-slate-400 border-b border-slate-800">
                            <tr>
                                <th className="p-4">#</th><th className="p-4">الموظف</th><th className="p-4">الشهر</th>
                                <th className="p-4">الأساسي</th><th className="p-4">البدلات</th><th className="p-4">الخصومات</th>
                                <th className="p-4">الصافي</th><th className="p-4 text-center">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {loading ? <tr><td colSpan={8} className="p-8 text-center text-slate-500">جاري التحميل...</td></tr>
                            : filtered.length === 0 ? <tr><td colSpan={8} className="p-8 text-center text-slate-500">لا توجد مسيرات رواتب.</td></tr>
                            : filtered.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-800/40 transition-colors text-slate-300">
                                    <td className="p-4 text-slate-500">{item.id}</td>
                                    <td className="p-4 font-semibold text-white">{item.employees?.full_name || '-'}</td>
                                    <td className="p-4">{item.month || '-'}</td>
                                    <td className="p-4 text-emerald-400 font-mono">${Number(item.basic_salary || 0).toLocaleString()}</td>
                                    <td className="p-4 text-blue-400 font-mono">${Number(item.allowances || 0).toLocaleString()}</td>
                                    <td className="p-4 text-red-400 font-mono">${Number(item.deductions || 0).toLocaleString()}</td>
                                    <td className="p-4 text-emerald-400 font-mono font-bold">${Number(item.net_salary || 0).toLocaleString()}</td>
                                    <td className="p-4"><div className="flex gap-2 justify-center">
                                        <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"><Edit size={16} /></button>
                                        <button onClick={() => { setItemToDelete(item); setDeleteDialogVisible(true); }} className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"><Trash2 size={16} /></button>
                                    </div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#0F172A] border border-slate-700 rounded-xl w-full max-w-lg shadow-2xl">
                        <div className="flex items-center justify-between p-5 border-b border-slate-800">
                            <h3 className="text-lg font-bold text-white">{isEditing ? 'تعديل المسير' : 'إضافة مسير راتب'}</h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1.5">الموظف *</label>
                                <select required value={formData.employee_id} onChange={e => setFormData({ ...formData, employee_id: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-3 outline-none focus:border-blue-500 appearance-none">
                                    <option value="">اختر الموظف...</option>
                                    {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1.5">الشهر</label>
                                <input type="text" placeholder="مثال: مايو 2026" value={formData.month} onChange={e => setFormData({ ...formData, month: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-3 outline-none focus:border-blue-500" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1.5">الراتب الأساسي</label>
                                    <input type="text" value={formData.basic_salary} onChange={e => updateForm('basic_salary', e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-3 outline-none focus:border-blue-500" dir="ltr" />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1.5">البدلات</label>
                                    <input type="text" value={formData.allowances} onChange={e => updateForm('allowances', e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-3 outline-none focus:border-blue-500" dir="ltr" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1.5">الخصومات</label>
                                    <input type="text" value={formData.deductions} onChange={e => updateForm('deductions', e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-3 outline-none focus:border-blue-500" dir="ltr" />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1.5">الصافي (تلقائي)</label>
                                    <input type="text" value={formData.net_salary} readOnly
                                        className="w-full bg-slate-700 border border-slate-600 text-emerald-400 font-bold rounded-lg p-3 outline-none cursor-not-allowed" dir="ltr" />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="submit" className="flex-1 bg-[#22C55E] hover:bg-green-600 text-white font-bold py-3 rounded-lg">حفظ</button>
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-lg border border-slate-700">إلغاء</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {deleteDialogVisible && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#0F172A] border border-slate-700 rounded-xl w-full max-w-sm shadow-2xl p-6 text-center">
                        <div className="w-14 h-14 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-4"><Trash2 size={28} className="text-red-400" /></div>
                        <h3 className="text-lg font-bold text-white mb-2">تأكيد الحذف</h3>
                        <p className="text-slate-400 mb-6 text-sm">هل أنت متأكد من حذف هذا المسير؟</p>
                        <div className="flex gap-3">
                            <button onClick={handleDelete} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-lg">حذف</button>
                            <button onClick={() => setDeleteDialogVisible(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-lg border border-slate-700">إلغاء</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Payroll;
