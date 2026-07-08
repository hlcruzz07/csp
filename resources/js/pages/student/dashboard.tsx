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
import { handleErrors, normalizeName } from '@/lib/utils';
import { useInitials } from '@/hooks/use-initials';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';
import {
    checkConversation,
    conversations,
    fetchMessages,
    sendMessage,
    suggestMessage,
} from '@/routes';
import { EmptyState } from '@/components/counselor/EmptyState';
import dayjs from 'dayjs';
import { AttachmentsGrid } from './modal/AttachementsGrid';
import {
    Grid2X2Plus,
    ImageIcon,
    ImagePlusIcon,
    SendHorizontal,
    Sparkles,
    Tag,
    XIcon,
} from 'lucide-react';
import InputEmoji from 'react-input-emoji';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StudentDrawer } from '@/pages/student/modal/StudentDrawer';
import { router, useForm, usePage } from '@inertiajs/react';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';

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
    const [hasConvo, setHasConvo] = useState(false);
    const [isOpenWelcome, setOpenWelcome] = useState(false);
    const [messages, setMessages] = useState<Message[]>(initialMessages ?? []);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);

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

                if (!hasConversation) {
                    setHasConvo(false);
                    timeoutId = setTimeout(poll, 3000);
                    return;
                }

                // Refresh Inertia's shared props (auth.user.student_conversation)
                // now that a match exists, so counselor info is actually populated.
                router.reload({
                    only: ['auth'],
                    onSuccess: () => setHasConvo(true),
                });

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
                fetchMessages({ query: { page, per_page: 20 } }).url,
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
        const node = containerRef.current;
        if (!node) return;

        const observer = new ResizeObserver(() => {
            if (skipAutoScrollRef.current) return;
            if (!shouldStickToBottomRef.current) return;
            setScrollBottom();
        });

        observer.observe(node);

        return () => observer.disconnect();
    }, [hasConvo]);

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
                setMessages((prevMessages) => [...prevMessages, data.message]);
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

    if (!isCompleted) return <CompleteStudentModal />;
    if (!hasConvo) return <MatchingCounselorModal />;

    return (
        <div className="flex h-screen flex-col overflow-hidden">
            <WelcomeModal open={isOpenWelcome} setOpen={setOpenWelcome} />

            {/* Header */}
            <div className="flex items-center justify-between p-3">
                <div className="flex cursor-pointer items-center gap-2">
                    <Avatar className="size-10 overflow-hidden rounded-full md:size-12">
                        <AvatarImage
                            src={counselor?.avatar || undefined}
                            alt={normalizeName(counselor?.name || '')}
                        />
                        <AvatarFallback className="rounded-lg bg-neutral-200 text-xs text-black md:text-sm dark:bg-neutral-700 dark:text-white">
                            {getInitials(
                                normalizeName(counselor?.name || '') ?? '',
                            )}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex flex-col text-sm md:text-base">
                        <h1>{normalizeName(counselor?.name || '')}</h1>
                        <small className="capitalized">
                            {normalizeName(counselor?.role || '')} -{' '}
                            {auth.user?.assigned_college?.name}{' '}
                            {`(${auth.user?.assigned_college?.code})`}
                        </small>
                    </div>
                </div>

                <StudentDrawer onSave={() => loadMessages(1)} />
            </div>

            {/* Messages */}
            <div
                className="m-2 my-0 flex h-full flex-col gap-2 overflow-auto rounded-lg border bg-accent/20 p-1 md:mx-4 md:p-4"
                ref={containerRef}
                onScroll={handleScroll}
            >
                {messages.length > 0 ? (
                    [...messages].map((message, index) => {
                        const isMine = message.sender_id === auth.user.id;

                        return (
                            <div
                                key={index}
                                className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : ''}`}
                            >
                                <Avatar className="size-6 overflow-hidden rounded-full sm:size-10 md:size-12">
                                    <AvatarImage
                                        src={
                                            !message.sender?.is_anonymous &&
                                            message.sender?.avatar
                                                ? `/storage/${message.sender.avatar}`
                                                : '/default.webp'
                                        }
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

            {/* Composer */}
            <form
                ref={formRef}
                onSubmit={handleSend}
                className="relative space-y-3 p-3"
            >
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

                {/* Image Attachments */}
                {data.attachments.length > 0 && (
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(90px,1fr))] gap-3">
                        {data.attachments.map((item, i) => (
                            <div className="relative aspect-square" key={i}>
                                <div className="h-full overflow-hidden rounded-xl border">
                                    <img
                                        src={URL.createObjectURL(item)}
                                        alt=""
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                                <Badge
                                    className="absolute -top-1 -right-1 z-10 cursor-pointer p-0"
                                    variant={'destructive'}
                                    onClick={() => {
                                        setData(
                                            'attachments',
                                            data.attachments.filter(
                                                (_, index) => index !== i,
                                            ),
                                        );
                                    }}
                                >
                                    <XIcon />
                                </Badge>

                                <Badge
                                    className="absolute -top-1 left-0 z-10 cursor-pointer"
                                    variant={'secondary'}
                                >
                                    {i + 1}
                                </Badge>
                            </div>
                        ))}
                        <Button
                            type="button"
                            size="icon"
                            className="aspect-square h-auto w-full cursor-pointer"
                            onClick={() =>
                                document.getElementById('attachments')?.click()
                            }
                        >
                            <ImagePlusIcon />
                        </Button>
                    </div>
                )}

                <div className="flex flex-col gap-2">
                    {/* AI Suggestions Panel */}
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
                                        {suggestMessages.map((item, index) => (
                                            <button
                                                key={index}
                                                type="button"
                                                onClick={() => {
                                                    setData(
                                                        'content',
                                                        item.message,
                                                    );
                                                    setSuggestMessages([]);
                                                    setOpenSuggestAi(false);
                                                    setData(
                                                        'is_structured',
                                                        true,
                                                    );
                                                }}
                                                className="group flex cursor-pointer flex-col gap-1 rounded-lg border bg-muted/40 p-3 text-left transition-colors hover:border-primary hover:bg-primary/5 lg:w-[calc(33.333%-0.5rem)]"
                                            >
                                                <span className="flex items-center gap-1 text-xs font-semibold text-primary">
                                                    <Sparkles className="size-3" />
                                                    {item.title}
                                                </span>
                                                <span className="text-xs text-muted-foreground group-hover:text-foreground">
                                                    {item.message}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </>
                            ) : data.content.trim() ? (
                                <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3 text-xs text-muted-foreground">
                                    <Sparkles className="size-3" />
                                    <span>
                                        Type a bit more to get suggestions...
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

                    {/* Input Row */}
                    <div className="flex grow items-end gap-2">
                        <div className="flex items-center gap-2">
                            {/* Image Upload */}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant={'link'}
                                        size={'icon'}
                                        type="button"
                                        disabled={
                                            processing ||
                                            data.attachments.length >= 5
                                        }
                                        className="cursor-pointer border p-0!"
                                        onClick={() =>
                                            document
                                                .getElementById('attachments')
                                                ?.click()
                                        }
                                    >
                                        <ImageIcon />
                                        <Input
                                            type="file"
                                            hidden
                                            id="attachments"
                                            accept=".jpg,.png,.jpeg"
                                            multiple
                                            onChange={(e) => {
                                                const newFiles = Array.from(
                                                    e.target.files || [],
                                                );
                                                const currentFiles =
                                                    data.attachments || [];
                                                const total =
                                                    currentFiles.length +
                                                    newFiles.length;

                                                if (total > 5) {
                                                    toast.error(
                                                        'You can only upload a maximum of 5 images',
                                                    );
                                                    e.target.value = '';
                                                    return;
                                                }

                                                const oversized =
                                                    newFiles.filter(
                                                        (file) =>
                                                            file.size >
                                                            5 * 1024 * 1024,
                                                    );
                                                if (oversized.length > 0) {
                                                    toast.error(
                                                        oversized.length === 1
                                                            ? `"${oversized[0].name}" exceeds the 5MB limit`
                                                            : `${oversized.length} files exceed the 5MB limit`,
                                                    );
                                                    e.target.value = '';
                                                    return;
                                                }

                                                setData('attachments', [
                                                    ...currentFiles,
                                                    ...newFiles,
                                                ]);
                                            }}
                                        />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Upload Images</p>
                                </TooltipContent>
                            </Tooltip>

                            {/* Category Selector */}
                            <Tooltip>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="link"
                                                size="icon"
                                                type="button"
                                                disabled={processing}
                                                className={`relative cursor-pointer border p-0! ${data.category_id && 'bg-primary text-primary-foreground'}`}
                                            >
                                                <Grid2X2Plus className="h-4 w-4" />
                                                <Badge
                                                    className="absolute -top-1 -right-1 z-10 flex h-5 min-w-5 animate-pulse items-center justify-center rounded-full border-none! bg-red-500 px-1 text-[10px] leading-none"
                                                    variant={'outline'}
                                                >
                                                    {categories.length}
                                                </Badge>
                                            </Button>
                                        </TooltipTrigger>
                                    </DropdownMenuTrigger>

                                    <DropdownMenuContent
                                        className="w-max"
                                        align="start"
                                    >
                                        <DropdownMenuLabel>
                                            Select Categories
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        {categories?.map((item) => (
                                            <DropdownMenuCheckboxItem
                                                key={item.id}
                                                checked={
                                                    data.category_id === item.id
                                                }
                                                onCheckedChange={(checked) => {
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
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <TooltipContent side="bottom">
                                    <p>Select Categories</p>
                                </TooltipContent>
                            </Tooltip>

                            {/* AI Toggle */}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="link"
                                        size="icon"
                                        type="button"
                                        onClick={() =>
                                            setOpenSuggestAi((prev) => !prev)
                                        }
                                        disabled={processing}
                                        className={`cursor-pointer border p-0! transition-colors ${
                                            openSuggestAi
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-background'
                                        }`}
                                    >
                                        <Sparkles />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Toggle AI Suggestions</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>

                        <InputEmoji
                            fontSize={12}
                            placeholderColor="#d6e6f2"
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
                            onEnter={() => formRef.current?.requestSubmit()}
                        />

                        <Button
                            type="submit"
                            className={`${!isMobile ? 'w-28' : ''} cursor-pointer`}
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
                </div>
            </form>
        </div>
    );
}
