import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useInitials } from '@/hooks/use-initials';
import { useIsMobile } from '@/hooks/use-mobile';
import { normalizeName } from '@/lib/utils';
import { StudentDrawer } from '@/pages/student/modal/StudentDrawer';
import { usePage } from '@inertiajs/react';
import {
    CircleAlertIcon,
    EllipsisVerticalIcon,
    ImageIcon,
    ImagePlusIcon,
    SendHorizontal,
    SendIcon,
    SmileIcon,
    UserPenIcon,
    XCircleIcon,
    XIcon,
} from 'lucide-react';
import InputEmoji from 'react-input-emoji';
type StudentLayoutProps = {
    children: React.ReactNode;
};
export default function StudentLayout({ children }: StudentLayoutProps) {
    const { auth } = usePage<any>().props;
    const getInitials = useInitials();
    const counselor = auth.user?.student_conversation.counselor;
    const isMobile = useIsMobile();

    return (
        <div className="flex h-screen flex-col overflow-hidden">
            <div className="flex items-center justify-between p-3">
                <div className="flex cursor-pointer items-center gap-2">
                    <Avatar className="size-10 overflow-hidden rounded-full md:size-12">
                        <AvatarImage
                            src={counselor.avatar}
                            alt={normalizeName(counselor.name)}
                        />
                        <AvatarFallback className="rounded-lg bg-neutral-200 text-xs text-black md:text-sm dark:bg-neutral-700 dark:text-white">
                            {getInitials(normalizeName(counselor.name) ?? '')}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex flex-col text-sm md:text-base">
                        <h1>{normalizeName(counselor.name)}</h1>
                        <small className="capitalized">
                            {normalizeName(counselor.role)} -{' '}
                            {auth.user?.assigned_college.name}{' '}
                            {`(${auth.user?.assigned_college.code})`}
                        </small>
                    </div>
                </div>

                <StudentDrawer />
            </div>
            {children}
            <form className="relative space-y-3 p-3">
                <div className="grid grid-cols-[repeat(auto-fill,minmax(90px,1fr))] gap-3">
                    {Array.from({ length: 5 }).map((_, index) => {
                        const imageNumber = Math.floor(Math.random() * 3) + 1;

                        return (
                            <div className="relative aspect-square" key={index}>
                                <div className="h-full overflow-hidden rounded-xl border">
                                    <img
                                        src={`/sample${imageNumber}.jpg`}
                                        alt=""
                                        className="h-full w-full object-cover"
                                    />
                                </div>

                                <Badge className="absolute -top-1 -right-1 z-10 cursor-pointer p-0">
                                    <XIcon className="size-3" />
                                </Badge>
                            </div>
                        );
                    })}

                    <Button
                        type="button"
                        size="icon"
                        className="aspect-square h-auto w-full cursor-pointer"
                    >
                        <ImagePlusIcon />
                    </Button>
                </div>
                <div className="flex items-start gap-2">
                    <Button
                        variant={'link'}
                        size={'icon'}
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
                    <InputEmoji
                        fontSize={12}
                        placeholderColor="#d6e6f2"
                        placeholder="Type a message"
                        cleanOnEnter
                        onEnter={(text) => console.log('enter', text)}
                        value=""
                        onChange={() => {}}
                    />
                    <Button
                        type="submit"
                        className={`${!isMobile && 'w-28'} cursor-pointer`}
                    >
                        {!isMobile && 'Send'} <SendHorizontal />
                    </Button>
                </div>
            </form>
        </div>
    );
}
