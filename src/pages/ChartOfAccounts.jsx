import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';
import { BookOpen, Plus, Edit, Trash2, X, RefreshCw } from 'lucide-react';

const ChartOfAccounts = () => {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);

    const [formData, setFormData] = useState({
        account_name: '', account_type: '', balance: 0
    });

    const fetchAccounts = async () => {
        setLoading(true);
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
            const { data, error } = await supabase
                .from('chart_of_accounts')
                .select('*')
                .eq('user_id', userData.user.id)
                .order('id', { ascending: false });
            if (!error) setAccounts(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchAccounts();
    }, []);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const openAddModal = () => {
        setFormData({ account_name: '', account_type: '', balance: 0 });
        setIsEditing(false);
        setShowModal(true);
    };

    const openEditModal = (account) => {
        setFormData({
            account_name: account.account_name, 
            account_type: account.account_type || '', 
            balance: account.balance || 0
        });
        setEditId(account.id);
        setIsEditing(true);
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) return;

        if (isEditing) {
            await supabase.from('chart_of_accounts').update(formData).eq('id', editId);
        } else {
            await supabase.from('chart_of_accounts').insert([{ ...formData, user_id: userData.user.id }]);
        }
        setShowModal(false);
        fetchAccounts();
    };

    const handleDelete = async (id) => {
        if (window.confirm('هل أنت متأكد من حذف هذا الحساب؟')) {
            await supabase.from('chart_of_accounts').delete().eq('id', id);
            fetchAccounts();
        }
    };

    return (
        <div className="min-h-screen bg-[#0B1120] text-slate-200 p-8" dir="rtl">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* الترويسة */}
                <div className="flex justify-between items-center bg-[#0F172A] p-6 rounded-2xl shadow-lg border border-slate-800">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center">
                            <BookOpen size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">دليل الحسابات</h1>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={fetchAccounts} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors">
                            <RefreshCw size={20} className={loading ? "animate-spin text-blue-400" : "text-slate-300"} />
                        </button>
                        <button onClick={openAddModal} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center gap-2">
                            <Plus size={20} /> إضافة حساب
                        </button>
                    </div>
                </div>

                {/* الجدول */}
                <div className="bg-[#0F172A] rounded-2xl shadow-lg border border-slate-800 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-sm">
                            <thead className="bg-slate-900/50 text-slate-400 border-b border-slate-800">
                                <tr>
                                    <th className="p-4 font-semibold">اسم الحساب</th>
                                    <th className="p-4 font-semibold">النوع</th>
                                    <th className="p-4 font-semibold">الرصيد</th>
                                    <th className="p-4 font-semibold text-center">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {loading ? (
                                    <tr><td colSpan="4" className="p-8 text-center text-slate-500">جاري تحميل البيانات...</td></tr>
                                ) : accounts.length === 0 ? (
                                    <tr><td colSpan="4" className="p-8 text-center text-slate-500">لا توجد حسابات مسجلة حالياً.</td></tr>
                                ) : (
                                    accounts.map((acc) => (
                                        <tr key={acc.id} className="hover:bg-slate-800/50 transition-colors">
                                            <td className="p-4 font-bold text-white">{acc.account_name}</td>
                                            <td className="p-4 text-slate-300">{acc.account_type || '-'}</td>
                                            <td className="p-4 text-emerald-400 font-mono font-bold">${Number(acc.balance).toLocaleString()}</td>
                                            <td className="p-4 flex justify-center gap-2">
                                                <button onClick={() => openEditModal(acc)} className="p-2 bg-slate-800 hover:bg-blue-500/20 hover:text-blue-400 border border-slate-700 rounded-lg transition-colors"><Edit size={16} /></button>
                                                <button onClick={() => handleDelete(acc.id)} className="p-2 bg-slate-800 hover:bg-red-500/20 hover:text-red-400 border border-slate-700 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* النافذة المنبثقة (Modal) للإضافة والتعديل */}
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                        <div className="bg-[#0F172A] border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                            <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-slate-900/30">
                                <h2 className="text-xl font-bold text-white">{isEditing ? 'تعديل الحساب' : 'إضافة حساب جديد'}</h2>
                                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white p-2 bg-slate-800 rounded-lg transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-sm text-slate-400 mb-1">اسم الحساب <span className="text-red-500">*</span></label>
                                        <input type="text" name="account_name" value={formData.account_name} onChange={handleInputChange} required className="w-full bg-[#0B1120] border border-slate-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none" />
                                    </div>
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className="block text-sm text-slate-400 mb-1">النوع (أصول، خصوم...)</label>
                                        <input type="text" name="account_type" value={formData.account_type} onChange={handleInputChange} className="w-full bg-[#0B1120] border border-slate-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none" />
                                    </div>
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className="block text-sm text-slate-400 mb-1">الرصيد</label>
                                        <input type="number" step="0.01" name="balance" value={formData.balance} onChange={handleInputChange} className="w-full bg-[#0B1120] border border-slate-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none font-mono" />
                                    </div>
                                </div>
                                <div className="pt-4 flex gap-3">
                                    <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors">
                                        {isEditing ? 'حفظ التعديلات' : 'إضافة الحساب'}
                                    </button>
                                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-colors border border-slate-700">
                                        إلغاء
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default ChartOfAccounts;
