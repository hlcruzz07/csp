import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { normalizeName } from '@/lib/utils';
import { Message } from '@/types/entities';
import { DotIcon } from 'lucide-react';

interface ChatListItemProps {
    message: Message;
}

const PREVIEW_LIMIT = 25;

export function ChatListItem({ message }: ChatListItemProps) {
    const getInitials = useInitials();
    const displayName = normalizeName(message.name);
    const preview =
        message.message.length > PREVIEW_LIMIT
            ? message.message.slice(0, PREVIEW_LIMIT) + '...'
            : message.message;

    return (
        <div className="relative me-2 flex cursor-pointer items-center gap-3 rounded-lg p-2 ps-3 duration-300 hover:bg-secondary-foreground">
            <Avatar className="size-13 overflow-hidden rounded-full">
                <AvatarImage src="" alt={displayName} />
                <AvatarFallback className="rounded-lg bg-neutral-200 text-sm text-black dark:bg-neutral-700 dark:text-white">
                    {getInitials(displayName)}
                </AvatarFallback>
            </Avatar>

            <div className="w-full font-bold text-foreground">
                <h1>{displayName}</h1>
                <div className="flex w-full items-center justify-between">
                    <small>{preview}</small>
                    <small className="text-[10px] text-muted-foreground">
                        {message.time}
                    </small>
                </div>
            </div>

            <DotIcon className="absolute right-[-10px] size-12 p-0! text-sky-500" />
        </div>
    );
}
