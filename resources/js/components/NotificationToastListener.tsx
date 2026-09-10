import { usePage } from '@inertiajs/react';
import { useEffect, useRef } from 'react';

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

async function handleBrowserNotification(
    notification: BroadcastNotification,
    title: string,
    description: string,
) {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
        return;
    }

    const targetUrl = notification.data?.url ?? '/dashboard';
    const tag = notification.id ?? `notification-${Date.now()}`;

    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription =
                await registration.pushManager.getSubscription();

            // When tab is hidden and Web Push subscription exists, sw.js push event already handles showing native notification
            if (subscription && document.visibilityState === 'hidden') {
                return;
            }

            await registration.showNotification(title, {
                body: description,
                icon: '/logo.webp',
                tag: tag,
                data: {
                    url: targetUrl,
                },
            });
            return;
        } catch (error) {
            console.error('Error with service worker notification:', error);
        }
    }

    // Fallback native notification
    try {
        const nativeNotif = new Notification(title, {
            body: description,
            icon: '/logo.webp',
            tag: tag,
            data: { url: targetUrl },
        });
        nativeNotif.onclick = () => {
            window.focus();
            window.location.href = targetUrl;
        };
    } catch (error) {
        console.error('Error showing native notification:', error);
    }
}

export function NotificationToastListener() {
    const { auth } = usePage<PageProps>().props;
    const userId = auth?.user?.id;
    const processedIdsRef = useRef<Set<string>>(new Set());
    const unreadCountRef = useRef<number>(0);
    const baseTitleRef = useRef<string>('');

    useEffect(() => {
        const getBaseTitle = () => {
            return document.title.replace(/^\(\d+\)\s*/, '');
        };

        const resetUnreadCount = () => {
            unreadCountRef.current = 0;
            if (baseTitleRef.current) {
                document.title = baseTitleRef.current;
            } else if (document.title.startsWith('(')) {
                document.title = getBaseTitle();
            }
        };

        const handleFocus = () => {
            resetUnreadCount();
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                resetUnreadCount();
            }
        };

        window.addEventListener('focus', handleFocus);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener(
                'visibilitychange',
                handleVisibilityChange,
            );
        };
    }, []);

    useEffect(() => {
        if (!userId) return;

        const echo = window.Echo;
        if (!echo) return;

        const channelName = `App.Models.User.${userId}`;
        const channel = echo.private(channelName);

        channel.notification((notification: BroadcastNotification) => {
            const notifId =
                notification.id ??
                `${notification.type}-${notification.data?.title}-${Date.now()}`;

            // Deduplicate notifications received within 5 seconds
            if (processedIdsRef.current.has(notifId)) {
                return;
            }
            processedIdsRef.current.add(notifId);
            setTimeout(() => {
                processedIdsRef.current.delete(notifId);
            }, 5000);

            const title =
                notification.data?.title ??
                notification.title ??
                notification.type ??
                'Notification';
            const description =
                notification.data?.description ??
                notification.description ??
                'You have a new notification.';

            void handleBrowserNotification(notification, title, description);

            // Update tab title with unread notification count
            const cleanTitle = document.title.replace(/^\(\d+\)\s*/, '');
            if (cleanTitle) {
                baseTitleRef.current = cleanTitle;
            }

            unreadCountRef.current += 1;
            document.title = `(${unreadCountRef.current}) ${
                baseTitleRef.current || cleanTitle || 'Counseling Support'
            }`;
        });

        return () => {
            channel.stopListening(
                '.Illuminate\\Notifications\\Events\\BroadcastNotificationCreated',
            );
            echo.leave(channelName);
        };
    }, [userId]);

    return null;
}
