import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useInitials } from '@/hooks/use-initials';
import { useIsMobile } from '@/hooks/use-mobile';
import { handleErrors, normalizeName } from '@/lib/utils';
import { StudentDrawer } from '@/pages/student/modal/StudentDrawer';
import { useForm, usePage } from '@inertiajs/react';
import {
    Grid2X2Plus,
    ImageIcon,
    ImagePlusIcon,
    SendHorizontal,
    Sparkles,
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
import { Categories, UserProps } from '@/types/entities';
import { FormEvent, useEffect, useRef, useState } from 'react';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import apiService from '@/lib/api-service';
import { sendMessage, suggestMessage } from '@/routes';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';

type StudentLayoutProps = {
    children: React.ReactNode;
};

type PageProps = {
    auth: {
        user: UserProps;
    };
    categories: Categories[];
};

type Suggestion = {
    title: string;
    message: string;
};

export default function StudentLayout({ children }: StudentLayoutProps) {
    const { auth, categories } = usePage<PageProps>().props;

    const getInitials = useInitials();
    const counselor = auth.user?.student_conversation?.counselor ?? null;
    const isMobile = useIsMobile();
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

    return (
        <div className="flex h-screen flex-col overflow-hidden">
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
                        <h1>
                            {normalizeName(counselor?.name || '')}{' '}
                            {normalizeName(counselor?.role || '')}
                        </h1>
                        <small className="capitalized">
                            {auth.user?.assigned_college?.name}{' '}
                            {`(${auth.user?.assigned_college?.code})`}
                        </small>
                    </div>
                </div>

                <StudentDrawer />
            </div>

            {children}

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
                                                    e.target.value = ''; // reset input
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
