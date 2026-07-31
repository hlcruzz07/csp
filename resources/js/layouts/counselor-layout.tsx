import { ChatSidebar } from '@/components/counselor/ChatSidebar';
import { NotificationDropdown } from '@/components/counselor/NotificationDropdown';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { StudentDrawer } from '@/pages/student/modal/StudentDrawer';
import { Conversation, Message, Notification } from '@/types/entities';
import { usePage } from '@inertiajs/react';
import { MenuIcon } from 'lucide-react';
type PageProps = {
    conversations: Conversation[];
};

export default function CounselorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const NOTIFICATIONS: Notification[] = [
        {
            id: 1,
            title: 'New chat assigned',
            description: 'Maria Santos has been assigned to your caseload.',
            time: '2m ago',
        },
        {
            id: 2,
            title: 'Chat updated',
            description: 'John Carlo Dela Cruz sent a new message.',
            time: '15m ago',
        },
        {
            id: 3,
            title: 'Follow-up reminder',
            description:
                'You have a scheduled follow-up with Angelica Reyes today.',
            time: '1h ago',
        },
        {
            id: 4,
            title: 'Session completed',
            description:
                'Your session with Mark Anthony Villanueva was marked as complete.',
            time: '5h ago',
        },
        {
            id: 5,
            title: 'New student request',
            description: 'A new student has requested a counseling session.',
            time: 'Yesterday',
        },
    ];
    const isMobile = useIsMobile();
    const { conversations } = usePage<PageProps>().props;
    const sidebar = <ChatSidebar conversations={conversations} />;

    return (
        <div className="flex h-screen overflow-hidden">
            {isMobile ? (
                <Sheet>
                    <div className="fixed top-4 left-3 z-50">
                        <SheetTrigger asChild>
                            <button className="rounded-full p-2 transition hover:bg-muted">
                                <MenuIcon className="size-5" />
                            </button>
                        </SheetTrigger>
                    </div>
                    <SheetContent side="left" className="w-72 p-0">
                        {sidebar}
                    </SheetContent>
                </Sheet>
            ) : (
                <div className="bg-background">{sidebar}</div>
            )}
            <div className="flex grow flex-col overflow-hidden bg-secondary md:gap-4 md:p-4">
                <div className="flex items-center justify-end rounded-none bg-background p-3 md:rounded-lg">
                    <div className="flex items-center gap-4">
                        <NotificationDropdown notifications={NOTIFICATIONS} />
                        <Avatar className="size-10 overflow-hidden rounded-full md:size-12">
                            <AvatarImage src="" alt="User avatar" />
                            <AvatarFallback className="rounded-lg bg-neutral-200 text-sm text-black sm:text-sm lg:text-base dark:bg-neutral-700 dark:text-white">
                                JD
                            </AvatarFallback>
                        </Avatar>
                        <StudentDrawer />
                    </div>
                </div>
                <div className="grow overflow-hidden rounded-none bg-background md:rounded-lg">
                    {children}
                </div>
            </div>
        </div>
    );
}
