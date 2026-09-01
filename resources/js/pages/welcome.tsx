import { Head, Link, usePage } from '@inertiajs/react';
import {
    BadgeCheck,
    Clock3,
    Eye,
    EyeOff,
    GraduationCap,
    HeartHandshake,
    HeartPulse,
    Lock,
    Menu,
    MessagesSquare,
    PenLine,
    Quote,
    ShieldCheck,
    Sparkles,
    Users2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import ThemeButton from '@/components/ThemeButton';
import { login, register } from '@/routes';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Counselor } from '@/types/entities';
import { capitalizeString } from '@/lib/utils';

type DemoStage = 'draft' | 'sorting' | 'sent';

const DRAFT_TEXT =
    "I've been falling behind on requirements and I don't know how to bring it up with my adviser...";

/**
 * Real counselor record, expected to come from the backend as an Inertia
 * page prop (e.g. `Inertia::render('Welcome', ['counselors' => ...])`).
 * `avatar` is optional — until real staff photos are uploaded, the UI
 * falls back to a plain placeholder image built from the counselor's
 * initials so nothing here implies a photo that doesn't exist yet.
 */
interface WelcomeProps {
    counselors?: Counselor[];
}

function getInitials(name: string) {
    const parts = name.trim().split(/\s+/);
    const initials =
        (parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '');
    return initials.toUpperCase() || '—';
}

/**
 * Default avatar shown when a counselor has no photo on file. Lives at
 * `public/default.webp`, so it's served as-is from the site root — no
 * import needed, just drop the file in `public/`.
 */
const DEFAULT_AVATAR_URL = '/default.webp';

/**
 * Turns whatever is stored in `counselor.avatar` into a usable <img> src.
 * The backend can hand this two different shapes and both are supported:
 *  - a full URL, e.g. a Google account photo such as
 *    "https://lh3.googleusercontent.com/a/ACg8ocIEN...=s96-c" (used as-is)
 *  - a relative path under `storage/app/public/avatars`, e.g.
 *    "avatars/3f2c1b9e.jpg" (resolved to "/storage/avatars/3f2c1b9e.jpg",
 *    which Laravel serves once `php artisan storage:link` has been run)
 * Falls back to `DEFAULT_AVATAR_URL` when nothing is stored (null,
 * undefined, or an empty string).
 */
function resolveAvatarUrl(avatar: string | null | undefined, size = 600) {
    if (!avatar) return DEFAULT_AVATAR_URL;

    if (/^https?:\/\//i.test(avatar)) {
        // Google photo URLs end in something like "=s96-c" — bump the size
        if (/lh3\.googleusercontent\.com/i.test(avatar)) {
            return avatar.replace(/=s\d+-c$/i, `=s${size}-c`);
        }
        return avatar;
    }

    const path = avatar.replace(/^\/?storage\//, '').replace(/^\/+/, '');
    return `/storage/${path}`;
}
/**
 * Small looping demo that embodies the system's core mechanic: a student
 * writes freely, the entry gets organized into a concern category, then
 * it's routed privately to their assigned counselor. This mirrors the
 * "psychosocial concern expression" + "confidentiality" domains directly.
 */
function ExpressionDemo() {
    const [stage, setStage] = useState<DemoStage>('draft');
    const [typed, setTyped] = useState('');

    useEffect(() => {
        let charIndex = 0;
        let typingId: ReturnType<typeof setInterval>;
        let sortingTimeout: ReturnType<typeof setTimeout>;
        let sentTimeout: ReturnType<typeof setTimeout>;
        let resetTimeout: ReturnType<typeof setTimeout>;

        const runCycle = () => {
            setStage('draft');
            setTyped('');
            charIndex = 0;

            typingId = setInterval(() => {
                charIndex += 1;
                setTyped(DRAFT_TEXT.slice(0, charIndex));

                if (charIndex >= DRAFT_TEXT.length) {
                    clearInterval(typingId);

                    sortingTimeout = setTimeout(() => {
                        setStage('sorting');

                        sentTimeout = setTimeout(() => {
                            setStage('sent');

                            resetTimeout = setTimeout(runCycle, 3200);
                        }, 1600);
                    }, 500);
                }
            }, 28);
        };

        runCycle();

        return () => {
            clearInterval(typingId);
            clearTimeout(sortingTimeout);
            clearTimeout(sentTimeout);
            clearTimeout(resetTimeout);
        };
    }, []);

    return (
        <div className="relative w-full max-w-sm rounded-2xl border border-primary/15 bg-card/80 p-5 shadow-[0_1px_0_rgba(0,0,0,0.03),0_20px_45px_-25px_rgba(0,0,0,0.25)] backdrop-blur-sm">
            <div className="mb-3 flex items-center justify-between">
                <span className="gcis-mono text-[11px] tracking-wide text-primary/70 uppercase">
                    New entry
                </span>
                <span className="flex items-center gap-1 font-mono text-[10px] tracking-wide text-primary uppercase">
                    <Lock className="h-3 w-3" />
                    Private
                </span>
            </div>

            <p className="min-h-[4.5rem] text-[13.5px] leading-relaxed text-foreground/90">
                {typed}
                <span
                    aria-hidden
                    className={`ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 bg-primary motion-safe:animate-[blink_1s_steps(1)_infinite] ${
                        stage === 'draft' ? 'opacity-100' : 'opacity-0'
                    }`}
                />
            </p>

            <div className="mt-4 flex flex-wrap gap-1.5">
                {['Academic', 'Personal', 'Emotional'].map((tag) => {
                    const isActive = stage !== 'draft' && tag === 'Academic';

                    return (
                        <Badge
                            key={tag}
                            variant={isActive ? 'default' : 'outline'}
                            className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-all duration-500 ${
                                isActive
                                    ? 'border-transparent bg-primary/10 text-primary hover:bg-primary/10'
                                    : 'border-border text-muted-foreground/60'
                            } ${stage === 'draft' ? 'opacity-0' : 'opacity-100'}`}
                        >
                            {tag}
                        </Badge>
                    );
                })}
            </div>

            <div
                className={`mt-4 flex items-center gap-2 border-t border-border pt-3 text-[12px] text-primary transition-opacity duration-500 ${
                    stage === 'sent' ? 'opacity-100' : 'opacity-0'
                }`}
            >
                <ShieldCheck className="h-3.5 w-3.5" />
                Routed to your assigned counselor who only they can read this.
            </div>
        </div>
    );
}

/**
 * "See who can read this" — expands on the confidentiality claim already
 * made in the hero demo and feature grid, rather than introducing a new
 * one. Keep this in sync with however confidentiality actually works in
 * the backend (e.g. whether admins can access entries for support
 * purposes) so the page never promises more than the product does.
 */
function ConfidentialityDialog() {
    const rows: { label: string; icon: typeof Eye; can: boolean }[] = [
        { label: 'Your assigned counselor', icon: Eye, can: true },
        { label: 'Other counselors', icon: EyeOff, can: false },
        { label: 'Faculty and advisers', icon: EyeOff, can: false },
        { label: 'Other students', icon: EyeOff, can: false },
    ];

    return (
        <Dialog>
            <DialogTrigger asChild>
                <button className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-primary underline decoration-primary/30 underline-offset-4 transition-colors hover:decoration-primary">
                    <Lock className="h-3.5 w-3.5" />
                    See exactly who can read this
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle className="gcis-display">
                        Who can read your entries
                    </DialogTitle>
                    <DialogDescription>
                        Every entry and message you send is routed to one
                        person.
                    </DialogDescription>
                </DialogHeader>
                <div className="mt-2 divide-y divide-border">
                    {rows.map(({ label, icon: Icon, can }) => (
                        <div
                            key={label}
                            className="flex items-center justify-between py-3"
                        >
                            <span className="text-[13.5px] text-foreground/90">
                                {label}
                            </span>
                            <span
                                className={`flex items-center gap-1.5 text-[12px] font-medium ${
                                    can
                                        ? 'text-primary'
                                        : 'text-muted-foreground/70'
                                }`}
                            >
                                <Icon className="h-3.5 w-3.5" />
                                {can ? 'Can read' : "Can't read"}
                            </span>
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}

/**
 * Overlapping avatar stack for the hero, built from real counselor
 * records. Shows up to 5 photos (or initials placeholders) plus a "+N"
 * badge for the rest, and a live count instead of a made-up stat.
 */
function CounselorAvatarStack({ counselors }: { counselors: Counselor[] }) {
    if (counselors.length === 0) return null;

    const visible = counselors.slice(0, 5);
    const remaining = counselors.length - visible.length;

    return (
        <div className="flex items-center gap-3">
            <div className="flex -space-x-3">
                {visible.map((counselor) => (
                    <Avatar
                        key={counselor.id}
                        className="h-9 w-9 border-2 border-background"
                    >
                        <AvatarImage
                            src={resolveAvatarUrl(counselor.avatar)}
                            alt={counselor.name}
                            referrerPolicy="no-referrer"
                        />
                        <AvatarFallback className="bg-primary/10 text-[11px] font-semibold text-primary">
                            {getInitials(counselor.name)}
                        </AvatarFallback>
                    </Avatar>
                ))}
                {remaining > 0 && (
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-background bg-primary/10 text-[11px] font-semibold text-primary">
                        +{remaining}
                    </span>
                )}
            </div>
            <span className="text-[12.5px] text-muted-foreground">
                {counselors.length} counselor
                {counselors.length === 1 ? '' : 's'} currently taking new
                students
            </span>
        </div>
    );
}

/**
 * Full counselor directory, driven entirely by the `counselors` prop.
 * Shows a real empty state when the backend hasn't sent any records yet,
 * instead of falling back to invented staff.
 */
function CounselorGrid({ counselors }: { counselors: Counselor[] }) {
    if (counselors.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-border px-6 py-10 text-center">
                <p className="text-[13.5px] text-muted-foreground">
                    Counselor profiles will show up here once your team is added
                    on the backend.
                </p>
            </div>
        );
    }

    return (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {counselors.map((counselor) => (
                <Card
                    key={counselor.id}
                    className="overflow-hidden rounded-2xl border-primary/15 bg-card/80 py-0 shadow-[0_1px_0_rgba(0,0,0,0.03),0_20px_45px_-25px_rgba(0,0,0,0.25)]"
                >
                    <img
                        src={resolveAvatarUrl(counselor.avatar)}
                        alt={counselor.name}
                        className="h-60 w-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = DEFAULT_AVATAR_URL;
                        }}
                    />
                    <CardContent className="p-4">
                        <p className="text-[13.5px] font-semibold">
                            {capitalizeString(counselor.name)}
                        </p>
                        <p className="text-[12px] text-primary">
                            {capitalizeString(counselor.role)}
                        </p>
                        {counselor.assigned_college?.name && (
                            <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">
                                {counselor.assigned_college?.name}
                            </p>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

/**
 * Example writing-starter prompts, grouped by concern category. These are
 * sample prompts the guided-entry flow can offer — the same kind of thing
 * shown in the hero demo — not quotes attributed to real or fictional
 * students, so there's nothing here to misrepresent.
 */
const PROMPTS_BY_CATEGORY: {
    key: string;
    label: string;
    icon: typeof GraduationCap;
    prompts: string[];
}[] = [
    {
        key: 'academic',
        label: 'Academic',
        icon: GraduationCap,
        prompts: [
            "I've been falling behind on requirements and I don't know how to bring it up with my adviser...",
            "I'm not sure if I should shift programs or stick it out this semester...",
            'My grades lately have not reflected what has actually been going on for me...',
        ],
    },
    {
        key: 'personal',
        label: 'Personal',
        icon: HeartHandshake,
        prompts: [
            "Money has been tight this semester and I don't really know who else to tell...",
            "I'm commuting several hours a day and it's wearing me down...",
            'Things at home have been hard to focus around lately...',
        ],
    },
    {
        key: 'emotional',
        label: 'Emotional',
        icon: HeartPulse,
        prompts: [
            "I've been feeling anxious before class and I can't quite explain why...",
            "I don't feel like I have anyone on campus I can talk to about this...",
            "I keep putting off reaching out because I don't know how to start...",
        ],
    },
];

function PromptExplorer() {
    return (
        <Tabs defaultValue="academic" className="w-full">
            <TabsList className="h-auto flex-wrap justify-start gap-1.5 bg-transparent p-0">
                {PROMPTS_BY_CATEGORY.map(({ key, label, icon: Icon }) => (
                    <TabsTrigger
                        key={key}
                        value={key}
                        className="gap-1.5 rounded-full border border-border px-4 py-1.5 text-[13px] data-[state=active]:border-primary data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
                    >
                        <Icon className="h-3.5 w-3.5" />
                        {label}
                    </TabsTrigger>
                ))}
            </TabsList>

            {PROMPTS_BY_CATEGORY.map(({ key, prompts }) => (
                <TabsContent key={key} value={key} className="mt-6">
                    <Carousel
                        opts={{ align: 'start', loop: false }}
                        className="w-full"
                    >
                        <CarouselContent className="-ml-4">
                            {prompts.map((prompt) => (
                                <CarouselItem
                                    key={prompt}
                                    className="basis-full pl-4 sm:basis-1/2 lg:basis-1/3"
                                >
                                    <Card className="h-full rounded-2xl border-primary/15 bg-card/80 shadow-[0_1px_0_rgba(0,0,0,0.03),0_20px_45px_-25px_rgba(0,0,0,0.25)] backdrop-blur-sm">
                                        <CardContent className="flex h-full flex-col justify-between p-5">
                                            <p className="text-[13.5px] leading-relaxed text-foreground/90">
                                                {prompt}
                                            </p>
                                            <span className="gcis-mono mt-4 text-[10.5px] tracking-wide text-primary/70 uppercase">
                                                Example starter
                                            </span>
                                        </CardContent>
                                    </Card>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <div className="mt-6 flex items-center justify-center gap-3">
                            <CarouselPrevious className="static translate-y-0 rounded-full border-border text-primary hover:bg-primary/5" />
                            <CarouselNext className="static translate-y-0 rounded-full border-border text-primary hover:bg-primary/5" />
                        </div>
                    </Carousel>
                </TabsContent>
            ))}
        </Tabs>
    );
}

/**
 * Illustrative testimonial copy, explicitly anonymized and unattributed
 * to any real person. Treat this the same way as PROMPTS_BY_CATEGORY:
 * sample content to demonstrate the format, meant to be replaced with
 * real, consented testimonials before launch.
 */
const TESTIMONIALS: { quote: string; tag: string }[] = [
    {
        quote: "Writing it out first made it so much easier to actually bring it up. I didn't have to find the right words on the spot.",
        tag: 'Anonymous student',
    },
    {
        quote: 'I messaged late at night when I finally had the words for it, and my counselor picked it up the next morning.',
        tag: 'Anonymous student',
    },
    {
        quote: 'Knowing only one person would read it made the difference between writing it and deleting it.',
        tag: 'Anonymous student',
    },
];

function TestimonialGrid() {
    return (
        <div className="grid gap-5 sm:grid-cols-3">
            {TESTIMONIALS.map(({ quote, tag }) => (
                <Card
                    key={tag}
                    className="rounded-2xl border-primary/15 bg-card/80 shadow-[0_1px_0_rgba(0,0,0,0.03),0_20px_45px_-25px_rgba(0,0,0,0.25)]"
                >
                    <CardContent className="p-5">
                        <Quote className="h-4 w-4 text-primary/50" />
                        <p className="mt-3 text-[13.5px] leading-relaxed text-foreground/90">
                            {quote}
                        </p>
                        <Separator className="my-4" />
                        <span className="gcis-mono text-[10.5px] tracking-wide text-muted-foreground uppercase">
                            {tag}
                        </span>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

/**
 * FAQ content describes how the product actually behaves per the rest of
 * this page's copy (confidentiality, categorization, threaded messages).
 * Update the counselor-reassignment and crisis-routing answers to match
 * your real backend/support process before shipping.
 */
const FAQS: { q: string; a: string }[] = [
    {
        q: 'Who can see what I write?',
        a: 'Only your assigned counselor can read your entries and messages. They are not visible to advisers, faculty, or other students.',
    },
    {
        q: 'Is this the same as an emergency hotline?',
        a: "No. This platform is for ongoing academic, personal, and emotional support, not for emergencies. If you're in immediate danger or crisis, contact campus security, a trusted person, or a crisis line right away.",
    },
    {
        q: 'Do I need to know which category my concern falls under?',
        a: 'No. Guided prompts help sort your entry into a category for you, and you can always just write freely instead.',
    },
    {
        q: 'Can I request a different counselor?',
        a: 'No. Your counselor is assigned based on your college, so you’ll need to work with your assigned counselor.',
    },

    {
        q: 'Do my conversations disappear after I close the tab?',
        a: 'No. Conversations are threaded and saved, so you can pick up exactly where you left off, on your own time.',
    },
];

const TRUST_MARKERS: { icon: typeof ShieldCheck; label: string }[] = [
    { icon: ShieldCheck, label: 'Confidential by design' },
    { icon: BadgeCheck, label: 'Campus-verified counselors' },
    { icon: Sparkles, label: 'No cost to students' },
];

/**
 * Hero side photo. Placeholder URL by design — swap `HERO_IMAGE_URL` for a
 * real campus or office photo whenever it's ready; nothing else needs to
 * change.
 */
const HERO_IMAGE_URL =
    'https://placehold.co/640x480/EDE7DD/8A6D53?text=Campus+photo&font=roboto';

export default function Welcome({ counselors = [] }: WelcomeProps) {
    const { auth } = usePage<any>().props;

    return (
        <>
            <Head title="Counseling Support Platform" />

            <style>{`
                @keyframes blink { 50% { opacity: 0; } }
                @keyframes breathe {
                    0%, 100% { transform: scale(1); opacity: 0.5; }
                    50% { transform: scale(1.04); opacity: 0.7; }
                }
            `}</style>

            <ThemeButton className="top-auto right-3 bottom-3 left-auto" />

            <div className="gcis-body relative min-h-screen overflow-hidden border bg-background text-foreground">
                <div
                    aria-hidden
                    className="pointer-events-none absolute -top-32 -right-40 h-[26rem] w-[26rem] rounded-full bg-primary opacity-20 blur-[110px] motion-safe:animate-[breathe_9s_ease-in-out_infinite]"
                />
                <div
                    aria-hidden
                    className="pointer-events-none absolute top-1/2 -left-24 h-72 w-72 rounded-full bg-primary opacity-10 blur-[100px] motion-safe:animate-[breathe_11s_ease-in-out_infinite]"
                />

                <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-6 lg:px-10">
                    <header className="flex items-start justify-between opacity-100 transition-opacity duration-700 md:items-center starting:opacity-0">
                        <div className="flex items-baseline gap-2">
                            <span className="gcis-display text-xl font-extrabold tracking-tight text-primary">
                                Counseling Support Platform
                            </span>
                        </div>

                        <nav className="hidden items-center gap-2 text-sm md:flex">
                            {auth.user ? (
                                <Link
                                    href={'/dashboard'}
                                    className="rounded-full border border-border px-4 py-1.5 text-primary transition-colors hover:bg-primary/5"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={login()}
                                        className="rounded-full px-4 py-1.5 text-muted-foreground transition-colors hover:text-foreground"
                                    >
                                        Log in
                                    </Link>
                                    <Link
                                        href={register()}
                                        className="rounded-full bg-primary px-4 py-1.5 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                                    >
                                        Register
                                    </Link>
                                </>
                            )}
                        </nav>

                        {/* Mobile nav: same destinations as the desktop bar, in a Sheet */}
                        <Sheet>
                            <SheetTrigger asChild>
                                <button
                                    className="rounded-full border border-border p-2 text-foreground/80 transition-colors hover:bg-primary/5 md:hidden"
                                    aria-label="Open menu"
                                >
                                    <Menu className="h-4.5 w-4.5" />
                                </button>
                            </SheetTrigger>
                            <SheetContent side="right" className="w-72">
                                <div className="mt-10 flex flex-col gap-2">
                                    {auth.user ? (
                                        <SheetClose asChild>
                                            <Link
                                                href={'/dashboard'}
                                                className="rounded-lg border border-border px-4 py-2.5 text-center text-sm text-primary transition-colors hover:bg-primary/5"
                                            >
                                                Dashboard
                                            </Link>
                                        </SheetClose>
                                    ) : (
                                        <>
                                            <SheetClose asChild>
                                                <Link
                                                    href={register()}
                                                    className="rounded-lg bg-primary px-4 py-2.5 text-center text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                                                >
                                                    Register
                                                </Link>
                                            </SheetClose>
                                            <SheetClose asChild>
                                                <Link
                                                    href={login()}
                                                    className="rounded-lg border border-border px-4 py-2.5 text-center text-sm text-primary transition-colors hover:bg-primary/5"
                                                >
                                                    Log in
                                                </Link>
                                            </SheetClose>
                                        </>
                                    )}
                                </div>
                            </SheetContent>
                        </Sheet>
                    </header>

                    <main className="flex flex-1 flex-col items-center justify-center gap-14 py-10 lg:flex-row lg:items-center lg:gap-20 lg:py-0">
                        <div className="max-w-xl opacity-100 transition-opacity delay-150 duration-700 starting:translate-y-3 starting:opacity-0">
                            <div className="flex flex-wrap items-center gap-2">
                                {TRUST_MARKERS.map(({ icon: Icon, label }) => (
                                    <Badge
                                        key={label}
                                        variant="outline"
                                        className="gap-1.5 rounded-full border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-medium text-primary"
                                    >
                                        <Icon className="h-3 w-3" />
                                        {label}
                                    </Badge>
                                ))}
                            </div>

                            <h1 className="gcis-display mt-5 text-4xl leading-[1.1] font-medium tracking-tight text-balance lg:text-5xl">
                                Some things are easier to write than to say.
                            </h1>

                            <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground">
                                The Counseling Support Platform gives students a
                                private, guided way to reach a real guidance
                                counselor for academic, personal, or emotional
                                concerns on your own schedule, in your own
                                words.
                            </p>

                            <div className="mt-4">
                                <ConfidentialityDialog />
                            </div>

                            {!auth.user && (
                                <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                                    <Link
                                        href={register()}
                                        className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                                    >
                                        Get started
                                    </Link>
                                    <Link
                                        href={login()}
                                        className="rounded-full border border-border px-6 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
                                    >
                                        I already have an account
                                    </Link>
                                </div>
                            )}

                            <div className="mt-9">
                                <CounselorAvatarStack counselors={counselors} />
                            </div>
                        </div>

                        <div className="relative opacity-100 transition-opacity delay-300 duration-700 starting:opacity-0">
                            <img
                                src={HERO_IMAGE_URL}
                                alt="Campus"
                                className="absolute -top-10 -right-8 -z-10 h-56 w-72 rounded-2xl border border-primary/15 object-cover opacity-90 shadow-[0_20px_45px_-25px_rgba(0,0,0,0.35)] lg:-top-12 lg:-right-12 lg:h-64 lg:w-80"
                            />
                            <ExpressionDemo />
                        </div>
                    </main>

                    <section className="mt-10 border-t border-border py-14">
                        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                            {[
                                {
                                    icon: PenLine,
                                    title: 'Say it your way',
                                    body: 'Guided prompts help you organize academic, personal, or emotional concerns before you send them. No blank page.',
                                },
                                {
                                    icon: Clock3,
                                    title: 'Reach out when ready',
                                    body: "Message anytime. You don't need to wait for office hours or explain yourself twice.",
                                },
                                {
                                    icon: Lock,
                                    title: 'Only your counselor sees it',
                                    body: 'Conversations stay between you and your assigned counselor, kept confidential by design.',
                                },
                                {
                                    icon: MessagesSquare,
                                    title: 'Conversations that keep up',
                                    body: 'Threaded messages and attachments, so context is never lost between sessions.',
                                },
                            ].map(({ icon: Icon, title, body }) => (
                                <Card
                                    key={title}
                                    className="border-none bg-transparent text-left shadow-none"
                                >
                                    <CardContent className="p-0">
                                        <TooltipProvider delayDuration={200}>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="mb-3 flex h-9 w-9 cursor-default items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                        <Icon className="h-4.5 w-4.5" />
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent side="top">
                                                    {title}
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                        <h3 className="gcis-display text-[15px] font-medium">
                                            {title}
                                        </h3>
                                        <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                                            {body}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </section>

                    <section className="border-t border-border py-14">
                        <h2 className="gcis-display mb-8 text-xl font-medium">
                            How it reaches your counselor
                        </h2>
                        <div className="grid gap-8 sm:grid-cols-3">
                            {[
                                {
                                    n: '01',
                                    title: 'Share what’s on your mind',
                                    body: 'Write freely, or use a guided prompt to organize your thoughts.',
                                },
                                {
                                    n: '02',
                                    title: 'It’s sorted and routed privately',
                                    body: 'Your entry is categorized and sent only to your assigned counselor and never posted publicly.',
                                },
                                {
                                    n: '03',
                                    title: 'Your counselor responds',
                                    body: 'Continue the conversation on your own time, right where you left off.',
                                },
                            ].map(({ n, title, body }) => (
                                <div key={n}>
                                    <span className="gcis-mono text-xs text-primary">
                                        {n}
                                    </span>
                                    <h3 className="mt-2 text-[14px] font-semibold">
                                        {title}
                                    </h3>
                                    <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                                        {body}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {counselors.length > 0 && (
                        <section className="border-t border-border py-14">
                            <div className="mb-8 flex items-center gap-2 text-left">
                                <Users2 className="h-4 w-4 text-primary" />
                                <h2 className="gcis-display text-xl font-medium">
                                    Meet your counselors
                                </h2>
                            </div>
                            <CounselorGrid counselors={counselors} />
                        </section>
                    )}

                    <section className="border-t border-border py-14">
                        <div className="mb-15 text-left sm:mb-8">
                            <span className="gcis-mono text-xs text-primary uppercase">
                                Not sure where to start?
                            </span>
                            <h2 className="gcis-display mt-2 text-xl font-medium">
                                Pick a category, see a sample prompt
                            </h2>
                        </div>
                        <PromptExplorer />
                    </section>

                    <section className="border-t border-border py-14">
                        <h2 className="gcis-display mb-8 text-xl font-medium">
                            What students say
                        </h2>
                        <TestimonialGrid />
                    </section>

                    <section className="border-t border-border py-14">
                        <h2 className="gcis-display mb-6 text-xl font-medium">
                            Questions students ask
                        </h2>
                        <Accordion type="single" collapsible className="w-full">
                            {FAQS.map(({ q, a }) => (
                                <AccordionItem key={q} value={q}>
                                    <AccordionTrigger className="text-left text-[14px] font-medium">
                                        {q}
                                    </AccordionTrigger>
                                    <AccordionContent className="text-[13.5px] leading-relaxed text-muted-foreground">
                                        {a}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </section>

                    <footer className="mt-auto border-t border-border py-8 text-[12.5px] text-muted-foreground">
                        <p className="mt-1">
                            The Counseling Support Platform provides a secure
                            and accessible space for students to seek counseling
                            support, manage their appointments, and stay
                            connected with available counseling services.
                        </p>
                    </footer>
                </div>
            </div>
        </>
    );
}
