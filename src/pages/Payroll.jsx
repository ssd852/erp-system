import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';
import { Plus, Edit, Trash2, X, Search, ArrowUpDown } from 'lucide-react';

const Payroll = () => {
    const [items, setItems] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const [formData, setFormData] = useState({
        employee_id: '', month: '', basic_salary: 0, allowances: 0, deductions: 0, net_salary: 0
    });

    const fetchData = async () => {
        setLoading(true);
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) return;

        const { data, error } = await supabase
            .from('payroll')
            .select('*, employees(full_name)')
            .eq('user_id', userData.user.id)
            .order('id', { ascending: false });

        if (!error) setItems(data || []);

        const { data: empData } = await supabase.from('employees').select('id, full_name');
        if (empData) setEmployees(empData);

        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Calculate net salary automatically
    useEffect(() => {
        const basic = parseFloat(String(formData.basic_salary || 0).replace(/[^0-9.-]+/g, "")) || 0;
        const allow = parseFloat(String(formData.allowances || 0).replace(/[^0-9.-]+/g, "")) || 0;
        const deduc = parseFloat(String(formData.deductions || 0).replace(/[^0-9.-]+/g, "")) || 0;
        setFormData(prev => ({ ...prev, net_salary: basic + allow - deduc }));
    }, [formData.basic_salary, formData.allowances, formData.deductions]);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const openAddModal = () => {
        setFormData({ employee_id: '', month: '', basic_salary: 0, allowances: 0, deductions: 0, net_salary: 0 });
        setIsEditing(false);
        setShowModal(true);
    };

    const openEditModal = (item) => {
        setFormData({
            employee_id: item.employee_id || '',
            month: item.month || '',
            basic_salary: item.basic_salary || 0,
            allowances: item.allowances || 0,
            deductions: item.deductions || 0,
            net_salary: item.net_salary || 0
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
        if (!formData.employee_id) return;

        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) return;

        const payload = {
            employee_id: formData.employee_id,
            month: formData.month,
            basic_salary: parseFloat(String(formData.basic_salary || 0).replace(/[^0-9.-]+/g, "")),
            allowances: parseFloat(String(formData.allowances || 0).replace(/[^0-9.-]+/g, "")),
            deductions: parseFloat(String(formData.deductions || 0).replace(/[^0-9.-]+/g, "")),
            net_salary: parseFloat(String(formData.net_salary || 0).replace(/[^0-9.-]+/g, "")),
            user_id: userData.user.id
        };

        if (isEditing) {
            await supabase.from('payroll').update(payload).eq('id', formData.id);
        } else {
            await supabase.from('payroll').insert([payload]);
        }
        setShowModal(false);
        fetchData();
    };

    const handleDelete = async () => {
        if (!itemToDelete) return;
        await supabase.from('payroll').delete().eq('id', itemToDelete.id);
        setDeleteDialogVisible(false);
        setItemToDelete(null);
        fetchData();
    };

    const filteredItems = items.filter(i =>
        (i.employees?.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (i.month && i.month.toLowerCase().includes(searchTerm.toLowerCase()))
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
                            <Plus size={20} /> صرف راتب
                        </button>
                    </div>
                    <h2 className="text-xl font-bold text-white tracking-wide">مسيرات الرواتب</h2>
                </div>

                <div className="w-full overflow-x-auto">
                    <table className="w-full text-right text-sm">
                        <thead className="bg-[#0F172A] text-slate-300 border-b border-slate-800">
                            <tr>
                                <th className="p-4 font-semibold whitespace-nowrap">الرقم</th>
                                <th className="p-4 font-semibold whitespace-nowrap">الموظف</th>
                                <th className="p-4 font-semibold whitespace-nowrap">الشهر</th>
                                <th className="p-4 font-semibold whitespace-nowrap">الأساسي</th>
                                <th className="p-4 font-semibold whitespace-nowrap">بدلات</th>
                                <th className="p-4 font-semibold whitespace-nowrap">خصومات</th>
                                <th className="p-4 font-semibold whitespace-nowrap">الصافي</th>
                                <th className="p-4 font-semibold text-center whitespace-nowrap">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {loading ? (
                                <tr><td colSpan="8" className="p-8 text-center text-slate-500">جاري التحميل...</td></tr>
                            ) : filteredItems.length === 0 ? (
                                <tr><td colSpan="8" className="p-8 text-center text-slate-500">لا يوجد مسيرات رواتب.</td></tr>
                            ) : (
                                filteredItems.map((item, index) => (
                                    <tr key={item.id} className="hover:bg-[#1E293B]/50 transition-colors">
                                        <td className="p-4 text-slate-400 font-mono">{item.id}</td>
                                        <td className="p-4 font-bold text-white">{item.employees?.full_name || '-'}</td>
                                        <td className="p-4 text-slate-300">{item.month || '-'}</td>
                                        <td className="p-4 text-emerald-400 font-mono">${Number(item.basic_salary || 0).toLocaleString()}</td>
                                        <td className="p-4 text-blue-400 font-mono">${Number(item.allowances || 0).toLocaleString()}</td>
                                        <td className="p-4 text-red-400 font-mono">${Number(item.deductions || 0).toLocaleString()}</td>
                                        <td className="p-4 text-emerald-400 font-mono font-bold">${Number(item.net_salary || 0).toLocaleString()}</td>
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
                            <h2 className="text-xl font-bold text-white">{isEditing ? 'تعديل المسير' : 'إضافة مسير راتب'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 p-1.5 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">الموظف <span className="text-red-500">*</span></label>
                                <select name="employee_id" value={formData.employee_id} onChange={handleInputChange} required className="w-full bg-[#0B1120] border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none appearance-none">
                                    <option value="">اختر الموظف...</option>
                                    {employees.map(e => (
                                        <option key={e.id} value={e.id}>{e.full_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">الشهر</label>
                                <input type="text" placeholder="مثال: مايو 2026" name="month" value={formData.month} onChange={handleInputChange} className="w-full bg-[#0B1120] border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">الراتب الأساسي</label>
                                    <input type="text" name="basic_salary" value={formData.basic_salary} onChange={handleInputChange} className="w-full bg-[#0B1120] border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none dir-ltr text-left" />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">البدلات</label>
                                    <input type="text" name="allowances" value={formData.allowances} onChange={handleInputChange} className="w-full bg-[#0B1120] border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none dir-ltr text-left" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">الخصومات</label>
                                    <input type="text" name="deductions" value={formData.deductions} onChange={handleInputChange} className="w-full bg-[#0B1120] border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none dir-ltr text-left" />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">الصافي (تلقائي)</label>
                                    <input type="text" name="net_salary" value={formData.net_salary} disabled className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white opacity-70 dir-ltr text-left" />
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
                            <p className="text-slate-400 mb-6">هل أنت متأكد من حذف هذا المسير؟ لا يمكن التراجع عن هذه العملية.</p>
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

export default Payroll;
