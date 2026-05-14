import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';
import { Plus, Edit, Trash2, X, Search } from 'lucide-react';

const PurchaseInvoices = () => {
    const [items, setItems] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ supplier_id: '', date: '', total_amount: 0, status: 'Pending' });

    const fetchData = async () => {
        setLoading(true);
        const { data } = await supabase.from('purchase_invoices').select('*, suppliers(name)').order('id', { ascending: false });
        setItems(data || []);
        const { data: sData } = await supabase.from('suppliers').select('id, name');
        setSuppliers(sData || []);
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    const openAdd = () => {
        setFormData({ supplier_id: '', date: new Date().toISOString().split('T')[0], total_amount: 0, status: 'Pending' });
        setIsEditing(false);
        setShowModal(true);
    };

    const openEdit = (item) => {
        setFormData({ id: item.id, supplier_id: item.supplier_id || '', date: item.invoice_date || item.date || '', total_amount: item.total_amount || 0, status: item.status || 'Pending' });
        setIsEditing(true);
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            supplier_id: formData.supplier_id,
            invoice_date: formData.date || null,
            total_amount: parseFloat(String(formData.total_amount || 0).replace(/[^0-9.-]+/g, '')) || 0,
            status: formData.status
        };
        if (isEditing) {
            await supabase.from('purchase_invoices').update(payload).eq('id', formData.id);
        } else {
            await supabase.from('purchase_invoices').insert([payload]);
        }
        setShowModal(false);
        fetchData();
    };

    const handleDelete = async () => {
        if (!itemToDelete) return;
        await supabase.from('purchase_invoices').delete().eq('id', itemToDelete.id);
        setDeleteDialogVisible(false);
        setItemToDelete(null);
        fetchData();
    };

    const filtered = items.filter(i =>
        (i.suppliers?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(i.id || '').includes(searchTerm)
    );

    const statusBadge = (s) => s === 'Paid' ? 'bg-emerald-500/15 text-emerald-400' : s === 'Overdue' ? 'bg-red-500/15 text-red-400' : 'bg-yellow-500/15 text-yellow-400';
    const statusLabel = (s) => s === 'Paid' ? 'مدفوع' : s === 'Overdue' ? 'متأخر' : 'معلق';

    return (
        <div className="p-6 w-full" dir="rtl">
            <div className="bg-[#0F172A] rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between p-5 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <button onClick={openAdd} className="flex items-center gap-2 bg-[#22C55E] hover:bg-green-600 text-white font-bold px-4 py-2.5 rounded-lg transition-colors">
                            <Plus size={18} /> إضافة فاتورة
                        </button>
                        <div className="relative">
                            <input type="text" placeholder="بحث..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                className="bg-slate-800 border border-slate-700 text-white rounded-lg py-2.5 px-4 pl-10 w-60 outline-none focus:border-blue-500" />
                            <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                        </div>
                    </div>
                    <h2 className="text-xl font-bold text-white">فواتير المشتريات</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-slate-800/50 text-slate-400 border-b border-slate-800">
                            <tr>
                                <th className="p-4">#</th><th className="p-4">المورد</th><th className="p-4">التاريخ</th>
                                <th className="p-4">الإجمالي</th><th className="p-4">الحالة</th><th className="p-4 text-center">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {loading ? <tr><td colSpan={6} className="p-8 text-center text-slate-500">جاري التحميل...</td></tr>
                            : filtered.length === 0 ? <tr><td colSpan={6} className="p-8 text-center text-slate-500">لا توجد فواتير.</td></tr>
                            : filtered.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-800/40 transition-colors text-slate-300">
                                    <td className="p-4 text-slate-500">{item.id}</td>
                                    <td className="p-4 font-semibold text-white">{item.suppliers?.name || '-'}</td>
                                    <td className="p-4">{item.invoice_date || item.date || '-'}</td>
                                    <td className="p-4 text-emerald-400 font-mono">${Number(item.total_amount || 0).toLocaleString()}</td>
                                    <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusBadge(item.status)}`}>{statusLabel(item.status)}</span></td>
                                    <td className="p-4"><div className="flex gap-2 justify-center">
                                        <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"><Edit size={16} /></button>
                                        <button onClick={() => { setItemToDelete(item); setDeleteDialogVisible(true); }} className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"><Trash2 size={16} /></button>
                                    </div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#0F172A] border border-slate-700 rounded-xl w-full max-w-lg shadow-2xl">
                        <div className="flex items-center justify-between p-5 border-b border-slate-800">
                            <h3 className="text-lg font-bold text-white">{isEditing ? 'تعديل الفاتورة' : 'إضافة فاتورة مشتريات'}</h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1.5">المورد *</label>
                                <select required value={formData.supplier_id} onChange={e => setFormData({ ...formData, supplier_id: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-3 outline-none focus:border-blue-500 appearance-none">
                                    <option value="">اختر المورد...</option>
                                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1.5">التاريخ</label>
                                    <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-3 outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1.5">الحالة</label>
                                    <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-3 outline-none focus:border-blue-500 appearance-none">
                                        <option value="Pending">معلق</option>
                                        <option value="Paid">مدفوع</option>
                                        <option value="Overdue">متأخر</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1.5">الإجمالي</label>
                                <input type="text" value={formData.total_amount} onChange={e => setFormData({ ...formData, total_amount: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-3 outline-none focus:border-blue-500" dir="ltr" />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="submit" className="flex-1 bg-[#22C55E] hover:bg-green-600 text-white font-bold py-3 rounded-lg">حفظ</button>
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-lg border border-slate-700">إلغاء</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {deleteDialogVisible && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#0F172A] border border-slate-700 rounded-xl w-full max-w-sm shadow-2xl p-6 text-center">
                        <div className="w-14 h-14 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-4"><Trash2 size={28} className="text-red-400" /></div>
                        <h3 className="text-lg font-bold text-white mb-2">تأكيد الحذف</h3>
                        <p className="text-slate-400 mb-6 text-sm">هل أنت متأكد من حذف هذه الفاتورة؟</p>
                        <div className="flex gap-3">
                            <button onClick={handleDelete} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-lg">حذف</button>
                            <button onClick={() => setDeleteDialogVisible(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-lg border border-slate-700">إلغاء</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PurchaseInvoices;
