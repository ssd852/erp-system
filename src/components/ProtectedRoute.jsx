import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase, supabaseReady } from '../config/supabaseClient';

const ProtectedRoute = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(null);
    const location = useLocation();

    useEffect(() => {
        // If ENV is missing, allow access (fallback for dev/demo mode)
        if (!supabaseReady) {
            setIsAuthenticated(true);
            return;
        }

        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setIsAuthenticated(!!session);
        };

        checkAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            setIsAuthenticated(!!session);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Show a sleek loading state while checking session
    if (isAuthenticated === null) {
        return (
            <div className="min-h-screen bg-[#0B1120] flex items-center justify-center font-sans" dir="rtl">
                <div className="flex flex-col items-center gap-4 animate-pulse">
                    <div className="w-16 h-16 rounded-full border-4 border-slate-700 border-t-emerald-500 animate-spin"></div>
                    <p className="text-slate-400 font-bold text-sm">جاري التحقق من الصلاحيات...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        // Redirect to login but save the attempted URL
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

export default ProtectedRoute;
