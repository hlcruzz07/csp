import { useCallback, useEffect, useRef, useState } from 'react';
import apiService from '@/lib/api-service';
import { toast } from 'sonner';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');
    const rawData = atob(base64);
    return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function usePushSubscription() {
    const isSubscribingRef = useRef(false);
    const [isEnabled, setIsEnabled] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            return;
        }

        void navigator.serviceWorker
            .register('/sw.js')
            .then((registration) => registration.pushManager.getSubscription())
            .then((subscription) => setIsEnabled(Boolean(subscription)));
    }, []);

    const subscribe = useCallback(async () => {
        if (isSubscribingRef.current) return;
        isSubscribingRef.current = true;
        setIsLoading(true);

        try {
            if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
                toast.error(
                    'Push notifications are not supported in this browser.',
                );
                return;
            }

            if (!VAPID_PUBLIC_KEY) {
                toast.error('Push notifications are not configured yet.');
                return;
            }

            const registration =
                await navigator.serviceWorker.register('/sw.js');

            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                toast.error('Notification permission was not granted.');
                return;
            }

            const subscription =
                (await registration.pushManager.getSubscription()) ??
                (await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey:
                        urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
                }));

            await apiService.post('/push-subscriptions', subscription.toJSON());
            setIsEnabled(true);
            toast.success('Push notifications enabled');
        } finally {
            isSubscribingRef.current = false;
            setIsLoading(false);
        }
    }, []);

    return { subscribe, isEnabled, isLoading };
}
