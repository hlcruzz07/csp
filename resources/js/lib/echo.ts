import EchoClient from 'laravel-echo';
import PusherClass from 'pusher-js';

declare global {
    interface Window {
        Pusher: typeof PusherClass;
        Echo: EchoClient<any>;
    }
}

let echo: EchoClient<any> | undefined;

if (typeof window !== 'undefined') {
    window.Pusher = PusherClass;

    const csrfToken = document
        .querySelector('meta[name="csrf-token"]')
        ?.getAttribute('content');

    echo = new EchoClient({
        broadcaster: 'reverb',
        key: import.meta.env.VITE_REVERB_APP_KEY,
        wsHost: import.meta.env.VITE_REVERB_HOST,
        wsPort: Number(import.meta.env.VITE_REVERB_PORT),
        wssPort: Number(import.meta.env.VITE_REVERB_PORT),
        forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
        enabledTransports: ['ws', 'wss'],
        authEndpoint: '/broadcasting/auth',
        authTransport: 'ajax',
        disableStats: true,
        auth: {
            headers: {
                'X-CSRF-TOKEN': csrfToken ?? '',
                'X-Requested-With': 'XMLHttpRequest',
            },
        },
    });

    window.Echo = echo;
}

export default echo;
