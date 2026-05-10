import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { useToast } from '../context/ToastContext';

const Employees = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [globalFilter, setGlobalFilter] = useState('');
    const [dialogVisible, setDialogVisible] = useState(false);
    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [currentItem, setCurrentItem] = useState({ full_name: '', position: '', salary: 0, hire_date: '' });
    const [isEdit, setIsEdit] = useState(false);

    const { showToast } = useToast();

    const fetchEmployees = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('employees')
            .select('*')
            .order('id', { ascending: true });

        if (error) {
            console.error('Error fetching employees:', error);
            showToast('error', 'خطأ', 'فشل جلب بيانات الموظفين');
        } else {
            setEmployees(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    const openNew = () => {
        setCurrentItem({ full_name: '', position: '', salary: 0, hire_date: '' });
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
        if (!currentItem.full_name?.trim()) {
            showToast('warn', 'تحذير', 'اسم الموظف مطلوب');
            return;
        }

        try {
            const payload = {
                full_name: currentItem.full_name,
                position: typeof currentItem.position === 'object' ? currentItem.position?.id : currentItem.position || '',
                salary: parseFloat(String(currentItem.salary || 0).replace(/[^0-9.-]+/g, "")),
                hire_date: currentItem.hire_date ? new Date(currentItem.hire_date).toISOString().split('T')[0] : null
            };

            if (isEdit) {
                const { error } = await supabase.from('employees').update(payload).eq('id', currentItem.id);
                if (error) throw error;
                showToast('success', 'نجاح', 'تم تحديث بيانات الموظف');
            } else {
                const { error } = await supabase.from('employees').insert([payload]);
                if (error) throw error;
                showToast('success', 'نجاح', 'تم إضافة موظف جديد');
            }
            
            setDialogVisible(false);
            fetchEmployees();
        } catch (error) {
            console.error('Save error:', error);
            showToast('error', 'خطأ', 'فشل في حفظ البيانات');
        }
    };

    const deleteItem = async () => {
        try {
            const { error } = await supabase.from('employees').delete().eq('id', currentItem.id);
            if (error) throw error;
            showToast('success', 'نجاح', 'تم حذف الموظف بنجاح');
            setDeleteDialogVisible(false);
            fetchEmployees();
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
            <h4 className="m-0 text-xl font-bold text-white">إدارة الموظفين</h4>
            <div className="flex items-center gap-4">
                <span className="p-input-icon-right">
                    <i className="pi pi-search" />
                    <InputText
                        type="search"
                        onInput={(e) => setGlobalFilter(e.target.value)}
                        placeholder="ابحث عن موظف..."
                        className="w-64 bg-slate-800 text-white border-slate-700"
                    />
                </span>
                <Button label="إضافة موظف" icon="pi pi-plus" severity="success" onClick={openNew} />
            </div>
        </div>
    );

    return (
        <div className="w-full flex flex-col gap-6 p-2 page-fade-in" dir="rtl">
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg w-full">
                <DataTable
                    value={employees || []}
                    paginator rows={10} dataKey="id"
                    loading={loading} globalFilter={globalFilter} header={header}
                    emptyMessage="لا يوجد موظفين مسجلين."
                    className="p-datatable-sm custom-dark-table" stripedRows
                >
                    <Column field="id" header="الرقم" sortable style={{ width: '10%' }}></Column>
                    <Column field="full_name" header="الاسم الكامل" sortable style={{ width: '25%' }}></Column>
                    <Column field="position" header="المنصب" sortable style={{ width: '20%' }}></Column>
                    <Column field="salary" header="الراتب" sortable style={{ width: '15%' }}></Column>
                    <Column field="hire_date" header="تاريخ التعيين" sortable style={{ width: '20%' }}></Column>
                    <Column body={actionBodyTemplate} exportable={false} style={{ width: '10%' }}></Column>
                </DataTable>
            </div>


            <Dialog visible={dialogVisible} style={{ width: '450px' }} header={isEdit ? "تعديل موظف" : "إضافة موظف"} modal className="p-fluid" onHide={hideDialog} dir="rtl">
                <div className="field mt-4">
                    <label htmlFor="full_name" className="font-bold">الاسم الكامل</label>
                    <InputText id="full_name" value={currentItem.full_name} onChange={(e) => setCurrentItem({...currentItem, full_name: e.target.value})} required autoFocus />
                </div>
                <div className="field mt-4">
                    <label htmlFor="position" className="font-bold">المنصب</label>
                    <InputText id="position" value={currentItem.position} onChange={(e) => setCurrentItem({...currentItem, position: e.target.value})} />
                </div>
                <div className="field mt-4">
                    <label htmlFor="salary" className="font-bold">الراتب</label>
                    <InputNumber id="salary" value={currentItem.salary} onValueChange={(e) => setCurrentItem({...currentItem, salary: e.value})} mode="currency" currency="USD" locale="en-US" />
                </div>
                <div className="field mt-4">
                    <label htmlFor="hire_date" className="font-bold">تاريخ التعيين</label>
                    <InputText id="hire_date" type="date" value={currentItem.hire_date} onChange={(e) => setCurrentItem({...currentItem, hire_date: e.target.value})} />
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <Button label="إلغاء" icon="pi pi-times" outlined onClick={hideDialog} />
                    <Button label="حفظ" icon="pi pi-check" onClick={saveItem} />
                </div>
            </Dialog>

            <Dialog visible={deleteDialogVisible} style={{ width: '450px' }} header="تأكيد الحذف" modal onHide={hideDeleteDialog} dir="rtl">
                <div className="flex items-center justify-center gap-4 py-4">
                    <i className="pi pi-exclamation-triangle text-red-500" style={{ fontSize: '2rem' }} />
                    <span>هل أنت متأكد من حذف המوظف <b>{currentItem.full_name}</b>؟</span>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                    <Button label="إلغاء" icon="pi pi-times" outlined onClick={hideDeleteDialog} />
                    <Button label="حذف" icon="pi pi-trash" severity="danger" onClick={deleteItem} />
                </div>
            </Dialog>
        </div>
    );
};

export default Employees;
