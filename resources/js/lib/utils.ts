import type { InertiaLinkProps } from '@inertiajs/react';
import { clsx } from 'clsx';
import type { ClassValue } from 'clsx';
import { toast } from 'sonner';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function toUrl(url: NonNullable<InertiaLinkProps['href']>): string {
    return typeof url === 'string' ? url : url.url;
}

export const capitalizeString = (text: string) => {
    if (!text) return '';
    return text
        .toLowerCase()
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

export const handleErrors = (errors: Record<string, string | string[]>) => {
    const errorKeys = Object.keys(errors);

    // 1. Existing Toast Logic
    errorKeys.reverse().forEach((key) => {
        const messages = errors[key];
        if (Array.isArray(messages)) {
            messages.forEach((message) => toast.error(message));
        } else {
            toast.error(messages);
        }
    });

    // 2. Focus Logic: Find the first field with an error
    if (errorKeys.length > 0) {
        // Since we reversed earlier, the first error in the original object is now at the end
        const firstErrorKey = Object.keys(errors)[0];

        // Find element by name or id (common in Inertia forms)
        const element =
            document.getElementsByName(firstErrorKey)[0] ||
            document.getElementById(firstErrorKey);

        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.focus();
            // Optional: smooth scroll if it's a long form
        }
    }
};

export const normalizeName = (name?: string | null) => {
    if (!name) return '';
    return name
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
};

export const resolveAvatarUrl = (
    avatar?: string | null,
    size = 600,
): string => {
    if (!avatar) return '/default.webp';

    const value = avatar.trim();

    if (/^https?:\/\//i.test(value)) {
        if (/lh3\.googleusercontent\.com/i.test(value)) {
            return value.replace(
                /=s\d+-c(?:\?.*)?$/i,
                `=s${size}-c`,
            );
        }

        return value;
    }

    const path = value.replace(/^\/?storage\//, '').replace(/^\/+/, '');
    return `/storage/${path}`;
};
