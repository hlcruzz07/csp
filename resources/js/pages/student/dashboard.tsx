import { usePage } from '@inertiajs/react';
import CompleteStudentModal from './modal/CompleteStudentModal';
import { useEffect, useRef, useState } from 'react';
import apiService from '@/lib/api-service';
import { Categories, UserProps } from '@/types/entities';
import MatchingCounselorModal from './modal/MatchingCounselorModal';
import WelcomeModal from './modal/WelcomeModal';
import StudentLayout from '@/layouts/student-layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { normalizeName } from '@/lib/utils';
import { useInitials } from '@/hooks/use-initials';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';
import { checkConversation, studentMessages } from '@/routes';
import { EmptyState } from '@/components/counselor/EmptyState';
import dayjs from 'dayjs';
import { AttachmentsGrid } from './modal/AttachementsGrid';
import { Sparkles, Tag } from 'lucide-react';

type Message = {
    id: number;
    conversation_id: number;
    sender_id: number;
    category_id: number | null;
    content: string;
    is_structured: boolean;
    category?: Categories;
    status: string;
    sender: UserProps;
    attachments: { id: number; file_url: string }[];
    created_at: string;
};

export default function Dashboard() {
    const {
        isCompleted,
        auth,
        messages: initialMessages,
    } = usePage<any>().props;

    const [hasConvo, setHasConvo] = useState(false);
    const [isOpenWelcome, setOpenWelcome] = useState(false);
    const [messages, setMessages] = useState<Message[]>(initialMessages ?? []);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);
    const getInitials = useInitials();
    const isMobile = useIsMobile();

    const containerRef = useRef<HTMLDivElement | null>(null);

    const setScrollBottom = () => {
        const node = containerRef.current;
        if (!node) return;
        node.scrollTop = node.scrollHeight;
    };

    const preserveScrollPosition = (
        previousScrollHeight: number,
        previousScrollTop: number,
    ) => {
        const node = containerRef.current;
        if (!node) return;

        const newScrollHeight = node.scrollHeight;
        node.scrollTop =
            newScrollHeight - previousScrollHeight + previousScrollTop;
    };

    // Use the UUID consistently — this is what the channel name and
    // broadcasting/auth check both key off now.
    const conversation_id = auth.user.student_conversation?.uuid;

    useEffect(() => {
        if (!isCompleted) return;

        let timeoutId: ReturnType<typeof setTimeout>;

        const poll = async () => {
            try {
                const response = await apiService.get(checkConversation().url);
                const hasConversation = response.data.hasConversation;

                setHasConvo(hasConversation);

                if (!hasConversation) {
                    timeoutId = setTimeout(poll, 3000);
                    return;
                }

                const cookie = document.cookie
                    .split('; ')
                    .find((row) => row.startsWith('csp_welcome_no_show='))
                    ?.split('=')[1];

                if (!cookie) setOpenWelcome(true);
            } catch (error) {
                console.error(error);
                timeoutId = setTimeout(poll, 3000);
            }
        };

        poll();

        return () => clearTimeout(timeoutId);
    }, [isCompleted]);

    const loadMessages = async (page = 1, preserveScroll = false) => {
        if (!conversation_id) return;
        if (isLoadingMessages || isLoadingOlderMessages) return;

        const node = containerRef.current;
        const previousScrollTop = node?.scrollTop ?? 0;
        const previousScrollHeight = node?.scrollHeight ?? 0;

        if (page === 1) {
            setIsLoadingMessages(true);
        } else {
            setIsLoadingOlderMessages(true);
        }

        try {
            const response = await apiService.get(
                studentMessages({
                    query: {
                        page,
                        per_page: 20,
                    },
                }).url,
            );

            const payload = response.data;
            const fetchedMessages = (payload.data as Message[]).reverse();

            setMessages((existingMessages) =>
                page === 1
                    ? fetchedMessages
                    : [...fetchedMessages, ...existingMessages],
            );
            setCurrentPage(payload.current_page ?? page);
            setLastPage(payload.last_page ?? page);
            setHasMore(page < (payload.last_page ?? page));

            if (page === 1) {
                requestAnimationFrame(() =>
                    requestAnimationFrame(setScrollBottom),
                );
            } else {
                requestAnimationFrame(() =>
                    requestAnimationFrame(() =>
                        preserveScrollPosition(
                            previousScrollHeight,
                            previousScrollTop,
                        ),
                    ),
                );
            }
        } catch (error) {
            console.error('Error loading messages', error);
        } finally {
            setIsLoadingMessages(false);
            setIsLoadingOlderMessages(false);
        }
    };

    useEffect(() => {
        if (!isCompleted || !conversation_id) return;

        loadMessages(1);
    }, [conversation_id, isCompleted]);

    const handleScroll = () => {
        const node = containerRef.current;
        if (!node || isLoadingOlderMessages || !hasMore) return;

        if (node.scrollTop <= 120 && currentPage < lastPage) {
            loadMessages(currentPage + 1, true);
        }
    };

    // Listen for broadcast events
    useEffect(() => {
        if (!conversation_id) return;

        const echo = (window as any).Echo;
        if (!echo) {
            console.error('Echo is not initialized');
            return;
        }

        const channel = echo.private(`conversation.${conversation_id}`);

        channel.subscribed(() => {
            console.log('✅ Subscribed to conversation', conversation_id);
        });

        channel.error((err: any) => {
            console.error('❌ Subscription error', err);
        });

        const handleMessageSent = (payload: any) => {
            const event = payload?.message ?? payload;
            if (!event?.id) return;

            const node = containerRef.current;
            const isMine = event.sender_id === auth.user.id;

            // Decide BEFORE the new message is appended to state, since
            // appending changes scrollHeight and would skew the check.
            const isNearBottom = node
                ? node.scrollHeight - node.scrollTop - node.clientHeight < 120
                : true;

            setMessages((existingMessages) => {
                if (
                    existingMessages.some((message) => message.id === event.id)
                ) {
                    return existingMessages;
                }

                return [...existingMessages, event];
            });

            // Always snap to bottom for your own messages; for messages
            // from others, only auto-scroll if already near the bottom.
            // Double rAF ensures we wait until the DOM has actually
            // painted the new message before measuring/scrolling.
            if (isMine || isNearBottom) {
                requestAnimationFrame(() =>
                    requestAnimationFrame(setScrollBottom),
                );
            }
        };

        channel.listen('MessageSent', handleMessageSent);
        channel.listen('.MessageSent', handleMessageSent);
        channel.listen('App\\Events\\MessageSent', handleMessageSent);
        channel.listen('App.Events.MessageSent', handleMessageSent);

        channel.listenToAll((event: string, data: any) => {
            if (event.endsWith('MessageSent') || event === 'MessageSent') {
                handleMessageSent(data);
            }
        });

        return () => {
            echo.leave(`conversation.${conversation_id}`);
        };
    }, [conversation_id]);

    if (!isCompleted) return <CompleteStudentModal />;
    if (!hasConvo) return <MatchingCounselorModal />;
    return (
        <StudentLayout>
            <WelcomeModal open={isOpenWelcome} setOpen={setOpenWelcome} />

            <div
                className="m-2 my-0 flex h-full flex-col gap-2 overflow-auto rounded-lg border bg-accent/20 p-1 md:mx-4 md:p-4"
                ref={containerRef}
                onScroll={handleScroll}
            >
                {messages.length > 0 ? (
                    [...messages].map((message) => {
                        const isMine = message.sender_id === auth.user.id;

                        console.log(message);
                        return (
                            <div
                                key={message.id}
                                className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : ''}`}
                            >
                                <Avatar className="size-6 overflow-hidden rounded-full sm:size-10 md:size-12">
                                    <AvatarImage
                                        src={`/storage/${message.sender?.avatar}`}
                                        alt={normalizeName(
                                            message.sender?.name,
                                        )}
                                        className="object-cover"
                                    />
                                    <AvatarFallback className="rounded-lg bg-neutral-200 text-[10px] text-black shadow-md sm:text-sm lg:text-base dark:bg-neutral-700 dark:text-white">
                                        {getInitials(
                                            normalizeName(
                                                message.sender?.name,
                                            ) ?? '',
                                        )}
                                    </AvatarFallback>
                                </Avatar>

                                <div className="max-w-[60%] lg:max-w-[40%]">
                                    <div
                                        className={`ms-2 mb-1 flex items-center px-2 text-xs sm:text-sm lg:text-base ${
                                            isMine
                                                ? 'justify-end'
                                                : 'justify-between'
                                        }`}
                                    >
                                        <small className="text-foreground/80">
                                            {!isMine &&
                                                normalizeName(
                                                    message.sender?.name,
                                                )}
                                        </small>
                                    </div>

                                    {/* Attachments */}

                                    {/* Message bubble */}
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div
                                                className={`${message.is_structured && 'mt-4'}`}
                                            >
                                                {message.attachments?.length >
                                                    0 && (
                                                    <AttachmentsGrid
                                                        attachments={
                                                            message.attachments
                                                        }
                                                    />
                                                )}
                                                {message.content && (
                                                    <div className="flex justify-end">
                                                        <div
                                                            className={`relative w-max ${
                                                                message.is_structured
                                                                    ? 'group'
                                                                    : ''
                                                            }`}
                                                        >
                                                            {message.is_structured && (
                                                                <span className="absolute -top-3 left-3 z-10 flex items-center gap-1 rounded-full bg-violet-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow">
                                                                    <Sparkles className="h-3 w-3" />
                                                                    AI Suggested
                                                                </span>
                                                            )}

                                                            {message.is_structured && (
                                                                <>
                                                                    <Sparkles className="absolute -top-2 -left-2 h-4 w-4 text-yellow-400 drop-shadow-sm" />
                                                                    <Sparkles className="absolute -top-1 -right-2 h-3 w-3 text-violet-400 opacity-80" />
                                                                    <Sparkles className="absolute -right-1 bottom-3 h-3.5 w-3.5 text-sky-400 opacity-80" />
                                                                </>
                                                            )}

                                                            <p
                                                                className={`p-3 px-4 text-xs font-medium transition-all sm:text-sm lg:text-base ${
                                                                    isMine
                                                                        ? 'overflow-hidden rounded-t-3xl rounded-tr-3xl rounded-br-sm rounded-bl-3xl bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                                                                        : 'rounded-t-3xl rounded-tl-3xl rounded-br-3xl rounded-bl-sm bg-background'
                                                                } ${
                                                                    message.is_structured
                                                                        ? 'shadow-[0_0_18px_rgba(168,85,247,0.25)] ring-2 ring-violet-300/60'
                                                                        : ''
                                                                } `}
                                                            >
                                                                {
                                                                    message.content
                                                                }
                                                            </p>
                                                            {message.category && (
                                                                <div className="mt-1 flex justify-end">
                                                                    <span className="inline-flex items-center gap-1 rounded-full border border-violet-400 bg-white px-2 py-0.5 text-xs font-semibold text-violet-700 shadow dark:bg-zinc-900 dark:text-violet-300">
                                                                        <Tag className="h-3 w-3" />
                                                                        {
                                                                            message
                                                                                .category
                                                                                .name
                                                                        }
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent
                                            side={
                                                isMobile
                                                    ? 'top'
                                                    : isMine
                                                      ? 'left'
                                                      : 'right'
                                            }
                                        >
                                            <small className="text-[10px] md:text-xs! xl:text-sm!">
                                                {dayjs(
                                                    message.created_at,
                                                ).format(
                                                    'MMM D, YYYY - hh:mm A',
                                                )}
                                            </small>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <EmptyState />
                )}
            </div>
        </StudentLayout>
    );
}
