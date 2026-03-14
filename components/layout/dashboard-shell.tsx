// components/layout/dashboard-shell.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { HostNotifier } from '@/components/dashboard/host-notifier';
import { cn } from '@/lib/utils';

interface DashboardShellProps {
    sidebar: React.ReactNode;
    header: React.ReactNode;
    children: React.ReactNode;
    restaurantId: string | null;
}

export function DashboardShell({ sidebar, header, children, restaurantId }: DashboardShellProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const pathname = usePathname();

    // Close sidebar when navigating on mobile
    useEffect(() => {
        setIsSidebarOpen(false);
    }, [pathname]);

    return (
        <div className="flex h-screen overflow-hidden bg-transparent">
            {/* Sidebar Overlay (Mobile only) */}
            <div
                className={cn(
                    "fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm lg:hidden transition-opacity duration-300",
                    isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={() => setIsSidebarOpen(false)}
            />

            {/* Sidebar Wrapper */}
            <div
                className={cn(
                    "fixed inset-y-0 left-0 z-[70] w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 bg-background",
                    isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {React.isValidElement(sidebar) && React.cloneElement(sidebar as React.ReactElement<any>, {
                    onClose: () => setIsSidebarOpen(false)
                })}
            </div>

            {/* Main Content Area */}
            <div className="flex flex-1 flex-col min-w-0 lg:pl-64">
                {/* Fixed Header */}
                <div className="sticky top-0 z-50 w-full">
                    {React.isValidElement(header) && React.cloneElement(header as React.ReactElement<any>, {
                        onMenuClick: () => setIsSidebarOpen(true)
                    })}
                </div>

                {/* Notifications & Body */}
                <div className="flex flex-1 flex-col min-h-0">
                    {restaurantId && <HostNotifier restaurantId={restaurantId} />}
                    <main className="flex-1 overflow-y-auto outline-none">
                        <div className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8 animate-fade-in">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
