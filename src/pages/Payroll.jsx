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

const Payroll = () => {
    const [items, setItems] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [globalFilter, setGlobalFilter] = useState('');
    const [dialogVisible, setDialogVisible] = useState(false);
    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [currentItem, setCurrentItem] = useState({ employee_id: null, month: '', basic_salary: 0, deductions: 0, net_salary: 0 });
    const [isEdit, setIsEdit] = useState(false);

    const { showToast } = useToast();

    const fetchData = async () => {
        setLoading(true);
        // Fetch Payroll and Join Employees using full_name
        const { data, error } = await supabase
            .from('payroll')
            .select('*, employees(full_name)')
            .order('id', { ascending: false });

        if (error) {
            console.error('Error fetching payroll:', error);
            // Suppress error toast to handle empty table gracefully
        } else {
            setItems(data || []);
        }

        // Fetch Employees for Dropdown using full_name
        const { data: empData } = await supabase.from('employees').select('id, full_name');
        if (empData) setEmployees(empData);
        
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    // Calculate net salary automatically when basic or deductions change
    useEffect(() => {
        setCurrentItem(prev => ({
            ...prev,
            net_salary: (prev.basic_salary || 0) - (prev.deductions || 0)
        }));
    }, [currentItem.basic_salary, currentItem.deductions]);

    const openNew = () => {
        setCurrentItem({ employee_id: null, month: '', basic_salary: 0, deductions: 0, net_salary: 0 });
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
        if (!currentItem.employee_id) {
            showToast('warn', 'تحذير', 'يجب اختيار موظف');
            return;
        }

        try {
            const payload = {
                employee_id: typeof currentItem.employee_id === 'object' ? currentItem.employee_id?.id : currentItem.employee_id,
                month: currentItem.month || '',
                basic_salary: parseFloat(String(currentItem.basic_salary || 0).replace(/[^0-9.-]+/g, "")),
                deductions: parseFloat(String(currentItem.deductions || 0).replace(/[^0-9.-]+/g, "")),
                net_salary: parseFloat(String(currentItem.net_salary || 0).replace(/[^0-9.-]+/g, ""))
            };

            if (isEdit) {
                const { error } = await supabase.from('payroll').update(payload).eq('id', currentItem.id);
                if (error) throw error;
                showToast('success', 'نجاح', 'تم تحديث الراتب');
            } else {
                const { error } = await supabase.from('payroll').insert([payload]);
                if (error) throw error;
                showToast('success', 'نجاح', 'تم إضافة مسير راتب جديد');
            }
            setDialogVisible(false);
            fetchData();
        } catch (error) {
            console.error('SUPABASE INSERT ERROR:', error);
            showToast('error', 'خطأ', 'فشل في حفظ الراتب');
        }
    };

    const deleteItem = async () => {
        try {
            const { error } = await supabase.from('payroll').delete().eq('id', currentItem.id);
            if (error) throw error;
            showToast('success', 'نجاح', 'تم حذف مسير الراتب بنجاح');
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
            <h4 className="m-0 text-xl font-bold text-white">مسيرات الرواتب (Payroll)</h4>
            <div className="flex items-center gap-4">
                <span className="p-input-icon-right">
                    <i className="pi pi-search" />
                    <InputText type="search" onInput={(e) => setGlobalFilter(e.target.value)} placeholder="ابحث..." className="w-64 bg-slate-800 text-white border-slate-700" />
                </span>
                <Button label="صرف راتب" icon="pi pi-plus" severity="success" onClick={openNew} />
            </div>
        </div>
    );

    return (
        <div className="w-full flex flex-col gap-6 p-2 page-fade-in" dir="rtl">
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg w-full">
                <DataTable value={items || []} paginator rows={10} dataKey="id" filterDisplay="row" loading={loading} globalFilter={globalFilter} header={header} emptyMessage="لا يوجد مسيرات رواتب." className="p-datatable-sm custom-dark-table" stripedRows>
                    <Column field="id" header="الرقم" sortable style={{ width: '10%' }}></Column>
                    <Column field="employees.full_name" header="الموظف" sortable style={{ width: '25%' }} body={(r) => r.employees?.full_name || 'غير معروف'}></Column>
                    <Column field="month" header="الشهر" sortable style={{ width: '15%' }}></Column>
                    <Column field="basic_salary" header="أساسي" sortable style={{ width: '15%' }} body={(r) => `$${r.basic_salary}`}></Column>
                    <Column field="deductions" header="خصومات" sortable style={{ width: '10%' }} body={(r) => `$${r.deductions}`}></Column>
                    <Column field="net_salary" header="الصافي" sortable style={{ width: '15%' }} body={(r) => `$${r.net_salary}`}></Column>
                    <Column body={actionBodyTemplate} exportable={false} style={{ width: '10%' }}></Column>
                </DataTable>
            </div>

            <Dialog visible={dialogVisible} style={{ width: '450px' }} header={isEdit ? "تعديل مسير الراتب" : "إضافة مسير راتب جديد"} modal className="p-fluid" onHide={() => setDialogVisible(false)} dir="rtl">
                <div className="field mt-4">
                    <label htmlFor="employee_id" className="font-bold">الموظف</label>
                    <Dropdown id="employee_id" value={currentItem.employee_id} options={employees} optionLabel="full_name" optionValue="id" onChange={(e) => setCurrentItem({...currentItem, employee_id: e.value})} placeholder="اختر الموظف" filter required />
                </div>
                <div className="field mt-4">
                    <label htmlFor="month" className="font-bold">الشهر</label>
                    <InputText id="month" placeholder="مثال: مايو 2026" value={currentItem.month} onChange={(e) => setCurrentItem({...currentItem, month: e.target.value})} />
                </div>
                <div className="field mt-4">
                    <label htmlFor="basic_salary" className="font-bold">الراتب الأساسي</label>
                    <InputNumber id="basic_salary" value={currentItem.basic_salary} onValueChange={(e) => setCurrentItem({...currentItem, basic_salary: e.value})} mode="currency" currency="USD" locale="en-US" />
                </div>
                <div className="field mt-4">
                    <label htmlFor="deductions" className="font-bold">الخصومات</label>
                    <InputNumber id="deductions" value={currentItem.deductions} onValueChange={(e) => setCurrentItem({...currentItem, deductions: e.value})} mode="currency" currency="USD" locale="en-US" />
                </div>
                <div className="field mt-4">
                    <label htmlFor="net_salary" className="font-bold">الصافي (يحسب تلقائياً)</label>
                    <InputNumber id="net_salary" value={currentItem.net_salary} disabled mode="currency" currency="USD" locale="en-US" />
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <Button label="إلغاء" icon="pi pi-times" outlined onClick={() => setDialogVisible(false)} />
                    <Button label="حفظ" icon="pi pi-check" onClick={saveItem} />
                </div>
            </Dialog>

            <Dialog visible={deleteDialogVisible} style={{ width: '450px' }} header="تأكيد الحذف" modal onHide={() => setDeleteDialogVisible(false)} dir="rtl">
                <div className="flex items-center justify-center gap-4 py-4">
                    <i className="pi pi-exclamation-triangle text-red-500" style={{ fontSize: '2rem' }} />
                    <span>هل أنت متأكد من حذف مسير الراتب هذا؟</span>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                    <Button label="إلغاء" icon="pi pi-times" outlined onClick={() => setDeleteDialogVisible(false)} />
                    <Button label="حذف" icon="pi pi-trash" severity="danger" onClick={deleteItem} />
                </div>
            </Dialog>
        </div>
    );
};

export default Payroll;
