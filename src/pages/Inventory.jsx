import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { useToast } from '../context/ToastContext';

const Inventory = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [globalFilter, setGlobalFilter] = useState('');
    const [dialogVisible, setDialogVisible] = useState(false);
    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [currentItem, setCurrentItem] = useState({ name: '', category: '', price: 0, stock: 0 });
    const [isEdit, setIsEdit] = useState(false);

    const { showToast } = useToast();

    const fetchItems = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('inventory').select('*').order('id', { ascending: true });
        if (error) {
            console.error('Error fetching inventory:', error);
            showToast('error', 'خطأ', 'فشل جلب بيانات المخزون');
        } else {
            setItems(data || []);
        }
        setLoading(false);
    };

    useEffect(() => { fetchItems(); }, []);

    const openNew = () => {
        setCurrentItem({ name: '', category: '', price: 0, stock: 0 });
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
        if (!currentItem.name?.trim()) {
            showToast('warn', 'تحذير', 'اسم المنتج مطلوب');
            return;
        }

        try {
            const payload = {
                name: currentItem.name,
                category: typeof currentItem.category === 'object' ? currentItem.category?.id : currentItem.category || '',
                price: parseFloat(String(currentItem.price || 0).replace(/[^0-9.-]+/g, "")),
                stock: parseInt(String(currentItem.stock || 0).replace(/[^0-9.-]+/g, ""), 10)
            };

            if (isEdit) {
                const { error } = await supabase.from('inventory').update(payload).eq('id', currentItem.id);
                if (error) throw error;
                showToast('success', 'نجاح', 'تم تحديث المنتج');
            } else {
                const { error } = await supabase.from('inventory').insert([payload]);
                if (error) throw error;
                showToast('success', 'نجاح', 'تم إضافة منتج جديد');
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
            const { error } = await supabase.from('inventory').delete().eq('id', currentItem.id);
            if (error) throw error;
            showToast('success', 'نجاح', 'تم حذف المنتج بنجاح');
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
            <h4 className="m-0 text-xl font-bold text-white">إدارة المخزون</h4>
            <div className="flex items-center gap-4">
                <span className="p-input-icon-right">
                    <i className="pi pi-search" />
                    <InputText type="search" onInput={(e) => setGlobalFilter(e.target.value)} placeholder="ابحث..." className="w-64 bg-slate-800 text-white border-slate-700" />
                </span>
                <Button label="إضافة منتج" icon="pi pi-plus" severity="success" onClick={openNew} />
            </div>
        </div>
    );

    return (
        <div className="w-full flex flex-col gap-6 p-2 page-fade-in" dir="rtl">
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg w-full">
                <DataTable value={items || []} paginator rows={10} dataKey="id" filterDisplay="row" loading={loading} globalFilter={globalFilter} header={header} emptyMessage="لا يوجد بيانات." className="p-datatable-sm custom-dark-table" stripedRows>
                    <Column field="id" header="الرقم" sortable style={{ width: '10%' }}></Column>
                    <Column field="name" header="اسم المنتج" sortable style={{ width: '30%' }}></Column>
                    <Column field="category" header="الفئة" sortable style={{ width: '20%' }}></Column>
                    <Column field="price" header="السعر" sortable style={{ width: '15%' }} body={(r) => `$${r.price}`}></Column>
                    <Column field="stock" header="الكمية" sortable style={{ width: '15%' }}></Column>
                    <Column body={actionBodyTemplate} exportable={false} style={{ width: '10%' }}></Column>
                </DataTable>
            </div>

            <Dialog visible={dialogVisible} style={{ width: '450px' }} header={isEdit ? "تعديل المنتج" : "إضافة منتج جديد"} modal className="p-fluid" onHide={() => setDialogVisible(false)} dir="rtl">
                <div className="field mt-4">
                    <label htmlFor="name" className="font-bold">اسم المنتج</label>
                    <InputText id="name" value={currentItem.name} onChange={(e) => setCurrentItem({...currentItem, name: e.target.value})} required autoFocus />
                </div>
                <div className="field mt-4">
                    <label htmlFor="category" className="font-bold">الفئة</label>
                    <InputText id="category" value={currentItem.category} onChange={(e) => setCurrentItem({...currentItem, category: e.target.value})} />
                </div>
                <div className="field mt-4">
                    <label htmlFor="price" className="font-bold">السعر</label>
                    <InputNumber id="price" value={currentItem.price} onValueChange={(e) => setCurrentItem({...currentItem, price: e.value})} mode="currency" currency="USD" locale="en-US" />
                </div>
                <div className="field mt-4">
                    <label htmlFor="stock" className="font-bold">الكمية</label>
                    <InputNumber id="stock" value={currentItem.stock} onValueChange={(e) => setCurrentItem({...currentItem, stock: e.value})} />
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <Button label="إلغاء" icon="pi pi-times" outlined onClick={() => setDialogVisible(false)} />
                    <Button label="حفظ" icon="pi pi-check" onClick={saveItem} />
                </div>
            </Dialog>

            <Dialog visible={deleteDialogVisible} style={{ width: '450px' }} header="تأكيد الحذف" modal onHide={() => setDeleteDialogVisible(false)} dir="rtl">
                <div className="flex items-center justify-center gap-4 py-4">
                    <i className="pi pi-exclamation-triangle text-red-500" style={{ fontSize: '2rem' }} />
                    <span>هل أنت متأكد من حذف المنتج <b>{currentItem.name}</b>؟</span>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                    <Button label="إلغاء" icon="pi pi-times" outlined onClick={() => setDeleteDialogVisible(false)} />
                    <Button label="حذف" icon="pi pi-trash" severity="danger" onClick={deleteItem} />
                </div>
            </Dialog>
        </div>
    );
};

export default Inventory;
