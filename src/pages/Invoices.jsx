import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';
import { Plus, Edit, Trash2, X, Search, ArrowUpDown } from 'lucide-react';

const Invoices = () => {
    const [items, setItems] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const [formData, setFormData] = useState({
        customer_id: '', date: '', total_amount: 0, status: 'Pending', tax_rate: 0, due_date: '', amount_paid: 0
    });

    const fetchData = async () => {
        setLoading(true);
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) return;

        const { data, error } = await supabase
            .from('invoices')
            .select('*, customers(name)')
            .eq('user_id', userData.user.id)
            .order('id', { ascending: false });

        if (!error) setItems(data || []);

        const { data: custData } = await supabase.from('customers').select('id, name');
        if (custData) setCustomers(custData);

        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const openAddModal = () => {
        setFormData({ customer_id: '', date: new Date().toISOString().split('T')[0], total_amount: 0, status: 'Pending', tax_rate: 0, due_date: '', amount_paid: 0 });
        setIsEditing(false);
        setShowModal(true);
    };

    const openEditModal = (item) => {
        setFormData({
            customer_id: item.customer_id || '',
            date: item.date || item.invoice_date || '',
            total_amount: item.total_amount || 0,
            status: item.status || 'Pending',
            tax_rate: item.tax_rate || 0,
            due_date: item.due_date || '',
            amount_paid: item.amount_paid || 0
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
        if (!formData.customer_id) return;

        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) return;

        const payload = {
            customer_id: formData.customer_id,
            invoice_date: formData.date ? new Date(formData.date).toISOString().split('T')[0] : null,
            total_amount: parseFloat(String(formData.total_amount || 0).replace(/[^0-9.-]+/g, "")),
            status: formData.status || 'Pending',
            tax_rate: parseFloat(String(formData.tax_rate || 0).replace(/[^0-9.-]+/g, "")),
            due_date: formData.due_date ? new Date(formData.due_date).toISOString().split('T')[0] : null,
            amount_paid: parseFloat(String(formData.amount_paid || 0).replace(/[^0-9.-]+/g, "")),
            user_id: userData.user.id
        };

        if (isEditing) {
            await supabase.from('invoices').update(payload).eq('id', formData.id);
        } else {
            await supabase.from('invoices').insert([payload]);
        }
        setShowModal(false);
        fetchData();
    };

    const handleDelete = async () => {
        if (!itemToDelete) return;
        await supabase.from('invoices').delete().eq('id', itemToDelete.id);
        setDeleteDialogVisible(false);
        setItemToDelete(null);
        fetchData();
    };

    const filteredItems = items.filter(i =>
        (i.customers?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (i.id && String(i.id).includes(searchTerm))
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
                            <Plus size={20} /> إصدار فاتورة
                        </button>
                    </div>
                    <h2 className="text-xl font-bold text-white tracking-wide">إدارة الفواتير</h2>
                </div>

                <div className="w-full overflow-x-auto">
                    <table className="w-full text-right text-sm">
                        <thead className="bg-[#0F172A] text-slate-300 border-b border-slate-800">
                            <tr>
                                <th className="p-4 font-semibold whitespace-nowrap">الرقم</th>
                                <th className="p-4 font-semibold whitespace-nowrap">العميل</th>
                                <th className="p-4 font-semibold whitespace-nowrap">تاريخ الفاتورة</th>
                                <th className="p-4 font-semibold whitespace-nowrap">الإجمالي</th>
                                <th className="p-4 font-semibold whitespace-nowrap">المدفوع</th>
                                <th className="p-4 font-semibold whitespace-nowrap">الحالة</th>
                                <th className="p-4 font-semibold text-center whitespace-nowrap">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {loading ? (
                                <tr><td colSpan="7" className="p-8 text-center text-slate-500">جاري التحميل...</td></tr>
                            ) : filteredItems.length === 0 ? (
                                <tr><td colSpan="7" className="p-8 text-center text-slate-500">لا يوجد فواتير.</td></tr>
                            ) : (
                                filteredItems.map((item, index) => (
                                    <tr key={item.id} className="hover:bg-[#1E293B]/50 transition-colors">
                                        <td className="p-4 text-slate-400 font-mono">{item.id}</td>
                                        <td className="p-4 font-bold text-white">{item.customers?.name || '-'}</td>
                                        <td className="p-4 text-slate-300">{item.invoice_date || item.date || '-'}</td>
                                        <td className="p-4 text-emerald-400 font-mono font-bold">${Number(item.total_amount || 0).toLocaleString()}</td>
                                        <td className="p-4 text-blue-400 font-mono font-bold">${Number(item.amount_paid || 0).toLocaleString()}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs ${
                                                item.status === 'Paid' ? 'bg-green-500/20 text-green-400' :
                                                item.status === 'Overdue' ? 'bg-red-500/20 text-red-400' :
                                                'bg-yellow-500/20 text-yellow-400'
                                            }`}>
                                                {item.status === 'Paid' ? 'مدفوع' : item.status === 'Overdue' ? 'متأخر' : 'معلق'}
                                            </span>
                                        </td>
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
                            <h2 className="text-xl font-bold text-white">{isEditing ? 'تعديل الفاتورة' : 'إصدار فاتورة'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 p-1.5 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">العميل <span className="text-red-500">*</span></label>
                                <select name="customer_id" value={formData.customer_id} onChange={handleInputChange} required className="w-full bg-[#0B1120] border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none appearance-none">
                                    <option value="">اختر العميل...</option>
                                    {customers.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">تاريخ الفاتورة</label>
                                    <input type="date" name="date" value={formData.date} onChange={handleInputChange} className="w-full bg-[#0B1120] border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">تاريخ الاستحقاق</label>
                                    <input type="date" name="due_date" value={formData.due_date} onChange={handleInputChange} className="w-full bg-[#0B1120] border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">الإجمالي</label>
                                    <input type="text" name="total_amount" value={formData.total_amount} onChange={handleInputChange} className="w-full bg-[#0B1120] border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none dir-ltr text-left" />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">المدفوع</label>
                                    <input type="text" name="amount_paid" value={formData.amount_paid} onChange={handleInputChange} className="w-full bg-[#0B1120] border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none dir-ltr text-left" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">الضريبة (%)</label>
                                    <input type="text" name="tax_rate" value={formData.tax_rate} onChange={handleInputChange} className="w-full bg-[#0B1120] border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none dir-ltr text-left" />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">الحالة</label>
                                    <select name="status" value={formData.status} onChange={handleInputChange} className="w-full bg-[#0B1120] border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none appearance-none">
                                        <option value="Pending">معلق</option>
                                        <option value="Paid">مدفوع</option>
                                        <option value="Overdue">متأخر</option>
                                    </select>
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
                            <p className="text-slate-400 mb-6">هل أنت متأكد من حذف هذه الفاتورة؟ لا يمكن التراجع عن هذه العملية.</p>
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

export default Invoices;
