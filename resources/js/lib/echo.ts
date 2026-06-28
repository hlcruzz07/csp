import EchoClient from 'laravel-echo';
import PusherClass from 'pusher-js';

// Explicitly declare properties on the global Window object
declare global {
    interface Window {
        Pusher: typeof PusherClass;
        Echo: EchoClient<any>; // Prevents "requires 1 type argument(s)" error
    }
}

// Assign them safely to the window object
window.Pusher = PusherClass;

const csrfToken = document
    .querySelector('meta[name="csrf-token"]')
    ?.getAttribute('content');

window.Echo = new EchoClient({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: import.meta.env.VITE_REVERB_PORT,
    wssPort: import.meta.env.VITE_REVERB_PORT,
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
