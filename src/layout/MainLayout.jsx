import React from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const MainLayout = ({ children }) => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-900 text-slate-200" dir="rtl">
      
      {/* SIDEBAR CONTAINER - FIXED WIDTH */}
      <div className="w-64 flex-none h-full bg-slate-950 border-l border-slate-800 overflow-y-auto z-20">
        <Sidebar />
      </div>

      {/* MAIN CONTENT COLUMN */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative z-10">
        
        {/* TOPBAR CONTAINER - FIXED HEIGHT */}
        <div className="h-16 flex-none bg-slate-900 border-b border-slate-800">
          <Topbar />
        </div>

        {/* DYNAMIC PAGE CONTENT - SCROLLABLE */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-900">
          {children}
        </div>

      </div>
    </div>
  );
};

export default MainLayout;
