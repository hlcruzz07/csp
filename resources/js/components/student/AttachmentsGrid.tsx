import {
    FileIcon,
    FileSpreadsheet,
    FileText,
    Music,
    Video,
    ImageIcon,
    Archive,
} from 'lucide-react';

type Attachment = {
    id: number;
    file_url: string;
    mime_type: string;
    original_name: string;
};

type Props = {
    attachments: Attachment[];
};

export function AttachmentsGrid({ attachments }: Props) {
    const getFileType = (mime: string) => {
        if (mime.startsWith('image/')) return 'image';
        if (mime.startsWith('audio/')) return 'audio';
        if (mime.startsWith('video/')) return 'video';
        if (mime === 'application/pdf') return 'pdf';

        if (
            mime.includes('word') ||
            mime.includes('officedocument.wordprocessingml')
        ) {
            return 'word';
        }

        if (
            mime.includes('excel') ||
            mime.includes('spreadsheet') ||
            mime.includes('csv')
        ) {
            return 'spreadsheet';
        }

        if (mime.includes('zip') || mime.includes('rar')) {
            return 'archive';
        }

        if (mime.startsWith('text/')) {
            return 'text';
        }

        return 'file';
    };

    const renderAttachment = (attachment: Attachment) => {
        const type = getFileType(attachment.mime_type);
        const url = `/storage/${attachment.file_url}`;

        switch (type) {
            case 'image':
                return (
                    <img
                        src={url}
                        alt={attachment.original_name}
                        className="h-56 w-full rounded-lg object-cover"
                    />
                );

            case 'audio':
                return (
                    <div className="space-y-2 rounded-lg border bg-background p-3">
                        <div className="flex items-center gap-2">
                            <Music className="size-8 text-primary" />
                            <p className="truncate text-sm font-medium">
                                {attachment.original_name}
                            </p>
                        </div>

                        <audio controls className="w-full">
                            <source src={url} />
                        </audio>
                    </div>
                );

            case 'video':
                return (
                    <div className="rounded-lg border bg-background p-2">
                        <video controls className="max-h-72 w-full rounded-lg">
                            <source src={url} />
                        </video>
                    </div>
                );

            case 'pdf':
                return (
                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-lg border bg-background p-4 transition hover:bg-accent"
                    >
                        <FileText className="size-10 text-red-500" />

                        <div className="min-w-0">
                            <p className="truncate font-medium">
                                {attachment.original_name}
                            </p>

                            <small className="text-muted-foreground">
                                Open PDF
                            </small>
                        </div>
                    </a>
                );

            case 'word':
                return (
                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-lg border bg-background p-4 transition hover:bg-accent"
                    >
                        <FileText className="size-10 text-blue-600" />

                        <div className="min-w-0">
                            <p className="truncate font-medium">
                                {attachment.original_name}
                            </p>

                            <small className="text-muted-foreground">
                                Open Document
                            </small>
                        </div>
                    </a>
                );

            case 'spreadsheet':
                return (
                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-lg border bg-background p-4 transition hover:bg-accent"
                    >
                        <FileSpreadsheet className="size-10 text-green-600" />

                        <div className="min-w-0">
                            <p className="truncate font-medium">
                                {attachment.original_name}
                            </p>

                            <small className="text-muted-foreground">
                                Open Spreadsheet
                            </small>
                        </div>
                    </a>
                );

            case 'archive':
                return (
                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-lg border bg-background p-4 transition hover:bg-accent"
                    >
                        <Archive className="size-10 text-orange-500" />

                        <div className="min-w-0">
                            <p className="truncate font-medium">
                                {attachment.original_name}
                            </p>

                            <small className="text-muted-foreground">
                                Download Archive
                            </small>
                        </div>
                    </a>
                );

            case 'text':
                return (
                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-lg border bg-background p-4 transition hover:bg-accent"
                    >
                        <FileText className="size-10 text-gray-600" />

                        <div className="min-w-0">
                            <p className="truncate font-medium">
                                {attachment.original_name}
                            </p>

                            <small className="text-muted-foreground">
                                Open Text File
                            </small>
                        </div>
                    </a>
                );

            default:
                return (
                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-lg border bg-background p-4 transition hover:bg-accent"
                    >
                        <FileIcon className="size-10 text-muted-foreground" />

                        <div className="min-w-0">
                            <p className="truncate font-medium">
                                {attachment.original_name}
                            </p>

                            <small className="text-muted-foreground">
                                Download File
                            </small>
                        </div>
                    </a>
                );
        }
    };

    return (
        <div className="mb-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {attachments.map((attachment) => (
                <div key={attachment.id}>{renderAttachment(attachment)}</div>
            ))}
        </div>
    );
}
