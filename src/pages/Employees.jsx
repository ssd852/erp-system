import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';
import { Plus, Edit, Trash2, X, Search } from 'lucide-react';

const Employees = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState({ full_name: '', position: '', salary: '', hire_date: '' });

    const fetchData = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }
        const { data } = await supabase.from('employees').select('*').eq('user_id', user.id).order('id', { ascending: false });
        setItems(data || []);
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    const openAdd = () => { setForm({ full_name: '', position: '', salary: '', hire_date: new Date().toISOString().split('T')[0] }); setIsEditing(false); setShowModal(true); };
    const openEdit = (item) => { setForm({ id: item.id, full_name: item.full_name || '', position: item.position || '', salary: item.salary || '', hire_date: item.hire_date || '' }); setIsEditing(true); setShowModal(true); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const payload = { full_name: form.full_name, position: form.position, salary: parseFloat(String(form.salary || 0).replace(/[^0-9.-]+/g, '')) || 0, hire_date: form.hire_date || null, user_id: user.id };
        if (isEditing) { await supabase.from('employees').update(payload).eq('id', form.id); }
        else { await supabase.from('employees').insert([payload]); }
        setShowModal(false); fetchData();
    };

    const handleDelete = async () => {
        if (!itemToDelete) return;
        await supabase.from('employees').delete().eq('id', itemToDelete.id);
        setDeleteModal(false); setItemToDelete(null); fetchData();
    };

    const filtered = items.filter(i => (i.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (i.position || '').toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="p-6 w-full min-h-screen bg-[#0B1120]" dir="rtl">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">إدارة الموظفين</h2>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <input type="text" placeholder="بحث..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-slate-800 border border-slate-700 text-white rounded-lg py-2.5 px-4 pl-10 w-64 outline-none focus:border-blue-500 transition-colors" />
                        <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                    </div>
                    <button onClick={openAdd} className="bg-[#22C55E] hover:bg-[#16a34a] text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-bold transition-colors">
                        <Plus size={18} /> إضافة موظف
                    </button>
                </div>
            </div>

            <div className="bg-[#0F172A] rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-slate-800/60 text-slate-400 border-b border-slate-800">
                            <tr>
                                <th className="p-4 font-semibold">#</th>
                                <th className="p-4 font-semibold">الاسم الكامل</th>
                                <th className="p-4 font-semibold">المنصب</th>
                                <th className="p-4 font-semibold">تاريخ التعيين</th>
                                <th className="p-4 font-semibold">الراتب</th>
                                <th className="p-4 font-semibold text-center">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/70">
                            {loading ? (
                                <tr><td colSpan={6} className="p-10 text-center text-slate-500">جاري التحميل...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={6} className="p-10 text-center text-slate-500">لا توجد بيانات.</td></tr>
                            ) : filtered.map((item, idx) => (
                                <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="p-4 text-slate-500">{idx + 1}</td>
                                    <td className="p-4 font-semibold text-white">{item.full_name}</td>
                                    <td className="p-4 text-slate-300">{item.position || '-'}</td>
                                    <td className="p-4 text-slate-300">{item.hire_date || '-'}</td>
                                    <td className="p-4 text-emerald-400 font-mono font-bold">${Number(item.salary || 0).toLocaleString()}</td>
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
                            <h3 className="text-lg font-bold text-white">{isEditing ? 'تعديل الموظف' : 'إضافة موظف جديد'}</h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1.5">الاسم الكامل *</label>
                                <input required type="text" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-3 outline-none focus:border-blue-500 transition-colors" />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1.5">المنصب</label>
                                <input type="text" value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-3 outline-none focus:border-blue-500 transition-colors" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1.5">الراتب</label>
                                    <input type="text" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-3 outline-none focus:border-blue-500 transition-colors" dir="ltr" />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1.5">تاريخ التعيين</label>
                                    <input type="date" value={form.hire_date} onChange={e => setForm({ ...form, hire_date: e.target.value })} className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-3 outline-none focus:border-blue-500 transition-colors" />
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
                        <p className="text-slate-400 mb-6 text-sm">هل أنت متأكد من حذف <span className="text-white font-semibold">{itemToDelete?.full_name}</span>؟</p>
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

export default Employees;
