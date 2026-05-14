import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';
import { Plus, Edit, Trash2, X, Search, ArrowUpDown } from 'lucide-react';

const Employees = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // التحكم بالشاشة المنبثقة
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);

    const [formData, setFormData] = useState({
        full_name: '', position: '', salary: 0, hire_date: ''
    });

    const fetchEmployees = async () => {
        setLoading(true);
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
            const { data, error } = await supabase
                .from('employees')
                .select('*')
                .eq('user_id', userData.user.id)
                .order('id', { ascending: false });
            if (!error) setEmployees(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // فتح شاشة الإضافة
    const openAddModal = () => {
        setFormData({ full_name: '', position: '', salary: 0, hire_date: new Date().toISOString().split('T')[0] });
        setIsEditing(false);
        setShowModal(true);
    };

    // فتح شاشة التعديل
    const openEditModal = (emp) => {
        setFormData({
            full_name: emp.full_name,
            position: emp.position || '',
            salary: emp.salary || 0,
            hire_date: emp.hire_date || ''
        });
        setEditId(emp.id);
        setIsEditing(true);
        setShowModal(true);
    };

    // الحفظ (إضافة أو تعديل)
    const handleSubmit = async (e) => {
        e.preventDefault();
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) return;

        if (isEditing) {
            await supabase.from('employees').update(formData).eq('id', editId);
        } else {
            await supabase.from('employees').insert([{ ...formData, user_id: userData.user.id }]);
        }
        setShowModal(false);
        fetchEmployees();
    };

    // الحذف
    const handleDelete = async (id) => {
        if (window.confirm('هل أنت متأكد من حذف هذا الموظف؟')) {
            await supabase.from('employees').delete().eq('id', id);
            fetchEmployees();
        }
    };

    const filteredEmployees = employees.filter(e =>
        e.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.position && e.position.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="w-full text-slate-200 p-6" dir="rtl">

            {/* الكارد الرئيسي للجدول */}
            <div className="bg-[#0F172A] rounded-xl border border-slate-800 overflow-hidden shadow-2xl w-full">

                {/* شريط الأدوات العلوي */}
                <div className="p-5 border-b border-slate-800 flex justify-between items-center">

                    <h2 className="text-lg font-bold text-white">إدارة الموظفين</h2>

                    <div className="flex items-center gap-4">
                        {/* مربع البحث */}
                        <div className="relative w-64">
                            <input
                                type="text"
                                placeholder="بحث..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-[#0B1120] border border-slate-700 rounded-lg py-2 px-4 pl-10 text-slate-200 focus:border-blue-500 outline-none"
                            />
                            <Search className="absolute left-3 top-2.5 text-slate-500" size={18} />
                        </div>

                        {/* الزر الأخضر */}
                        <button
                            onClick={openAddModal}
                            className="bg-[#22C55E] hover:bg-[#16a34a] text-white px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2 font-bold"
                        >
                            إضافة موظف <Plus size={20} />
                        </button>
                    </div>
                </div>

                {/* الجدول */}
                <div className="overflow-x-auto">
                    <table className="w-full text-right text-sm">
                        <thead className="bg-[#0F172A] text-slate-300 border-b border-slate-800">
                            <tr>
                                <th className="p-4 font-semibold whitespace-nowrap">
                                    <div className="flex items-center gap-2 justify-start">الرقم <ArrowUpDown size={14} className="text-slate-500" /></div>
                                </th>
                                <th className="p-4 font-semibold whitespace-nowrap">
                                    <div className="flex items-center gap-2 justify-start">الاسم الكامل <ArrowUpDown size={14} className="text-slate-500" /></div>
                                </th>
                                <th className="p-4 font-semibold whitespace-nowrap">
                                    <div className="flex items-center gap-2 justify-start">المنصب <ArrowUpDown size={14} className="text-slate-500" /></div>
                                </th>
                                <th className="p-4 font-semibold whitespace-nowrap">
                                    <div className="flex items-center gap-2 justify-start">الراتب <ArrowUpDown size={14} className="text-slate-500" /></div>
                                </th>
                                <th className="p-4 font-semibold whitespace-nowrap">
                                    <div className="flex items-center gap-2 justify-start">تاريخ التعيين <ArrowUpDown size={14} className="text-slate-500" /></div>
                                </th>
                                <th className="p-4 font-semibold text-center">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {loading ? (
                                <tr><td colSpan="6" className="p-8 text-center text-slate-500">جاري التحميل...</td></tr>
                            ) : filteredEmployees.length === 0 ? (
                                <tr><td colSpan="6" className="p-8 text-center text-slate-500">لا يوجد بيانات متاحة.</td></tr>
                            ) : (
                                filteredEmployees.map((emp, index) => (
                                    <tr key={emp.id} className="hover:bg-[#1E293B]/50 transition-colors">
                                        <td className="p-4 text-slate-400 font-mono">{index + 1}</td>
                                        <td className="p-4 font-bold text-white">{emp.full_name}</td>
                                        <td className="p-4 text-slate-300">{emp.position || '-'}</td>
                                        <td className="p-4 text-emerald-400 font-mono font-bold">${Number(emp.salary).toLocaleString()}</td>
                                        <td className="p-4 text-slate-300">{emp.hire_date || '-'}</td>
                                        <td className="p-4 flex justify-center gap-3">
                                            <button onClick={() => openEditModal(emp)} className="text-blue-400 hover:text-blue-300 transition-colors"><Edit size={18} /></button>
                                            <button onClick={() => handleDelete(emp.id)} className="text-red-400 hover:text-red-300 transition-colors"><Trash2 size={18} /></button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* الشاشة المنبثقة (Modal) */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-[#0F172A] border border-slate-700 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center p-5 border-b border-slate-800 bg-[#0B1120]">
                            <h2 className="text-xl font-bold text-white">{isEditing ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 p-1.5 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">الاسم الكامل <span className="text-red-500">*</span></label>
                                <input type="text" name="full_name" value={formData.full_name} onChange={handleInputChange} required className="w-full bg-[#0B1120] border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">المنصب</label>
                                    <input type="text" name="position" value={formData.position} onChange={handleInputChange} className="w-full bg-[#0B1120] border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">الراتب الأساسي</label>
                                    <input type="number" step="0.01" name="salary" value={formData.salary} onChange={handleInputChange} className="w-full bg-[#0B1120] border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">تاريخ التعيين</label>
                                <input type="date" name="hire_date" value={formData.hire_date} onChange={handleInputChange} className="w-full bg-[#0B1120] border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none" />
                            </div>

                            <div className="pt-4 flex gap-3 border-t border-slate-800 mt-6">
                                <button type="submit" className="flex-1 bg-[#22C55E] hover:bg-[#16a34a] text-white font-bold py-3 rounded-lg transition-colors">
                                    حفظ البيانات
                                </button>
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-lg transition-colors border border-slate-700">
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

export default Employees;
