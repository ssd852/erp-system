import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';
import { Plus, Edit, Trash2, X, Search } from 'lucide-react';

const Customers = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', address: '', city: '', balance: 0 });

    const fetchData = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }
        const { data } = await supabase.from('customers').select('*').eq('user_id', user.id).order('id', { ascending: false });
        setItems(data || []);
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    const openAdd = () => {
        setFormData({ name: '', email: '', phone: '', address: '', city: '', balance: 0 });
        setIsEditing(false);
        setShowModal(true);
    };

    const openEdit = (item) => {
        setFormData({ id: item.id, name: item.name || '', email: item.email || '', phone: item.phone || '', address: item.address || '', city: item.city || '', balance: item.balance || 0 });
        setIsEditing(true);
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const payload = {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            balance: parseFloat(String(formData.balance || 0).replace(/[^0-9.-]+/g, '')) || 0,
            user_id: user.id
        };
        if (isEditing) {
            await supabase.from('customers').update(payload).eq('id', formData.id);
        } else {
            await supabase.from('customers').insert([payload]);
        }
        setShowModal(false);
        fetchData();
    };

    const handleDelete = async () => {
        if (!itemToDelete) return;
        await supabase.from('customers').delete().eq('id', itemToDelete.id);
        setDeleteDialogVisible(false);
        setItemToDelete(null);
        fetchData();
    };

    const filtered = items.filter(i =>
        (i.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (i.phone || '').includes(searchTerm)
    );

    return (
        <div className="p-6 w-full" dir="rtl">
            <div className="bg-[#0F172A] rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <button onClick={openAdd} className="flex items-center gap-2 bg-[#22C55E] hover:bg-green-600 text-white font-bold px-4 py-2.5 rounded-lg transition-colors shadow-lg shadow-green-900/30">
                            <Plus size={18} /> إضافة عميل
                        </button>
                        <div className="relative">
                            <input type="text" placeholder="بحث..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                className="bg-slate-800 border border-slate-700 text-white rounded-lg py-2.5 px-4 pl-10 w-60 outline-none focus:border-blue-500 transition-colors" />
                            <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                        </div>
                    </div>
                    <h2 className="text-xl font-bold text-white">إدارة العملاء</h2>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-slate-800/50 text-slate-400 border-b border-slate-800">
                            <tr>
                                <th className="p-4">#</th>
                                <th className="p-4">الاسم</th>
                                <th className="p-4">الهاتف</th>
                                <th className="p-4">البريد</th>
                                <th className="p-4">المدينة</th>
                                <th className="p-4">الرصيد</th>
                                <th className="p-4 text-center">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {loading ? (
                                <tr><td colSpan={7} className="p-8 text-center text-slate-500">جاري التحميل...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={7} className="p-8 text-center text-slate-500">لا توجد بيانات.</td></tr>
                            ) : filtered.map((item, idx) => (
                                <tr key={item.id} className="hover:bg-slate-800/40 transition-colors text-slate-300">
                                    <td className="p-4 text-slate-500">{idx + 1}</td>
                                    <td className="p-4 font-semibold text-white">{item.name}</td>
                                    <td className="p-4" dir="ltr">{item.phone || '-'}</td>
                                    <td className="p-4">{item.email || '-'}</td>
                                    <td className="p-4">{item.city || '-'}</td>
                                    <td className="p-4 text-emerald-400 font-mono">${Number(item.balance || 0).toLocaleString()}</td>
                                    <td className="p-4">
                                        <div className="flex gap-2 justify-center">
                                            <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"><Edit size={16} /></button>
                                            <button onClick={() => { setItemToDelete(item); setDeleteDialogVisible(true); }} className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#0F172A] border border-slate-700 rounded-xl w-full max-w-lg shadow-2xl">
                        <div className="flex items-center justify-between p-5 border-b border-slate-800">
                            <h3 className="text-lg font-bold text-white">{isEditing ? 'تعديل العميل' : 'إضافة عميل جديد'}</h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1.5">الاسم *</label>
                                <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-3 outline-none focus:border-blue-500 transition-colors" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1.5">الهاتف</label>
                                    <input type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-3 outline-none focus:border-blue-500 transition-colors" />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1.5">البريد الإلكتروني</label>
                                    <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-3 outline-none focus:border-blue-500 transition-colors" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1.5">المدينة</label>
                                    <input type="text" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-3 outline-none focus:border-blue-500 transition-colors" />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1.5">الرصيد</label>
                                    <input type="text" value={formData.balance} onChange={e => setFormData({ ...formData, balance: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-3 outline-none focus:border-blue-500 transition-colors" dir="ltr" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1.5">العنوان</label>
                                <input type="text" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-3 outline-none focus:border-blue-500 transition-colors" />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="submit" className="flex-1 bg-[#22C55E] hover:bg-green-600 text-white font-bold py-3 rounded-lg transition-colors">حفظ</button>
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-lg border border-slate-700 transition-colors">إلغاء</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {deleteDialogVisible && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#0F172A] border border-slate-700 rounded-xl w-full max-w-sm shadow-2xl p-6 text-center">
                        <div className="w-14 h-14 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-4"><Trash2 size={28} className="text-red-400" /></div>
                        <h3 className="text-lg font-bold text-white mb-2">تأكيد الحذف</h3>
                        <p className="text-slate-400 mb-6 text-sm">هل أنت متأكد من حذف هذا العميل؟ لا يمكن التراجع.</p>
                        <div className="flex gap-3">
                            <button onClick={handleDelete} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-lg transition-colors">حذف</button>
                            <button onClick={() => setDeleteDialogVisible(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-lg border border-slate-700 transition-colors">إلغاء</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Customers;