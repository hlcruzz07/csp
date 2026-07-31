import { AlertDialog, AlertDialogContent } from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { SendHorizontal } from 'lucide-react';

type UploadProgress = {
    progress: number; // 0 - 1
    percentage: number; // 0 - 100
    loaded: number; // bytes
    total: number; // bytes
};

type SendingMessageDialogProps = {
    open: boolean;
    progress: UploadProgress | null;
};

const formatBytes = (bytes: number) => {
    if (bytes >= 1024 * 1024) {
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    if (bytes >= 1024) {
        return `${(bytes / 1024).toFixed(0)} KB`;
    }
    return `${bytes} B`;
};

export function SendingMessageDialog({
    open,
    progress,
}: SendingMessageDialogProps) {
    const percentage = progress?.percentage ?? 0;
    const clamped = Math.min(100, Math.max(0, percentage));
    const isDone = clamped >= 100;

    return (
        <AlertDialog open={open}>
            <AlertDialogContent className="flex flex-col items-center gap-5 border-none bg-background/95 py-8 shadow-2xl backdrop-blur-sm sm:max-w-xs">
                {/* Icon */}
                <div className="relative flex size-16 items-center justify-center">
                    {/* Outer pulsing ring */}
                    <span
                        className={`absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 opacity-20 ${
                            isDone ? '' : 'animate-ping'
                        }`}
                    />
                    {/* Rotating ring made from a conic-ish border trick */}
                    <span
                        className={`absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 border-r-purple-500 ${
                            isDone ? '' : 'animate-spin'
                        }`}
                    />
                    {/* Solid center */}
                    <div className="relative flex size-11 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg">
                        <SendHorizontal
                            className={`size-5 text-white transition-transform duration-300 ${
                                isDone ? 'scale-110' : 'animate-pulse'
                            }`}
                        />
                    </div>
                </div>

                {/* Text */}
                <div className="flex flex-col items-center gap-1 text-center">
                    <p className="text-sm font-semibold">
                        {isDone ? 'Message sent' : 'Sending message'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {isDone
                            ? 'Delivered successfully'
                            : 'Please wait while your message is delivered...'}
                    </p>
                </div>

                {/* Progress bar */}
                <div className="flex w-full flex-col gap-2">
                    <Progress
                        value={clamped}
                        className="h-2 w-full transition-all duration-300"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
                        <span>
                            {isDone
                                ? 'Complete'
                                : progress
                                  ? `${formatBytes(progress.loaded)} / ${formatBytes(progress.total)}`
                                  : 'Uploading...'}
                        </span>
                        <span>{Math.round(clamped)}%</span>
                    </div>
                </div>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export default SendingMessageDialog;
