import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';
import { Briefcase, Plus, Edit, Trash2, X, RefreshCw } from 'lucide-react';

const Employees = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    
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
            if (!error) setEmployees(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const openAddModal = () => {
        setFormData({ full_name: '', position: '', salary: 0, hire_date: new Date().toISOString().split('T')[0] });
        setIsEditing(false);
        setShowModal(true);
    };

    const openEditModal = (employee) => {
        setFormData({
            full_name: employee.full_name, 
            position: employee.position || '', 
            salary: employee.salary || 0, 
            hire_date: employee.hire_date || ''
        });
        setEditId(employee.id);
        setIsEditing(true);
        setShowModal(true);
    };

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

    const handleDelete = async (id) => {
        if (window.confirm('هل أنت متأكد من حذف هذا الموظف؟')) {
            await supabase.from('employees').delete().eq('id', id);
            fetchEmployees();
        }
    };

    return (
        <div className="min-h-screen bg-[#0B1120] text-slate-200 p-8" dir="rtl">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* الترويسة */}
                <div className="flex justify-between items-center bg-[#0F172A] p-6 rounded-2xl shadow-lg border border-slate-800">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center">
                            <Briefcase size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">إدارة الموظفين</h1>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={fetchEmployees} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors">
                            <RefreshCw size={20} className={loading ? "animate-spin text-blue-400" : "text-slate-300"} />
                        </button>
                        <button onClick={openAddModal} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center gap-2">
                            <Plus size={20} /> إضافة موظف
                        </button>
                    </div>
                </div>

                {/* الجدول */}
                <div className="bg-[#0F172A] rounded-2xl shadow-lg border border-slate-800 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-sm">
                            <thead className="bg-slate-900/50 text-slate-400 border-b border-slate-800">
                                <tr>
                                    <th className="p-4 font-semibold">الاسم الكامل</th>
                                    <th className="p-4 font-semibold">المنصب</th>
                                    <th className="p-4 font-semibold">تاريخ التعيين</th>
                                    <th className="p-4 font-semibold">الراتب الأساسي</th>
                                    <th className="p-4 font-semibold text-center">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {loading ? (
                                    <tr><td colSpan="5" className="p-8 text-center text-slate-500">جاري تحميل البيانات...</td></tr>
                                ) : employees.length === 0 ? (
                                    <tr><td colSpan="5" className="p-8 text-center text-slate-500">لا يوجد موظفين مسجلين حالياً.</td></tr>
                                ) : (
                                    employees.map((emp) => (
                                        <tr key={emp.id} className="hover:bg-slate-800/50 transition-colors">
                                            <td className="p-4 font-bold text-white">{emp.full_name}</td>
                                            <td className="p-4 text-slate-300">{emp.position || '-'}</td>
                                            <td className="p-4 text-slate-300">{emp.hire_date || '-'}</td>
                                            <td className="p-4 text-emerald-400 font-mono font-bold">${Number(emp.salary).toLocaleString()}</td>
                                            <td className="p-4 flex justify-center gap-2">
                                                <button onClick={() => openEditModal(emp)} className="p-2 bg-slate-800 hover:bg-blue-500/20 hover:text-blue-400 border border-slate-700 rounded-lg transition-colors"><Edit size={16} /></button>
                                                <button onClick={() => handleDelete(emp.id)} className="p-2 bg-slate-800 hover:bg-red-500/20 hover:text-red-400 border border-slate-700 rounded-lg transition-colors"><Trash2 size={16} /></button>
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
                                <h2 className="text-xl font-bold text-white">{isEditing ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'}</h2>
                                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white p-2 bg-slate-800 rounded-lg transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-sm text-slate-400 mb-1">الاسم الكامل <span className="text-red-500">*</span></label>
                                        <input type="text" name="full_name" value={formData.full_name} onChange={handleInputChange} required className="w-full bg-[#0B1120] border border-slate-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none" />
                                    </div>
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className="block text-sm text-slate-400 mb-1">المنصب</label>
                                        <input type="text" name="position" value={formData.position} onChange={handleInputChange} className="w-full bg-[#0B1120] border border-slate-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none" />
                                    </div>
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className="block text-sm text-slate-400 mb-1">الراتب الأساسي</label>
                                        <input type="number" step="0.01" name="salary" value={formData.salary} onChange={handleInputChange} className="w-full bg-[#0B1120] border border-slate-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none font-mono" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm text-slate-400 mb-1">تاريخ التعيين</label>
                                        <input type="date" name="hire_date" value={formData.hire_date} onChange={handleInputChange} className="w-full bg-[#0B1120] border border-slate-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none" />
                                    </div>
                                </div>
                                <div className="pt-4 flex gap-3">
                                    <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors">
                                        {isEditing ? 'حفظ التعديلات' : 'إضافة الموظف'}
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

export default Employees;
