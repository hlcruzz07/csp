import { ChatSidebar } from '@/components/counselor/ChatSidebar';
import { NotificationDropdown } from '@/components/counselor/NotificationDropdown';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { startTour } from '@/lib/tour';
import { StudentDrawer } from '@/pages/student/modal/StudentDrawer';
import { Conversation, Notification } from '@/types/entities';
import { usePage } from '@inertiajs/react';
import { HelpCircle, MenuIcon } from 'lucide-react';

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

    const sidebar = (
        <div id="tour-chat-sidebar">
            <ChatSidebar conversations={conversations} />
        </div>
    );

    const runTour = () => {
        const steps = isMobile
            ? [
                  {
                      element: '#tour-menu-toggle',
                      popover: {
                          title: 'Your conversations',
                          description:
                              'Tap here anytime to open your list of student conversations.',
                          side: 'bottom' as const,
                      },
                  },
              ]
            : [
                  {
                      element: '#tour-chat-sidebar',
                      popover: {
                          title: 'Your conversations',
                          description:
                              'All conversations assigned to you show up here, sorted by recent activity.',
                          side: 'right' as const,
                      },
                  },
              ];

        steps.push(
            {
                element: '#tour-notifications',
                popover: {
                    title: 'Notifications',
                    description:
                        'New assignments, messages, and reminders land here.',
                    side: 'bottom' as const,
                },
            },
            {
                element: '#tour-student-drawer',
                popover: {
                    title: 'Personal details',
                    description:
                        "Open this to see the current student's profile without leaving the conversation.",
                    side: 'bottom' as const,
                },
            },
        );

        startTour({ steps });
    };

    return (
        <div className="flex h-dvh overflow-hidden">
            {isMobile ? (
                <Sheet>
                    <div className="fixed top-4 left-3 z-50">
                        <SheetTrigger asChild>
                            <button
                                id="tour-menu-toggle"
                                type="button"
                                className="rounded-lg border p-2 transition hover:bg-muted"
                            >
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
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            type="button"
                            className="rounded-full"
                            onClick={runTour}
                            title="Show tutorial"
                        >
                            <HelpCircle className="size-4.5" />
                        </Button>

                        <div id="tour-notifications">
                            <NotificationDropdown
                                notifications={NOTIFICATIONS}
                            />
                        </div>

                        <div id="tour-student-drawer">
                            <StudentDrawer />
                        </div>
                    </div>
                </div>
                <div className="grow overflow-hidden rounded-none bg-background md:rounded-lg">
                    {children}
                </div>
            </div>
        </div>
    );
}
