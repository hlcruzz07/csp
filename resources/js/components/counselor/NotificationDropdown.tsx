import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import apiService from '@/lib/api-service';
import { timeAgo } from '@/lib/utils';
import { readNotification, markAllNotificationsRead } from '@/routes';
import { Notification } from '@/types/entities';
import { usePage } from '@inertiajs/react';
import { Bell, CheckCheckIcon, EllipsisIcon, Loader2Icon } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';

interface NotificationDropdownProps {
    notifications: Notification[];
    isLoading: boolean;
    isLoadingMore: boolean;
    hasMore: boolean;
    onLoadMore: () => void;
    onNotificationRead?: (id: number | string) => void;
    onAllRead?: () => void;
}

export function NotificationDropdown({
    notifications,
    isLoading,
    isLoadingMore,
    hasMore,
    onLoadMore,
    onNotificationRead,
    onAllRead,
}: NotificationDropdownProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [selected, setSelected] = useState<Notification | null>(null);
    const [isMarkingAll, setIsMarkingAll] = useState(false);

    const { auth } = usePage<{ auth: { user: { id: number } } }>().props;
    const isNotificationRead = (notification: Notification) =>
        Boolean(notification.read_at ?? notification.is_read);

    const handleScroll = useCallback(() => {
        const el = scrollRef.current;
        if (!el || isLoadingMore || !hasMore) return;

        const threshold = 80;
        const reachedBottom =
            el.scrollHeight - el.scrollTop - el.clientHeight < threshold;

        if (reachedBottom) {
            onLoadMore();
        }
    }, [isLoadingMore, hasMore, onLoadMore]);

    const openNotification = async (notification: Notification) => {
        setSelected(notification);

        if (!isNotificationRead(notification)) {
            try {
                await apiService.patch(readNotification(notification.id).url);
                onNotificationRead?.(notification.id);
            } catch (error) {
                console.error('Error marking notification as read:', error);
            }
        }
    };

    const markAllAsRead = async () => {
        if (isMarkingAll || !auth?.user?.id) return;
        setIsMarkingAll(true);

        try {
            await apiService.patch(markAllNotificationsRead(auth.user.id).url);
            onAllRead?.();
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        } finally {
            setIsMarkingAll(false);
        }
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="relative rounded-full p-2 transition hover:bg-muted">
                        <Bell className="h-5 w-5" />
                        {notifications.some((n) => !isNotificationRead(n)) && (
                            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
                        )}
                    </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                    align="end"
                    sideOffset={8}
                    collisionPadding={16}
                    className="w-[calc(100vw-2rem)] max-w-108 p-0"
                >
                    <div className="flex items-center justify-between p-3 sm:p-4">
                        <DropdownMenuLabel className="p-0 text-base font-semibold">
                            Notifications
                        </DropdownMenuLabel>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <EllipsisIcon size={15} />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                sideOffset={8}
                                collisionPadding={16}
                            >
                                <DropdownMenuGroup>
                                    <DropdownMenuItem
                                        disabled={isMarkingAll}
                                        onSelect={(e) => {
                                            e.preventDefault();
                                            markAllAsRead();
                                        }}
                                    >
                                        <CheckCheckIcon /> Mark all as read
                                    </DropdownMenuItem>
                                </DropdownMenuGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <DropdownMenuSeparator className="m-0" />

                    <div
                        ref={scrollRef}
                        onScroll={handleScroll}
                        className="max-h-[60vh] overflow-y-auto sm:max-h-[400px]"
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2Icon className="h-5 w-5 animate-spin text-muted-foreground" />
                            </div>
                        ) : notifications.length > 0 ? (
                            <>
                                {notifications.map((n) => {
                                    const isRead = isNotificationRead(n);
                                    const title =
                                        n.data?.title ??
                                        n.type ??
                                        'Notification';
                                    const description =
                                        n.data?.description ??
                                        'No description available.';

                                    return (
                                        <DropdownMenuItem
                                            key={n.id}
                                            onSelect={(e) => {
                                                e.preventDefault();
                                                openNotification(n);
                                            }}
                                            className={`relative flex cursor-pointer flex-col items-start gap-1 p-3 ${isRead && 'text-muted-foreground'} sm:p-4`}
                                        >
                                            {!isRead && (
                                                <span className="absolute right-3 bottom-3 size-2 rounded-full bg-blue-600" />
                                            )}
                                            <div className="flex w-full items-center justify-between gap-2">
                                                <span className="font-medium">
                                                    {title}
                                                </span>
                                                <span className="shrink-0 text-xs">
                                                    {timeAgo(n.created_at)}
                                                </span>
                                            </div>
                                            <p className="text-sm">
                                                {description.length > 50
                                                    ? description.slice(0, 50) +
                                                      '...'
                                                    : description}
                                            </p>
                                        </DropdownMenuItem>
                                    );
                                })}

                                {isLoadingMore && (
                                    <div className="flex items-center justify-center py-4">
                                        <Loader2Icon className="h-4 w-4 animate-spin text-muted-foreground" />
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <Bell className="mb-2 h-8 w-8 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">
                                    No notifications yet
                                </p>
                            </div>
                        )}
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog
                open={!!selected}
                onOpenChange={(open) => !open && setSelected(null)}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {selected?.data?.title ??
                                selected?.type ??
                                'Notification'}
                        </DialogTitle>
                        <DialogDescription className="pt-1 text-xs">
                            {selected && timeAgo(selected.created_at)}
                        </DialogDescription>
                    </DialogHeader>
                    <p className="text-sm text-foreground">
                        {selected?.data?.description ??
                            'No description available.'}
                    </p>
                </DialogContent>
            </Dialog>
        </>
    );
}
