import Heading from '@/components/heading';
import { Input } from '@/components/ui/input';
import { CheckCheckIcon, EyeIcon, SearchIcon, SendIcon } from 'lucide-react';
import { useState } from 'react';
import { ChatListItem } from './ChatListItem';
import { Conversation, Message } from '@/types/entities';
import { Badge } from '../ui/badge';
import { Filter, FilterTabs } from './FilterTabs';

interface ChatSidebarProps {
    conversations: Conversation[];
}

export function ChatSidebar({ conversations }: ChatSidebarProps) {
    const [filter, setFilter] = useState<Filter>('All');
    const [search, setSearch] = useState('');
    const filtered = conversations.filter((c) => {
        const displayName = c.student?.is_anonymous
            ? c.student?.pseudonym
            : c.student?.name;

        const matchesSearch = (displayName ?? '')
            .toLowerCase()
            .includes(search.toLowerCase());

        const latestMessageStatus =
            c.latest_message?.sender_id === c.counselor_id
                ? 'responded'
                : c.latest_message?.status;

        const matchesFilter =
            filter === 'All' ||
            (filter === 'Unread' && c.unread_count > 0) ||
            (filter === 'Responded' && latestMessageStatus === 'responded');

        return matchesSearch && matchesFilter;
    });

    return (
        <div className="flex h-screen w-72 flex-col gap-3 pb-3">
            <div className="px-3 pt-3">
                <Heading
                    title="Chats"
                    description="Browse and respond to conversations assigned to your counseling queue."
                />
            </div>

            <div className="space-y-3 px-3">
                <div className="flex items-center">
                    <div className="relative flex grow items-center">
                        <Input
                            type="text"
                            placeholder="Search chats"
                            className="ps-7"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            autoFocus={false}
                        />
                        <SearchIcon className="absolute left-2" size={15} />
                    </div>

                    <FilterTabs selected={filter} onChange={setFilter} />
                </div>
                <div className="flex items-center gap-2">
                    <Badge className="bg-blue-700 text-blue-100">
                        <SendIcon /> Sent
                    </Badge>

                    <Badge className="bg-amber-700 text-amber-100">
                        <EyeIcon /> Seen
                    </Badge>

                    <Badge className="bg-green-700 text-green-100">
                        <CheckCheckIcon /> Responded
                    </Badge>
                </div>
            </div>

            <div className="flex h-full flex-col overflow-x-hidden overflow-y-auto">
                {filtered?.length === 0 && (
                    <div className="flex h-full flex-col items-center justify-center gap-2">
                        <p className="text-sm text-muted-foreground">
                            No conversations found.
                        </p>
                    </div>
                )}
                {filtered.map((item) => (
                    <ChatListItem
                        key={item.id}
                        message={item.latest_message as Message | null}
                        sender={item.student}
                        conversation={item as any}
                    />
                ))}
            </div>
        </div>
    );
}
