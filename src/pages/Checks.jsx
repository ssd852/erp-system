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
import SqlInsight from '../components/SqlInsight';

const Checks = () => {
    const [checks, setChecks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [globalFilter, setGlobalFilter] = useState('');
    const [dialogVisible, setDialogVisible] = useState(false);
    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [currentItem, setCurrentItem] = useState({ check_number: '', amount: 0, due_date: '', bank_name: '', status: 'Pending' });
    const [isEdit, setIsEdit] = useState(false);

    const { showToast } = useToast();

    const statusOptions = [
        { label: 'قيد الانتظار', value: 'Pending' },
        { label: 'مصروف', value: 'Cleared' },
        { label: 'مرتجع', value: 'Bounced' },
        { label: 'ملغى', value: 'Cancelled' }
    ];

    const fetchChecks = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('checks')
            .select('*')
            .order('id', { ascending: true });

        if (error) {
            console.error('Error fetching checks:', error);
            showToast('error', 'خطأ', 'فشل جلب بيانات الشيكات');
        } else {
            setChecks(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchChecks();
    }, []);

    const openNew = () => {
        setCurrentItem({ check_number: '', amount: 0, due_date: '', bank_name: '', status: 'Pending' });
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

    const hideDialog = () => setDialogVisible(false);
    const hideDeleteDialog = () => setDeleteDialogVisible(false);

    const saveItem = async () => {
        if (!currentItem.check_number?.trim()) {
            showToast('warn', 'تحذير', 'رقم الشيك مطلوب');
            return;
        }

        try {
            const payload = {
                check_number: currentItem.check_number,
                amount: parseFloat(String(currentItem.amount || 0).replace(/[^0-9.-]+/g, "")),
                due_date: currentItem.due_date ? new Date(currentItem.due_date).toISOString().split('T')[0] : null,
                bank_name: currentItem.bank_name || '',
                status: typeof currentItem.status === 'object' ? currentItem.status?.value : currentItem.status || 'Pending'
            };

            if (isEdit) {
                const { error } = await supabase.from('checks').update(payload).eq('id', currentItem.id);
                if (error) throw error;
                showToast('success', 'نجاح', 'تم تحديث بيانات الشيك');
            } else {
                const { error } = await supabase.from('checks').insert([payload]);
                if (error) throw error;
                showToast('success', 'نجاح', 'تم إضافة شيك جديد');
            }
            
            setDialogVisible(false);
            fetchChecks();
        } catch (error) {
            console.error('Save error:', error);
            showToast('error', 'خطأ', 'فشل في حفظ البيانات');
        }
    };

    const deleteItem = async () => {
        try {
            const { error } = await supabase.from('checks').delete().eq('id', currentItem.id);
            if (error) throw error;
            showToast('success', 'نجاح', 'تم حذف الشيك بنجاح');
            setDeleteDialogVisible(false);
            fetchChecks();
        } catch (error) {
            console.error('Delete error:', error);
            showToast('error', 'خطأ', 'فشل عملية الحذف');
        }
    };

    const statusBodyTemplate = (rowData) => {
        let severity = 'info';
        let text = rowData.status;
        
        switch (rowData.status) {
            case 'Cleared': severity = 'success'; text = 'مصروف'; break;
            case 'Bounced': severity = 'danger'; text = 'مرتجع'; break;
            case 'Cancelled': severity = 'warning'; text = 'ملغى'; break;
            case 'Pending': severity = 'info'; text = 'قيد الانتظار'; break;
            default: text = rowData.status || 'غير محدد';
        }

        return <span className={`px-2 py-1 rounded-md text-xs border border-${severity}-500/50 bg-${severity}-500/10 text-${severity}-400`}>{text}</span>;
    };

    const actionBodyTemplate = (rowData) => {
        return (
            <div className="flex gap-2">
                <Button icon="pi pi-pencil" rounded text severity="info" onClick={() => editItem(rowData)} />
                <Button icon="pi pi-trash" rounded text severity="danger" onClick={() => confirmDelete(rowData)} />
            </div>
        );
    };

    const header = (
        <div className="flex flex-wrap gap-2 items-center justify-between w-full">
            <h4 className="m-0 text-xl font-bold text-white">إدارة الشيكات</h4>
            <div className="flex items-center gap-4">
                <span className="p-input-icon-right">
                    <i className="pi pi-search" />
                    <InputText
                        type="search"
                        onInput={(e) => setGlobalFilter(e.target.value)}
                        placeholder="ابحث عن شيك..."
                        className="w-64 bg-slate-800 text-white border-slate-700"
                    />
                </span>
                <Button label="إضافة شيك" icon="pi pi-plus" severity="success" onClick={openNew} />
            </div>
        </div>
    );

    return (
        <div className="w-full flex flex-col gap-6 p-2 page-fade-in" dir="rtl">
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg w-full">
                <DataTable
                    value={checks || []}
                    paginator rows={10} dataKey="id"
                    loading={loading} globalFilter={globalFilter} header={header}
                    emptyMessage="لا توجد شيكات مسجلة."
                    className="p-datatable-sm custom-dark-table" stripedRows
                >
                    <Column field="id" header="الرقم" sortable style={{ width: '10%' }}></Column>
                    <Column field="check_number" header="رقم الشيك" sortable style={{ width: '20%' }}></Column>
                    <Column field="bank_name" header="البنك" sortable style={{ width: '15%' }}></Column>
                    <Column field="amount" header="المبلغ" sortable style={{ width: '15%' }}></Column>
                    <Column field="due_date" header="تاريخ الاستحقاق" sortable style={{ width: '15%' }}></Column>
                    <Column field="status" header="الحالة" sortable body={statusBodyTemplate} style={{ width: '15%' }}></Column>
                    <Column body={actionBodyTemplate} exportable={false} style={{ width: '10%' }}></Column>
                </DataTable>
            </div>

            <SqlInsight query="SELECT * FROM checks ORDER BY id ASC;" title="عرض استعلام قاعدة البيانات (الشيكات)" />

            <Dialog visible={dialogVisible} style={{ width: '450px' }} header={isEdit ? "تعديل بيانات الشيك" : "إضافة شيك جديد"} modal className="p-fluid" onHide={hideDialog} dir="rtl">
                <div className="field mt-4">
                    <label htmlFor="check_number" className="font-bold">رقم الشيك</label>
                    <InputText id="check_number" value={currentItem.check_number} onChange={(e) => setCurrentItem({...currentItem, check_number: e.target.value})} required autoFocus />
                </div>
                <div className="field mt-4">
                    <label htmlFor="bank_name" className="font-bold">البنك</label>
                    <InputText id="bank_name" value={currentItem.bank_name} onChange={(e) => setCurrentItem({...currentItem, bank_name: e.target.value})} />
                </div>
                <div className="field mt-4">
                    <label htmlFor="amount" className="font-bold">المبلغ</label>
                    <InputNumber id="amount" value={currentItem.amount} onValueChange={(e) => setCurrentItem({...currentItem, amount: e.value})} mode="currency" currency="USD" locale="en-US" />
                </div>
                <div className="field mt-4">
                    <label htmlFor="due_date" className="font-bold">تاريخ الاستحقاق</label>
                    <InputText id="due_date" type="date" value={currentItem.due_date} onChange={(e) => setCurrentItem({...currentItem, due_date: e.target.value})} />
                </div>
                <div className="field mt-4">
                    <label htmlFor="status" className="font-bold">الحالة</label>
                    <Dropdown id="status" value={currentItem.status} options={statusOptions} onChange={(e) => setCurrentItem({...currentItem, status: e.value})} placeholder="اختر الحالة" />
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <Button label="إلغاء" icon="pi pi-times" outlined onClick={hideDialog} />
                    <Button label="حفظ" icon="pi pi-check" onClick={saveItem} />
                </div>
            </Dialog>

            <Dialog visible={deleteDialogVisible} style={{ width: '450px' }} header="تأكيد الحذف" modal onHide={hideDeleteDialog} dir="rtl">
                <div className="flex items-center justify-center gap-4 py-4">
                    <i className="pi pi-exclamation-triangle text-red-500" style={{ fontSize: '2rem' }} />
                    <span>هل أنت متأكد من حذف الشيك <b>{currentItem.check_number}</b>؟</span>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                    <Button label="إلغاء" icon="pi pi-times" outlined onClick={hideDeleteDialog} />
                    <Button label="حذف" icon="pi pi-trash" severity="danger" onClick={deleteItem} />
                </div>
            </Dialog>
        </div>
    );
};

export default Checks;
