import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#0B1120] flex items-center justify-center relative overflow-hidden font-sans" dir="rtl">
            {/* Ambient Background Glows */}
            <div className="absolute top-[20%] left-[20%] w-96 h-96 bg-red-600/20 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[20%] right-[20%] w-96 h-96 bg-orange-600/20 rounded-full blur-[120px] pointer-events-none"></div>

            {/* Glassmorphism Card */}
            <div className="z-10 w-full max-w-lg p-10 bg-slate-900/60 backdrop-blur-2xl border border-slate-700/50 rounded-3xl shadow-2xl text-center transform transition-all animate-fade-in">
                
                {/* 404 Header */}
                <div className="mb-8">
                    <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-red-500 to-orange-400 mb-4 drop-shadow-lg">
                        404
                    </h1>
                    <h2 className="text-2xl font-bold text-white mb-2">عفواً، الصفحة غير موجودة!</h2>
                    <p className="text-slate-400 text-sm">يبدو أنك تائه في الفضاء الرقمي. الصفحة التي تبحث عنها غير موجودة أو تم نقلها.</p>
                </div>

                {/* Back to Home Button */}
                <button 
                    onClick={() => navigate('/')}
                    className="relative group overflow-hidden rounded-xl p-[1px] inline-block transition-all hover:shadow-[0_0_20px_rgba(249,115,22,0.3)]"
                >
                    <span className="absolute inset-0 bg-gradient-to-r from-red-500 via-orange-500 to-red-500 rounded-xl opacity-70 group-hover:opacity-100 transition-opacity duration-300"></span>
                    <div className="relative flex items-center justify-center gap-2 bg-slate-900 px-8 py-3 rounded-xl transition-all duration-300 group-hover:bg-opacity-0">
                        <i className="pi pi-home text-white"></i>
                        <span className="text-white font-bold text-lg">العودة للرئيسية</span>
                    </div>
                </button>
            </div>
        </div>
    );
};

export default NotFound;
