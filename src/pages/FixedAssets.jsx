import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';
import { Plus, Edit, Trash2, X, Search } from 'lucide-react';

const FixedAssets = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ asset_name: '', purchase_date: '', value: 0, salvage_value: 0, useful_life_years: 0, depreciation_method: 'Straight Line', depreciation_rate: 0 });

    const fetchData = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }
        const { data } = await supabase.from('fixed_assets').select('*').eq('user_id', user.id).order('id', { ascending: false });
        setItems(data || []);
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    const openAdd = () => {
        setFormData({ asset_name: '', purchase_date: new Date().toISOString().split('T')[0], value: 0, salvage_value: 0, useful_life_years: 0, depreciation_method: 'Straight Line', depreciation_rate: 0 });
        setIsEditing(false);
        setShowModal(true);
    };

    const openEdit = (item) => {
        setFormData({ id: item.id, asset_name: item.asset_name || '', purchase_date: item.purchase_date || '', value: item.value || 0, salvage_value: item.salvage_value || 0, useful_life_years: item.useful_life_years || 0, depreciation_method: item.depreciation_method || 'Straight Line', depreciation_rate: item.depreciation_rate || 0 });
        setIsEditing(true);
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const n = (v) => parseFloat(String(v || 0).replace(/[^0-9.-]+/g, '')) || 0;
        const payload = {
            asset_name: formData.asset_name,
            purchase_date: formData.purchase_date || null,
            value: n(formData.value),
            salvage_value: n(formData.salvage_value),
            useful_life_years: n(formData.useful_life_years),
            depreciation_method: formData.depreciation_method,
            depreciation_rate: n(formData.depreciation_rate),
            user_id: user.id
        };
        if (isEditing) {
            await supabase.from('fixed_assets').update(payload).eq('id', formData.id);
        } else {
            await supabase.from('fixed_assets').insert([payload]);
        }
        setShowModal(false);
        fetchData();
    };

    const handleDelete = async () => {
        if (!itemToDelete) return;
        await supabase.from('fixed_assets').delete().eq('id', itemToDelete.id);
        setDeleteDialogVisible(false);
        setItemToDelete(null);
        fetchData();
    };

    const filtered = items.filter(i =>
        (i.asset_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 w-full" dir="rtl">
            <div className="bg-[#0F172A] rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between p-5 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <button onClick={openAdd} className="flex items-center gap-2 bg-[#22C55E] hover:bg-green-600 text-white font-bold px-4 py-2.5 rounded-lg transition-colors">
                            <Plus size={18} /> إضافة أصل
                        </button>
                        <div className="relative">
                            <input type="text" placeholder="بحث..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                className="bg-slate-800 border border-slate-700 text-white rounded-lg py-2.5 px-4 pl-10 w-60 outline-none focus:border-blue-500" />
                            <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                        </div>
                    </div>
                    <h2 className="text-xl font-bold text-white">الأصول الثابتة</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-slate-800/50 text-slate-400 border-b border-slate-800">
                            <tr>
                                <th className="p-4">#</th><th className="p-4">اسم الأصل</th><th className="p-4">تاريخ الشراء</th>
                                <th className="p-4">القيمة</th><th className="p-4">قيمة الخردة</th>
                                <th className="p-4">طريقة الإهلاك</th><th className="p-4">العمر</th><th className="p-4 text-center">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {loading ? <tr><td colSpan={8} className="p-8 text-center text-slate-500">جاري التحميل...</td></tr>
                            : filtered.length === 0 ? <tr><td colSpan={8} className="p-8 text-center text-slate-500">لا توجد أصول.</td></tr>
                            : filtered.map((item, idx) => (
                                <tr key={item.id} className="hover:bg-slate-800/40 transition-colors text-slate-300">
                                    <td className="p-4 text-slate-500">{idx + 1}</td>
                                    <td className="p-4 font-semibold text-white">{item.asset_name}</td>
                                    <td className="p-4">{item.purchase_date || '-'}</td>
                                    <td className="p-4 text-emerald-400 font-mono">${Number(item.value || 0).toLocaleString()}</td>
                                    <td className="p-4 text-slate-400 font-mono">${Number(item.salvage_value || 0).toLocaleString()}</td>
                                    <td className="p-4">{item.depreciation_method || '-'}</td>
                                    <td className="p-4">{item.useful_life_years || 0} سنوات</td>
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
                    <div className="bg-[#0F172A] border border-slate-700 rounded-xl w-full max-w-lg shadow-2xl max-h-screen overflow-y-auto">
                        <div className="flex items-center justify-between p-5 border-b border-slate-800">
                            <h3 className="text-lg font-bold text-white">{isEditing ? 'تعديل الأصل' : 'إضافة أصل جديد'}</h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1.5">اسم الأصل *</label>
                                <input required type="text" value={formData.asset_name} onChange={e => setFormData({ ...formData, asset_name: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-3 outline-none focus:border-blue-500" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1.5">تاريخ الشراء</label>
                                    <input type="date" value={formData.purchase_date} onChange={e => setFormData({ ...formData, purchase_date: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-3 outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1.5">طريقة الإهلاك</label>
                                    <input type="text" value={formData.depreciation_method} onChange={e => setFormData({ ...formData, depreciation_method: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-3 outline-none focus:border-blue-500" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1.5">القيمة</label>
                                    <input type="text" value={formData.value} onChange={e => setFormData({ ...formData, value: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-3 outline-none focus:border-blue-500" dir="ltr" />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1.5">قيمة الخردة</label>
                                    <input type="text" value={formData.salvage_value} onChange={e => setFormData({ ...formData, salvage_value: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-3 outline-none focus:border-blue-500" dir="ltr" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1.5">العمر (سنوات)</label>
                                    <input type="text" value={formData.useful_life_years} onChange={e => setFormData({ ...formData, useful_life_years: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-3 outline-none focus:border-blue-500" dir="ltr" />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1.5">الإهلاك الحالي</label>
                                    <input type="text" value={formData.depreciation_rate} onChange={e => setFormData({ ...formData, depreciation_rate: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-3 outline-none focus:border-blue-500" dir="ltr" />
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
                        <p className="text-slate-400 mb-6 text-sm">هل أنت متأكد من حذف هذا الأصل؟</p>
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

export default FixedAssets;
