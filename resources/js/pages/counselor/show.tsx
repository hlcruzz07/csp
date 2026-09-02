import CounselorLayout from '@/layouts/counselor-layout';
import { Categories, Conversation, UserProps } from '@/types/entities';
import { FormEvent, useEffect, useRef, useState } from 'react';
import apiService from '@/lib/api-service';
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
    counselorResponse,
    fetchMessages,
    sendMessage,
    suggestMessage,
} from '@/routes';
import { EmptyState } from '@/components/counselor/EmptyState';
import dayjs from 'dayjs';
import { AttachmentsGrid } from '@/pages/student/modal/AttachementsGrid';
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
    Briefcase,
    FileIcon,
    FilePlus,
    FileText,
    Heart,
    Grid2X2Plus,
    HelpCircle,
    ImageIcon,
    Music,
    Paperclip,
    Plus,
    SendHorizontal,
    Sparkles,
    Tag,
    Video,
    XIcon,
    Zap,
} from 'lucide-react';
import InputEmoji from 'react-input-emoji';
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
import SendingMessageDialog from '@/components/SendingMessage';
import { startTour } from '@/lib/tour';

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
    conversation: Conversation;
    auth: { user: UserProps };
    // categories: Categories[];
    messages: Message[];
};

CounselorConversationShow.layout = (page: React.ReactNode) => (
    <CounselorLayout>{page}</CounselorLayout>
);

export default function CounselorConversationShow() {
    const {
        conversation,
        auth,
        // categories,
        messages: initialMessages,
    } = usePage<PageProps>().props;

    const getInitials = useInitials();
    const isMobile = useIsMobile();
    const student = conversation.student;
    const conversation_id = conversation.uuid;

    // ---- Message list state ----
    const [messages, setMessages] = useState<Message[]>(initialMessages ?? []);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);

    // Messenger-style tap-to-reveal timestamp — only one message's timestamp
    // is shown at a time, centered above its bubble.
    const [activeTimestampId, setActiveTimestampId] = useState<number | null>(
        null,
    );

    const containerRef = useRef<HTMLDivElement | null>(null);
    const shouldStickToBottomRef = useRef(true);
    const skipAutoScrollRef = useRef(false);

    // ---- Composer / AI suggestion state ----
    const [openSuggestAi, setOpenSuggestAi] = useState(false);
    const [suggestMessages, setSuggestMessages] = useState<Suggestion[]>([]);
    const [isSuggesting, setIsSuggesting] = useState(false);

    const formRef = useRef<HTMLFormElement>(null);

    const { data, setData, post, processing, reset, progress } = useForm({
        category_id: null as null | number,
        conversation_uuid: conversation.uuid,
        attachments: [] as File[],
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

    const loadMessages = async (page = 1) => {
        if (!conversation_id) return;
        if (isLoadingMessages || isLoadingOlderMessages) return;

        const node = containerRef.current;
        const previousScrollTop = node?.scrollTop ?? 0;
        const previousScrollHeight = node?.scrollHeight ?? 0;

        if (page === 1) {
            setIsLoadingMessages(true);
        } else {
            skipAutoScrollRef.current = true;
            setIsLoadingOlderMessages(true);
        }

        try {
            // NOTE: for the counselor view we need to tell the backend which
            // conversation to pull from — swap this for whatever your
            // Wayfinder route signature actually looks like.
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
        loadMessages(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [conversation_id]);

    useEffect(() => {
        if (skipAutoScrollRef.current) return;
        if (!shouldStickToBottomRef.current) return;

        requestAnimationFrame(() => requestAnimationFrame(setScrollBottom));
    }, [messages]);

    const handleScroll = () => {
        const node = containerRef.current;
        if (!node) return;

        const isNearBottom =
            node.scrollHeight - node.scrollTop - node.clientHeight < 120;
        shouldStickToBottomRef.current = isNearBottom;

        if (isLoadingOlderMessages || !hasMore) return;

        if (node.scrollTop <= 120 && currentPage < lastPage) {
            loadMessages(currentPage + 1);
        }
    };

    // Listen for broadcast events on this specific conversation
    useEffect(() => {
        console.log('effect running, conversation_id =', conversation_id);
        if (!conversation_id) {
            console.log('bailing: no conversation_id');
            return;
        }

        const echo = (window as any).Echo;
        console.log('echo instance:', echo);
        if (!echo) {
            console.error('Echo is not initialized');
            return;
        }

        const channel = echo.private(`conversation.${conversation_id}`);
        console.log(
            'subscribing to channel:',
            `conversation.${conversation_id}`,
        );
        channel.subscribed(() => console.log('✅ counselor subscribed'));
        channel.error((err: any) =>
            console.error('❌ counselor auth failed', err),
        );
        channel.listenToAll((event: string, data: any) => {
            console.log('📩 counselor received event', event, data);
            if (event.endsWith('MessageSent') || event === 'MessageSent') {
                appendUniqueMessage(data.message as Message);
            }
        });

        return () => echo.leave(`conversation.${conversation_id}`);
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

    // const selectedCategoryName = categories?.find(
    //     (item) => item.id === data.category_id,
    // )?.name;

    // const selectedCategoryDesc = categories?.find(
    //     (item) => item.id === data.category_id,
    // )?.description;

    const suggest = async () => {
        if (isSuggesting) return;
        setIsSuggesting(true);
        try {
            const { data: responseData } = await apiService.post(
                counselorResponse().url,
                {
                    studentMessages: messages
                        .filter((m) => m.sender_id !== auth.user.id)
                        .sort(
                            (a, b) =>
                                new Date(a.created_at).getTime() -
                                new Date(b.created_at).getTime(),
                        )
                        .slice(-5)
                        .map((m) => m.content),
                },
            );
            setSuggestMessages(responseData.suggestions ?? []);
        } finally {
            setIsSuggesting(false);
        }
    };

    useEffect(() => {
        if (!openSuggestAi) return;

        const timeout = setTimeout(() => {
            suggest();
        }, 1500);

        return () => clearTimeout(timeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [openSuggestAi]);

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

    const suggestionStyles: Record<
        string,
        { icon: typeof Briefcase; color: string; bg: string; border: string }
    > = {
        professional: {
            icon: Briefcase,
            color: 'text-blue-600 dark:text-blue-400',
            bg: 'bg-blue-50/60 dark:bg-blue-950/20',
            border: 'hover:border-blue-400',
        },
        empathetic: {
            icon: Heart,
            color: 'text-rose-600 dark:text-rose-400',
            bg: 'bg-rose-50/60 dark:bg-rose-950/20',
            border: 'hover:border-rose-400',
        },
        brief: {
            icon: Zap,
            color: 'text-amber-600 dark:text-amber-400',
            bg: 'bg-amber-50/60 dark:bg-amber-950/20',
            border: 'hover:border-amber-400',
        },
    };

    const getSuggestionStyle = (title: string) => {
        const key = title.toLowerCase();
        return (
            suggestionStyles[key] ?? {
                icon: Sparkles,
                color: 'text-primary',
                bg: 'bg-muted/40',
                border: 'hover:border-primary',
            }
        );
    };

    // Toggle the centered, Messenger-style timestamp for a message. Tapping
    // the same message again (or tapping another message) closes/switches it —
    // only one timestamp is visible at a time.
    const toggleTimestamp = (id: number) => {
        setActiveTimestampId((prev) => (prev === id ? null : id));
    };

    // ---- Tour ----
    // Only ever runs when the "?" button is clicked — no auto-start, no
    // persisted dismissal state.
    const runComposerTour = () => {
        startTour({
            steps: [
                {
                    element: '#tour-composer-options',
                    popover: {
                        title: 'Add attachments & AI help',
                        description:
                            'Use this button to attach files, images, audio, or turn AI suggestions on for support while drafting a response.',
                        side: 'top' as const,
                    },
                },
                {
                    element: '#tour-composer-input',
                    popover: {
                        title: 'Message input box',
                        description:
                            'This is where you type the student reply. You can also pick an AI suggestion and edit it before sending.',
                        side: 'top' as const,
                    },
                },
                {
                    element: '#tour-composer-send',
                    popover: {
                        title: 'Send message',
                        description:
                            'Press this when your reply is ready to send it to the student.',
                        side: 'top' as const,
                    },
                },
            ],
            config: {
                stagePadding: 10,
                showProgress: true,
                nextBtnText: 'Next',
                prevBtnText: 'Back',
                doneBtnText: 'Done',
            },
        });
    };

    return (
        <div className="flex h-full flex-col overflow-hidden bg-background">
            {/* Header */}
            {data.attachments.length > 0 && (
                <SendingMessageDialog open={processing} progress={progress} />
            )}
            <div className="flex items-center justify-between p-3">
                <div className="flex cursor-pointer items-center gap-2">
                    <Avatar className="size-10 overflow-hidden rounded-full md:size-12">
                        <AvatarImage
                            src={
                                !student?.is_anonymous
                                    ? resolveAvatarUrl(student?.avatar)
                                    : '/default.webp'
                            }
                            className="object-cover"
                            alt={normalizeName(student?.name || '')}
                        />
                        <AvatarFallback className="rounded-lg bg-neutral-200 text-xs text-black md:text-sm dark:bg-neutral-700 dark:text-white">
                            {getInitials(
                                normalizeName(
                                    !student?.is_anonymous
                                        ? student.name
                                        : student?.pseudonym,
                                ) ?? '',
                            )}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex flex-col text-sm md:text-base">
                        <h1 className="font-semibold">
                            {normalizeName(
                                !student?.is_anonymous
                                    ? student.name
                                    : student?.pseudonym,
                            )}
                        </h1>
                        <small className="capitalized text-xs text-muted-foreground md:text-sm">
                            {student?.assigned_college?.name}
                        </small>
                    </div>
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    className="rounded-full"
                    onClick={runComposerTour}
                    title="Show tutorial"
                >
                    <HelpCircle className="size-4.5" />
                </Button>
            </div>

            {/* Messages — h-full swapped for min-h-0 flex-1: inside a flex-col
                parent, h-full can push the child taller than the space actually
                left after the header + composer, relying on overflow-hidden to
                mask it. min-h-0 flex-1 makes it correctly claim only the
                remaining space and scroll within that, which is what lets the
                floating composer panel below sit flush against it. */}
            <div
                className="m-2 my-0 flex min-h-0 flex-1 flex-col gap-2 overflow-auto rounded-lg border bg-accent/20 p-1 md:mx-4 md:p-4"
                ref={containerRef}
                onScroll={handleScroll}
            >
                {messages.length > 0 ? (
                    messages.map((message, index) => {
                        const isMine = message.sender_id === auth.user.id;

                        // Anonymity now applies universally — even counselors see the default
                        // avatar and "Anonymous" label for anonymous students.
                        const isSenderAnonymous =
                            message.sender?.is_anonymous === true;
                        const shouldShowAvatar = !isSenderAnonymous;
                        const displayName = isSenderAnonymous
                            ? 'Anonymous'
                            : normalizeName(message.sender?.name);
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
                                            shouldShowAvatar
                                                ? resolveAvatarUrl(
                                                      message.sender?.avatar,
                                                  )
                                                : '/default.webp'
                                        }
                                        alt={displayName}
                                        className="object-cover"
                                    />
                                    <AvatarFallback className="rounded-lg bg-neutral-200 text-xs text-black shadow-md sm:text-sm lg:text-base dark:bg-neutral-700 dark:text-white">
                                        {getInitials(displayName ?? '')}
                                    </AvatarFallback>
                                </Avatar>

                                <div className="flex max-w-[60%] flex-col items-start lg:max-w-[40%]">
                                    <div
                                        className={`flex items-center text-xs sm:text-sm`}
                                    >
                                        <small className="text-xs text-foreground/80 sm:text-sm">
                                            {!isMine && displayName}
                                        </small>
                                    </div>

                                    {/* Messenger-style timestamp: hidden by default,
                                        centered above the bubble, revealed on tap/click
                                        of the message. Replaces the old hover Tooltip,
                                        which doesn't work on touch devices. */}
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
                                            className={`w-full ${message.is_structured && 'mt-4'}`}
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
                                                // toggleTimestamp on the parent
                                                // — this keeps attachment
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
                                                            <span
                                                                className={`absolute -top-3 left-3 z-10 flex items-center gap-1 rounded-full bg-violet-500 px-2 py-0.5 text-xs font-semibold text-white shadow`}
                                                            >
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

                                                        {message.category &&
                                                            !isMine && (
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

                                                        {isMine &&
                                                            index ===
                                                                messages.length -
                                                                    1 && (
                                                                <div className="mt-1 flex items-center justify-end gap-2">
                                                                    <small className="text-xs text-muted-foreground">
                                                                        {
                                                                            message.status
                                                                        }
                                                                    </small>
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
                {/* Floating panel — attachment previews + AI suggestions.
                    Positioned absolutely ABOVE the input row (bottom-full) so it
                    overlays the conversation instead of pushing/squeezing the
                    message list when it appears. */}
                {(data.attachments.length > 0 || openSuggestAi) && (
                    <div className="absolute inset-x-3 bottom-full z-20 mb-2 flex max-h-[45vh] flex-col gap-2 overflow-y-auto rounded-xl border bg-background/95 p-3 shadow-lg backdrop-blur-sm sm:max-h-[40vh]">
                        {/* {data.category_id && (
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
                        )} */}

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
                                ) : (
                                    suggestMessages.length > 0 && (
                                        <>
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <Sparkles className="size-3 text-primary" />
                                                <span>
                                                    AI Suggestions — Click to
                                                    Use
                                                </span>
                                            </div>

                                            <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap">
                                                {suggestMessages.map(
                                                    (item, index) => {
                                                        const style =
                                                            getSuggestionStyle(
                                                                item.title,
                                                            );
                                                        const Icon = style.icon;

                                                        return (
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
                                                                className={`group flex cursor-pointer flex-col gap-1.5 rounded-lg border p-3 text-left transition-colors lg:w-[calc(33.333%-0.5rem)] ${style.bg} ${style.border}`}
                                                            >
                                                                <span
                                                                    className={`flex items-center gap-1.5 text-sm font-semibold ${style.color}`}
                                                                >
                                                                    <Icon className="size-3.5" />
                                                                    {item.title}
                                                                </span>
                                                                <span className="text-sm text-muted-foreground group-hover:text-foreground">
                                                                    {
                                                                        item.message
                                                                    }
                                                                </span>
                                                            </button>
                                                        );
                                                    },
                                                )}
                                            </div>
                                        </>
                                    )
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Input Row — the only normal-flow child of the composer now.
                    Attachments + AI toggle are consolidated behind ONE trigger
                    (with a submenu for attachment types) instead of two separate
                    buttons, freeing horizontal room for InputEmoji. */}
                <div className="flex grow items-center gap-2">
                    <Tooltip>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <TooltipTrigger asChild>
                                    <Button
                                        id="tour-composer-options"
                                        variant="ghost"
                                        size="icon"
                                        type="button"
                                        disabled={processing}
                                        className={`composer-icon-btn relative size-10 shrink-0 cursor-pointer rounded-full ${
                                            data.attachments.length > 0 ||
                                            openSuggestAi
                                                ? 'is-active'
                                                : ''
                                        }`}
                                    >
                                        <Plus className="size-4.5" />
                                        {data.attachments.length > 0 && (
                                            <Badge
                                                className="absolute -top-1 -right-1 z-10 flex h-5 min-w-5 items-center justify-center rounded-full border-none! bg-red-500 px-1 text-xs leading-none"
                                                variant={'outline'}
                                            >
                                                {data.attachments.length}
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

                                {/* Category submenu — re-enable once `categories`
                                    is passed back into this page's props.
                                <DropdownMenuSub>
                                    <DropdownMenuSubTrigger className="cursor-pointer">
                                        <Grid2X2Plus className="mr-2 size-4" />
                                        <span className="flex-1">Category</span>
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuPortal>
                                        <DropdownMenuSubContent className="w-56">
                                            {categories?.map((item) => (
                                                <DropdownMenuCheckboxItem
                                                    key={item.id}
                                                    checked={data.category_id === item.id}
                                                    onCheckedChange={(checked) => {
                                                        setData('category_id', checked ? item.id : null);
                                                    }}
                                                >
                                                    {item.name}
                                                </DropdownMenuCheckboxItem>
                                            ))}
                                        </DropdownMenuSubContent>
                                    </DropdownMenuPortal>
                                </DropdownMenuSub>
                                */}

                                <DropdownMenuSeparator />

                                {/* AI Suggestions toggle */}
                                <DropdownMenuCheckboxItem
                                    checked={openSuggestAi}
                                    disabled={processing}
                                    onCheckedChange={(checked) =>
                                        setOpenSuggestAi(() => {
                                            if (!checked) {
                                                setSuggestMessages([]);
                                            }
                                            return checked;
                                        })
                                    }
                                    className="cursor-pointer"
                                >
                                    <Sparkles className="mr-2 size-4" />
                                    AI Suggestions
                                </DropdownMenuCheckboxItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <TooltipContent side="top">
                            <p>Attachments & AI suggestions</p>
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

                    <div id="tour-composer-input" className="min-w-0 flex-1">
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
                        id="tour-composer-send"
                        type="submit"
                        className={`${!isMobile ? 'w-28' : 'size-10'} shrink-0 cursor-pointer rounded-full`}
                        disabled={processing}
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
