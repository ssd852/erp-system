import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Plus, Edit, Trash2, X, Search, ArrowUpDown } from 'lucide-react';

const Customers = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // التحكم بالشاشة المنبثقة
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

    // فتح شاشة الإضافة
    const openAddModal = () => {
        setFormData({ name: '', email: '', phone: '', address: '', city: '', balance: 0 });
        setIsEditing(false);
        setShowModal(true);
    };

    // فتح شاشة التعديل
    const openEditModal = (customer) => {
        setFormData({
            name: customer.name, email: customer.email || '', phone: customer.phone || '',
            address: customer.address || '', city: customer.city || '', balance: customer.balance
        });
        setEditId(customer.id);
        setIsEditing(true);
        setShowModal(true);
    };

    // الحفظ (إضافة أو تعديل)
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

    // الحذف
    const handleDelete = async (id) => {
        if (window.confirm('هل أنت متأكد من حذف هذا العميل؟')) {
            await supabase.from('customers').delete().eq('id', id);
            fetchCustomers();
        }
    };

    // فلترة العملاء حسب البحث
    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.phone && c.phone.includes(searchTerm))
    );

    return (
        <div className="w-full text-slate-200" dir="rtl">

            {/* عنوان الصفحة المطابق لتصميمك */}
            <div className="flex justify-center items-center mb-8 mt-2">
                <h1 className="text-3xl font-bold text-white tracking-wide">إدارة العملاء</h1>
            </div>

            {/* الكارد الرئيسي للجدول */}
            <div className="bg-[#0F172A] rounded-xl border border-slate-800 overflow-hidden shadow-2xl w-full">

                {/* شريط الأدوات (زر الإضافة والبحث) - مطابق لصفحة الفواتير */}
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-[#0B1120]/50">

                    {/* زر الإضافة الأخضر */}
                    <button
                        onClick={openAddModal}
                        className="bg-[#22C55E] hover:bg-[#16a34a] text-white px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2 font-bold shadow-lg shadow-green-500/20 z-10"
                    >
                        <Plus size={20} /> إضافة عميل
                    </button>

                    {/* مربع البحث */}
                    <div className="relative w-72">
                        <input
                            type="text"
                            placeholder="بحث..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[#0F172A] border border-slate-700 rounded-lg py-2.5 px-4 pl-10 text-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                        />
                        <Search className="absolute left-3 top-3 text-slate-500" size={18} />
                    </div>
                </div>

                {/* الجدول */}
                <div className="overflow-x-auto">
                    <table className="w-full text-right text-sm">
                        <thead className="bg-[#0F172A] text-slate-300 border-b border-slate-800">
                            <tr>
                                <th className="p-4 font-semibold whitespace-nowrap">
                                    <div className="flex items-center gap-2 justify-end">الرقم <ArrowUpDown size={14} className="text-slate-500" /></div>
                                </th>
                                <th className="p-4 font-semibold whitespace-nowrap">
                                    <div className="flex items-center gap-2 justify-end">الاسم <ArrowUpDown size={14} className="text-slate-500" /></div>
                                </th>
                                <th className="p-4 font-semibold whitespace-nowrap">
                                    <div className="flex items-center gap-2 justify-end">الهاتف <ArrowUpDown size={14} className="text-slate-500" /></div>
                                </th>
                                <th className="p-4 font-semibold whitespace-nowrap">
                                    <div className="flex items-center gap-2 justify-end">البريد الإلكتروني <ArrowUpDown size={14} className="text-slate-500" /></div>
                                </th>
                                <th className="p-4 font-semibold whitespace-nowrap">
                                    <div className="flex items-center gap-2 justify-end">الرصيد <ArrowUpDown size={14} className="text-slate-500" /></div>
                                </th>
                                <th className="p-4 font-semibold text-center">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {loading ? (
                                <tr><td colSpan="6" className="p-8 text-center text-slate-500">جاري التحميل...</td></tr>
                            ) : filteredCustomers.length === 0 ? (
                                <tr><td colSpan="6" className="p-8 text-center text-slate-500">لا يوجد بيانات متاحة.</td></tr>
                            ) : (
                                filteredCustomers.map((c, index) => (
                                    <tr key={c.id} className="hover:bg-[#1E293B]/50 transition-colors">
                                        <td className="p-4 text-slate-400 font-mono">{index + 1}</td>
                                        <td className="p-4 font-bold text-white">{c.name}</td>
                                        <td className="p-4 text-slate-300" dir="ltr">{c.phone || '-'}</td>
                                        <td className="p-4 text-slate-300">{c.email || '-'}</td>
                                        <td className="p-4 text-emerald-400 font-mono font-bold">{Number(c.balance).toFixed(2)}</td>
                                        <td className="p-4 flex justify-center gap-3">
                                            <button onClick={() => openEditModal(c)} className="text-blue-400 hover:text-blue-300 transition-colors"><Edit size={18} /></button>
                                            <button onClick={() => handleDelete(c.id)} className="text-red-400 hover:text-red-300 transition-colors"><Trash2 size={18} /></button>
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
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-[#0F172A] border border-slate-700 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center p-5 border-b border-slate-800 bg-[#0B1120]">
                            <h2 className="text-xl font-bold text-white">{isEditing ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 p-1.5 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space