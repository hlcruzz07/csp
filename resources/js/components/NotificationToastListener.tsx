import { usePage } from '@inertiajs/react';
import { Bell, X } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';

type PageProps = {
    auth?: {
        user?: {
            id: number;
        };
    };
};

type BroadcastNotification = {
    id?: string;
    type?: string;
    data?: {
        title?: string;
        description?: string;
        url?: string;
    };
    title?: string;
    description?: string;
};

async function showHiddenTabNotification(
    notification: BroadcastNotification,
    title: string,
    description: string,
) {
    if (
        document.visibilityState !== 'hidden' ||
        !('Notification' in window) ||
        Notification.permission !== 'granted' ||
        !('serviceWorker' in navigator)
    ) {
        return;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    // Web Push already shows the native notification when subscribed.
    if (subscription) return;

    await registration.showNotification(title, {
        body: description,
        icon: '/logo.webp',
        tag: notification.id ?? `notification-${Date.now()}`,
        data: {
            url: notification.data?.url ?? '/dashboard',
        },
    });
}

export function NotificationToastListener() {
    const { auth } = usePage<PageProps>().props;
    const userId = auth?.user?.id;

    useEffect(() => {
        if (!userId) return;

        const echo = window.Echo;
        if (!echo) return;

        const channelName = `App.Models.User.${userId}`;
        const channel = echo.private(channelName);

        channel.notification((notification: BroadcastNotification) => {
            const title =
                notification.data?.title ??
                notification.title ??
                notification.type ??
                'Notification';
            const description =
                notification.data?.description ??
                notification.description ??
                'You have a new notification.';

            void showHiddenTabNotification(notification, title, description);

            toast.custom(
                (toastId) => (
                    <div className="hidden w-[min(380px,calc(100vw-2rem))] items-start gap-3 rounded-xl border bg-popover p-4 text-popover-foreground shadow-lg sm:flex">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Bell className="size-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="font-semibold">{title}</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {description}
                            </p>
                        </div>
                        <button
                            type="button"
                            className="shrink-0 rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                            onClick={() => toast.dismiss(toastId)}
                            aria-label="Dismiss notification"
                        >
                            <X className="size-4" />
                        </button>
                    </div>
                ),
                { duration: 7000 },
            );
        });

        return () => {
            echo.leave(channelName);
        };
    }, [userId]);

    return null;
}
