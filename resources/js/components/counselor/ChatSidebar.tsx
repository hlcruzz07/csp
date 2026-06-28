import Heading from '@/components/heading';
import { Input } from '@/components/ui/input';
import { SearchIcon } from 'lucide-react';
import { useState } from 'react';
import { ChatListItem } from './ChatListItem';
import { FilterTabs } from './FilterTabs';
import { Message } from '@/types/entities';

type Filter = 'All' | 'Unread';

interface ChatSidebarProps {
    messages: Message[];
}

export function ChatSidebar({ messages }: ChatSidebarProps) {
    const [filter, setFilter] = useState<Filter>('All');
    const [search, setSearch] = useState('');

    const filtered = messages.filter((m) => {
        const matchesSearch = m.name
            .toLowerCase()
            .includes(search.toLowerCase());
        return matchesSearch;
    });

    return (
        <div className="flex h-screen flex-col gap-3 border pb-3">
            <div className="px-3 pt-3">
                <Heading
                    title="Chats"
                    description="Browse and respond to conversations assigned to your counseling queue."
                />
            </div>

            <div className="space-y-3 px-3">
                <div className="relative flex grow items-center">
                    <Input
                        type="text"
                        placeholder="Search chats"
                        className="ps-7"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <SearchIcon className="absolute left-2" size={15} />
                </div>

                <FilterTabs selected={filter} onChange={setFilter} />
            </div>

            <div className="flex h-full flex-col overflow-x-hidden overflow-y-auto">
                {Array.from({ length: 10 }, (_, index) => (
                    <div key={index}>
                        {filtered.map((message) => (
                            <ChatListItem key={message.id} message={message} />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
