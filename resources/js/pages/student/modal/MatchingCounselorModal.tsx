import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Loader2, Search, SearchCheckIcon } from 'lucide-react';

export default function MatchingCounselorModal() {
    return (
        <Dialog open={true}>
            <DialogContent
                className="flex flex-col items-center gap-6 overflow-hidden py-10 text-center sm:max-w-md"
                showCloseButton={false}
            >
                {/* Animated background glow */}
                <div className="absolute inset-0 -z-10 animate-pulse bg-gradient-to-br from-primary/10 via-muted/10 to-accent/10" />

                {/* CUSTOM HEADER (centered) */}
                <div className="space-y-2 text-center">
                    <h2 className="flex items-center justify-center gap-2 text-xl font-semibold tracking-tight">
                        <Search /> Finding Your Counselor
                    </h2>

                    <p className="text-sm leading-relaxed text-muted-foreground">
                        Please wait while we securely assign you to an available
                        counselor within your college.
                    </p>
                </div>

                {/* Loader */}
                <div className="flex flex-col items-center gap-5">
                    <div className="relative flex items-center justify-center">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />

                        <div className="absolute inset-0 animate-ping rounded-full border border-primary/20" />
                    </div>

                    {/* Status */}
                    <div className="space-y-2">
                        <p className="flex items-center justify-center gap-2 text-sm font-medium">
                            Matching in progress
                            <span className="flex gap-1">
                                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" />
                                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:150ms]" />
                                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:300ms]" />
                            </span>
                        </p>

                        <p className="animate-pulse text-xs text-muted-foreground">
                            This may take a few moments...
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
