import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { useToast } from '../context/ToastContext';

const JournalEntries = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [globalFilter, setGlobalFilter] = useState('');
    const [dialogVisible, setDialogVisible] = useState(false);
    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [currentItem, setCurrentItem] = useState({ date: '', description: '', debit: 0, credit: 0 });
    const [isEdit, setIsEdit] = useState(false);

    const { showToast } = useToast();

    const fetchItems = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('journal_entries').select('*').order('id', { ascending: false });
        if (error) {
            console.error('Error fetching journal entries:', error);
            showToast('error', 'خطأ', 'فشل جلب القيود اليومية');
        } else {
            setItems(data || []);
        }
        setLoading(false);
    };

    useEffect(() => { fetchItems(); }, []);

    const openNew = () => {
        setCurrentItem({ date: new Date().toISOString().split('T')[0], description: '', debit: 0, credit: 0 });
        setIsEdit(false);
        setDialogVisible(true);
    };

    const editItem = (item) => {
        setCurrentItem({ ...item });
        setIsEdit(true);
        setDialogVisible(true);
    };

    const confirmDelete = (item) => {
        setCurrentItem(item);
        setDeleteDialogVisible(true);
    };

    const saveItem = async () => {
        if (!currentItem.description?.trim()) {
            showToast('warn', 'تحذير', 'البيان مطلوب');
            return;
        }

        try {
            const debitVal = parseFloat(String(currentItem.debit || 0).replace(/[^0-9.-]+/g, ""));
            const creditVal = parseFloat(String(currentItem.credit || 0).replace(/[^0-9.-]+/g, ""));
            const payload = {
                description: currentItem.description,
                entry_date: currentItem.date ? new Date(currentItem.date).toISOString().split('T')[0] : null,
                account_id: typeof currentItem.account === 'object' ? currentItem.account?.id : currentItem.account || null,
                amount: debitVal > 0 ? debitVal : creditVal,
                type: debitVal > 0 ? 'Debit' : 'Credit'
            };

            if (isEdit) {
                const { error } = await supabase.from('journal_entries').update(payload).eq('id', currentItem.id);
                if (error) throw error;
                showToast('success', 'نجاح', 'تم تحديث القيد');
            } else {
                const { error } = await supabase.from('journal_entries').insert([payload]);
                if (error) throw error;
                showToast('success', 'نجاح', 'تم إضافة قيد جديد');
            }
            setDialogVisible(false);
            fetchItems();
        } catch (error) {
            console.error('Save error:', error);
            showToast('error', 'خطأ', 'فشل في حفظ البيانات');
        }
    };

    const deleteItem = async () => {
        try {
            const { error } = await supabase.from('journal_entries').delete().eq('id', currentItem.id);
            if (error) throw error;
            showToast('success', 'نجاح', 'تم حذف القيد بنجاح');
            setDeleteDialogVisible(false);
            fetchItems();
        } catch (error) {
            console.error('Delete error:', error);
            showToast('error', 'خطأ', 'فشل عملية الحذف');
        }
    };

    const actionBodyTemplate = (rowData) => (
        <div className="flex gap-2">
            <Button icon="pi pi-pencil" rounded text severity="info" onClick={() => editItem(rowData)} />
            <Button icon="pi pi-trash" rounded text severity="danger" onClick={() => confirmDelete(rowData)} />
        </div>
    );

    const header = (
        <div className="flex flex-wrap gap-2 items-center justify-between w-full">
            <h4 className="m-0 text-xl font-bold text-white">القيود اليومية (Journal Entries)</h4>
            <div className="flex items-center gap-4">
                <span className="p-input-icon-right">
                    <i className="pi pi-search" />
                    <InputText type="search" onInput={(e) => setGlobalFilter(e.target.value)} placeholder="ابحث..." className="w-64 bg-slate-800 text-white border-slate-700" />
                </span>
                <Button label="إضافة قيد" icon="pi pi-plus" severity="success" onClick={openNew} />
            </div>
        </div>
    );

    return (
        <div className="w-full flex flex-col gap-6 p-2 page-fade-in" dir="rtl">
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg w-full">
                <DataTable value={items || []} paginator rows={10} dataKey="id" filterDisplay="row" loading={loading} globalFilter={globalFilter} header={header} emptyMessage="لا يوجد قيود." className="p-datatable-sm custom-dark-table" stripedRows>
                    <Column field="id" header="رقم القيد" sortable style={{ width: '10%' }}></Column>
                    <Column field="date" header="التاريخ" sortable style={{ width: '15%' }}></Column>
                    <Column field="description" header="البيان" sortable style={{ width: '35%' }}></Column>
                    <Column field="debit" header="مدين" sortable style={{ width: '15%' }} body={(r) => `$${r.debit}`}></Column>
                    <Column field="credit" header="دائن" sortable style={{ width: '15%' }} body={(r) => `$${r.credit}`}></Column>
                    <Column body={actionBodyTemplate} exportable={false} style={{ width: '10%' }}></Column>
                </DataTable>
            </div>

            <Dialog visible={dialogVisible} style={{ width: '450px' }} header={isEdit ? "تعديل القيد" : "إضافة قيد جديد"} modal className="p-fluid" onHide={() => setDialogVisible(false)} dir="rtl">
                <div className="field mt-4">
                    <label htmlFor="date" className="font-bold">التاريخ</label>
                    <InputText id="date" type="date" value={currentItem.date} onChange={(e) => setCurrentItem({...currentItem, date: e.target.value})} />
                </div>
                <div className="field mt-4">
                    <label htmlFor="description" className="font-bold">البيان</label>
                    <InputText id="description" value={currentItem.description} onChange={(e) => setCurrentItem({...currentItem, description: e.target.value})} required autoFocus />
                </div>
                <div className="field mt-4">
                    <label htmlFor="debit" className="font-bold">مدين</label>
                    <InputNumber id="debit" value={currentItem.debit} onValueChange={(e) => setCurrentItem({...currentItem, debit: e.value})} mode="currency" currency="USD" locale="en-US" />
                </div>
                <div className="field mt-4">
                    <label htmlFor="credit" className="font-bold">دائن</label>
                    <InputNumber id="credit" value={currentItem.credit} onValueChange={(e) => setCurrentItem({...currentItem, credit: e.value})} mode="currency" currency="USD" locale="en-US" />
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <Button label="إلغاء" icon="pi pi-times" outlined onClick={() => setDialogVisible(false)} />
                    <Button label="حفظ" icon="pi pi-check" onClick={saveItem} />
                </div>
            </Dialog>

            <Dialog visible={deleteDialogVisible} style={{ width: '450px' }} header="تأكيد الحذف" modal onHide={() => setDeleteDialogVisible(false)} dir="rtl">
                <div className="flex items-center justify-center gap-4 py-4">
                    <i className="pi pi-exclamation-triangle text-red-500" style={{ fontSize: '2rem' }} />
                    <span>هل أنت متأكد من حذف هذا القيد؟</span>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                    <Button label="إلغاء" icon="pi pi-times" outlined onClick={() => setDeleteDialogVisible(false)} />
                    <Button label="حذف" icon="pi pi-trash" severity="danger" onClick={deleteItem} />
                </div>
            </Dialog>
        </div>
    );
};

export default JournalEntries;
