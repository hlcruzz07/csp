import { Head, usePage } from '@inertiajs/react';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import { adminDashboard, checkConversation, studentDashboard } from '@/routes';
import CompleteStudentModal from './modal/CompleteStudentModal';
import { useEffect, useRef, useState } from 'react';
import apiService from '@/lib/api-service';
import { UserProps } from '@/types/entities';
import MatchingCounselorModal from './modal/MatchingCounselorModal';
import WelcomeModal from './modal/WelcomeModal';
import StudentLayout from '@/layouts/student-layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { normalizeName } from '@/lib/utils';
import { useInitials } from '@/hooks/use-initials';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';

export default function Dashboard() {
    const { isCompleted, auth } = usePage<any>().props;

    const [hasConvo, setHasConvo] = useState(false);
    const [isOpenWelcome, setOpenWelcome] = useState(false);
    const getInitials = useInitials();
    const isMobile = useIsMobile();

    // Using a callback ref instead of a standard useRef + useEffect.
    // This executes immediately when the element is actually rendered to the DOM.
    const containerRef = (node: HTMLDivElement | null) => {
        if (node !== null) {
            node.scrollTop = node.scrollHeight;
        }
    };

    useEffect(() => {
        if (!isCompleted) return;

        let timeoutId: ReturnType<typeof setTimeout>;

        const poll = async () => {
            try {
                const response = await apiService.get(checkConversation().url);
                const hasConversation = response.data.hasConversation;

                setHasConvo(hasConversation);

                if (!hasConversation) {
                    timeoutId = setTimeout(poll, 3000);
                    return;
                }

                // Respect "don't show again" cookie
                const cookie = document.cookie
                    .split('; ')
                    .find((row) => row.startsWith('csp_welcome_no_show='))
                    ?.split('=')[1];

                if (!cookie) {
                    setOpenWelcome(true);
                }
            } catch (error) {
                console.error(error);
                timeoutId = setTimeout(poll, 3000);
            }
        };

        poll();

        return () => {
            clearTimeout(timeoutId);
        };
    }, [isCompleted]);

    if (!isCompleted) {
        return <CompleteStudentModal />;
    }

    if (!hasConvo) {
        return <MatchingCounselorModal />;
    }

    console.log(auth);
    return (
        <StudentLayout>
            <WelcomeModal open={isOpenWelcome} setOpen={setOpenWelcome} />

            <div
                className="m-2 my-0 flex h-full flex-col flex-col-reverse gap-2 overflow-auto rounded-lg border bg-accent/20 p-1 md:m-4 md:p-4"
                ref={containerRef}
            >
                {Array.from({ length: 20 }).map((_, index) => {
                    const isMine = index % 2 === 0;

                    return (
                        <div
                            key={index}
                            className={`flex items-end gap-2 ${
                                isMine ? 'flex-row-reverse' : ''
                            }`}
                        >
                            <Avatar className="size-6 overflow-hidden rounded-full md:size-8">
                                <AvatarImage
                                    src=""
                                    alt={normalizeName(
                                        isMine
                                            ? auth.user?.name
                                            : auth.user?.student_conversation
                                                  .counselor.name,
                                    )}
                                />
                                <AvatarFallback className="rounded-lg bg-neutral-200 text-[10px] text-black md:text-sm dark:bg-neutral-700 dark:text-white">
                                    {getInitials(
                                        normalizeName(
                                            isMine
                                                ? auth.user?.name
                                                : auth.user
                                                      ?.student_conversation
                                                      .counselor.name,
                                        ) ?? '',
                                    )}
                                </AvatarFallback>
                            </Avatar>

                            <div className={`max-w-[60%]`}>
                                <div
                                    className={`ms-2 mb-1 flex items-center px-2 text-xs md:text-sm ${
                                        isMine
                                            ? 'justify-end'
                                            : 'justify-between'
                                    }`}
                                >
                                    <small className="text-foreground/80">
                                        {!isMine &&
                                            auth.user?.student_conversation
                                                .counselor.name}
                                    </small>
                                </div>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <p
                                            className={`rounded-3xl border ${isMine ? 'overflow-hidden bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-background'} lg:text-sm" p-3 px-4 text-xs font-medium`}
                                        >
                                            Lorem ipsum dolor sit amet
                                            consectetur adipisicing elit.
                                            Doloribus, voluptate? Lorem ipsum
                                            dolor sit amet consectetur
                                            adipisicing elit. Doloribus,
                                            voluptate? Lorem ipsum dolor sit
                                            amet consectetur adipisicing elit.
                                            Doloribus, voluptate? Lorem ipsum
                                            dolor sit amet consectetur
                                            adipisicing elit. Doloribus,
                                            voluptate? Lorem ipsum dolor sit
                                            amet consectetur adipisicing elit.
                                            Doloribus, voluptate? Lorem ipsum
                                            dolor sit amet consectetur
                                            adipisicing elit. Doloribus,
                                            voluptate? Lorem ipsum dolor sit
                                            amet consectetur adipisicing elit.
                                            Doloribus, voluptate? Lorem ipsum
                                            dolor sit amet consectetur
                                            adipisicing elit. Doloribus,
                                            voluptate?
                                        </p>
                                    </TooltipTrigger>

                                    <TooltipContent
                                        side={
                                            isMobile
                                                ? 'top'
                                                : isMine
                                                  ? 'left'
                                                  : 'right'
                                        }
                                    >
                                        <small className="text-[10px] lg:text-xs!">
                                            Jan 1, 2026 - 11:36 PM
                                        </small>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        </div>
                    );
                })}
            </div>
        </StudentLayout>
    );
}
