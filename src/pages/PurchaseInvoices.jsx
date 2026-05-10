import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { useToast } from '../context/ToastContext';

const PurchaseInvoices = () => {
    const [items, setItems] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [globalFilter, setGlobalFilter] = useState('');
    const [dialogVisible, setDialogVisible] = useState(false);
    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [currentItem, setCurrentItem] = useState({ supplier_id: null, date: '', total_amount: 0, status: 'Pending' });
    const [isEdit, setIsEdit] = useState(false);

    const { showToast } = useToast();

    const fetchData = async () => {
        setLoading(true);
        // User requested to use suppliers(name) instead of suppliers(company)
        const { data, error } = await supabase
            .from('purchase_invoices')
            .select('*, suppliers(name)')
            .order('id', { ascending: false });

        if (error) {
            console.error('Error fetching purchase invoices:', error);
            // Suppress error toast to handle empty table gracefully
        } else {
            setItems(data || []);
        }

        // Fetch Suppliers for Dropdown using name instead of company
        const { data: supData } = await supabase.from('suppliers').select('id, name');
        if (supData) setSuppliers(supData);
        
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    const openNew = () => {
        setCurrentItem({ supplier_id: null, date: new Date().toISOString().split('T')[0], total_amount: 0, status: 'Pending' });
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
        if (!currentItem.supplier_id) {
            showToast('warn', 'تحذير', 'يجب اختيار مورد');
            return;
        }

        try {
            const payload = {
                supplier_id: typeof currentItem.supplier_id === 'object' ? currentItem.supplier_id?.id : currentItem.supplier_id,
                invoice_date: currentItem.date ? new Date(currentItem.date).toISOString().split('T')[0] : null,
                total_amount: parseFloat(String(currentItem.total_amount || currentItem.amount || 0).replace(/[^0-9.-]+/g,"")),
                status: typeof currentItem.status === 'object' ? currentItem.status?.value : currentItem.status || 'Pending'
            };

            console.log("SENDING PURCHASE PAYLOAD:", payload);

            if (isEdit) {
                const { error } = await supabase.from('purchase_invoices').update(payload).eq('id', currentItem.id);
                if (error) console.error("SUPABASE ERROR:", error);
                if (error) throw error;
                showToast('success', 'نجاح', 'تم تحديث الفاتورة');
            } else {
                const { error } = await supabase.from('purchase_invoices').insert([payload]);
                if (error) console.error("SUPABASE ERROR:", error);
                if (error) throw error;
                showToast('success', 'نجاح', 'تم إضافة فاتورة شراء جديدة');
            }
            setDialogVisible(false);
            fetchData();
        } catch (error) {
            console.error('SUPABASE INSERT ERROR:', error);
            showToast('error', 'خطأ', 'فشل في حفظ الفاتورة');
        }
    };

    const deleteItem = async () => {
        try {
            const { error } = await supabase.from('purchase_invoices').delete().eq('id', currentItem.id);
            if (error) throw error;
            showToast('success', 'نجاح', 'تم حذف الفاتورة بنجاح');
            setDeleteDialogVisible(false);
            fetchData();
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
            <h4 className="m-0 text-xl font-bold text-white">فواتير المشتريات</h4>
            <div className="flex items-center gap-4">
                <span className="p-input-icon-right">
                    <i className="pi pi-search" />
                    <InputText type="search" onInput={(e) => setGlobalFilter(e.target.value)} placeholder="ابحث..." className="w-64 bg-slate-800 text-white border-slate-700" />
                </span>
                <Button label="إصدار فاتورة مشتريات" icon="pi pi-plus" severity="success" onClick={openNew} />
            </div>
        </div>
    );

    const statusOptions = [
        { label: 'مدفوع (Paid)', value: 'Paid' },
        { label: 'معلق (Pending)', value: 'Pending' },
        { label: 'متأخر (Overdue)', value: 'Overdue' }
    ];

    return (
        <div className="w-full flex flex-col gap-6 p-2 page-fade-in" dir="rtl">
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg w-full">
                <DataTable value={items || []} paginator rows={10} dataKey="id" filterDisplay="row" loading={loading} globalFilter={globalFilter} header={header} emptyMessage="لا يوجد فواتير مشتريات." className="p-datatable-sm custom-dark-table" stripedRows>
                    <Column field="id" header="رقم الفاتورة" sortable style={{ width: '10%' }}></Column>
                    <Column field="suppliers.name" header="المورد" sortable style={{ width: '30%' }} body={(r) => r.suppliers?.name || 'غير معروف'}></Column>
                    <Column field="date" header="التاريخ" sortable style={{ width: '20%' }}></Column>
                    <Column field="total_amount" header="المبلغ الإجمالي" sortable style={{ width: '15%' }} body={(r) => `$${r.total_amount}`}></Column>
                    <Column field="status" header="الحالة" sortable style={{ width: '15%' }}></Column>
                    <Column body={actionBodyTemplate} exportable={false} style={{ width: '10%' }}></Column>
                </DataTable>
            </div>

            <Dialog visible={dialogVisible} style={{ width: '450px' }} header={isEdit ? "تعديل الفاتورة" : "إصدار فاتورة مشتريات"} modal className="p-fluid" onHide={() => setDialogVisible(false)} dir="rtl">
                <div className="field mt-4">
                    <label htmlFor="supplier_id" className="font-bold">المورد</label>
                    <Dropdown id="supplier_id" value={currentItem.supplier_id} options={suppliers} optionLabel="name" optionValue="id" onChange={(e) => setCurrentItem({...currentItem, supplier_id: e.value})} placeholder="اختر المورد" filter required />
                </div>
                <div className="field mt-4">
                    <label htmlFor="date" className="font-bold">التاريخ</label>
                    <InputText id="date" type="date" value={currentItem.date} onChange={(e) => setCurrentItem({...currentItem, date: e.target.value})} />
                </div>
                <div className="field mt-4">
                    <label htmlFor="total_amount" className="font-bold">المبلغ الإجمالي</label>
                    <InputNumber id="total_amount" value={currentItem.total_amount} onValueChange={(e) => setCurrentItem({...currentItem, total_amount: e.value})} mode="currency" currency="USD" locale="en-US" />
                </div>
                <div className="field mt-4">
                    <label htmlFor="status" className="font-bold">الحالة</label>
                    <Dropdown id="status" value={currentItem.status} options={statusOptions} onChange={(e) => setCurrentItem({...currentItem, status: e.value})} placeholder="اختر الحالة" />
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <Button label="إلغاء" icon="pi pi-times" outlined onClick={() => setDialogVisible(false)} />
                    <Button label="حفظ" icon="pi pi-check" onClick={saveItem} />
                </div>
            </Dialog>

            <Dialog visible={deleteDialogVisible} style={{ width: '450px' }} header="تأكيد الحذف" modal onHide={() => setDeleteDialogVisible(false)} dir="rtl">
                <div className="flex items-center justify-center gap-4 py-4">
                    <i className="pi pi-exclamation-triangle text-red-500" style={{ fontSize: '2rem' }} />
                    <span>هل أنت متأكد من حذف هذه الفاتورة؟</span>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                    <Button label="إلغاء" icon="pi pi-times" outlined onClick={() => setDeleteDialogVisible(false)} />
                    <Button label="حذف" icon="pi pi-trash" severity="danger" onClick={deleteItem} />
                </div>
            </Dialog>
        </div>
    );
};

export default PurchaseInvoices;
