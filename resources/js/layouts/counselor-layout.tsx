import { ChatSidebar } from '@/components/counselor/ChatSidebar';
import { NotificationDropdown } from '@/components/counselor/NotificationDropdown';
import { NotificationToastListener } from '@/components/NotificationToastListener';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePushSubscription } from '@/hooks/use-push-subscription';
import apiService from '@/lib/api-service';
import { startTour } from '@/lib/tour';
import { StudentDrawer } from '@/pages/student/modal/StudentDrawer';
import { paginateNotifications } from '@/routes';
import type { Conversation, Notification } from '@/types/entities';
import { usePage } from '@inertiajs/react';
import {
    Bell,
    BellOff,
    DatabaseIcon,
    HelpCircle,
    MenuIcon,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

type PageProps = {
    conversations: Conversation[];
};

export default function CounselorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    // Guards against overlapping/duplicate requests
    const isFetchingRef = useRef(false);

    const fetchNotifications = useCallback(async (page: number) => {
        if (isFetchingRef.current) return;
        isFetchingRef.current = true;

        page === 1 ? setIsLoading(true) : setIsLoadingMore(true);

        try {
            const { data } = await apiService.get(paginateNotifications().url, {
                params: { page, perPage: 10 },
            });

            setNotifications((prev) =>
                page === 1 ? data.data : [...prev, ...data.data],
            );
            setCurrentPage(data.current_page);
            setLastPage(data.last_page);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            isFetchingRef.current = false;
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, []);

    const loadMoreNotifications = useCallback(() => {
        if (isFetchingRef.current || currentPage >= lastPage) return;
        fetchNotifications(currentPage + 1);
    }, [currentPage, lastPage, fetchNotifications]);

    const handleNotificationRead = useCallback((id: number | string) => {
        setNotifications((prev) =>
            prev.map((n) =>
                n.id === id
                    ? { ...n, read_at: new Date().toISOString(), is_read: true }
                    : n,
            ),
        );
    }, []);

    const handleAllRead = useCallback(() => {
        setNotifications((prev) =>
            prev.map((n) => ({
                ...n,
                read_at: new Date().toISOString(),
                is_read: true,
            })),
        );
    }, []);

    useEffect(() => {
        fetchNotifications(1);
    }, [fetchNotifications]);

    const isMobile = useIsMobile();
    const { conversations } = usePage<PageProps>().props;

    const sidebar = (
        <div id="tour-chat-sidebar">
            <ChatSidebar conversations={conversations} />
        </div>
    );

    const runTour = () => {
        const steps: Array<{
            element: string;
            popover: {
                title: string;
                description: string;
                side: 'bottom' | 'right';
            };
        }> = isMobile
            ? [
                  {
                      element: '#tour-menu-toggle',
                      popover: {
                          title: 'Your conversations',
                          description:
                              'Tap here anytime to open your list of student conversations.',
                          side: 'bottom',
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
                          side: 'right',
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

    const {
        subscribe,
        isEnabled,
        isLoading: isPushLoading,
    } = usePushSubscription();

    return (
        <div className="flex h-dvh overflow-hidden">
            <NotificationToastListener />
            {isMobile ? (
                <Sheet>
                    <div className="fixed top-4 left-3 z-50">
                        <SheetTrigger asChild>
                            <button
                                id="tour-menu-toggle"
                                type="button"
                                className="rounded-lg p-2 transition hover:bg-muted"
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

                        <div className="flex items-center gap-1.5 rounded-full border px-2 py-1">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <button
                                        type="button"
                                        className="flex items-center gap-1.5 rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                    >
                                        <Bell className="size-3.5 text-muted-foreground" />
                                        <span className="hidden text-xs text-muted-foreground sm:inline">
                                            Notify me
                                        </span>
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent
                                    side="bottom"
                                    align="start"
                                    className="w-64 text-xs"
                                >
                                    Enables browser notifications when you are
                                    away from the application. It does not
                                    control the notification list inside the
                                    app.
                                </PopoverContent>
                            </Popover>

                            <Switch
                                checked={isEnabled}
                                disabled={isEnabled || isPushLoading}
                                onCheckedChange={(checked) => {
                                    if (checked) void subscribe();
                                }}
                                icon={{
                                    on: <Bell className="text-primary" />,
                                    off: (
                                        <BellOff className="text-muted-foreground" />
                                    ),
                                }}
                                aria-label="Enable browser notifications"
                            />
                        </div>

                        <div id="tour-notifications">
                            <NotificationDropdown
                                notifications={notifications}
                                isLoading={isLoading}
                                isLoadingMore={isLoadingMore}
                                hasMore={currentPage < lastPage}
                                onLoadMore={loadMoreNotifications}
                                onNotificationRead={handleNotificationRead}
                                onAllRead={handleAllRead}
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
