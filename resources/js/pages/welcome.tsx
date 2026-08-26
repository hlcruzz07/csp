import { Head, Link, usePage } from '@inertiajs/react';
import {
    Clock3,
    Lock,
    MessagesSquare,
    PenLine,
    ShieldCheck,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import ThemeButton from '@/components/ThemeButton';
import { login, register } from '@/routes';

type DemoStage = 'draft' | 'sorting' | 'sent';

const DRAFT_TEXT =
    "I've been falling behind on requirements and I don't know how to bring it up with my adviser...";

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
                        <span
                            key={tag}
                            className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all duration-500 ${
                                isActive
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'border-border text-muted-foreground/60'
                            } ${stage === 'draft' ? 'opacity-0' : 'opacity-100'}`}
                        >
                            {tag}
                        </span>
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

export default function Welcome() {
    const { auth } = usePage<any>().props;

    return (
        <>
            <Head title="Counseling Support System" />

            <style>{`
                @keyframes blink { 50% { opacity: 0; } }
                @keyframes breathe {
                    0%, 100% { transform: scale(1); opacity: 0.5; }
                    50% { transform: scale(1.04); opacity: 0.7; }
                }
            `}</style>

            <ThemeButton />

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
                    <header className="flex items-center justify-between opacity-100 transition-opacity duration-700 starting:opacity-0">
                        <div className="flex items-baseline gap-2">
                            <span className="gcis-display text-lg font-semibold tracking-tight text-primary">
                                Counseling Support System
                            </span>
                        </div>

                        <nav className="flex items-center gap-2 text-sm">
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
                    </header>

                    <main className="flex flex-1 flex-col items-center justify-center gap-14 py-16 lg:flex-row lg:items-center lg:gap-20 lg:py-0">
                        <div className="max-w-xl opacity-100 transition-opacity delay-150 duration-700 starting:translate-y-3 starting:opacity-0">
                            <h1 className="gcis-display mt-5 text-4xl leading-[1.1] font-medium tracking-tight text-balance lg:text-5xl">
                                Some things are easier to write than to say.
                            </h1>

                            <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground">
                                The Counseling Support System gives students a
                                private, guided way to reach a real guidance
                                counselor for academic, personal, or emotional
                                concerns on your own schedule, in your own
                                words.
                            </p>

                            {!auth.user && (
                                <div className="mt-8 flex items-center gap-3">
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
                        </div>

                        <div className="opacity-100 transition-opacity delay-300 duration-700 starting:opacity-0">
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
                                <div key={title} className="text-left">
                                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <Icon className="h-4.5 w-4.5" />
                                    </div>
                                    <h3 className="gcis-display text-[15px] font-medium">
                                        {title}
                                    </h3>
                                    <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                                        {body}
                                    </p>
                                </div>
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

                    <footer className="mt-auto border-t border-border py-8 text-[12.5px] text-muted-foreground">
                        <p className="mt-1">
                            The Counseling Support System provides a secure and
                            accessible space for students to seek counseling
                            support, manage their appointments, and stay
                            connected with available counseling services.
                        </p>
                    </footer>
                </div>
            </div>
        </>
    );
}
