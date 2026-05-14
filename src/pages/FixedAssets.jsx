import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';
import { Plus, Edit, Trash2, X, Search, ArrowUpDown } from 'lucide-react';

const FixedAssets = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const [formData, setFormData] = useState({
        asset_name: '', purchase_date: '', value: 0, depreciation_rate: 0, salvage_value: 0, useful_life_years: 0, depreciation_method: 'Straight Line'
    });

    const fetchData = async () => {
        setLoading(true);
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
            const { data, error } = await supabase
                .from('fixed_assets')
                .select('*')
                .eq('user_id', userData.user.id)
                .order('id', { ascending: false });
            if (!error) setItems(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const openAddModal = () => {
        setFormData({ asset_name: '', purchase_date: new Date().toISOString().split('T')[0], value: 0, depreciation_rate: 0, salvage_value: 0, useful_life_years: 0, depreciation_method: 'Straight Line' });
        setIsEditing(false);
        setShowModal(true);
    };

    const openEditModal = (item) => {
        setFormData({
            asset_name: item.asset_name,
            purchase_date: item.purchase_date || '',
            value: item.value || 0,
            depreciation_rate: item.depreciation_rate || item.depreciation || 0,
            salvage_value: item.salvage_value || 0,
            useful_life_years: item.useful_life_years || 0,
            depreciation_method: item.depreciation_method || 'Straight Line'
        });
        setIsEditing(true);
        setFormData(prev => ({...prev, id: item.id}));
        setShowModal(true);
    };

    const confirmDelete = (item) => {
        setItemToDelete(item);
        setDeleteDialogVisible(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.asset_name?.trim()) return;

        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) return;

        const payload = {
            asset_name: formData.asset_name,
            purchase_date: formData.purchase_date ? new Date(formData.purchase_date).toISOString().split('T')[0] : null,
            value: parseFloat(String(formData.value || 0).replace(/[^0-9.-]+/g, "")),
            depreciation_rate: parseFloat(String(formData.depreciation_rate || 0).replace(/[^0-9.-]+/g, "")),
            salvage_value: parseFloat(String(formData.salvage_value || 0).replace(/[^0-9.-]+/g, "")),
            useful_life_years: parseFloat(String(formData.useful_life_years || 0).replace(/[^0-9.-]+/g, "")),
            depreciation_method: formData.depreciation_method || 'Straight Line',
            user_id: userData.user.id
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

    const filteredItems = items.filter(a =>
        a.asset_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="w-full text-slate-200 p-6 page-fade-in" dir="rtl">
            <div className="bg-[#0F172A] rounded-xl border border-slate-800 overflow-hidden shadow-2xl w-full">
                
                {/* Header Layout */}
                <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-[#0B1120]/50">
                    <div className="flex items-center gap-4">
                        <div className="relative w-64">
                            <input
                                type="text"
                                placeholder="بحث..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-[#0F172A] border border-slate-700 rounded-lg py-2.5 px-4 pl-10 text-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                            />
                            <Search className="absolute left-3 top-3 text-slate-500" size={18} />
                        </div>

                        <button
                            onClick={openAddModal}
                            className="bg-[#22C55E] hover:bg-[#16a34a] text-white px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2 font-bold shadow-lg shadow-green-500/20"
                        >
                            <Plus size={20} /> إضافة أصل
                        </button>
                    </div>
                    <h2 className="text-xl font-bold text-white tracking-wide">الأصول الثابتة</h2>
                </div>

                <div className="w-full overflow-x-auto">
                    <table className="w-full text-right text-sm">
                        <thead className="bg-[#0F172A] text-slate-300 border-b border-slate-800">
                            <tr>
                                <th className="p-4 font-semibold whitespace-nowrap">الرقم</th>
                                <th className="p-4 font-semibold whitespace-nowrap">اسم الأصل</th>
                                <th className="p-4 font-semibold whitespace-nowrap">تاريخ الشراء</th>
                                <th className="p-4 font-semibold whitespace-nowrap">القيمة</th>
                                <th className="p-4 font-semibold whitespace-nowrap">الخردة</th>
                                <th className="p-4 font-semibold whitespace-nowrap">طريقة الإهلاك</th>
                                <th className="p-4 font-semibold whitespace-nowrap">العمر</th>
                                <th className="p-4 font-semibold text-center whitespace-nowrap">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {loading ? (
                                <tr><td colSpan="8" className="p-8 text-center text-slate-500">جاري التحميل...</td></tr>
                            ) : filteredItems.length === 0 ? (
                                <tr><td colSpan="8" className="p-8 text-center text-slate-500">لا يوجد أصول مسجلة.</td></tr>
                            ) : (
                                filteredItems.map((item, index) => (
                                    <tr key={item.id} className="hover:bg-[#1E293B]/50 transition-colors">
                                        <td className="p-4 text-slate-400 font-mono">{index + 1}</td>
                                        <td className="p-4 font-bold text-white">{item.asset_name}</td>
                                        <td className="p-4 text-slate-300">{item.purchase_date || '-'}</td>
                                        <td className="p-4 text-emerald-400 font-mono font-bold">${Number(item.value || 0).toLocaleString()}</td>
                                        <td className="p-4 text-slate-300">${Number(item.salvage_value || 0).toLocaleString()}</td>
                                        <td className="p-4 text-slate-300">{item.depreciation_method || '-'}</td>
                                        <td className="p-4 text-slate-300">{item.useful_life_years || 0} سنوات</td>
                                        <td className="p-4 flex justify-center gap-3">
                                            <button onClick={() => openEditModal(item)} className="text-blue-400 hover:text-blue-300 transition-colors"><Edit size={18} /></button>
                                            <button onClick={() => confirmDelete(item)} className="text-red-400 hover:text-red-300 transition-colors"><Trash2 size={18} /></button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Main Form Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-[#0F172A] border border-slate-700 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 my-8">
                        <div className="flex justify-between items-center p-5 border-b border-slate-800 bg-[#0B1120]">
                            <h2 className="text-xl font-bold text-white">{isEditing ? 'تعديل الأصل' : 'إضافة أصل جديد'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 p-1.5 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">اسم الأصل <span className="text-red-500">*</span></label>
                                <input type="text" name="asset_name" value={formData.asset_name} onChange={handleInputChange} required className="w-full bg-[#0B1120] border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">تاريخ الشراء</label>
                                    <input type="date" name="purchase_date" value={formData.purchase_date} onChange={handleInputChange} className="w-full bg-[#0B1120] border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">طريقة الإهلاك</label>
                                    <input type="text" name="depreciation_method" value={formData.depreciation_method} onChange={handleInputChange} className="w-full bg-[#0B1120] border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">القيمة</label>
                                    <input type="text" name="value" value={formData.value} onChange={handleInputChange} className="w-full bg-[#0B1120] border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none dir-ltr text-left" />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">قيمة الخردة</label>
                                    <input type="text" name="salvage_value" value={formData.salvage_value} onChange={handleInputChange} className="w-full bg-[#0B1120] border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none dir-ltr text-left" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">العمر (سنوات)</label>
                                    <input type="text" name="useful_life_years" value={formData.useful_life_years} onChange={handleInputChange} className="w-full bg-[#0B1120] border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none dir-ltr text-left" />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">الإهلاك الحالي</label>
                                    <input type="text" name="depreciation_rate" value={formData.depreciation_rate} onChange={handleInputChange} className="w-full bg-[#0B1120] border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none dir-ltr text-left" />
                                </div>
                            </div>
                            <div className="pt-4 flex gap-3 border-t border-slate-800 mt-6">
                                <button type="submit" className="flex-1 bg-[#22C55E] hover:bg-[#16a34a] text-white font-bold py-3 rounded-lg transition-colors">
                                    حفظ
                                </button>
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-lg transition-colors border border-slate-700">
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteDialogVisible && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-[#0F172A] border border-slate-700 rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                                <Trash2 size={32} className="text-red-500" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">تأكيد الحذف</h3>
                            <p className="text-slate-400 mb-6">هل أنت متأكد من حذف هذا الأصل؟ لا يمكن التراجع عن هذه العملية.</p>
                            <div className="flex gap-3">
                                <button onClick={handleDelete} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-lg transition-colors">
                                    نعم، احذف
                                </button>
                                <button onClick={() => setDeleteDialogVisible(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-lg transition-colors border border-slate-700">
                                    إلغاء
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FixedAssets;
