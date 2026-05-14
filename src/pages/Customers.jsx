import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Users, Plus, Edit, Trash2, X } from 'lucide-react';

const Customers = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);

    // المتغيرات المسؤولة عن إظهار الشاشات المنبثقة (هون كان الخطأ)
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

    // دالة فتح شاشة الإضافة
    const openAddModal = () => {
        setFormData({ name: '', email: '', phone: '', address: '', city: '', balance: 0 });
        setIsEditing(false);
        setShowModal(true); // هاي اللي بتفتح الشاشة المنبثقة
    };

    // دالة فتح شاشة التعديل
    const openEditModal = (customer) => {
        setFormData({
            name: customer.name, email: customer.email || '', phone: customer.phone || '',
            address: customer.address || '', city: customer.city || '', balance: customer.balance
        });
        setEditId(customer.id);
        setIsEditing(true);
        setShowModal(true);
    };

    // دالة الحفظ
    const handleSubmit = async (e) => {
        e.preventDefault();
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) return;

        if (isEditing) {
            await supabase.from('customers').update(formData).eq('id', editId);
        } else {
            await supabase.from('customers').insert([{ ...formData, user_id: userData.user.id }]);
        }
        setShowModal(false); // تسكير الشاشة بعد الحفظ
        fetchCustomers();
    };

    // دالة الحذف
    const handleDelete = async (id) => {
        if (window.confirm('هل أنت متأكد من حذف هذا العميل؟')) {
            await supabase.from('customers').delete().eq('id', id);
            fetchCustomers();
        }
    };

    return (
        <div className="p-6 text-slate-200 w-full" dir="rtl">

            {/* الترويسة وزر الإضافة */}
            <div className="flex justify-between items-center mb-6 bg-[#0F172A] p-4 rounded-xl border border-slate-800">
                <div className="flex items-center gap-3">
                    <Users className="text-blue-400" size={24} />
                    <h1 className="text-xl font-bold text-white">إدارة العملاء</h1>
                </div>

                {/* زر الإضافة الأخضر زي باقي الموقع */}
                <button
                    onClick={openAddModal}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                    <Plus size={20} /> إضافة عميل
                </button>
            </div>

            {/* الجدول المفرود على عرض الشاشة */}
            <div className="bg-[#0F172A] rounded-xl border border-slate-800 overflow-hidden w-full">
                <div className="overflow-x-auto">
                    <table className="w-full text-right text-sm">
                        <thead className="bg-[#1E293B] text-slate-300 border-b border-slate-700">
                            <tr>
                                <th className="p-4 font-semibold">الرقم</th>
                                <th className="p-4 font-semibold">الاسم</th>
                                <th className="p-4 font-semibold">الهاتف</th>
                                <th className="p-4 font-semibold">البريد الإلكتروني</th>
                                <th className="p-4 font-semibold">الرصيد</th>
                                <th className="p-4 font-semibold text-center">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {loading ? (
                                <tr><td colSpan="6" className="p-8 text-center text-slate-500">جاري التحميل...</td></tr>
                            ) : customers.length === 0 ? (
                                <tr><td colSpan="6" className="p-8 text-center text-slate-500">لا يوجد بيانات متاحة.</td></tr>
                            ) : (
                                customers.map((c, index) => (
                                    <tr key={c.id} className="hover:bg-slate-800/50 transition-colors">
                                        <td className="p-4 text-slate-400">{index + 1}</td>
                                        <td className="p-4 font-bold text-white">{c.name}</td>
                                        <td className="p-4 text-slate-300" dir="ltr">{c.phone || '-'}</td>
                                        <td className="p-4 text-slate-300">{c.email || '-'}</td>
                                        <td className="p-4 text-emerald-400 font-mono font-bold">{Number(c.balance).toFixed(2)}</td>
                                        <td className="p-4 flex justify-center gap-2">
                                            <button onClick={() => openEditModal(c)} className="text-blue-400 hover:bg-blue-500/20 p-2 rounded-lg transition-colors"><Edit size={18} /></button>
                                            <button onClick={() => handleDelete(c.id)} className="text-red-400 hover:bg-red-500/20 p-2 rounded-lg transition-colors"><Trash2 size={18} /></button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* الشاشة المنبثقة (Modal) للإضافة والتعديل */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-[#0F172A] border border-slate-700 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden">
                        <div className="flex justify-between items-center p-4 border-b border-slate-700 bg-[#1E293B]">
                            <h2 className="text-lg font-bold text-white">{isEditing ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">اسم العميل <span className="text-red-500">*</span></label>
                                <input type="text" name="name" value={formData.name} onChange={handleInputChange} required className="w-full bg-[#0B1120] border border-slate-700 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">رقم الهاتف</label>
                                    <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full bg-[#0B1120] border border-slate-700 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">الرصيد</label>
                                    <input type="number" step="0.01" name="balance" value={formData.balance} onChange={handleInputChange} className="w-full bg-[#0B1120] border border-slate-700 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">البريد الإلكتروني</label>
                                <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full bg-[#0B1120] border border-slate-700 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none" />
                            </div>

                            <div className="pt-4 flex gap-3 border-t border-slate-700 mt-4">
                                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-lg transition-colors">
                                    حفظ
                                </button>
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2.5 rounded-lg transition-colors">
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Customers;