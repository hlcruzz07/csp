import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

type Attachment = {
    id: number;
    file_url: string;
};

type AttachmentsGridProps = {
    attachments: Attachment[];
    /**
     * Max thumbnails to show in the grid before collapsing the rest
     * into a "+N" overlay on the last visible tile. Defaults to 4.
     */
    maxVisible?: number;
};

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

                    return (
                        <button
                            key={attachment.id}
                            type="button"
                            onClick={() => openPreview(index)}
                            className="group relative aspect-square overflow-hidden rounded-xl border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                        >
                            <img
                                src={`/storage/${attachment.file_url}`}
                                alt="attachment"
                                className="size-full object-cover transition-opacity group-hover:opacity-90"
                            />

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

                    {previewIndex !== null && (
                        <div className="relative flex items-center justify-center rounded-xl bg-black/90">
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

                            <img
                                src={`/storage/${attachments[previewIndex].file_url}`}
                                alt="attachment preview"
                                className="max-h-[80vh] w-full object-contain"
                            />

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
                    )}

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
