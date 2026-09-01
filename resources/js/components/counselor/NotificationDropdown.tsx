import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Notification } from '@/types/entities';
import { Bell } from 'lucide-react';

interface NotificationDropdownProps {
    notifications: Notification[];
}

export function NotificationDropdown({
    notifications,
}: NotificationDropdownProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="relative rounded-full p-2 transition hover:bg-muted">
                    <Bell className="h-5 w-5" />
                    {notifications.length > 0 && (
                        <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
                    )}
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="end"
                sideOffset={8}
                collisionPadding={16}
                className="w-[calc(100vw-2rem)] max-w-96 p-0"
            >
                <div className="p-3 sm:p-4">
                    <DropdownMenuLabel className="p-0 text-base font-semibold">
                        Notifications
                    </DropdownMenuLabel>
                </div>

                <DropdownMenuSeparator />

                <div className="max-h-[60vh] overflow-y-auto sm:max-h-[400px]">
                    {notifications.length > 0 ? (
                        notifications.map((n) => (
                            <DropdownMenuItem
                                key={n.id}
                                className="flex cursor-pointer flex-col items-start gap-1 p-3 sm:p-4"
                            >
                                <div className="flex w-full items-center justify-between gap-2">
                                    <span className="font-medium">
                                        {n.title}
                                    </span>
                                    <span className="shrink-0 text-xs text-muted-foreground">
                                        {n.time}
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {n.description}
                                </p>
                            </DropdownMenuItem>
                        ))
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
    );
}
