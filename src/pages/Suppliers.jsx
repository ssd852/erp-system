import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { useToast } from '../context/ToastContext';
import SqlInsight from '../components/SqlInsight';

const Suppliers = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [globalFilter, setGlobalFilter] = useState('');
    const [dialogVisible, setDialogVisible] = useState(false);
    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [currentItem, setCurrentItem] = useState({ name: '', contact_person: '', phone: '', email: '' });
    const [isEdit, setIsEdit] = useState(false);

    const { showToast } = useToast();

    const fetchSuppliers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('suppliers')
            .select('*')
            .order('id', { ascending: true });

        if (error) {
            console.error('Error fetching suppliers:', error);
            showToast('error', 'خطأ', 'فشل جلب بيانات الموردين');
        } else {
            setSuppliers(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const openNew = () => {
        setCurrentItem({ name: '', contact_person: '', phone: '', email: '' });
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
        if (!currentItem.name?.trim()) {
            showToast('warn', 'تحذير', 'اسم المورد مطلوب');
            return;
        }

        try {
            const payload = {
                name: currentItem.name,
                contact_person: currentItem.contact_person,
                phone: currentItem.phone,
                email: currentItem.email
            };

            if (isEdit) {
                const { error } = await supabase.from('suppliers').update(payload).eq('id', currentItem.id);
                if (error) throw error;
                showToast('success', 'نجاح', 'تم تحديث بيانات المورد');
            } else {
                const { error } = await supabase.from('suppliers').insert([payload]);
                if (error) throw error;
                showToast('success', 'نجاح', 'تم إضافة مورد جديد');
            }
            
            setDialogVisible(false);
            fetchSuppliers();
        } catch (error) {
            console.error('Save error:', error);
            showToast('error', 'خطأ', 'فشل في حفظ البيانات');
        }
    };

    const deleteItem = async () => {
        try {
            const { error } = await supabase.from('suppliers').delete().eq('id', currentItem.id);
            if (error) throw error;
            showToast('success', 'نجاح', 'تم حذف المورد بنجاح');
            setDeleteDialogVisible(false);
            fetchSuppliers();
        } catch (error) {
            console.error('Delete error:', error);
            showToast('error', 'خطأ', 'فشل عملية الحذف');
        }
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
            <h4 className="m-0 text-xl font-bold text-white">إدارة الموردين</h4>
            <div className="flex items-center gap-4">
                <span className="p-input-icon-right">
                    <i className="pi pi-search" />
                    <InputText
                        type="search"
                        onInput={(e) => setGlobalFilter(e.target.value)}
                        placeholder="ابحث عن مورد..."
                        className="w-64 bg-slate-800 text-white border-slate-700"
                    />
                </span>
                <Button label="إضافة مورد" icon="pi pi-plus" severity="success" onClick={openNew} />
            </div>
        </div>
    );

    return (
        <div className="w-full flex flex-col gap-6 p-2 page-fade-in" dir="rtl">
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg w-full">
                <DataTable
                    value={suppliers}
                    paginator rows={10} dataKey="id"
                    loading={loading} globalFilter={globalFilter} header={header}
                    emptyMessage="لا يوجد موردين مسجلين."
                    className="p-datatable-sm custom-dark-table" stripedRows
                >
                    <Column field="id" header="الرقم" sortable style={{ width: '10%' }}></Column>
                    <Column field="name" header="اسم المورد" sortable style={{ width: '25%' }}></Column>
                    <Column field="contact_person" header="جهة الاتصال" sortable style={{ width: '20%' }}></Column>
                    <Column field="phone" header="الهاتف" sortable style={{ width: '15%' }}></Column>
                    <Column field="email" header="البريد الإلكتروني" sortable style={{ width: '20%' }}></Column>
                    <Column body={actionBodyTemplate} exportable={false} style={{ width: '10%' }}></Column>
                </DataTable>
            </div>

            <SqlInsight query="SELECT * FROM suppliers ORDER BY id ASC;" title="عرض استعلام قاعدة البيانات (الموردين)" />

            <Dialog visible={dialogVisible} style={{ width: '450px' }} header={isEdit ? "تعديل بيانات المورد" : "إضافة مورد جديد"} modal className="p-fluid" onHide={hideDialog} dir="rtl">
                <div className="field mt-4">
                    <label htmlFor="name" className="font-bold">اسم المورد</label>
                    <InputText id="name" value={currentItem.name} onChange={(e) => setCurrentItem({...currentItem, name: e.target.value})} required autoFocus />
                </div>
                <div className="field mt-4">
                    <label htmlFor="contact_person" className="font-bold">جهة الاتصال</label>
                    <InputText id="contact_person" value={currentItem.contact_person} onChange={(e) => setCurrentItem({...currentItem, contact_person: e.target.value})} />
                </div>
                <div className="field mt-4">
                    <label htmlFor="phone" className="font-bold">الهاتف</label>
                    <InputText id="phone" value={currentItem.phone} onChange={(e) => setCurrentItem({...currentItem, phone: e.target.value})} />
                </div>
                <div className="field mt-4">
                    <label htmlFor="email" className="font-bold">البريد الإلكتروني</label>
                    <InputText id="email" value={currentItem.email} onChange={(e) => setCurrentItem({...currentItem, email: e.target.value})} />
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <Button label="إلغاء" icon="pi pi-times" outlined onClick={hideDialog} />
                    <Button label="حفظ" icon="pi pi-check" onClick={saveItem} />
                </div>
            </Dialog>

            <Dialog visible={deleteDialogVisible} style={{ width: '450px' }} header="تأكيد الحذف" modal onHide={hideDeleteDialog} dir="rtl">
                <div className="flex items-center justify-center gap-4 py-4">
                    <i className="pi pi-exclamation-triangle text-red-500" style={{ fontSize: '2rem' }} />
                    <span>هل أنت متأكد من حذف المورد <b>{currentItem.name}</b>؟</span>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                    <Button label="إلغاء" icon="pi pi-times" outlined onClick={hideDeleteDialog} />
                    <Button label="حذف" icon="pi pi-trash" severity="danger" onClick={deleteItem} />
                </div>
            </Dialog>
        </div>
    );
};

export default Suppliers;
