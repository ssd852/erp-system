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

const Invoices = () => {
    const [items, setItems] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [globalFilter, setGlobalFilter] = useState('');
    const [dialogVisible, setDialogVisible] = useState(false);
    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [currentItem, setCurrentItem] = useState({ customer_id: null, date: '', total_amount: 0, status: 'Pending', tax_rate: 0, due_date: '', amount_paid: 0 });
    const [isEdit, setIsEdit] = useState(false);

    const { showToast } = useToast();

    const fetchData = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            showToast('error', 'خطأ', 'الرجاء تسجيل الدخول أولاً');
            setLoading(false);
            return;
        }

        // Fetch Invoices and Join Customers for display
        const { data, error } = await supabase
            .from('invoices')
            .select('*, customers(name)')
            .eq('user_id', user.id)
            .order('id', { ascending: false });

        if (error) {
            console.error('Error fetching invoices:', error);
            // Ignore error toast if it's just empty/missing relation in dev
            if (error.code !== 'PGRST116') {
                // showToast('error', 'خطأ', 'فشل جلب الفواتير');
            }
        } else {
            setItems(data || []);
        }

        // Fetch Customers for Dropdown
        const { data: custData } = await supabase.from('customers').select('id, name');
        if (custData) setCustomers(custData);
        
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    const openNew = () => {
        setCurrentItem({ customer_id: null, date: new Date().toISOString().split('T')[0], total_amount: 0, status: 'Pending', tax_rate: 0, due_date: '', amount_paid: 0 });
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
        if (!currentItem.customer_id) {
            showToast('warn', 'تحذير', 'يجب اختيار عميل');
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const payload = {
                customer_id: typeof currentItem.customer_id === 'object' ? currentItem.customer_id?.id : currentItem.customer_id,
                invoice_date: currentItem.date ? new Date(currentItem.date).toISOString().split('T')[0] : null,
                total_amount: parseFloat(String(currentItem.total_amount || currentItem.amount || 0).replace(/[^0-9.-]+/g,"")),
                status: typeof currentItem.status === 'object' ? currentItem.status?.value : currentItem.status || 'Pending',
                tax_rate: parseFloat(String(currentItem.tax_rate || 0).replace(/[^0-9.-]+/g,"")),
                due_date: currentItem.due_date ? new Date(currentItem.due_date).toISOString().split('T')[0] : null,
                amount_paid: parseFloat(String(currentItem.amount_paid || 0).replace(/[^0-9.-]+/g,"")),
                user_id: user.id
            };
            
            console.log("SENDING INVOICE PAYLOAD:", payload);

            if (isEdit) {
                const { error } = await supabase.from('invoices').update(payload).eq('id', currentItem.id);
                if (error) console.error("SUPABASE ERROR:", error);
                if (error) throw error;
                showToast('success', 'نجاح', 'تم تحديث الفاتورة');
            } else {
                const { error } = await supabase.from('invoices').insert([payload]);
                if (error) console.error("SUPABASE ERROR:", error);
                if (error) throw error;
                showToast('success', 'نجاح', 'تم إضافة فاتورة جديدة');
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
            const { error } = await supabase.from('invoices').delete().eq('id', currentItem.id);
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
            <h4 className="m-0 text-xl font-bold text-white">إدارة المبيعات (الفواتير)</h4>
            <div className="flex items-center gap-4">
                <span className="p-input-icon-right">
                    <i className="pi pi-search" />
                    <InputText type="search" onInput={(e) => setGlobalFilter(e.target.value)} placeholder="ابحث..." className="w-64 bg-slate-800 text-white border-slate-700" />
                </span>
                <Button label="إصدار فاتورة" icon="pi pi-plus" severity="success" onClick={openNew} />
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
                <DataTable value={items || []} paginator rows={10} dataKey="id" filterDisplay="row" loading={loading} globalFilter={globalFilter} header={header} emptyMessage="لا يوجد فواتير." className="p-datatable-sm custom-dark-table" stripedRows>
                    <Column field="id" header="رقم الفاتورة" sortable style={{ width: '10%' }}></Column>
                    <Column field="customers.name" header="العميل" sortable style={{ width: '20%' }} body={(r) => r.customers?.name || 'غير معروف'}></Column>
                    <Column field="date" header="تاريخ الفاتورة" sortable style={{ width: '15%' }}></Column>
                    <Column field="due_date" header="تاريخ الاستحقاق" sortable style={{ width: '15%' }}></Column>
                    <Column field="total_amount" header="المبلغ الإجمالي" sortable style={{ width: '10%' }} body={(r) => `$${r.total_amount}`}></Column>
                    <Column field="amount_paid" header="المبلغ المدفوع" sortable style={{ width: '10%' }} body={(r) => `$${r.amount_paid || 0}`}></Column>
                    <Column field="status" header="الحالة" sortable style={{ width: '10%' }}></Column>
                    <Column body={actionBodyTemplate} exportable={false} style={{ width: '10%' }}></Column>
                </DataTable>
            </div>

            <Dialog visible={dialogVisible} style={{ width: '450px' }} header={isEdit ? "تعديل الفاتورة" : "إصدار فاتورة جديدة"} modal className="p-fluid" onHide={() => setDialogVisible(false)} dir="rtl">
                <div className="field mt-4">
                    <label htmlFor="customer_id" className="font-bold">العميل</label>
                    <Dropdown id="customer_id" value={currentItem.customer_id} options={customers} optionLabel="name" optionValue="id" onChange={(e) => setCurrentItem({...currentItem, customer_id: e.value})} placeholder="اختر العميل" filter required />
                </div>
                <div className="field mt-4">
                    <label htmlFor="date" className="font-bold">تاريخ الفاتورة</label>
                    <InputText id="date" type="date" value={currentItem.date} onChange={(e) => setCurrentItem({...currentItem, date: e.target.value})} />
                </div>
                <div className="field mt-4">
                    <label htmlFor="due_date" className="font-bold">تاريخ الاستحقاق</label>
                    <InputText id="due_date" type="date" value={currentItem.due_date} onChange={(e) => setCurrentItem({...currentItem, due_date: e.target.value})} />
                </div>
                <div className="field mt-4">
                    <label htmlFor="total_amount" className="font-bold">المبلغ الإجمالي</label>
                    <InputNumber id="total_amount" value={currentItem.total_amount} onValueChange={(e) => setCurrentItem({...currentItem, total_amount: e.value})} mode="currency" currency="USD" locale="en-US" />
                </div>
                <div className="field mt-4">
                    <label htmlFor="tax_rate" className="font-bold">نسبة الضريبة (%)</label>
                    <InputNumber id="tax_rate" value={currentItem.tax_rate} onValueChange={(e) => setCurrentItem({...currentItem, tax_rate: e.value})} />
                </div>
                <div className="field mt-4">
                    <label htmlFor="amount_paid" className="font-bold">المبلغ المدفوع</label>
                    <InputNumber id="amount_paid" value={currentItem.amount_paid} onValueChange={(e) => setCurrentItem({...currentItem, amount_paid: e.value})} mode="currency" currency="USD" locale="en-US" />
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

export default Invoices;
