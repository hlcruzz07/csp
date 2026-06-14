import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useInitials } from '@/hooks/use-initials';
import { normalizeName } from '@/lib/utils';
import { usePage } from '@inertiajs/react';
import {
    CircleAlertIcon,
    EllipsisVerticalIcon,
    ImageIcon,
    ImagePlusIcon,
    SendIcon,
    SmileIcon,
    UserPenIcon,
    XCircleIcon,
    XIcon,
} from 'lucide-react';

type StudentLayoutProps = {
    children: React.ReactNode;
};
export default function StudentLayout({ children }: StudentLayoutProps) {
    const { auth } = usePage<any>().props;
    const getInitials = useInitials();
    const counselor = auth.user?.student_conversation.counselor;

    console.log(auth);
    return (
        <div className="flex h-screen flex-col">
            <div className="flex items-center justify-between p-3">
                <div className="flex cursor-pointer items-center gap-2 rounded-md bg-background px-2 py-1.5 shadow-xs duration-300 hover:bg-accent hover:text-accent-foreground">
                    <Avatar className="size-12 overflow-hidden rounded-full">
                        <AvatarImage
                            src={counselor.avatar}
                            alt={normalizeName(counselor.name)}
                        />
                        <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                            {getInitials(normalizeName(counselor.name) ?? '')}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex flex-col">
                        <h1>{normalizeName(counselor.name)}</h1>
                        <small className="capitalized">
                            {normalizeName(counselor.role)} -{' '}
                            {auth.user?.assigned_college.name}
                        </small>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant={'outline'}
                        className="cursor-pointer"
                        size={'sm'}
                    >
                        <EllipsisVerticalIcon />
                    </Button>
                </div>
            </div>
            {children}
            <form className="relative space-y-3 p-3">
                <div className="grid grid-cols-[repeat(auto-fill,minmax(60px,1fr))] gap-3">
                    {Array.from({ length: 5 }).map((_, index) => (
                        <div className="relative aspect-square">
                            <div className="h-full overflow-hidden rounded-xl border">
                                <img
                                    src="/logo.webp"
                                    alt=""
                                    className="h-full w-full object-cover"
                                />
                            </div>

                            <Badge className="absolute -top-1 -right-1 z-10 p-0">
                                <XIcon className="size-3" />
                            </Badge>
                        </div>
                    ))}

                    <Button
                        type="button"
                        size="icon"
                        className="aspect-square h-auto w-full"
                    >
                        <ImagePlusIcon />
                    </Button>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant={'link'}
                        size={'icon'}
                        disabled
                        type="button"
                        className="cursor-pointer border p-0!"
                        onClick={() =>
                            document.getElementById('attachments')?.click()
                        }
                    >
                        <ImageIcon />
                        <Input
                            type="file"
                            hidden
                            id="attachments"
                            accept=".jpg,.png,.jpeg"
                            multiple
                        />
                    </Button>{' '}
                    <div className="relative flex grow items-center">
                        <Input placeholder="Write a message..." />

                        <Button
                            type="button"
                            variant={'link'}
                            className="absolute right-2 cursor-pointer p-0!"
                        >
                            <SmileIcon size={20} />
                        </Button>
                    </div>
                    <Button type="submit">
                        <SendIcon />
                    </Button>
                </div>
            </form>
        </div>
    );
}
