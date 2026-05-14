import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';
import { useToast } from '../context/ToastContext';
import { Plus, Edit2, Trash2, Search, X } from 'lucide-react';

const Customers = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [currentCustomer, setCurrentCustomer] = useState({ id: null, name: '', email: '', phone: '' });
    const [isEdit, setIsEdit] = useState(false);
    const { showToast } = useToast();

    const fetchCustomers = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            showToast('error', 'خطأ', 'الرجاء تسجيل الدخول أولاً');
            setLoading(false);
            return;
        }

        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .eq('user_id', user.id)
            .order('id', { ascending: true });

        if (error) {
            console.error('Error fetching customers:', error);
            showToast('error', 'خطأ', 'فشل جلب بيانات العملاء');
        } else {
            setCustomers(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const filteredCustomers = customers.filter(cust => 
        (cust.name && cust.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (cust.email && cust.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (cust.phone && cust.phone.includes(searchQuery))
    );

    const openNew = () => {
        setCurrentCustomer({ id: null, name: '', email: '', phone: '' });
        setIsEdit(false);
        setIsModalOpen(true);
    };

    const editCustomer = (customer) => {
        setCurrentCustomer({ ...customer });
        setIsEdit(true);
        setIsModalOpen(true);
    };

    const confirmDelete = (customer) => {
        setCurrentCustomer(customer);
        setIsDeleteModalOpen(true);
    };

    const saveCustomer = async (e) => {
        e.preventDefault();
        if (!currentCustomer.name?.trim()) {
            showToast('warn', 'تحذير', 'اسم العميل مطلوب');
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const payload = {
                name: currentCustomer.name,
                email: currentCustomer.email,
                phone: currentCustomer.phone,
                user_id: user.id
            };

            if (isEdit) {
                const { error } = await supabase.from('customers').update(payload).eq('id', currentCustomer.id);
                if (error) throw error;
                showToast('success', 'نجاح', 'تم تحديث بيانات العميل');
            } else {
                const { error } = await supabase.from('customers').insert([payload]);
                if (error) throw error;
                showToast('success', 'نجاح', 'تم إضافة عميل جديد');
            }
            
            setIsModalOpen(false);
            fetchCustomers();
        } catch (error) {
            console.error('Save error:', error);
            showToast('error', 'خطأ', 'فشل في حفظ البيانات');
        }
    };

    const deleteCustomer = async () => {
        try {
            const { error } = await supabase.from('customers').delete().eq('id', currentCustomer.id);
            if (error) throw error;
            showToast('success', 'نجاح', 'تم حذف العميل بنجاح');
            setIsDeleteModalOpen(false);
            fetchCustomers();
        } catch (error) {
            console.error('Delete error:', error);
            showToast('error', 'خطأ', 'فشل عملية الحذف');
        }
    };

    return (
        <div className="p-6 space-y-6 w-full text-slate-200" dir="rtl">
            <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
                <div className="p-6 border-b border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h2 className="text-2xl font-bold text-white">العملاء</h2>
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="relative w-full sm:w-64">
                            <input 
                                type="text" 
                                placeholder="ابحث..." 
                                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <Search className="absolute left-3 top-2.5 text-slate-400 w-5 h-5" />
                        </div>
                        <button 
                            onClick={openNew}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap"
                        >
                            <Plus className="w-5 h-5" />
                            إضافة عميل
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead className="bg-slate-900/50 text-slate-400">
                            <tr>
                                <th className="p-4 font-semibold">الرقم</th>
                                <th className="p-4 font-semibold">الاسم</th>
                                <th className="p-4 font-semibold">الهاتف</th>
                                <th className="p-4 font-semibold">البريد الإلكتروني</th>
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
                            ) : filteredCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-slate-400">
                                        لا توجد بيانات متاحة.
                                    </td>
                                </tr>
                            ) : (
                                filteredCustomers.map(customer => (
                                    <tr key={customer.id} className="hover:bg-slate-700/20 transition-colors">
                                        <td className="p-4">{customer.id}</td>
                                        <td className="p-4 font-medium text-white">{customer.name}</td>
                                        <td className="p-4">{customer.phone}</td>
                                        <td className="p-4">{customer.email}</td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => editCustomer(customer)} className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-full transition-colors">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => confirmDelete(customer)} className="p-2 text-rose-400 hover:bg-rose-400/10 rounded-full transition-colors">
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
            </div>

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-6 border-b border-slate-700">
                            <h3 className="text-xl font-bold text-white">{isEdit ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={saveCustomer} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">الاسم</label>
                                <input 
                                    type="text" 
                                    required
                                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                                    value={currentCustomer.name}
                                    onChange={e => setCurrentCustomer({...currentCustomer, name: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">الهاتف</label>
                                <input 
                                    type="text" 
                                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                                    value={currentCustomer.phone}
                                    onChange={e => setCurrentCustomer({...currentCustomer, phone: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">البريد الإلكتروني</label>
                                <input 
                                    type="email" 
                                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                                    value={currentCustomer.email}
                                    onChange={e => setCurrentCustomer({...currentCustomer, email: e.target.value})}
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-700 mt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-300 hover:bg-slate-700 rounded-lg transition-colors">إلغاء</button>
                                <button type="submit" className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shadow-lg shadow-emerald-900/20 font-medium">حفظ</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 text-center space-y-4">
                            <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-white">تأكيد الحذف</h3>
                            <p className="text-slate-300">هل أنت متأكد من حذف العميل <b>{currentCustomer.name}</b>؟ لا يمكن التراجع عن هذا الإجراء.</p>
                        </div>
                        <div className="flex justify-end gap-3 p-6 bg-slate-900/50 border-t border-slate-700">
                            <button onClick={() => setIsDeleteModalOpen(false)} className="px-5 py-2.5 text-slate-300 hover:bg-slate-700 rounded-lg transition-colors">إلغاء</button>
                            <button onClick={deleteCustomer} className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors shadow-lg shadow-rose-900/20 font-medium">حذف</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Customers;
