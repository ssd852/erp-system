import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../config/supabaseClient';
import { useToast } from '../context/ToastContext';
import { Plus, Edit2, Trash2, Search, X } from 'lucide-react';

const ChartOfAccounts = () => {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [currentAccount, setCurrentAccount] = useState({ id: null, account_name: '', account_type: '', balance: 0 });
    const [isEdit, setIsEdit] = useState(false);
    const { showToast } = useToast();

    const fetchAccounts = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            showToast('error', 'خطأ', 'الرجاء تسجيل الدخول أولاً');
            setLoading(false);
            return;
        }

        const { data, error } = await supabase
            .from('chart_of_accounts')
            .select('*')
            .eq('user_id', user.id)
            .order('id', { ascending: true });

        if (error) {
            console.error('Error fetching accounts:', error);
            showToast('error', 'خطأ', 'فشل جلب دليل الحسابات');
        } else {
            setAccounts(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchAccounts();
    }, []);

    const filteredAccounts = accounts.filter(acc => 
        (acc.account_name && acc.account_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (acc.account_type && acc.account_type.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const openNew = () => {
        setCurrentAccount({ id: null, account_name: '', account_type: '', balance: 0 });
        setIsEdit(false);
        setIsModalOpen(true);
    };

    const editAccount = (account) => {
        setCurrentAccount({ ...account });
        setIsEdit(true);
        setIsModalOpen(true);
    };

    const confirmDelete = (account) => {
        setCurrentAccount(account);
        setIsDeleteModalOpen(true);
    };

    const saveAccount = async (e) => {
        e.preventDefault();
        if (!currentAccount.account_name?.trim()) {
            showToast('warn', 'تحذير', 'اسم الحساب مطلوب');
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const payload = {
                account_name: currentAccount.account_name,
                account_type: currentAccount.account_type,
                balance: parseFloat(currentAccount.balance || 0),
                user_id: user.id
            };

            if (isEdit) {
                const { error } = await supabase.from('chart_of_accounts').update(payload).eq('id', currentAccount.id);
                if (error) throw error;
                showToast('success', 'نجاح', 'تم تحديث الحساب');
            } else {
                const { error } = await supabase.from('chart_of_accounts').insert([payload]);
                if (error) throw error;
                showToast('success', 'نجاح', 'تم إضافة حساب جديد');
            }
            
            setIsModalOpen(false);
            fetchAccounts();
        } catch (error) {
            console.error('Save error:', error);
            showToast('error', 'خطأ', 'فشل في حفظ البيانات');
        }
    };

    const deleteAccount = async () => {
        try {
            const { error } = await supabase.from('chart_of_accounts').delete().eq('id', currentAccount.id);
            if (error) throw error;
            showToast('success', 'نجاح', 'تم حذف الحساب بنجاح');
            setIsDeleteModalOpen(false);
            fetchAccounts();
        } catch (error) {
            console.error('Delete error:', error);
            showToast('error', 'خطأ', 'فشل عملية الحذف');
        }
    };

    const modalContent = isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4" dir="rtl">
            <div className="bg-slate-800 p-6 rounded-xl w-full max-w-2xl border border-slate-700 shadow-2xl">
                <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
                    <h2 className="text-xl font-bold text-white">{isEdit ? 'تعديل الحساب' : 'إضافة حساب جديد'}</h2>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <form onSubmit={saveAccount} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-300">اسم الحساب</label>
                            <input 
                                type="text" 
                                required
                                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                                value={currentAccount.account_name}
                                onChange={e => setCurrentAccount({...currentAccount, account_name: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-300">النوع</label>
                            <input 
                                type="text" 
                                placeholder="أصول، خصوم، إيرادات، الخ"
                                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                                value={currentAccount.account_type}
                                onChange={e => setCurrentAccount({...currentAccount, account_type: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-300">الرصيد</label>
                            <input 
                                type="number" 
                                step="0.01"
                                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                                value={currentAccount.balance}
                                onChange={e => setCurrentAccount({...currentAccount, balance: e.target.value})}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-700 mt-6">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-300 hover:bg-slate-700 rounded-lg transition-colors">إلغاء</button>
                        <button type="submit" className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors font-medium">حفظ</button>
                    </div>
                </form>
            </div>
        </div>
    );

    const deleteModalContent = isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4" dir="rtl">
            <div className="bg-slate-800 p-6 rounded-xl w-full max-w-sm border border-slate-700 shadow-2xl">
                <div className="text-center space-y-4 mb-6">
                    <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Trash2 className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-white">تأكيد الحذف</h3>
                    <p className="text-slate-300">هل أنت متأكد من حذف الحساب <b>{currentAccount.account_name}</b>؟</p>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                    <button onClick={() => setIsDeleteModalOpen(false)} className="px-5 py-2.5 text-slate-300 hover:bg-slate-700 rounded-lg transition-colors">إلغاء</button>
                    <button onClick={deleteAccount} className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors font-medium">حذف</button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="p-6 space-y-6 w-full min-h-screen text-slate-200" dir="rtl">
            {/* Top Header */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <h1 className="text-2xl font-bold text-white">دليل الحسابات</h1>
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <input 
                            type="text" 
                            placeholder="ابحث..." 
                            className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Search className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                    </div>
                    <button 
                        onClick={openNew}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap font-medium"
                    >
                        <Plus className="w-5 h-5" />
                        إضافة حساب
                    </button>
                </div>
            </div>

            {/* Data Table */}
            <div className="w-full overflow-x-auto bg-slate-800 rounded-xl border border-slate-700 shadow-xl">
                <table className="w-full text-right whitespace-nowrap">
                    <thead className="bg-slate-900 text-slate-300 border-b border-slate-700">
                        <tr>
                            <th className="p-4 font-semibold">رقم الحساب</th>
                            <th className="p-4 font-semibold">اسم الحساب</th>
                            <th className="p-4 font-semibold">النوع</th>
                            <th className="p-4 font-semibold">الرصيد</th>
                            <th className="p-4 font-semibold text-center">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                        {loading ? (
                            <tr>
                                <td colSpan="5" className="p-8 text-center text-slate-400">
                                    جاري التحميل...
                                </td>
                            </tr>
                        ) : filteredAccounts.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="p-8 text-center text-slate-400">
                                    لا توجد بيانات متاحة.
                                </td>
                            </tr>
                        ) : (
                            filteredAccounts.map(account => (
                                <tr key={account.id} className="hover:bg-slate-700/30 transition-colors">
                                    <td className="p-4 text-slate-400">{account.id}</td>
                                    <td className="p-4 font-medium text-white">{account.account_name}</td>
                                    <td className="p-4">{account.account_type}</td>
                                    <td className="p-4">${Number(account.balance).toLocaleString()}</td>
                                    <td className="p-4">
                                        <div className="flex items-center justify-center gap-2">
                                            <button onClick={() => editAccount(account)} className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-full transition-colors" title="تعديل">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => confirmDelete(account)} className="p-2 text-rose-400 hover:bg-rose-400/10 rounded-full transition-colors" title="حذف">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && createPortal(modalContent, document.body)}
            {isDeleteModalOpen && createPortal(deleteModalContent, document.body)}
        </div>
    );
};

export default ChartOfAccounts;
