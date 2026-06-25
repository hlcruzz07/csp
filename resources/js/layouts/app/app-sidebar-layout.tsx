import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AdminSidebar } from '@/components/admin-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import type { AppLayoutProps } from '@/types';
import { usePage } from '@inertiajs/react';
import { UserProps } from '@/types/entities';
import { CounselorSidebar } from '@/components/counselor-sidebar';
import { StudentSidebar } from '@/components/student-sidebar';

type PageProps = {
    auth: {
        user: UserProps;
    };
};
export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    const { auth } = usePage<PageProps>().props;

    return (
        <AppShell variant="sidebar">
            {auth.user.role === 'admin' && <AdminSidebar />}
            <AppContent variant="sidebar" className="overflow-x-hidden">
                {auth.user.role === 'admin' && (
                    <AppSidebarHeader breadcrumbs={breadcrumbs} />
                )}
                {children}
            </AppContent>
        </AppShell>
    );
}
