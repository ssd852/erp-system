import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Users, Plus, Edit, Trash2, X, RefreshCw } from 'lucide-react';

const Customers = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);

    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', address: '', city: '', balance: 0
    });

    const fetchCustomers = async () => {
        setLoading(true);
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
            const { data, error } = await supabase
                .from('customers')
                .select('*')
                .eq('user_id', userData.user.id)
                .order('created_at', { ascending: false });
            if (!error) setCustomers(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const openAddModal = () => {
        setFormData({ name: '', email: '', phone: '', address: '', city: '', balance: 0 });
        setIsEditing(false);
        setShowModal(true);
    };

    const openEditModal = (customer) => {
        setFormData({
            name: customer.name, email: customer.email || '', phone: customer.phone || '',
            address: customer.address || '', city: customer.city || '', balance: customer.balance
        });
        setEditId(customer.id);
        setIsEditing(true);
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) return;

        if (isEditing) {
            await supabase.from('customers').update(formData).eq('id', editId);
        } else {
            await supabase.from('customers').insert([{ ...formData, user_id: userData.user.id }]);
        }
        setShowModal(false);
        fetchCustomers();
    };

    const handleDelete = async (id) => {
        if (window.confirm('هل أنت متأكد من حذف هذا العميل؟')) {
            await supabase.from('customers').delete().eq('id', id);
            fetchCustomers();
        }
    };

    return (
        <div className="min-h-screen bg-[#0B1120] text-slate-200 p-8" dir="rtl">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* الترويسة */}
                <div className="flex justify-between items-center bg-[#0F172A] p-6 rounded-2xl shadow-lg border border-slate-800">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center">
                            <Users size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">إدارة العملاء</h1>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={fetchCustomers} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors">
                            <RefreshCw size={20} className={loading ? "animate-spin text-blue-400" : "text-slate-300"} />
                        </button>
                        <button onClick={openAddModal} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center gap-2">
                            <Plus size={20} /> إضافة عميل
                        </button>
                    </div>
                </div>

                {/* الجدول */}
                <div className="bg-[#0F172A] rounded-2xl shadow-lg border border-slate-800 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-sm">
                            <thead className="bg-slate-900/50 text-slate-400 border-b border-slate-800">
                                <tr>
                                    <th className="p-4 font-semibold">اسم العميل</th>
                                    <th className="p-4 font-semibold">الهاتف / الإيميل</th>
                                    <th className="p-4 font-semibold">المدينة</th>
                                    <th className="p-4 font-semibold">الرصيد</th>
                                    <th className="p-4 font-semibold text-center">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {loading ? (
                                    <tr><td colSpan="5" className="p-8 text-center text-slate-500">جاري تحميل البيانات...</td></tr>
                                ) : customers.length === 0 ? (
                                    <tr><td colSpan="5" className="p-8 text-center text-slate-500">لا يوجد عملاء مسجلين حالياً.</td></tr>
                                ) : (
                                    customers.map((c) => (
                                        <tr key={c.id} className="hover:bg-slate-800/50 transition-colors">
                                            <td className="p-4 font-bold text-white">{c.name}</td>
                                            <td className="p-4 text-slate-300">
                                                <div dir="ltr" className="text-right text-blue-400 font-mono">{c.phone || '-'}</div>
                                                <div className="text-xs text-slate-500">{c.email}</div>
                                            </td>
                                            <td className="p-4 text-slate-300">{c.city || '-'}</td>
                                            <td className="p-4 text-emerald-400 font-mono font-bold">{Number(c.balance).toFixed(2)}</td>
                                            <td className="p-4 flex justify-center gap-2">
                                                <button onClick={() => openEditModal(c)} className="p-2 bg-slate-800 hover:bg-blue-500/20 hover:text-blue-400 border border-slate-700 rounded-lg transition-colors"><Edit size={16} /></button>
                                                <button onClick={() => handleDelete(c.id)} className="p-2 bg-slate-800 hover:bg-red-500/20 hover:text-red-400 border border-slate-700 rounded-lg transition-colors"><Trash2 size={16} /></button>
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
                                <h2 className="text-xl font-bold text-white">{isEditing ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}</h2>
                                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white p-2 bg-slate-800 rounded-lg transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">اسم العميل <span className="text-red-500">*</span></label>
                                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} required className="w-full bg-[#0B1120] border border-slate-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">رقم الهاتف</label>
                                        <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full bg-[#0B1120] border border-slate-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">المدينة</label>
                                        <input type="text" name="city" value={formData.city} onChange={handleInputChange} className="w-full bg-[#0B1120] border border-slate-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">البريد الإلكتروني</label>
                                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full bg-[#0B1120] border border-slate-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">الرصيد الافتتاحي</label>
                                    <input type="number" step="0.01" name="balance" value={formData.balance} onChange={handleInputChange} className="w-full bg-[#0B1120] border border-slate-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none font-mono" />
                                </div>
                                <div className="pt-4 flex gap-3">
                                    <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors">
                                        {isEditing ? 'حفظ التعديلات' : 'إضافة العميل'}
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

export default Customers;