import { ChatSidebar } from '@/components/counselor/ChatSidebar';
import { EmptyState } from '@/components/counselor/EmptyState';
import { NotificationDropdown } from '@/components/counselor/NotificationDropdown';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { Message, Notification } from '@/types/entities';
import { MenuIcon } from 'lucide-react';

const MESSAGES: Message[] = [
    {
        id: 1,
        name: 'Maria Santos',
        message: "Thank you po, I'll try the breathing exercise tonight.",
        time: '2m ago',
    },
    {
        id: 2,
        name: 'John Carlo Dela Cruz',
        message:
            "I haven't been sleeping well this week because of the upcoming exams, can we talk later?",
        time: '10m ago',
    },
    {
        id: 3,
        name: 'Angelica Reyes',
        message: 'Okay sir, see you sa appointment tomorrow at 2pm.',
        time: '1h ago',
    },
    {
        id: 4,
        name: 'Mark Anthony Villanueva',
        message: 'Sorry for the late reply, may I reschedule our session?',
        time: '3h ago',
    },
    {
        id: 5,
        name: 'Bea Fernandez',
        message: "I'm feeling a bit better today, thank you for checking in.",
        time: 'Yesterday',
    },
];

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

export default function Dashboard() {
    const isMobile = useIsMobile();

    const sidebar = <ChatSidebar messages={MESSAGES} />;

    return (
        <div className="flex h-screen overflow-hidden bg-secondary-foreground">
            {isMobile ? (
                <Sheet>
                    <div className="fixed top-7 left-7 z-50">
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
                <div className="w-82 bg-background">{sidebar}</div>
            )}

            <div className="flex grow flex-col gap-4 overflow-hidden bg-secondary-foreground p-4">
                {/* Top bar */}
                <div className="flex items-center justify-end rounded-lg bg-background p-3">
                    <div className="flex items-center gap-4">
                        <NotificationDropdown notifications={NOTIFICATIONS} />
                        <Avatar className="size-6 overflow-hidden rounded-full sm:size-10 md:size-12">
                            <AvatarImage src="" alt="User avatar" />
                            <AvatarFallback className="rounded-lg bg-neutral-200 text-[10px] text-black sm:text-sm lg:text-base dark:bg-neutral-700 dark:text-white">
                                JD
                            </AvatarFallback>
                        </Avatar>
                    </div>
                </div>

                {/* Chat area */}
                <div className="grow overflow-hidden rounded-lg bg-background">
                    <EmptyState />
                </div>
            </div>
        </div>
    );
}
