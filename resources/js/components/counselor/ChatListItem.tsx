import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { normalizeName, resolveAvatarUrl } from '@/lib/utils';
import { Conversation, Message, UserProps } from '@/types/entities';
import dayjs from 'dayjs';
import { DotIcon } from 'lucide-react';
import { Link, router, usePage } from '@inertiajs/react';
import { counselorConversation } from '@/routes';
import { useEffect } from 'react';

interface ChatListItemProps {
    message: Message | null;
    sender: UserProps;
    conversation: Conversation;
}

const PREVIEW_LIMIT = 25;

export function ChatListItem({
    message,
    sender,
    conversation,
}: ChatListItemProps) {
    const { url } = usePage();
    const getInitials = useInitials();
    const displayName = sender.is_anonymous
        ? `${sender.pseudonym} `
        : normalizeName(sender.name);
    const content =
        message?.content ??
        ((message?.attachments?.length ?? 0) > 0
            ? `📎 Sent an attachment (${message?.attachments?.length})`
            : '👋 Say hello');

    const preview =
        content.length > PREVIEW_LIMIT
            ? content.slice(0, PREVIEW_LIMIT) + '...'
            : content;

    useEffect(() => {
        const echo = (window as any).Echo;
        if (!echo) {
            console.error('Echo is not initialized');
            return;
        }

        const channel = echo.private(`conversation.${conversation.uuid}`);

        channel.listenToAll((event: string, data: any) => {
            if (event.endsWith('MessageSent') || event === 'MessageSent') {
                router.reload({
                    only: ['conversations'],
                });
            }
        });

        return () => {
            echo.leave(`conversation.${conversation.uuid}`);
        };
    }, [conversation.uuid]);

    const isActive = url.split('/').pop() === conversation.uuid;

    return (
        <div
            onClick={() => {
                router.visit(counselorConversation(conversation.uuid).url, {
                    onSuccess: () => {
                        router.reload({
                            only: ['conversations'],
                        });
                    },
                });
            }}
            className={`relative flex w-full cursor-pointer items-center gap-3 rounded-lg p-3 transition hover:bg-muted ${isActive ? 'bg-muted' : ''}`}
        >
            <Avatar className="size-13 overflow-hidden rounded-full">
                <AvatarImage
                    src={
                        !sender.is_anonymous
                            ? resolveAvatarUrl(sender.avatar)
                            : '/default.webp'
                    }
                    alt={displayName}
                    className="object-cover"
                />
                <AvatarFallback className="rounded-lg bg-neutral-200 text-sm text-black dark:bg-neutral-700 dark:text-white">
                    {getInitials(displayName)}
                </AvatarFallback>
            </Avatar>

            <div
                className={`w-full ${!message?.status || message?.status === 'sent' ? 'font-bold' : ''} text-foreground`}
            >
                <div className="max-w-48">
                    <h1 className="truncate text-sm">{displayName}</h1>
                </div>
                <div className="flex w-full items-center justify-between">
                    <small className="text-xs">{preview}</small>
                    <small className="mt-1 text-[8px] font-bold text-muted-foreground">
                        {message
                            ? dayjs(message.created_at).format('h:mm A')
                            : ''}
                    </small>
                </div>
            </div>

            {message?.status === 'sent' && (
                <DotIcon className="absolute right-[-10px] size-12 p-0! text-sky-500" />
            )}
        </div>
    );
}
