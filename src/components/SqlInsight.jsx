import React, { useState } from 'react';

const SqlInsight = ({ query, title = "عرض استعلام SQL" }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="mt-4 mb-2">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors text-sm font-bold shadow-sm"
            >
                <i className={`pi ${isOpen ? 'pi-chevron-up' : 'pi-chevron-down'}`}></i>
                <i className="pi pi-database text-blue-400"></i>
                {title}
            </button>

            {isOpen && (
                <div className="mt-3 p-4 bg-[#0d1117] border border-slate-700 rounded-xl shadow-inner animate-fade-in relative overflow-hidden">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500"></div>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">Raw SQL Query</span>
                        <i className="pi pi-code text-slate-500"></i>
                    </div>
                    <pre className="text-sm font-mono text-emerald-400 whitespace-pre-wrap leading-relaxed" dir="ltr">
                        {query}
                    </pre>
                </div>
            )}
        </div>
    );
};

export default SqlInsight;
