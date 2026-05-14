import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { useToast } from '../context/ToastContext';

const FixedAssets = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [globalFilter, setGlobalFilter] = useState('');
    const [dialogVisible, setDialogVisible] = useState(false);
    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [currentItem, setCurrentItem] = useState({ asset_name: '', purchase_date: '', value: 0, depreciation: 0, salvage_value: 0, useful_life_years: 0, depreciation_method: 'Straight Line' });
    const [isEdit, setIsEdit] = useState(false);

    const { showToast } = useToast();

    const fetchItems = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            showToast('error', 'خطأ', 'الرجاء تسجيل الدخول أولاً');
            setLoading(false);
            return;
        }

        const { data, error } = await supabase
            .from('fixed_assets')
            .select('*')
            .eq('user_id', user.id)
            .order('id', { ascending: true });
        if (error) {
            console.error('Error fetching assets:', error);
            if (error.code !== 'PGRST116') {
                // Ignore missing table error initially
            }
        } else {
            setItems(data || []);
        }
        setLoading(false);
    };

    useEffect(() => { fetchItems(); }, []);

    const openNew = () => {
        setCurrentItem({ asset_name: '', purchase_date: new Date().toISOString().split('T')[0], value: 0, depreciation: 0, salvage_value: 0, useful_life_years: 0, depreciation_method: 'Straight Line' });
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
        if (!currentItem.asset_name?.trim()) {
            showToast('warn', 'تحذير', 'اسم الأصل مطلوب');
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const payload = {
                asset_name: currentItem.asset_name,
                purchase_date: currentItem.purchase_date ? new Date(currentItem.purchase_date).toISOString().split('T')[0] : null,
                value: parseFloat(String(currentItem.value || 0).replace(/[^0-9.-]+/g, "")),
                depreciation_rate: parseFloat(String(currentItem.depreciation || 0).replace(/[^0-9.-]+/g, "")),
                salvage_value: parseFloat(String(currentItem.salvage_value || 0).replace(/[^0-9.-]+/g, "")),
                useful_life_years: parseFloat(String(currentItem.useful_life_years || 0).replace(/[^0-9.-]+/g, "")),
                depreciation_method: currentItem.depreciation_method || 'Straight Line',
                user_id: user.id
            };

            if (isEdit) {
                const { error } = await supabase.from('fixed_assets').update(payload).eq('id', currentItem.id);
                if (error) throw error;
                showToast('success', 'نجاح', 'تم تحديث الأصل');
            } else {
                const { error } = await supabase.from('fixed_assets').insert([payload]);
                if (error) throw error;
                showToast('success', 'نجاح', 'تم إضافة أصل جديد');
            }
            setDialogVisible(false);
            fetchItems();
        } catch (error) {
            console.error('SUPABASE INSERT ERROR:', error);
            showToast('error', 'خطأ', 'فشل في حفظ البيانات');
        }
    };

    const deleteItem = async () => {
        try {
            const { error } = await supabase.from('fixed_assets').delete().eq('id', currentItem.id);
            if (error) throw error;
            showToast('success', 'نجاح', 'تم حذف الأصل بنجاح');
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
            <h4 className="m-0 text-xl font-bold text-white">الأصول الثابتة</h4>
            <div className="flex items-center gap-4">
                <span className="p-input-icon-right">
                    <i className="pi pi-search" />
                    <InputText type="search" onInput={(e) => setGlobalFilter(e.target.value)} placeholder="ابحث..." className="w-64 bg-slate-800 text-white border-slate-700" />
                </span>
                <Button label="إضافة أصل" icon="pi pi-plus" severity="success" onClick={openNew} />
            </div>
        </div>
    );

    return (
        <div className="w-full flex flex-col gap-6 p-2 page-fade-in" dir="rtl">
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg w-full">
                <DataTable value={items || []} paginator rows={10} dataKey="id" filterDisplay="row" loading={loading} globalFilter={globalFilter} header={header} emptyMessage="لا توجد أصول مسجلة." className="p-datatable-sm custom-dark-table" stripedRows>
                    <Column field="id" header="الرقم" sortable style={{ width: '5%' }}></Column>
                    <Column field="asset_name" header="اسم الأصل" sortable style={{ width: '25%' }}></Column>
                    <Column field="purchase_date" header="تاريخ الشراء" sortable style={{ width: '15%' }}></Column>
                    <Column field="value" header="القيمة" sortable style={{ width: '10%' }} body={(r) => `$${r.value}`}></Column>
                    <Column field="salvage_value" header="قيمة الخردة" sortable style={{ width: '10%' }} body={(r) => `$${r.salvage_value || 0}`}></Column>
                    <Column field="depreciation_method" header="طريقة الإهلاك" sortable style={{ width: '15%' }}></Column>
                    <Column field="useful_life_years" header="العمر (سنوات)" sortable style={{ width: '10%' }}></Column>
                    <Column body={actionBodyTemplate} exportable={false} style={{ width: '10%' }}></Column>
                </DataTable>
            </div>

            <Dialog visible={dialogVisible} style={{ width: '450px' }} header={isEdit ? "تعديل الأصل" : "إضافة أصل جديد"} modal className="p-fluid" onHide={() => setDialogVisible(false)} dir="rtl">
                <div className="field mt-4">
                    <label htmlFor="asset_name" className="font-bold">اسم الأصل</label>
                    <InputText id="asset_name" value={currentItem.asset_name} onChange={(e) => setCurrentItem({...currentItem, asset_name: e.target.value})} required autoFocus />
                </div>
                <div className="field mt-4">
                    <label htmlFor="purchase_date" className="font-bold">تاريخ الشراء</label>
                    <InputText id="purchase_date" type="date" value={currentItem.purchase_date} onChange={(e) => setCurrentItem({...currentItem, purchase_date: e.target.value})} />
                </div>
                <div className="field mt-4">
                    <label htmlFor="value" className="font-bold">القيمة</label>
                    <InputNumber id="value" value={currentItem.value} onValueChange={(e) => setCurrentItem({...currentItem, value: e.value})} mode="currency" currency="USD" locale="en-US" />
                </div>
                <div className="field mt-4">
                    <label htmlFor="salvage_value" className="font-bold">قيمة الخردة (الخردة)</label>
                    <InputNumber id="salvage_value" value={currentItem.salvage_value} onValueChange={(e) => setCurrentItem({...currentItem, salvage_value: e.value})} mode="currency" currency="USD" locale="en-US" />
                </div>
                <div className="field mt-4">
                    <label htmlFor="useful_life_years" className="font-bold">العمر الإنتاجي (سنوات)</label>
                    <InputNumber id="useful_life_years" value={currentItem.useful_life_years} onValueChange={(e) => setCurrentItem({...currentItem, useful_life_years: e.value})} />
                </div>
                <div className="field mt-4">
                    <label htmlFor="depreciation_method" className="font-bold">طريقة الإهلاك</label>
                    <InputText id="depreciation_method" value={currentItem.depreciation_method} onChange={(e) => setCurrentItem({...currentItem, depreciation_method: e.target.value})} />
                </div>
                <div className="field mt-4">
                    <label htmlFor="depreciation" className="font-bold">الإهلاك الحالي</label>
                    <InputNumber id="depreciation" value={currentItem.depreciation} onValueChange={(e) => setCurrentItem({...currentItem, depreciation: e.value})} mode="currency" currency="USD" locale="en-US" />
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <Button label="إلغاء" icon="pi pi-times" outlined onClick={() => setDialogVisible(false)} />
                    <Button label="حفظ" icon="pi pi-check" onClick={saveItem} />
                </div>
            </Dialog>

            <Dialog visible={deleteDialogVisible} style={{ width: '450px' }} header="تأكيد الحذف" modal onHide={() => setDeleteDialogVisible(false)} dir="rtl">
                <div className="flex items-center justify-center gap-4 py-4">
                    <i className="pi pi-exclamation-triangle text-red-500" style={{ fontSize: '2rem' }} />
                    <span>هل أنت متأكد من حذف هذا الأصل <b>{currentItem.asset_name}</b>؟</span>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                    <Button label="إلغاء" icon="pi pi-times" outlined onClick={() => setDeleteDialogVisible(false)} />
                    <Button label="حذف" icon="pi pi-trash" severity="danger" onClick={deleteItem} />
                </div>
            </Dialog>
        </div>
    );
};

export default FixedAssets;
