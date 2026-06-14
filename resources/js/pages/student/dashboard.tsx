import { Head, usePage } from '@inertiajs/react';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import { adminDashboard, checkConversation, studentDashboard } from '@/routes';
import CompleteStudentModal from './modal/CompleteStudentModal';
import { useEffect, useState } from 'react';
import apiService from '@/lib/api-service';
import { UserProps } from '@/types/entities';
import MatchingCounselorModal from './modal/MatchingCounselorModal';
import WelcomeModal from './modal/WelcomeModal';
import StudentLayout from '@/layouts/student-layout';
type PageProps = {
    isCompleted: boolean;
};
export default function Dashboard() {
    const { isCompleted, auth } = usePage<PageProps>().props;

    const [hasConvo, setHasConvo] = useState(false);
    const [isOpenWelcome, setOpenWelcome] = useState(false);

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

    return (
        <StudentLayout>
            <WelcomeModal open={isOpenWelcome} setOpen={setOpenWelcome} />
            <div className="h-full overflow-auto border">
                {Array.from({ length: 10 }).map((_, index) => (
                    <div
                        key={index}
                        className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border"
                    >
                        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                    </div>
                ))}
            </div>
        </StudentLayout>
    );
}
