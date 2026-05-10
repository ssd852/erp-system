import React, { useState } from 'react';
import { supabase } from '../config/supabaseClient';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import PrintWrapper from '../components/PrintWrapper';

const Reports = () => {
  const [printData, setPrintData] = useState([]);
  const [printColumns, setPrintColumns] = useState([]);
  const [printTitle, setPrintTitle] = useState('تقرير عام');

  const handlePrint = async (tableName, title, columnsDef) => {
    try {
      const { data, error } = await supabase.from(tableName).select('*');
      if (error) throw error;
      setPrintData(data || []);
      setPrintColumns(columnsDef);
      setPrintTitle(title);
      
      // Wait for React to render the hidden PrintWrapper, then trigger print
      setTimeout(() => {
        window.print();
      }, 500);
    } catch (err) {
      console.error('Error preparing print:', err);
      alert('لا توجد بيانات متاحة لهذا التقرير حالياً أو حدث خطأ في الاتصال.');
    }
  };

  const reportsList = [
    { 
      title: 'تقرير المخزون', 
      table: 'inventory', 
      icon: 'pi pi-box',
      cols: [
        { field: 'id', header: 'الرقم', type: 'number' },
        { field: 'name', header: 'اسم المنتج', type: 'string' },
        { field: 'category', header: 'الفئة', type: 'string' },
        { field: 'price', header: 'السعر', type: 'number' },
        { field: 'stock', header: 'الكمية', type: 'number' }
      ]
    },
    { 
      title: 'تقرير المبيعات والفواتير', 
      table: 'invoices', 
      icon: 'pi pi-file',
      cols: [
        { field: 'id', header: 'رقم الفاتورة', type: 'number' },
        { field: 'customer', header: 'العميل', type: 'string' },
        { field: 'date', header: 'التاريخ', type: 'string' },
        { field: 'amount', header: 'المبلغ', type: 'number' },
        { field: 'status', header: 'الحالة', type: 'string' }
      ]
    },
    { 
      title: 'تقرير مسيرات الرواتب', 
      table: 'payroll', 
      icon: 'pi pi-money-bill',
      cols: [
        { field: 'employee_name', header: 'الموظف', type: 'string' },
        { field: 'month', header: 'الشهر', type: 'string' },
        { field: 'net_salary', header: 'صافي الراتب', type: 'number' }
      ]
    },
    { 
      title: 'سجل القيود اليومية', 
      table: 'journal_entries', 
      icon: 'pi pi-book',
      cols: [
        { field: 'id', header: 'رقم القيد', type: 'number' },
        { field: 'date', header: 'التاريخ', type: 'string' },
        { field: 'description', header: 'البيان', type: 'string' },
        { field: 'debit', header: 'مدين', type: 'number' },
        { field: 'credit', header: 'دائن', type: 'number' }
      ]
    }
  ];

  return (
    <div className="flex flex-col gap-6 print:hidden" dir="rtl">
      <Card title="مركز التقارير الشامل" className="shadow-sm border border-slate-200">
        <div className="text-slate-600 mb-6">
          يمكنك من خلال هذه الشاشة استخراج التقارير الرسمية والطباعة لجميع وحدات النظام بضغطة زر واحدة.
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {reportsList.map((report, index) => (
            <Card key={index} className="border border-slate-100 hover:shadow-md transition-shadow">
              <div className="flex flex-col items-center text-center gap-4 py-4">
                <i className={`${report.icon} text-5xl text-indigo-500`}></i>
                <h3 className="text-lg font-bold text-slate-800">{report.title}</h3>
                <Button 
                  label="طباعة التقرير" 
                  icon="pi pi-print" 
                  severity="secondary" 
                  className="w-full"
                  onClick={() => handlePrint(report.table, report.title, report.cols)}
                />
              </div>
            </Card>
          ))}
        </div>
      </Card>

      <PrintWrapper data={printData} columns={printColumns} title={printTitle} />
    </div>
  );
};

export default Reports;
