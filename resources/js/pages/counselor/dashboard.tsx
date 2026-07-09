import { EmptyState } from '@/components/counselor/EmptyState';
import CounselorLayout from '@/layouts/counselor-layout';

Dashboard.layout = (page: React.ReactNode) => (
    <CounselorLayout>{page}</CounselorLayout>
);

export default function Dashboard() {
    return <EmptyState />;
}
