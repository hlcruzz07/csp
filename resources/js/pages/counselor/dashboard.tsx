import Heading from '@/components/heading';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { useInitials } from '@/hooks/use-initials';
import { useIsMobile } from '@/hooks/use-mobile';
import { normalizeName } from '@/lib/utils';
import { StudentDrawer } from '@/pages/student/modal/StudentDrawer';
import { usePage } from '@inertiajs/react';
import {
    Bell,
    DotIcon,
    MenuIcon,
    MessageCircleQuestion,
    SearchIcon,
    SettingsIcon,
    SlidersHorizontalIcon,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuItem,
    DropdownMenuGroup,
    DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Bold, Italic, Underline } from 'lucide-react';
import { useState } from 'react';
function SidebarContent() {
    const { auth } = usePage<any>().props;

    const getInitials = useInitials();
    const isMobile = useIsMobile();
    const messages = [
        {
            id: 1,
            name: 'Borge Kupal',
            message: 'Diin kana shat ta ssob',
            time: '2m ago',
        },
        {
            id: 2,
            name: 'Jack Bunal',
            message: 'Bilatadasdas asdkjaslkdj aoisdjoq asdhaosdhajshdas',
            time: '10m ago',
        },
        {
            id: 3,
            name: 'Danilo Burdagol',
            message: 'Ambot simo da hmmpp',
            time: '1h ago',
        },
    ];
    const [selected, setSelected] = useState<'All' | 'Unread'>('All');
    return (
        <div className="flex flex-col">
            <div className="px-3 pt-3">
                <Heading
                    title="Chats"
                    description="Browse and respond to conversations assigned to your counseling queue."
                />
            </div>

            <div className="flex flex-col gap-3">
                <div className="space-y-3 px-3">
                    <div className="relative flex grow items-center">
                        <Input
                            type="text"
                            placeholder="Search chats"
                            className="ps-7"
                        />
                        <SearchIcon className="absolute left-2" size={15} />
                    </div>

                    <div className="flex items-center gap-2">
                        {['All', 'Unread'].map((filter) => (
                            <button
                                key={filter}
                                onClick={() =>
                                    setSelected(filter as 'All' | 'Unread')
                                }
                                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                                    selected === filter
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                }`}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex flex-col">
                    {messages.map((item) => (
                        <div
                            key={item.id}
                            className="relative me-2 flex cursor-pointer items-center gap-3 rounded-lg p-2 ps-3 duration-300 hover:bg-secondary-foreground"
                        >
                            <Avatar className="size-13 overflow-hidden rounded-full">
                                <AvatarImage src="" alt={'test'} />
                                <AvatarFallback className="rounded-lg bg-neutral-200 text-sm text-black dark:bg-neutral-700 dark:text-white">
                                    {getInitials(normalizeName(item.name))}
                                </AvatarFallback>
                            </Avatar>
                            <div className="w-full font-bold text-foreground">
                                <h1>{normalizeName(item.name)}</h1>
                                <div className="flex w-full items-center justify-between">
                                    <small>
                                        {item.message.length > 25
                                            ? item.message.slice(0, 25) + '...'
                                            : item.message}
                                    </small>
                                    <small className="text-[10px] text-muted-foreground">
                                        {item.time}
                                    </small>
                                </div>
                            </div>

                            <DotIcon className="absolute right-[-10px] size-12 p-0! text-sky-500" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function Dashboard() {
    const { auth } = usePage<any>().props;

    const getInitials = useInitials();
    const isMobile = useIsMobile();
    const notifications = [
        {
            id: 1,
            title: 'New chat assigned',
            description: 'A new conversation has been assigned to you.',
            time: '2m ago',
        },
        {
            id: 2,
            title: 'Chat updated',
            description: 'A participant sent a new message.',
            time: '15m ago',
        },
        {
            id: 3,
            title: 'Follow-up reminder',
            description: 'You have a scheduled follow-up today.',
            time: '1h ago',
        },
    ];

    return (
        <div className="flex h-screen overflow-hidden bg-secondary-foreground">
            {/* Sidebar — shown inline on desktop, as a drawer on mobile */}
            {isMobile ? (
                <Sheet>
                    {/* Trigger button shown in the chat header on mobile */}
                    <div className="fixed top-7 left-7 z-50">
                        <SheetTrigger asChild>
                            <button className="rounded-full p-2 transition hover:bg-muted">
                                <MenuIcon className="size-5" />
                            </button>
                        </SheetTrigger>
                    </div>
                    <SheetContent side="left" className="w-72 p-0">
                        <SidebarContent />
                    </SheetContent>
                </Sheet>
            ) : (
                <div className="w-82 bg-background">
                    <SidebarContent />
                </div>
            )}

            {/* Main chat area */}
            <div className="flex grow flex-col gap-4 overflow-hidden bg-secondary-foreground p-4">
                <div className="flex items-center justify-end rounded-lg bg-background p-3">
                    <div className="flex items-center gap-4">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="relative rounded-full p-2 transition hover:bg-muted">
                                    <Bell className="h-5 w-5" />

                                    {/* Notification badge */}
                                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
                                </button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent
                                align="end"
                                className="w-96 p-0"
                            >
                                <div className="p-4">
                                    <DropdownMenuLabel className="p-0 text-base font-semibold">
                                        Notifications
                                    </DropdownMenuLabel>
                                </div>

                                <DropdownMenuSeparator />

                                <div className="max-h-[400px] overflow-y-auto">
                                    {notifications.length > 0 ? (
                                        notifications.map((notification) => (
                                            <DropdownMenuItem
                                                key={notification.id}
                                                className="flex cursor-pointer flex-col items-start gap-1 p-4"
                                            >
                                                <div className="flex w-full items-center justify-between">
                                                    <span className="font-medium">
                                                        {notification.title}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {notification.time}
                                                    </span>
                                                </div>

                                                <p className="text-sm text-muted-foreground">
                                                    {notification.description}
                                                </p>
                                            </DropdownMenuItem>
                                        ))
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-8 text-center">
                                            <Bell className="mb-2 h-8 w-8 text-muted-foreground" />
                                            <p className="text-sm text-muted-foreground">
                                                No notifications yet
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <DropdownMenuSeparator />

                                <button className="w-full p-3 text-center text-sm font-medium text-primary hover:bg-muted">
                                    View all notifications
                                </button>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Avatar className="size-6 overflow-hidden rounded-full sm:size-10 md:size-12">
                            <AvatarImage src="" alt={'test'} />
                            <AvatarFallback className="rounded-lg bg-neutral-200 text-[10px] text-black sm:text-sm lg:text-base dark:bg-neutral-700 dark:text-white">
                                {'ha'}
                            </AvatarFallback>
                        </Avatar>
                    </div>
                </div>
                <div className="grow overflow-hidden rounded-lg bg-background">
                    <div className="flex h-full w-full items-center justify-center">
                        <div className="flex flex-col items-center text-center">
                            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-200">
                                <MessageCircleQuestion
                                    size={40}
                                    className="text-gray-500"
                                />
                            </div>

                            <h1 className="text-xl font-semibold">
                                No Message Selected
                            </h1>

                            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                                Choose a conversation from the sidebar to start
                                chatting.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
