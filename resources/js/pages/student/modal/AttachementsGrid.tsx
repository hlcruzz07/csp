import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
    ChevronLeft,
    ChevronRight,
    Download,
    FileIcon,
    FileText,
    Music,
    Video as VideoIcon,
    X,
} from 'lucide-react';

type Attachment = {
    id: number;
    file_url: string;
};

type AttachmentsGridProps = {
    attachments: Attachment[];
    maxVisible?: number;
};

type FileKind = 'image' | 'video' | 'audio' | 'pdf' | 'other';

const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'bmp', 'avif'];
const VIDEO_EXTS = ['mp4', 'webm', 'mov', 'ogv', 'mkv', 'avi'];
const AUDIO_EXTS = ['mp3', 'wav', 'm4a', 'ogg', 'aac', 'flac'];

function getExtension(url: string) {
    const clean = url.split('?')[0].split('#')[0];
    const parts = clean.split('.');
    return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
}

function getFileKind(url: string): FileKind {
    const ext = getExtension(url);
    if (IMAGE_EXTS.includes(ext)) return 'image';
    if (VIDEO_EXTS.includes(ext)) return 'video';
    if (AUDIO_EXTS.includes(ext)) return 'audio';
    if (ext === 'pdf') return 'pdf';
    return 'other';
}

function getFileName(url: string) {
    const clean = url.split('?')[0].split('#')[0];
    const segments = clean.split('/');
    return decodeURIComponent(segments[segments.length - 1] || 'file');
}

function FileTypeIcon({
    kind,
    className,
}: {
    kind: FileKind;
    className?: string;
}) {
    switch (kind) {
        case 'audio':
            return <Music className={className} />;
        case 'video':
            return <VideoIcon className={className} />;
        case 'pdf':
            return <FileText className={className} />;
        default:
            return <FileIcon className={className} />;
    }
}

export function AttachmentsGrid({
    attachments,
    maxVisible = 4,
}: AttachmentsGridProps) {
    const [previewIndex, setPreviewIndex] = useState<number | null>(null);

    if (!attachments?.length) return null;

    const visibleAttachments = attachments.slice(0, maxVisible);
    const remainingCount = attachments.length - maxVisible;

    const openPreview = (index: number) => setPreviewIndex(index);
    const closePreview = () => setPreviewIndex(null);

    const showPrev = () =>
        setPreviewIndex((current) =>
            current === null
                ? null
                : (current - 1 + attachments.length) % attachments.length,
        );

    const showNext = () =>
        setPreviewIndex((current) =>
            current === null ? null : (current + 1) % attachments.length,
        );

    return (
        <>
            <div
                className={`mb-2 grid grid-cols-1 ${attachments.length > 1 && 'grid-cols-2'} gap-1`}
            >
                {visibleAttachments.map((attachment, index) => {
                    const isLastVisible = index === maxVisible - 1;
                    const hasOverflow = isLastVisible && remainingCount > 0;
                    const kind = getFileKind(attachment.file_url);
                    const fileUrl = `/storage/${attachment.file_url}`;
                    const fileName = getFileName(attachment.file_url);

                    return (
                        <button
                            key={attachment.id}
                            type="button"
                            onClick={() => openPreview(index)}
                            className="group relative aspect-square overflow-hidden rounded-xl border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                        >
                            {kind === 'image' ? (
                                <img
                                    src={fileUrl}
                                    alt="attachment"
                                    className="size-full object-cover transition-opacity group-hover:opacity-90"
                                />
                            ) : kind === 'video' ? (
                                <video
                                    src={fileUrl}
                                    className="size-full object-cover transition-opacity group-hover:opacity-90"
                                    muted
                                />
                            ) : (
                                <div className="flex size-full flex-col items-center justify-center gap-1 bg-muted p-2 transition-colors group-hover:bg-muted/70">
                                    <FileTypeIcon
                                        kind={kind}
                                        className={`size-7 ${
                                            kind === 'pdf'
                                                ? 'text-red-500'
                                                : kind === 'audio'
                                                  ? 'text-primary'
                                                  : 'text-muted-foreground'
                                        }`}
                                    />
                                    <p className="line-clamp-2 text-center text-[10px] break-all text-muted-foreground">
                                        {fileName}
                                    </p>
                                </div>
                            )}

                            {kind === 'video' && !hasOverflow && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                    <VideoIcon className="size-6 text-white drop-shadow" />
                                </div>
                            )}

                            {hasOverflow && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/55 text-lg font-semibold text-white">
                                    +{remainingCount}
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            <Dialog
                open={previewIndex !== null}
                onOpenChange={(open) => !open && closePreview()}
            >
                <DialogContent
                    showCloseButton={false}
                    className="flex max-h-[90vh] max-w-3xl flex-col gap-3 overflow-hidden border-none bg-transparent p-0 shadow-none"
                >
                    <DialogTitle className="sr-only">
                        Attachment preview
                    </DialogTitle>

                    {previewIndex !== null &&
                        (() => {
                            const attachment = attachments[previewIndex];
                            const kind = getFileKind(attachment.file_url);
                            const fileUrl = `/storage/${attachment.file_url}`;
                            const fileName = getFileName(attachment.file_url);

                            return (
                                <div className="relative flex min-h-[50vh] items-center justify-center rounded-xl bg-black/90">
                                    <button
                                        type="button"
                                        onClick={closePreview}
                                        className="absolute top-3 right-3 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
                                        aria-label="Close preview"
                                    >
                                        <X className="size-5" />
                                    </button>

                                    {attachments.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={showPrev}
                                            className="absolute left-3 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
                                            aria-label="Previous attachment"
                                        >
                                            <ChevronLeft className="size-5" />
                                        </button>
                                    )}

                                    {kind === 'image' ? (
                                        <img
                                            src={fileUrl}
                                            alt="attachment preview"
                                            className="max-h-[80vh] w-full object-contain"
                                        />
                                    ) : kind === 'video' ? (
                                        <video
                                            src={fileUrl}
                                            controls
                                            autoPlay
                                            className="max-h-[80vh] w-full"
                                        />
                                    ) : kind === 'audio' ? (
                                        <div className="flex w-full max-w-sm flex-col items-center gap-4 p-10 text-white">
                                            <Music className="size-16 text-primary" />
                                            <p className="line-clamp-2 text-center text-sm break-all">
                                                {fileName}
                                            </p>
                                            <audio
                                                controls
                                                src={fileUrl}
                                                className="w-full"
                                            />
                                        </div>
                                    ) : kind === 'pdf' ? (
                                        <iframe
                                            src={fileUrl}
                                            title={fileName}
                                            className="h-[80vh] w-full rounded-lg bg-white"
                                        />
                                    ) : (
                                        <div className="flex w-full max-w-sm flex-col items-center gap-4 p-10 text-white">
                                            <FileIcon className="size-16 text-muted-foreground" />
                                            <p className="line-clamp-2 text-center text-sm break-all">
                                                {fileName}
                                            </p>
                                            <a
                                                href={fileUrl}
                                                download={fileName}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm hover:bg-white/20"
                                            >
                                                <Download className="size-4" />
                                                Download file
                                            </a>
                                        </div>
                                    )}

                                    {attachments.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={showNext}
                                            className="absolute right-3 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
                                            aria-label="Next attachment"
                                        >
                                            <ChevronRight className="size-5" />
                                        </button>
                                    )}
                                </div>
                            );
                        })()}

                    {attachments.length > 1 && (
                        <div className="flex justify-center gap-1.5 pb-2">
                            {attachments.map((attachment, index) => (
                                <button
                                    key={attachment.id}
                                    type="button"
                                    onClick={() => setPreviewIndex(index)}
                                    className={`size-1.5 rounded-full transition-colors ${
                                        index === previewIndex
                                            ? 'bg-white'
                                            : 'bg-white/40'
                                    }`}
                                    aria-label={`Go to attachment ${index + 1}`}
                                />
                            ))}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
