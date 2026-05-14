import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { useToast } from '../context/ToastContext';

const ChartOfAccounts = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [globalFilter, setGlobalFilter] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [currentItem, setCurrentItem] = useState({ account_name: '', account_type: '', balance: 0 });
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

        const { data, error } = await supabase
            .from('chart_of_accounts')
            .select('*')
            .eq('user_id', user.id)
            .order('id', { ascending: false });

        if (error) {
            console.error('Error fetching accounts:', error);
        } else {
            setItems(data || []);
        }
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    const openNew = () => {
        setCurrentItem({ account_name: '', account_type: '', balance: 0 });
        setIsEdit(false);
        setShowModal(true);
    };

    const editItem = (item) => {
        setCurrentItem({ ...item });
        setIsEdit(true);
        setShowModal(true);
    };

    const confirmDelete = (item) => {
        setCurrentItem(item);
        setDeleteDialogVisible(true);
    };

    const saveItem = async () => {
        if (!currentItem.account_name?.trim()) {
            showToast('warn', 'تحذير', 'اسم الحساب مطلوب');
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const payload = {
                account_name: currentItem.account_name,
                account_type: currentItem.account_type,
                balance: parseFloat(String(currentItem.balance || 0).replace(/[^0-9.-]+/g,"")),
                user_id: user.id
            };

            if (isEdit) {
                const { error } = await supabase.from('chart_of_accounts').update(payload).eq('id', currentItem.id);
                if (error) throw error;
                showToast('success', 'نجاح', 'تم تحديث الحساب');
            } else {
                const { error } = await supabase.from('chart_of_accounts').insert([payload]);
                if (error) throw error;
                showToast('success', 'نجاح', 'تم إضافة حساب جديد');
            }
            setShowModal(false);
            fetchData();
        } catch (error) {
            console.error('SUPABASE INSERT ERROR:', error);
            showToast('error', 'خطأ', 'فشل في حفظ البيانات');
        }
    };

    const deleteItem = async () => {
        try {
            const { error } = await supabase.from('chart_of_accounts').delete().eq('id', currentItem.id);
            if (error) throw error;
            showToast('success', 'نجاح', 'تم حذف الحساب بنجاح');
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
            <h4 className="m-0 text-xl font-bold text-white">دليل الحسابات</h4>
            <div className="flex items-center gap-4">
                <span className="p-input-icon-right">
                    <i className="pi pi-search" />
                    <InputText type="search" onInput={(e) => setGlobalFilter(e.target.value)} placeholder="ابحث..." className="w-64 bg-slate-800 text-white border-slate-700" />
                </span>
                <Button label="إضافة حساب" icon="pi pi-plus" severity="success" onClick={openNew} />
            </div>
        </div>
    );

    return (
        <div className="w-full flex flex-col gap-6 p-2 page-fade-in" dir="rtl">
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg w-full">
                <DataTable value={items || []} paginator rows={10} dataKey="id" filterDisplay="row" loading={loading} globalFilter={globalFilter} header={header} emptyMessage="لا يوجد حسابات." className="p-datatable-sm custom-dark-table" stripedRows>
                    <Column field="id" header="الرقم" sortable style={{ width: '10%' }}></Column>
                    <Column field="account_name" header="اسم الحساب" sortable style={{ width: '30%' }}></Column>
                    <Column field="account_type" header="النوع" sortable style={{ width: '25%' }}></Column>
                    <Column field="balance" header="الرصيد" sortable style={{ width: '20%' }} body={(r) => `$${r.balance || 0}`}></Column>
                    <Column body={actionBodyTemplate} exportable={false} style={{ width: '15%' }}></Column>
                </DataTable>
            </div>

            <Dialog visible={showModal} style={{ width: '450px' }} header={isEdit ? "تعديل الحساب" : "إضافة حساب جديد"} modal className="p-fluid" onHide={() => setShowModal(false)} dir="rtl">
                <div className="field mt-4">
                    <label htmlFor="account_name" className="font-bold">اسم الحساب</label>
                    <InputText id="account_name" value={currentItem.account_name} onChange={(e) => setCurrentItem({...currentItem, account_name: e.target.value})} required autoFocus />
                </div>
                <div className="field mt-4">
                    <label htmlFor="account_type" className="font-bold">النوع (أصول، خصوم...)</label>
                    <InputText id="account_type" value={currentItem.account_type} onChange={(e) => setCurrentItem({...currentItem, account_type: e.target.value})} />
                </div>
                <div className="field mt-4">
                    <label htmlFor="balance" className="font-bold">الرصيد</label>
                    <InputNumber id="balance" value={currentItem.balance} onValueChange={(e) => setCurrentItem({...currentItem, balance: e.value})} mode="currency" currency="USD" locale="en-US" />
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <Button label="إلغاء" icon="pi pi-times" outlined onClick={() => setShowModal(false)} />
                    <Button label="حفظ" icon="pi pi-check" onClick={saveItem} />
                </div>
            </Dialog>

            <Dialog visible={deleteDialogVisible} style={{ width: '450px' }} header="تأكيد الحذف" modal onHide={() => setDeleteDialogVisible(false)} dir="rtl">
                <div className="flex items-center justify-center gap-4 py-4">
                    <i className="pi pi-exclamation-triangle text-red-500" style={{ fontSize: '2rem' }} />
                    <span>هل أنت متأكد من حذف هذا الحساب؟</span>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                    <Button label="إلغاء" icon="pi pi-times" outlined onClick={() => setDeleteDialogVisible(false)} />
                    <Button label="حذف" icon="pi pi-trash" severity="danger" onClick={deleteItem} />
                </div>
            </Dialog>
        </div>
    );
};

export default ChartOfAccounts;
