import CompleteStudentModal from './modal/CompleteStudentModal';
import { FormEvent, useEffect, useRef, useState } from 'react';
import apiService from '@/lib/api-service';
import { Categories, UserProps } from '@/types/entities';
import MatchingCounselorModal from './modal/MatchingCounselorModal';
import WelcomeModal from './modal/WelcomeModal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { handleErrors, normalizeName, resolveAvatarUrl } from '@/lib/utils';
import { useInitials } from '@/hooks/use-initials';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';
import {
    checkConversation,
    fetchMessages,
    sendMessage,
    suggestMessage,
} from '@/routes';
import { EmptyState } from '@/components/counselor/EmptyState';
import dayjs from 'dayjs';
import { AttachmentsGrid } from './modal/AttachementsGrid';
import {
    Attachment,
    AttachmentAction,
    AttachmentActions,
    AttachmentContent,
    AttachmentDescription,
    AttachmentGroup,
    AttachmentMedia,
    AttachmentTitle,
} from '@/components/ui/attachment';
import {
    FileIcon,
    FilePlus,
    FilePlus2Icon,
    FileText,
    Grid2X2Plus,
    ImageIcon,
    ImagePlusIcon,
    Music,
    Paperclip,
    Plus,
    SendHorizontal,
    Sparkles,
    Tag,
    Video,
    XIcon,
} from 'lucide-react';
import InputEmoji from 'react-input-emoji';
import { StudentDrawer } from '@/pages/student/modal/StudentDrawer';
import { router, useForm, usePage } from '@inertiajs/react';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuPortal,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import SendingMessageDialog from '../../components/SendingMessage';
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

type Suggestion = {
    title: string;
    message: string;
};

type PageProps = {
    isCompleted: boolean;
    auth: {
        user: UserProps;
    };
    categories: Categories[];
    messages: Message[];
};

export default function Dashboard() {
    const {
        isCompleted,
        auth,
        categories,
        messages: initialMessages,
    } = usePage<PageProps>().props;

    const getInitials = useInitials();
    const isMobile = useIsMobile();
    const counselor = auth.user?.student_conversation?.counselor ?? null;

    // ---- Conversation / message list state ----
    const [hasConvo, setHasConvo] = useState(!!auth.user.student_conversation);
    const [isOpenWelcome, setOpenWelcome] = useState(false);
    const [messages, setMessages] = useState<Message[]>(initialMessages ?? []);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);

    // Messenger-style tap-to-reveal timestamp — only one message's timestamp
    // is shown at a time, centered above its bubble. Tapping anywhere on the
    // message row (avatar included) toggles it; attachment clicks are kept
    // isolated so opening/closing their preview never affects this state.
    const [activeTimestampId, setActiveTimestampId] = useState<number | null>(
        null,
    );

    const containerRef = useRef<HTMLDivElement | null>(null);

    // True while we want the view to auto-stick to the bottom
    // (i.e. the user hasn't scrolled up to read older messages).
    const shouldStickToBottomRef = useRef(true);

    // True while we're restoring scroll position after loading older
    // messages — blocks the ResizeObserver from yanking us to bottom.
    const skipAutoScrollRef = useRef(false);

    // ---- Composer / AI suggestion state ----
    const [openSuggestAi, setOpenSuggestAi] = useState(false);
    const [suggestMessages, setSuggestMessages] = useState<Suggestion[]>([]);
    const [isSuggesting, setIsSuggesting] = useState(false);

    const formRef = useRef<HTMLFormElement>(null);

    const { data, setData, post, processing, reset, progress } = useForm({
        category_id: null as null | number,
        attachments: [] as File[],
        conversation_uuid: auth.user.student_conversation?.uuid,
        content: '',
        is_structured: false as boolean,
    });

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

    const appendUniqueMessage = (message: Message) => {
        setMessages((prevMessages) => {
            if (prevMessages.some((item) => item.id === message.id)) {
                return prevMessages;
            }

            return [...prevMessages, message];
        });
    };

    // Use the UUID consistently — this is what the channel name and
    // broadcasting/auth check both key off now.
    const conversation_id = auth.user.student_conversation?.uuid;

    useEffect(() => {
        if (!isCompleted || hasConvo) return; // already matched — nothing to poll for

        let timeoutId: ReturnType<typeof setTimeout>;

        const poll = async () => {
            try {
                const response = await apiService.get(checkConversation().url);
                const hasConversation = response.data.hasConversation;

                if (!hasConversation) {
                    timeoutId = setTimeout(poll, 3000);
                    return;
                }

                // Conversation just matched — reload to get fresh server props
                // (auth.user.student_conversation, useForm's initial state, etc.)
                window.location.reload();
            } catch (error) {
                console.error(error);
                timeoutId = setTimeout(poll, 3000);
            }
        };

        poll();

        return () => clearTimeout(timeoutId);
    }, [isCompleted, hasConvo]);
    const loadMessages = async (page = 1) => {
        if (!conversation_id) return;
        if (isLoadingMessages || isLoadingOlderMessages) return;

        const node = containerRef.current;
        const previousScrollTop = node?.scrollTop ?? 0;
        const previousScrollHeight = node?.scrollHeight ?? 0;

        if (page === 1) {
            setIsLoadingMessages(true);
        } else {
            skipAutoScrollRef.current = true; // block auto-scroll for this load
            setIsLoadingOlderMessages(true);
        }

        try {
            const response = await apiService.get(
                fetchMessages(conversation_id, {
                    query: { page, per_page: 20 },
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
                shouldStickToBottomRef.current = true;
                requestAnimationFrame(() =>
                    requestAnimationFrame(setScrollBottom),
                );
            } else {
                requestAnimationFrame(() =>
                    requestAnimationFrame(() => {
                        preserveScrollPosition(
                            previousScrollHeight,
                            previousScrollTop,
                        );
                        // release the block only after position is restored
                        skipAutoScrollRef.current = false;
                    }),
                );
            }
        } catch (error) {
            console.error('Error loading messages', error);
            skipAutoScrollRef.current = false;
        } finally {
            setIsLoadingMessages(false);
            setIsLoadingOlderMessages(false);
        }
    };

    useEffect(() => {
        if (!isCompleted || !conversation_id) return;

        loadMessages(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [conversation_id, isCompleted]);

    useEffect(() => {
        if (skipAutoScrollRef.current) return;
        if (!shouldStickToBottomRef.current) return;

        requestAnimationFrame(() => requestAnimationFrame(setScrollBottom));
    }, [messages]);

    const handleScroll = () => {
        const node = containerRef.current;
        if (!node) return;

        // Track whether the user is near the bottom so we know whether
        // to keep auto-sticking them there as new content streams in.
        const isNearBottom =
            node.scrollHeight - node.scrollTop - node.clientHeight < 120;
        shouldStickToBottomRef.current = isNearBottom;

        if (isLoadingOlderMessages || !hasMore) return;

        if (node.scrollTop <= 120 && currentPage < lastPage) {
            loadMessages(currentPage + 1);
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

        channel.listenToAll((event: string, data: any) => {
            if (event.endsWith('MessageSent') || event === 'MessageSent') {
                appendUniqueMessage(data.message as Message);
            }
        });

        return () => {
            echo.leave(`conversation.${conversation_id}`);
        };
    }, [conversation_id]);

    // ---- Composer handlers ----
    const handleSend = (e: FormEvent) => {
        e.preventDefault();
        if (processing) return;

        post(sendMessage().url, {
            forceFormData: true,
            preserveScroll: true,
            onError: (err) => {
                console.error('Error sending message', err);
                handleErrors(err);
            },
            onSuccess: () => {
                reset();
                shouldStickToBottomRef.current = true;
                void loadMessages(1);

                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        setScrollBottom();
                    });
                });
            },
        });
    };

    const selectedCategoryName = categories.find(
        (item) => item.id === data.category_id,
    )?.name;

    const selectedCategoryDesc = categories.find(
        (item) => item.id === data.category_id,
    )?.description;

    const suggest = async () => {
        if (isSuggesting) return;
        setIsSuggesting(true);
        try {
            const { data: responseData } = await apiService.post(
                suggestMessage().url,
                {
                    message: data.content,
                    category: selectedCategoryName ?? null,
                    category_description: selectedCategoryDesc ?? null,
                },
            );
            setSuggestMessages(responseData.suggestions ?? []);
        } finally {
            setIsSuggesting(false);
        }
    };

    useEffect(() => {
        if (!openSuggestAi || !data.content.trim()) return;

        const timeout = setTimeout(() => {
            suggest();
        }, 1500);

        return () => clearTimeout(timeout);
    }, [openSuggestAi, data.content, data.category_id]);

    const handleAttachmentChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        maxSizeMB = 5,
    ) => {
        const newFiles = Array.from(e.target.files || []);
        const currentFiles = data.attachments || [];
        const total = currentFiles.length + newFiles.length;

        if (total > 5) {
            toast.error('You can only upload a maximum of 5 attachments');
            e.target.value = '';
            return;
        }

        const oversized = newFiles.filter(
            (file) => file.size > maxSizeMB * 1024 * 1024,
        );
        if (oversized.length > 0) {
            toast.error(
                oversized.length === 1
                    ? `"${oversized[0].name}" exceeds the ${maxSizeMB}MB limit`
                    : `${oversized.length} files exceed the ${maxSizeMB}MB limit`,
            );
            e.target.value = '';
            return;
        }

        setData('attachments', [...currentFiles, ...newFiles]);
    };

    // Toggle the centered, Messenger-style timestamp for a message. Tapping
    // the same message again (or tapping another message) closes/switches it —
    // only one timestamp is visible at a time.
    const toggleTimestamp = (id: number) => {
        setActiveTimestampId((prev) => (prev === id ? null : id));
    };

    if (!isCompleted) return <CompleteStudentModal />;
    if (!hasConvo) return <MatchingCounselorModal />;

    return (
        <div className="flex h-dvh min-h-0 flex-col overflow-hidden">
            <WelcomeModal open={isOpenWelcome} setOpen={setOpenWelcome} />
            {data.attachments.length > 0 && (
                <SendingMessageDialog open={processing} progress={progress} />
            )}

            {/* Header */}
            <div className="flex items-center justify-between p-3">
                <div className="flex cursor-pointer items-center gap-2">
                    <Avatar className="size-10 overflow-hidden rounded-full md:size-12">
                        <AvatarImage
                            src={resolveAvatarUrl(counselor?.avatar)}
                            alt={normalizeName(counselor?.name || '')}
                        />
                        <AvatarFallback className="rounded-lg bg-neutral-200 text-xs text-black md:text-sm dark:bg-neutral-700 dark:text-white">
                            {getInitials(
                                normalizeName(counselor?.name || '') ?? '',
                            )}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex flex-col text-sm md:text-base">
                        <h1>
                            {normalizeName(counselor?.name || '')}
                            {' - '}
                            {normalizeName(counselor?.role || 'Undefined')}
                        </h1>
                        <small className="capitalized">
                            {auth.user?.assigned_college?.name}{' '}
                            {`(${auth.user?.assigned_college?.code})`}
                        </small>
                    </div>
                </div>

                <StudentDrawer onSave={() => loadMessages(1)} />
            </div>

            {/* Messages */}
            <div
                className="m-2 my-0 flex min-h-0 flex-1 flex-col gap-2 overflow-auto rounded-lg border bg-accent/20 p-1 md:mx-4 md:p-4"
                ref={containerRef}
                onScroll={handleScroll}
            >
                {messages.length > 0 ? (
                    [...messages].map((message, index) => {
                        const isMine = message.sender_id === auth.user.id;

                        return (
                            <div
                                key={index}
                                className={`flex cursor-pointer items-end gap-2 select-none ${isMine ? 'flex-row-reverse' : ''}`}
                                role="button"
                                tabIndex={0}
                                onClick={() => toggleTimestamp(message.id)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        toggleTimestamp(message.id);
                                    }
                                }}
                            >
                                <Avatar className="size-8 overflow-hidden rounded-full sm:size-10 md:size-12">
                                    <AvatarImage
                                        src={
                                            !message.sender?.is_anonymous
                                                ? resolveAvatarUrl(
                                                      message.sender?.avatar,
                                                  )
                                                : '/default.webp'
                                        }
                                        alt={normalizeName(
                                            message.sender?.name,
                                        )}
                                        className="object-cover"
                                    />
                                    <AvatarFallback className="rounded-lg bg-neutral-200 text-xs text-black shadow-md sm:text-sm lg:text-base dark:bg-neutral-700 dark:text-white">
                                        {getInitials(
                                            normalizeName(
                                                message.sender?.name,
                                            ) ?? '',
                                        )}
                                    </AvatarFallback>
                                </Avatar>

                                <div className="flex max-w-[60%] flex-col items-start lg:max-w-[40%]">
                                    <div
                                        className={`flex items-center text-xs sm:text-sm`}
                                    >
                                        <small className="text-xs text-foreground/80 sm:text-sm">
                                            {!isMine &&
                                                normalizeName(
                                                    message.sender?.name,
                                                )}
                                        </small>
                                    </div>

                                    {/* Messenger-style timestamp: hidden by default,
                                        centered above the bubble, revealed on tap/click
                                        anywhere on the message row (avatar included).
                                        Replaces the old hover Tooltip, which doesn't
                                        work on touch devices. */}
                                    <div className="flex w-full flex-col items-center">
                                        {activeTimestampId === message.id && (
                                            <span className="mb-1 rounded-full bg-muted px-3 py-1 text-[11px] text-muted-foreground">
                                                {dayjs(
                                                    message.created_at,
                                                ).format(
                                                    'MMM D, YYYY - hh:mm A',
                                                )}
                                            </span>
                                        )}

                                        <div
                                            className={`${message.is_structured && 'mt-4'}`}
                                        >
                                            {message.attachments?.length >
                                                0 && (
                                                // Attachments (images, videos,
                                                // audio, files) open their own
                                                // preview/modal on click. That
                                                // click still bubbles through
                                                // the React tree even when the
                                                // modal renders in a portal, so
                                                // without stopping it here,
                                                // opening AND closing the modal
                                                // would each re-trigger
                                                // toggleTimestamp on the row —
                                                // this keeps attachment
                                                // interactions fully isolated
                                                // from the timestamp toggle,
                                                // regardless of attachment type.
                                                <div
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                >
                                                    <AttachmentsGrid
                                                        attachments={
                                                            message.attachments
                                                        }
                                                    />
                                                </div>
                                            )}
                                            {message.content && (
                                                <div
                                                    className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                                                >
                                                    <div
                                                        className={`relative max-w-full ${
                                                            message.is_structured
                                                                ? 'group'
                                                                : ''
                                                        }`}
                                                    >
                                                        {message.is_structured && (
                                                            <span className="absolute -top-3 left-3 z-10 flex items-center gap-1 rounded-full bg-violet-500 px-2 py-0.5 text-xs font-semibold text-white shadow">
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
                                                            className={`p-3 px-4 text-sm font-medium transition-all sm:text-base ${
                                                                isMine
                                                                    ? 'overflow-hidden rounded-t-3xl rounded-tr-3xl rounded-br-sm rounded-bl-3xl bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                                                                    : 'rounded-t-3xl rounded-tl-3xl rounded-br-3xl rounded-bl-sm bg-background'
                                                            } ${
                                                                message.is_structured
                                                                    ? 'shadow-[0_0_18px_rgba(168,85,247,0.25)] ring-2 ring-violet-300/60'
                                                                    : ''
                                                            } `}
                                                        >
                                                            {message.content}
                                                        </p>
                                                        {message.category && (
                                                            <div className="mt-1 flex justify-end">
                                                                <span className="inline-flex items-center gap-1 rounded-full border-violet-400 bg-white px-2 py-0.5 text-xs font-semibold text-violet-700 shadow dark:bg-zinc-900 dark:text-violet-300">
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
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <EmptyState />
                )}
            </div>

            {/* Composer */}
            <form
                ref={formRef}
                onSubmit={handleSend}
                className="relative shrink-0 p-3"
            >
                {/* Floating panel — category badge, attachment previews, AI suggestions.
                    Positioned absolutely ABOVE the input row (bottom-full) so it overlays
                    the chat instead of pushing/squeezing the messages list. This is what
                    stops it from covering the conversation permanently on small screens —
                    it now floats over it and can be dismissed / scrolled independently. */}
                {(data.category_id ||
                    data.attachments.length > 0 ||
                    openSuggestAi) && (
                    <div className="absolute inset-x-3 bottom-full z-20 mb-2 flex max-h-[45vh] flex-col gap-2 overflow-y-auto rounded-xl border bg-background/95 p-3 shadow-lg backdrop-blur-sm sm:max-h-[40vh]">
                        {/* Category Badge */}
                        {data.category_id && (
                            <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/50 p-3">
                                <span className="text-xs text-muted-foreground">
                                    Message Category:
                                </span>
                                <Badge variant="secondary">
                                    {selectedCategoryName}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                    {selectedCategoryDesc}
                                </span>
                            </div>
                        )}

                        {/* Attachments preview — the outer panel now owns the
                            scroll/height budget, so this no longer needs its
                            own max-h/overflow */}
                        {data.attachments.length > 0 && (
                            <AttachmentGroup className="flex flex-wrap items-start gap-2">
                                {data.attachments.map((item, i) => {
                                    const url = URL.createObjectURL(item);

                                    const isImage =
                                        item.type.startsWith('image/');
                                    const isAudio =
                                        item.type.startsWith('audio/');
                                    const isVideo =
                                        item.type.startsWith('video/');
                                    const isPdf =
                                        item.type === 'application/pdf';

                                    const kindLabel = isPdf
                                        ? 'PDF'
                                        : isVideo
                                          ? 'Video'
                                          : isAudio
                                            ? 'Audio'
                                            : isImage
                                              ? 'Image'
                                              : 'File';

                                    const sizeLabel = `${(
                                        item.size /
                                        1024 /
                                        1024
                                    ).toFixed(2)} MB`;

                                    return (
                                        <Attachment
                                            key={i}
                                            className="relative"
                                        >
                                            {isImage ? (
                                                <AttachmentMedia variant="image">
                                                    <img
                                                        src={url}
                                                        alt={item.name}
                                                        className="h-full w-full object-cover"
                                                    />
                                                </AttachmentMedia>
                                            ) : isVideo ? (
                                                <AttachmentMedia variant="image">
                                                    <video
                                                        src={url}
                                                        className="h-full w-full object-cover"
                                                        muted
                                                    />
                                                </AttachmentMedia>
                                            ) : (
                                                <AttachmentMedia>
                                                    {isPdf ? (
                                                        <FileText className="size-6 text-red-500" />
                                                    ) : isAudio ? (
                                                        <Music className="size-6 text-primary" />
                                                    ) : (
                                                        <FileIcon className="size-6 text-primary" />
                                                    )}
                                                </AttachmentMedia>
                                            )}

                                            <AttachmentContent>
                                                <AttachmentTitle>
                                                    {item.name}
                                                </AttachmentTitle>
                                                <AttachmentDescription>
                                                    {kindLabel} · {sizeLabel}
                                                </AttachmentDescription>
                                            </AttachmentContent>

                                            <AttachmentActions>
                                                <AttachmentAction
                                                    aria-label={`Remove ${item.name}`}
                                                    onClick={() =>
                                                        setData(
                                                            'attachments',
                                                            data.attachments.filter(
                                                                (_, index) =>
                                                                    index !== i,
                                                            ),
                                                        )
                                                    }
                                                >
                                                    <XIcon />
                                                </AttachmentAction>
                                            </AttachmentActions>

                                            <Badge
                                                className="absolute -top-1 left-0 z-10"
                                                variant="secondary"
                                            >
                                                {i + 1}
                                            </Badge>
                                        </Attachment>
                                    );
                                })}
                            </AttachmentGroup>
                        )}

                        {/* AI Suggestions Panel — also no longer self-scrolling,
                            the outer floating panel handles height + scroll */}
                        {openSuggestAi && (
                            <div className="flex flex-col gap-2">
                                {isSuggesting ? (
                                    <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3 text-sm text-muted-foreground">
                                        <Sparkles className="size-4 animate-spin text-primary" />
                                        <span className="flex items-center gap-1">
                                            Generating suggestions
                                            <span className="inline-flex gap-0.5">
                                                <span className="animate-bounce [animation-delay:0ms]">
                                                    .
                                                </span>
                                                <span className="animate-bounce [animation-delay:150ms]">
                                                    .
                                                </span>
                                                <span className="animate-bounce [animation-delay:300ms]">
                                                    .
                                                </span>
                                            </span>
                                        </span>
                                    </div>
                                ) : suggestMessages.length > 0 ? (
                                    <>
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <Sparkles className="size-3 text-primary" />
                                            <span>
                                                AI Suggestions — Click to Use
                                            </span>
                                        </div>

                                        <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap">
                                            {suggestMessages.map(
                                                (item, index) => (
                                                    <button
                                                        key={index}
                                                        type="button"
                                                        onClick={() => {
                                                            setData(
                                                                'content',
                                                                item.message,
                                                            );
                                                            setSuggestMessages(
                                                                [],
                                                            );
                                                            setOpenSuggestAi(
                                                                false,
                                                            );
                                                            setData(
                                                                'is_structured',
                                                                true,
                                                            );
                                                        }}
                                                        className="group flex cursor-pointer flex-col gap-1 rounded-lg border bg-muted/40 p-3 text-left transition-colors hover:border-primary hover:bg-primary/5 lg:w-[calc(33.333%-0.5rem)]"
                                                    >
                                                        <span className="flex items-center gap-1 text-sm font-semibold text-primary">
                                                            <Sparkles className="size-3" />
                                                            {item.title}
                                                        </span>
                                                        <span className="text-sm text-muted-foreground group-hover:text-foreground">
                                                            {item.message}
                                                        </span>
                                                    </button>
                                                ),
                                            )}
                                        </div>
                                    </>
                                ) : data.content.trim() ? (
                                    <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3 text-xs text-muted-foreground">
                                        <Sparkles className="size-3" />
                                        <span>
                                            Type a bit more to get
                                            suggestions...
                                        </span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3 text-xs text-muted-foreground">
                                        <Sparkles className="size-3" />
                                        <span>
                                            Start typing to get AI suggestions
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Input Row — the only normal-flow child of the composer now,
                    so its height stays constant and the messages list's flex-1
                    space never gets squeezed by category/attachments/AI state.
                    Attachments, Category, and AI Suggestions are now consolidated
                    into ONE dropdown (with submenus) behind a single trigger,
                    instead of three separate buttons — this frees up the
                    horizontal room InputEmoji needs so it doesn't grow taller
                    as quickly when the user types a lot of text. */}
                <div className="flex grow items-end gap-2">
                    {/* Combined "more options" trigger */}
                    <Tooltip>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        type="button"
                                        disabled={processing}
                                        className={`composer-icon-btn relative size-10 shrink-0 cursor-pointer rounded-full ${
                                            data.category_id ||
                                            data.attachments.length > 0 ||
                                            openSuggestAi
                                                ? 'is-active'
                                                : ''
                                        }`}
                                    >
                                        <Plus className="size-4.5" />
                                        {(data.attachments.length > 0 ||
                                            data.category_id) && (
                                            <Badge
                                                className="absolute -top-1 -right-1 z-10 flex h-5 min-w-5 items-center justify-center rounded-full border-none! bg-red-500 px-1 text-xs leading-none"
                                                variant={'outline'}
                                            >
                                                {data.attachments.length +
                                                    (data.category_id ? 1 : 0)}
                                            </Badge>
                                        )}
                                    </Button>
                                </TooltipTrigger>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent
                                className="w-56"
                                align="start"
                                side="top"
                            >
                                <DropdownMenuLabel>Options</DropdownMenuLabel>
                                <DropdownMenuSeparator />

                                {/* Attachments submenu */}
                                <DropdownMenuSub>
                                    <DropdownMenuSubTrigger
                                        disabled={
                                            processing ||
                                            data.attachments.length >= 5
                                        }
                                        className="cursor-pointer"
                                    >
                                        <Paperclip className="mr-2 size-4" />
                                        <span className="flex-1">
                                            Attachments
                                        </span>
                                        {data.attachments.length > 0 && (
                                            <Badge
                                                className="ml-2 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs leading-none"
                                                variant="secondary"
                                            >
                                                {data.attachments.length}
                                            </Badge>
                                        )}
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuPortal>
                                        <DropdownMenuSubContent className="w-44">
                                            <DropdownMenuItem
                                                className="cursor-pointer"
                                                onSelect={(e) => {
                                                    e.preventDefault();
                                                    document
                                                        .getElementById(
                                                            'attachments-image',
                                                        )
                                                        ?.click();
                                                }}
                                            >
                                                <ImageIcon className="mr-2 size-4" />
                                                Images
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="cursor-pointer"
                                                onSelect={(e) => {
                                                    e.preventDefault();
                                                    document
                                                        .getElementById(
                                                            'attachments-video',
                                                        )
                                                        ?.click();
                                                }}
                                            >
                                                <Video className="mr-2 size-4" />
                                                Videos
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="cursor-pointer"
                                                onSelect={(e) => {
                                                    e.preventDefault();
                                                    document
                                                        .getElementById(
                                                            'attachments-audio',
                                                        )
                                                        ?.click();
                                                }}
                                            >
                                                <Music className="mr-2 size-4" />
                                                Audio
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="cursor-pointer"
                                                onSelect={(e) => {
                                                    e.preventDefault();
                                                    document
                                                        .getElementById(
                                                            'attachments-file',
                                                        )
                                                        ?.click();
                                                }}
                                            >
                                                <FileText className="mr-2 size-4" />
                                                Files
                                            </DropdownMenuItem>
                                        </DropdownMenuSubContent>
                                    </DropdownMenuPortal>
                                </DropdownMenuSub>

                                {/* Category submenu */}
                                <DropdownMenuSub>
                                    <DropdownMenuSubTrigger
                                        disabled={processing}
                                        className="cursor-pointer"
                                    >
                                        <Grid2X2Plus className="mr-2 size-4" />
                                        <span className="flex-1">Category</span>
                                        {data.category_id && (
                                            <Badge
                                                className="ml-2 max-w-20 truncate rounded-full px-1 text-xs leading-none"
                                                variant="secondary"
                                            >
                                                {selectedCategoryName}
                                            </Badge>
                                        )}
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuPortal>
                                        <DropdownMenuSubContent className="w-56">
                                            {categories?.map((item) => (
                                                <DropdownMenuCheckboxItem
                                                    key={item.id}
                                                    checked={
                                                        data.category_id ===
                                                        item.id
                                                    }
                                                    onCheckedChange={(
                                                        checked,
                                                    ) => {
                                                        setData(
                                                            'category_id',
                                                            checked
                                                                ? item.id
                                                                : null,
                                                        );
                                                    }}
                                                >
                                                    {item.name}
                                                </DropdownMenuCheckboxItem>
                                            ))}
                                        </DropdownMenuSubContent>
                                    </DropdownMenuPortal>
                                </DropdownMenuSub>

                                <DropdownMenuSeparator />

                                {/* AI Suggestions toggle — plain checkbox item, no submenu needed */}
                                <DropdownMenuCheckboxItem
                                    checked={openSuggestAi}
                                    disabled={processing}
                                    onCheckedChange={(checked) =>
                                        setOpenSuggestAi(checked)
                                    }
                                    className="cursor-pointer"
                                >
                                    <Sparkles className="mr-2 size-4" />
                                    AI Suggestions
                                </DropdownMenuCheckboxItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <TooltipContent side="top">
                            <p>Attachments, category & AI suggestions</p>
                        </TooltipContent>
                    </Tooltip>

                    {/* Hidden inputs — one per type, so each opens the OS picker filtered correctly */}
                    <Input
                        type="file"
                        hidden
                        id="attachments-image"
                        accept=".jpg,.png,.jpeg,.webp"
                        multiple
                        onChange={(e) => handleAttachmentChange(e)}
                    />
                    <Input
                        type="file"
                        hidden
                        id="attachments-video"
                        accept=".mp4,.mov,.webm,.mkv,.avi,.m4v"
                        multiple
                        onChange={(e) => handleAttachmentChange(e, 50)}
                    />
                    <Input
                        type="file"
                        hidden
                        id="attachments-audio"
                        accept=".mp3,.wav,.m4a,.ogg"
                        multiple
                        onChange={(e) => handleAttachmentChange(e)}
                    />
                    <Input
                        type="file"
                        hidden
                        id="attachments-file"
                        accept=".pdf,.doc,.docx,.txt,.csv,.xlsx"
                        multiple
                        onChange={(e) => handleAttachmentChange(e)}
                    />

                    <div className="min-w-0 flex-1">
                        <InputEmoji
                            fontSize={15}
                            placeholderColor="var(--muted-foreground)"
                            placeholder="Type a message"
                            cleanOnEnter
                            keepOpened={true}
                            value={data.content}
                            onChange={(value) => {
                                if (value === '') {
                                    setSuggestMessages([]);
                                    setData('is_structured', false);
                                }
                                setData('content', value);
                            }}
                            onEnter={() => {
                                if (processing || data.content.trim() === '') {
                                    return;
                                }

                                formRef.current?.requestSubmit();
                            }}
                        />
                    </div>

                    <Button
                        type="submit"
                        className={`${!isMobile ? 'w-28' : 'size-10'} shrink-0 cursor-pointer rounded-full`}
                        disabled={
                            processing ||
                            (!data.content.trim() &&
                                data.attachments.length === 0)
                        }
                    >
                        {processing ? (
                            <>
                                <Spinner />
                                {!isMobile && 'Sending...'}
                            </>
                        ) : (
                            <>
                                {!isMobile && 'Send'} <SendHorizontal />
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
