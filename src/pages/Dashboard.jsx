import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';
import { Chart } from 'primereact/chart';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({
    customers: 0,
    inventory: 0,
    invoices: 0,
    employees: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  
  const [chartData, setChartData] = useState({});
  const [chartOptions, setChartOptions] = useState({});

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        const tables = ['customers', 'inventory', 'invoices', 'employees'];
        
        // 1. Fetch exact counts concurrently
        const countsPromises = tables.map(t => supabase.from(t).select('*', { count: 'exact', head: true }));
        
        // 2. Fetch recent activity (latest 5 invoices)
        const recentActivityPromise = supabase
          .from('invoices')
          .select('*')
          .order('date', { ascending: false })
          .limit(5);
        
        const results = await Promise.all([...countsPromises, recentActivityPromise]);
        
        const newCounts = {};
        tables.forEach((t, i) => {
          newCounts[t] = results[i].count || 0;
        });
        setCounts(newCounts);
        
        const activityRes = results[4];
        if (activityRes.data && activityRes.data.length > 0) {
          setRecentActivity(activityRes.data);
        } else {
          // Fallback to customers if invoices are empty
          const { data: custData } = await supabase.from('customers').select('*').order('id', { ascending: false }).limit(5);
          if (custData && custData.length > 0) {
             setRecentActivity(custData.map(c => ({
                id: c.id,
                customer: c.name || c.company,
                date: new Date().toISOString().split('T')[0],
                amount: '-',
                status: 'New Customer'
             })));
          }
        }
      } catch (err) {
        console.error("Dashboard fetch error", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  useEffect(() => {
    const data = {
      labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو'],
      datasets: [
        {
          label: 'الإيرادات',
          data: [45000, 52000, 68000, 74000, 61000, 85000, 95000],
          fill: true,
          borderColor: '#10b981', // emerald-500
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          tension: 0.4
        },
        {
          label: 'المصروفات',
          data: [28000, 31000, 40000, 39000, 46000, 37000, 42000],
          fill: true,
          borderColor: '#f43f5e', // rose-500
          backgroundColor: 'rgba(244, 63, 94, 0.15)',
          tension: 0.4
        }
      ]
    };

    const options = {
      maintainAspectRatio: false,
      aspectRatio: 0.6,
      plugins: {
        legend: { labels: { color: '#e2e8f0', font: { family: 'inherit' } } }
      },
      scales: {
        x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
        y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
      }
    };

    setChartData(data);
    setChartOptions(options);
  }, []);

  // --- UI Helpers ---
  const renderKPIValue = (value) => {
    if (loading) {
      return (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', height: '32px' }}>
          <div style={{ width: '40px', height: '24px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', animation: 'pulse 1.5s infinite' }}></div>
        </div>
      );
    }
    return value;
  };

  const statusBodyTemplate = (rowData) => {
    const status = (rowData.status || '').toLowerCase();
    let bg = 'rgba(100, 116, 139, 0.2)';
    let color = '#cbd5e1';
    
    if (status.includes('paid') || status.includes('مدفوع')) {
      bg = 'rgba(16, 185, 129, 0.2)'; color = '#34d399';
    } else if (status.includes('pending') || status.includes('معلق')) {
      bg = 'rgba(245, 158, 11, 0.2)'; color = '#fbbf24';
    } else if (status.includes('overdue') || status.includes('متأخر')) {
      bg = 'rgba(244, 63, 94, 0.2)'; color = '#fb7185';
    } else if (status.includes('new')) {
      bg = 'rgba(56, 189, 248, 0.2)'; color = '#7dd3fc';
    }

    return (
      <span style={{ padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 'bold', background: bg, color: color }}>
        {rowData.status || 'N/A'}
      </span>
    );
  };

  const amountBodyTemplate = (rowData) => {
    if (!rowData.amount || rowData.amount === '-') return rowData.amount;
    return `$${Number(rowData.amount).toLocaleString()}`;
  };

  return (
    <div className="p-6" dir="rtl" style={{ color: '#e2e8f0', minHeight: '100vh', background: 'transparent' }}>
      
      {/* HEADER */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: '800', color: '#f8fafc', margin: 0 }}>
          نظرة عامة على النظام
        </h1>
        <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>متابعة فورية لأداء الشركة ومقاييس قاعدة البيانات</p>
      </div>

      {/* KPI CARDS (Glassmorphism) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        
        {/* Card 1: Customers */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(16px)', borderRadius: '1rem', padding: '1.5rem',
          border: '1px solid rgba(167, 139, 250, 0.2)', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'transform 0.2s', cursor: 'pointer'
        }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
          <div>
            <p style={{ margin: '0 0 0.5rem 0', color: '#94a3b8', fontSize: '0.9rem', fontWeight: '600' }}>إجمالي العملاء</p>
            <h3 style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', background: 'linear-gradient(to right, #c084fc, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {renderKPIValue(counts.customers)}
            </h3>
          </div>
          <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="pi pi-users" style={{ fontSize: '1.5rem', color: '#a78bfa', filter: 'drop-shadow(0 0 8px rgba(167, 139, 250, 0.6))' }}></i>
          </div>
        </div>

        {/* Card 2: Invoices */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(16px)', borderRadius: '1rem', padding: '1.5rem',
          border: '1px solid rgba(56, 189, 248, 0.2)', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'transform 0.2s', cursor: 'pointer'
        }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
          <div>
            <p style={{ margin: '0 0 0.5rem 0', color: '#94a3b8', fontSize: '0.9rem', fontWeight: '600' }}>الفواتير المسجلة</p>
            <h3 style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', background: 'linear-gradient(to right, #38bdf8, #2dd4bf)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {renderKPIValue(counts.invoices)}
            </h3>
          </div>
          <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="pi pi-file-invoice" style={{ fontSize: '1.5rem', color: '#38bdf8', filter: 'drop-shadow(0 0 8px rgba(56, 189, 248, 0.6))' }}></i>
          </div>
        </div>

        {/* Card 3: Inventory */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(16px)', borderRadius: '1rem', padding: '1.5rem',
          border: '1px solid rgba(16, 185, 129, 0.2)', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'transform 0.2s', cursor: 'pointer'
        }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
          <div>
            <p style={{ margin: '0 0 0.5rem 0', color: '#94a3b8', fontSize: '0.9rem', fontWeight: '600' }}>أصناف المخزون</p>
            <h3 style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', background: 'linear-gradient(to right, #34d399, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {renderKPIValue(counts.inventory)}
            </h3>
          </div>
          <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="pi pi-box" style={{ fontSize: '1.5rem', color: '#34d399', filter: 'drop-shadow(0 0 8px rgba(52, 211, 153, 0.6))' }}></i>
          </div>
        </div>

        {/* Card 4: Employees */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(16px)', borderRadius: '1rem', padding: '1.5rem',
          border: '1px solid rgba(245, 158, 11, 0.2)', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'transform 0.2s', cursor: 'pointer'
        }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
          <div>
            <p style={{ margin: '0 0 0.5rem 0', color: '#94a3b8', fontSize: '0.9rem', fontWeight: '600' }}>طاقم العمل</p>
            <h3 style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', background: 'linear-gradient(to right, #fbbf24, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {renderKPIValue(counts.employees)}
            </h3>
          </div>
          <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="pi pi-id-card" style={{ fontSize: '1.5rem', color: '#fbbf24', filter: 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.6))' }}></i>
          </div>
        </div>

      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        
        {/* CHART SECTION */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(16px)', borderRadius: '1.25rem', padding: '1.5rem',
          border: '1px solid rgba(255, 255, 255, 0.05)', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
        }}>
          <h2 style={{ fontSize: '1.25rem', margin: '0 0 1.5rem 0', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <i className="pi pi-chart-line text-emerald-400"></i>
            الأداء المالي (إيرادات مقابل مصروفات)
          </h2>
          <div style={{ height: '350px', width: '100%' }}>
            <Chart type="line" data={chartData} options={chartOptions} style={{ height: '100%' }} />
          </div>
        </div>

        {/* RECENT ACTIVITY DATATABLE */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(16px)', borderRadius: '1.25rem', padding: '1.5rem',
          border: '1px solid rgba(255, 255, 255, 0.05)', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
          display: 'flex', flexDirection: 'column'
        }}>
          <h2 style={{ fontSize: '1.25rem', margin: '0 0 1.5rem 0', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <i className="pi pi-bolt text-amber-400"></i>
            أحدث النشاطات (Recent Activity)
          </h2>
          
          <style>{`
            .custom-datatable .p-datatable-header { display: none; }
            .custom-datatable .p-datatable-thead > tr > th {
              background: rgba(0,0,0,0.2) !important;
              color: #94a3b8 !important;
              border-bottom: 1px solid rgba(255,255,255,0.05) !important;
              padding: 1rem !important;
              font-weight: 600;
            }
            .custom-datatable .p-datatable-tbody > tr {
              background: transparent !important;
              color: #e2e8f0 !important;
            }
            .custom-datatable .p-datatable-tbody > tr > td {
              border-bottom: 1px solid rgba(255,255,255,0.02) !important;
              padding: 1rem !important;
            }
            .custom-datatable .p-datatable-tbody > tr:hover {
              background: rgba(255,255,255,0.03) !important;
            }
            .custom-datatable .p-datatable-empty-message td {
              background: transparent !important;
              color: #94a3b8 !important;
              border: none !important;
              padding: 2rem !important;
            }
          `}</style>
          
          <div style={{ flex: 1, overflowX: 'auto' }}>
            <DataTable 
              value={loading ? [] : recentActivity} 
              className="custom-datatable" 
              emptyMessage={loading ? 
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', color: '#64748b' }}>
                  <i className="pi pi-spin pi-spinner text-xl"></i> جاري تحميل البيانات...
                </div> 
                : "لا توجد نشاطات مسجلة مؤخراً"
              }
            >
              <Column field="id" header="رقم المعاملة" style={{ width: '15%' }} body={(r) => <span className="text-slate-400">#{r.id}</span>}></Column>
              <Column field="customer" header="الطرف المعني" style={{ width: '35%', fontWeight: 'bold' }}></Column>
              <Column field="date" header="التاريخ" style={{ width: '20%' }}></Column>
              <Column field="amount" header="المبلغ" style={{ width: '15%' }} body={amountBodyTemplate}></Column>
              <Column field="status" header="الحالة" style={{ width: '15%' }} body={statusBodyTemplate}></Column>
            </DataTable>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
