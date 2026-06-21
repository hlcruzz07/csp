import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEffect, useRef, useState } from 'react';
type WelcomeModalProps = {
    open: boolean;
    setOpen: (open: boolean) => void;
};
export default function WelcomeModal({ open, setOpen }: WelcomeModalProps) {
    const COOKIE_NAME = 'csp_welcome_no_show';

    const [dontShow, setDontShow] = useState(false);
    const prevOpenRef = useRef(open);

    const setCookie = (name: string, value: string, days = 365) => {
        const d = new Date();
        d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
        document.cookie = `${name}=${value};expires=${d.toUTCString()};path=/`;
    };

    const getCookie = (name: string) => {
        return (
            document.cookie
                .split('; ')
                .find((row) => row.startsWith(name + '='))
                ?.split('=')[1] ?? null
        );
    };

    useEffect(() => {
        // If cookie already set, don't open the modal
        if (open) {
            const cookie = getCookie(COOKIE_NAME);
            if (cookie === '1') {
                setOpen(false);
            }
        }
        prevOpenRef.current = open;
    }, [open]);

    useEffect(() => {
        // When modal closes and checkbox was checked, persist cookie
        if (prevOpenRef.current && !open && dontShow) {
            setCookie(COOKIE_NAME, '1', 365);
        }
        prevOpenRef.current = open;
    }, [open, dontShow]);
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent
                className="flex max-h-[85vh] flex-col gap-4 overflow-hidden sm:max-w-lg"
                showCloseButton={true}
            >
                {/* Header */}
                <DialogHeader className="space-y-2 text-center">
                    <DialogTitle className="text-xl font-semibold">
                        Welcome to the Counseling System 🎓
                    </DialogTitle>

                    <p className="text-sm text-muted-foreground">
                        Before you begin, please take a moment to read the
                        guidelines and learn how the system works.
                    </p>
                </DialogHeader>
                {/* Content */}
                <div className="no-scrollbar -mx-4 max-h-[50vh] space-y-5 overflow-y-auto px-4 text-sm">
                    {/* System Overview */}
                    <section className="space-y-2">
                        <h3 className="text-base font-semibold">
                            📌 System Overview
                        </h3>
                        <p className="leading-relaxed text-muted-foreground">
                            This platform automatically connects students to
                            assigned counselors within their college. You can
                            chat securely, seek guidance, and receive academic
                            or personal support.
                        </p>
                    </section>

                    {/* Rules */}
                    <section className="space-y-2">
                        <h3 className="text-base font-semibold">
                            📜 Rules & Regulations
                        </h3>
                        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                            <li>Always maintain respectful communication.</li>
                            <li>
                                Do not share sensitive personal data unless
                                necessary.
                            </li>
                            <li>
                                Misuse of the system may result in account
                                restrictions.
                            </li>
                            <li>
                                Conversations are monitored for safety and
                                compliance.
                            </li>
                        </ul>
                    </section>

                    {/* How to use */}
                    <section className="space-y-2">
                        <h3 className="text-base font-semibold">
                            🚀 How to Use the System
                        </h3>
                        <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
                            <li>Complete your student profile information.</li>
                            <li>Wait for automatic counselor assignment.</li>
                            <li>
                                Start chatting with your assigned counselor.
                            </li>
                            <li>
                                Use the system responsibly for guidance and
                                support.
                            </li>
                        </ol>
                    </section>

                    {/* Reminder */}
                    <section className="rounded-lg border bg-muted/30 p-3">
                        <p className="text-xs text-muted-foreground">
                            ⚠️ By continuing, you agree to follow all rules and
                            respect the counseling process.
                        </p>
                    </section>
                </div>
                {/* Footer action (optional) */}
                <DialogFooter>
                    <div className="flex w-full flex-col justify-between gap-3 md:flex-row">
                        <label className="inline-flex items-center gap-2 text-sm">
                            <input
                                id="dontShow"
                                type="checkbox"
                                checked={dontShow}
                                onChange={(e) => setDontShow(e.target.checked)}
                                className="h-4 w-4"
                            />
                            <span>Don't show again</span>
                        </label>
                        <DialogClose asChild>
                            <Button
                                type="button"
                                onClick={() => {
                                    if (dontShow)
                                        setCookie(COOKIE_NAME, '1', 365);
                                    setOpen(false);
                                }}
                            >
                                I Understand
                            </Button>
                        </DialogClose>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
