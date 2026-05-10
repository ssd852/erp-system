import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { useToast } from '../context/ToastContext';

const Customers = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [globalFilter, setGlobalFilter] = useState('');
    const [dialogVisible, setDialogVisible] = useState(false);
    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [currentCustomer, setCurrentCustomer] = useState({ name: '', email: '', phone: '' });
    const [isEdit, setIsEdit] = useState(false);

    const { showToast } = useToast();

    const fetchCustomers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .order('id', { ascending: true });

        if (error) {
            console.error('Error fetching customers:', error);
            showToast('error', 'خطأ', 'فشل جلب بيانات العملاء');
        } else {
            setCustomers(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const openNew = () => {
        setCurrentCustomer({ name: '', email: '', phone: '' });
        setIsEdit(false);
        setDialogVisible(true);
    };

    const editCustomer = (customer) => {
        setCurrentCustomer({ ...customer });
        setIsEdit(true);
        setDialogVisible(true);
    };

    const confirmDelete = (customer) => {
        setCurrentCustomer(customer);
        setDeleteDialogVisible(true);
    };

    const hideDialog = () => setDialogVisible(false);
    const hideDeleteDialog = () => setDeleteDialogVisible(false);

    const saveCustomer = async () => {
        if (!currentCustomer.name.trim()) {
            showToast('warn', 'تحذير', 'اسم العميل مطلوب');
            return;
        }

        try {
            if (isEdit) {
                // Update
                const { error } = await supabase
                    .from('customers')
                    .update({
                        name: currentCustomer.name,
                        email: currentCustomer.email,
                        phone: currentCustomer.phone
                    })
                    .eq('id', currentCustomer.id);

                if (error) throw error;
                showToast('success', 'نجاح', 'تم تحديث بيانات العميل');
            } else {
                // Insert
                const { error } = await supabase
                    .from('customers')
                    .insert([{
                        name: currentCustomer.name,
                        email: currentCustomer.email,
                        phone: currentCustomer.phone
                    }]);

                if (error) throw error;
                showToast('success', 'نجاح', 'تم إضافة عميل جديد');
            }
            
            setDialogVisible(false);
            fetchCustomers();
        } catch (error) {
            console.error('Save error:', error);
            showToast('error', 'خطأ', 'فشل في حفظ البيانات');
        }
    };

    const deleteCustomer = async () => {
        try {
            const { error } = await supabase
                .from('customers')
                .delete()
                .eq('id', currentCustomer.id);

            if (error) throw error;
            showToast('success', 'نجاح', 'تم حذف العميل بنجاح');
            setDeleteDialogVisible(false);
            fetchCustomers();
        } catch (error) {
            console.error('Delete error:', error);
            showToast('error', 'خطأ', 'فشل عملية الحذف');
        }
    };

    const actionBodyTemplate = (rowData) => {
        return (
            <div className="flex gap-2">
                <Button icon="pi pi-pencil" rounded text severity="info" onClick={() => editCustomer(rowData)} />
                <Button icon="pi pi-trash" rounded text severity="danger" onClick={() => confirmDelete(rowData)} />
            </div>
        );
    };

    const header = (
        <div className="flex flex-wrap gap-2 items-center justify-between w-full">
            <h4 className="m-0 text-xl font-bold text-white">إدارة العملاء</h4>
            <div className="flex items-center gap-4">
                <span className="p-input-icon-right">
                    <i className="pi pi-search" />
                    <InputText
                        type="search"
                        onInput={(e) => setGlobalFilter(e.target.value)}
                        placeholder="ابحث عن عميل..."
                        className="w-64 bg-slate-800 text-white border-slate-700"
                    />
                </span>
                <Button label="إضافة عميل" icon="pi pi-plus" severity="success" onClick={openNew} />
            </div>
        </div>
    );

    return (
        <div className="w-full flex flex-col gap-6 p-2 page-fade-in" dir="rtl">
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg w-full">
                <DataTable
                    value={customers}
                    paginator
                    rows={10}
                    dataKey="id"
                    filterDisplay="row"
                    loading={loading}
                    globalFilter={globalFilter}
                    header={header}
                    emptyMessage="لا يوجد عملاء مسجلين."
                    className="p-datatable-sm custom-dark-table"
                    stripedRows
                >
                    <Column field="id" header="الرقم" sortable style={{ width: '10%' }}></Column>
                    <Column field="name" header="الاسم" sortable style={{ width: '30%' }}></Column>
                    <Column field="phone" header="الهاتف" style={{ width: '25%' }}></Column>
                    <Column field="email" header="البريد الإلكتروني" style={{ width: '25%' }}></Column>
                    <Column body={actionBodyTemplate} exportable={false} style={{ width: '10%' }}></Column>
                </DataTable>
            </div>

            {/* Save Dialog */}
            <Dialog visible={dialogVisible} style={{ width: '450px' }} header={isEdit ? "تعديل بيانات العميل" : "إضافة عميل جديد"} modal className="p-fluid" onHide={hideDialog} dir="rtl">
                <div className="field mt-4">
                    <label htmlFor="name" className="font-bold">الاسم</label>
                    <InputText id="name" value={currentCustomer.name} onChange={(e) => setCurrentCustomer({...currentCustomer, name: e.target.value})} required autoFocus />
                </div>
                <div className="field mt-4">
                    <label htmlFor="phone" className="font-bold">الهاتف</label>
                    <InputText id="phone" value={currentCustomer.phone} onChange={(e) => setCurrentCustomer({...currentCustomer, phone: e.target.value})} />
                </div>
                <div className="field mt-4">
                    <label htmlFor="email" className="font-bold">البريد الإلكتروني</label>
                    <InputText id="email" value={currentCustomer.email} onChange={(e) => setCurrentCustomer({...currentCustomer, email: e.target.value})} />
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <Button label="إلغاء" icon="pi pi-times" outlined onClick={hideDialog} />
                    <Button label="حفظ" icon="pi pi-check" onClick={saveCustomer} />
                </div>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog visible={deleteDialogVisible} style={{ width: '450px' }} header="تأكيد الحذف" modal onHide={hideDeleteDialog} dir="rtl">
                <div className="flex items-center justify-center gap-4 py-4">
                    <i className="pi pi-exclamation-triangle text-red-500" style={{ fontSize: '2rem' }} />
                    <span>هل أنت متأكد من حذف العميل <b>{currentCustomer.name}</b>؟</span>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                    <Button label="إلغاء" icon="pi pi-times" outlined onClick={hideDeleteDialog} />
                    <Button label="حذف" icon="pi pi-trash" severity="danger" onClick={deleteCustomer} />
                </div>
            </Dialog>
        </div>
    );
};

export default Customers;
