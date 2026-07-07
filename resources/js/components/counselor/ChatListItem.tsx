import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { normalizeName } from '@/lib/utils';
import { Message, UserProps } from '@/types/entities';
import dayjs from 'dayjs';
import { DotIcon } from 'lucide-react';

interface ChatListItemProps {
    message: Message | null;
    sender: UserProps;
}

const PREVIEW_LIMIT = 25;

export function ChatListItem({ message, sender }: ChatListItemProps) {
    const getInitials = useInitials();
    const displayName = sender.is_anonymous
        ? sender.pseudonym
        : normalizeName(sender.name);
    const content = message?.content ?? '👋 Say hello';

    const preview =
        content.length > PREVIEW_LIMIT
            ? content.slice(0, PREVIEW_LIMIT) + '...'
            : content;

    console.log(sender);
    return (
        <div className="relative me-2 flex cursor-pointer items-center gap-3 rounded-lg p-2 ps-3 duration-300 hover:bg-secondary-foreground">
            <Avatar className="size-13 overflow-hidden rounded-full">
                <AvatarImage
                    src={
                        !sender.is_anonymous && sender.avatar
                            ? `/storage/${sender.avatar}`
                            : '/default.webp'
                    }
                    alt={displayName}
                    className="object-cover"
                />
                <AvatarFallback className="rounded-lg bg-neutral-200 text-sm text-black dark:bg-neutral-700 dark:text-white">
                    {getInitials(displayName)}
                </AvatarFallback>
            </Avatar>

            <div className="w-full font-bold text-foreground">
                <h1>{displayName}</h1>
                <div className="flex w-full items-center justify-between">
                    <small>{preview}</small>
                    <small className="text-[10px] text-muted-foreground">
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
