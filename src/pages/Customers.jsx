import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { useToast } from '../context/ToastContext';

const Customers = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [globalFilter, setGlobalFilter] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [currentItem, setCurrentItem] = useState({ name: '', email: '', phone: '', address: '', city: '', balance: 0 });
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
            .from('customers')
            .select('*')
            .eq('user_id', user.id)
            .order('id', { ascending: false });

        if (error) {
            console.error('Error fetching customers:', error);
            if (error.code !== 'PGRST116') {
                // showToast('error', 'خطأ', 'فشل جلب العملاء');
            }
        } else {
            setItems(data || []);
        }
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    const openNew = () => {
        setCurrentItem({ name: '', email: '', phone: '', address: '', city: '', balance: 0 });
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
        if (!currentItem.name?.trim()) {
            showToast('warn', 'تحذير', 'اسم العميل مطلوب');
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const payload = {
                name: currentItem.name,
                email: currentItem.email,
                phone: currentItem.phone,
                address: currentItem.address,
                city: currentItem.city,
                balance: parseFloat(String(currentItem.balance || 0).replace(/[^0-9.-]+/g,"")),
                user_id: user.id
            };

            if (isEdit) {
                const { error } = await supabase.from('customers').update(payload).eq('id', currentItem.id);
                if (error) throw error;
                showToast('success', 'نجاح', 'تم تحديث بيانات العميل');
            } else {
                const { error } = await supabase.from('customers').insert([payload]);
                if (error) throw error;
                showToast('success', 'نجاح', 'تم إضافة عميل جديد');
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
            const { error } = await supabase.from('customers').delete().eq('id', currentItem.id);
            if (error) throw error;
            showToast('success', 'نجاح', 'تم حذف العميل بنجاح');
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
            <h4 className="m-0 text-xl font-bold text-white">إدارة العملاء</h4>
            <div className="flex items-center gap-4">
                <span className="p-input-icon-right">
                    <i className="pi pi-search" />
                    <InputText type="search" onInput={(e) => setGlobalFilter(e.target.value)} placeholder="ابحث..." className="w-64 bg-slate-800 text-white border-slate-700" />
                </span>
                <Button label="إضافة عميل" icon="pi pi-plus" severity="success" onClick={openNew} />
            </div>
        </div>
    );

    return (
        <div className="w-full flex flex-col gap-6 p-2 page-fade-in" dir="rtl">
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg w-full">
                <DataTable value={items || []} paginator rows={10} dataKey="id" filterDisplay="row" loading={loading} globalFilter={globalFilter} header={header} emptyMessage="لا يوجد عملاء." className="p-datatable-sm custom-dark-table" stripedRows>
                    <Column field="id" header="الرقم" sortable style={{ width: '10%' }}></Column>
                    <Column field="name" header="الاسم" sortable style={{ width: '20%' }}></Column>
                    <Column field="phone" header="الهاتف" sortable style={{ width: '15%' }}></Column>
                    <Column field="email" header="البريد الإلكتروني" sortable style={{ width: '20%' }}></Column>
                    <Column field="city" header="المدينة" sortable style={{ width: '15%' }}></Column>
                    <Column field="balance" header="الرصيد" sortable style={{ width: '10%' }} body={(r) => `$${r.balance || 0}`}></Column>
                    <Column body={actionBodyTemplate} exportable={false} style={{ width: '10%' }}></Column>
                </DataTable>
            </div>

            <Dialog visible={showModal} style={{ width: '450px' }} header={isEdit ? "تعديل بيانات العميل" : "إضافة عميل جديد"} modal className="p-fluid" onHide={() => setShowModal(false)} dir="rtl">
                <div className="field mt-4">
                    <label htmlFor="name" className="font-bold">اسم العميل</label>
                    <InputText id="name" value={currentItem.name} onChange={(e) => setCurrentItem({...currentItem, name: e.target.value})} required autoFocus />
                </div>
                <div className="field mt-4">
                    <label htmlFor="phone" className="font-bold">الهاتف</label>
                    <InputText id="phone" value={currentItem.phone} onChange={(e) => setCurrentItem({...currentItem, phone: e.target.value})} />
                </div>
                <div className="field mt-4">
                    <label htmlFor="email" className="font-bold">البريد الإلكتروني</label>
                    <InputText id="email" type="email" value={currentItem.email} onChange={(e) => setCurrentItem({...currentItem, email: e.target.value})} />
                </div>
                <div className="field mt-4">
                    <label htmlFor="city" className="font-bold">المدينة</label>
                    <InputText id="city" value={currentItem.city} onChange={(e) => setCurrentItem({...currentItem, city: e.target.value})} />
                </div>
                <div className="field mt-4">
                    <label htmlFor="address" className="font-bold">العنوان</label>
                    <InputText id="address" value={currentItem.address} onChange={(e) => setCurrentItem({...currentItem, address: e.target.value})} />
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
                    <span>هل أنت متأكد من حذف هذا العميل؟</span>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                    <Button label="إلغاء" icon="pi pi-times" outlined onClick={() => setDeleteDialogVisible(false)} />
                    <Button label="حذف" icon="pi pi-trash" severity="danger" onClick={deleteItem} />
                </div>
            </Dialog>
        </div>
    );
};

export default Customers;