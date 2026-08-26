import { Head, usePage } from '@inertiajs/react';
import {
    Building2,
    ShieldCheck,
    UserPen,
    UserPlus2,
    UsersRound,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import CounselorAddDialog from '@/components/counselor/CounselorAddDialog';
import CounselorEditDialog from '@/components/counselor/CounselorEditDialog';
import DataTable from '@/components/DataTable';
import type {
    DataTableColumn,
    PaginatedData,
    SortState,
} from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import apiService from '@/lib/api-service';
import { adminDashboard } from '@/routes';
import type { College, Counselor } from '@/types/entities';

type CounselorResponse = PaginatedData<Counselor> & {
    stats: {
        total: number;
        verified: number;
        assignedCollege: number;
    };
    colleges: { label: string; value: string }[];
};

function StatWidget({
    label,
    value,
    icon: Icon,
}: {
    label: string;
    value: number;
    icon: React.ComponentType<{ className?: string }>;
}) {
    return (
        <Card className="border-sidebar-border/70 dark:border-sidebar-border">
            <CardContent className="flex items-center justify-between px-6">
                <div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="mt-1 text-3xl font-semibold tracking-tight">
                        {value.toLocaleString()}
                    </p>
                </div>
                <div className="flex size-11 items-center justify-center rounded-full bg-primary/10">
                    <Icon className="size-5 text-primary" />
                </div>
            </CardContent>
        </Card>
    );
}
type PageProps = {
    colleges: College[];
};
export default function Index() {
    const [search, setSearch] = useState('');
    const [college, setCollege] = useState<string | null>(null);
    const [page, setPage] = useState('1');
    const [perPage, setPerPage] = useState(10);
    const [sort, setSort] = useState<SortState>({ key: 'name', order: 'asc' });
    const [response, setResponse] = useState<CounselorResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [editTarget, setEditTarget] = useState<Counselor | null>(null);
    const [openAdd, setOpenAdd] = useState<boolean>(false);
    const { colleges } = usePage<PageProps>().props;

    useEffect(() => {
        const controller = new AbortController();

        apiService
            .get<CounselorResponse>('/api/counselors', {
                params: {
                    search,
                    college,
                    page,
                    perPage,
                    sort: sort.key,
                    order: sort.order,
                },
                signal: controller.signal,
            })
            .then(({ data }) => {
                setResponse(data);
                setError(null);
            })
            .catch((requestError) => {
                if (requestError.name !== 'CanceledError') {
                    setError('Unable to load counselors right now.');
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            });

        return () => controller.abort();
    }, [college, page, perPage, refreshKey, search, sort]);

    const columns: DataTableColumn<Counselor>[] = [
        {
            key: 'name',
            header: 'Name',
            sortKey: 'name',
            render: (c) => <span className="font-medium">{c.name}</span>,
        },
        {
            key: 'email',
            header: 'Email',
            sortKey: 'email',
            render: (c) => c.email,
        },
        {
            key: 'college',
            header: 'College',
            render: (c) => c.assigned_college?.name ?? 'Unassigned',
        },
        {
            key: 'students',
            header: 'Students',
            sortKey: 'student_count',
            render: (c) => c.student_count.toLocaleString(),
        },
        {
            key: 'action',
            header: 'Action',
            render: (c) => (
                <>
                    <Button
                        type="button"
                        onClick={() => {
                            setEditTarget(c);
                        }}
                        size={'icon-sm'}
                        variant={'outline'}
                    >
                        <UserPen />
                    </Button>
                </>
            ),
        },
    ];

    const handleSearch = (value: string) => {
        setSearch(value);
        setPage('1');
    };

    const handleCollege = (_key: string, value: string | null) => {
        setCollege(value);
        setPage('1');
    };

    const handleSort = (value: SortState) => {
        setSort(value);
        setPage('1');
    };

    return (
        <>
            <Head title="Counselors" />
            <CounselorEditDialog
                counselor={editTarget}
                open={!!editTarget}
                onOpenChange={(open) => !open && setEditTarget(null)}
                colleges={colleges}
                onSaved={() => setRefreshKey((k) => k + 1)}
            />
            <CounselorAddDialog
                open={openAdd}
                onOpenChange={setOpenAdd}
                colleges={colleges}
                onSaved={() => setRefreshKey((k) => k + 1)}
            />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    <StatWidget
                        label="Total counselors"
                        value={response?.stats.total ?? 0}
                        icon={UsersRound}
                    />
                    <StatWidget
                        label="Verified email"
                        value={response?.stats.verified ?? 0}
                        icon={ShieldCheck}
                    />
                    <StatWidget
                        label="Assigned to a college"
                        value={response?.stats.assignedCollege ?? 0}
                        icon={Building2}
                    />
                </div>

                {error && (
                    <p className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                        {error}
                    </p>
                )}

                <Card>
                    <CardHeader>
                        <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center md:gap-0">
                            <h1>Counselors Table</h1>
                            <Button
                                className="w-full md:w-max"
                                size={'sm'}
                                onClick={() => setOpenAdd(true)}
                            >
                                <UserPlus2 /> Add
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <DataTable
                            columns={columns}
                            paginated={response}
                            emptyMessage={
                                loading ? 'Loading counselors...' : undefined
                            }
                            onPageChange={setPage}
                            sort={sort}
                            onSortChange={handleSort}
                            toolbar={{
                                search: {
                                    value: search,
                                    onChange: handleSearch,
                                    placeholder: 'Search counselors...',
                                },
                                filters: [
                                    {
                                        key: 'college',
                                        label: 'College',
                                        value: college,
                                        options:
                                            response?.colleges.map(
                                                (option) => option.label,
                                            ) ?? [],
                                        onSelect: handleCollege,
                                    },
                                ],
                                perPage: {
                                    value: perPage,
                                    options: [10, 25, 50, 100],
                                    onChange: (value) => {
                                        setPerPage(value);
                                        setPage('1');
                                    },
                                },
                                onRefresh: () =>
                                    setRefreshKey((current) => current + 1),
                            }}
                        />
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

Index.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: adminDashboard(),
        },
    ],
};
