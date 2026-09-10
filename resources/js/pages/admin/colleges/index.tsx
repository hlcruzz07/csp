import { Head } from '@inertiajs/react';
import { PenIcon, UserPlus2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import CollegeDialog from '@/components/college/CollegeDialog';
import DataTable from '@/components/DataTable';
import type {
    DataTableColumn,
    PaginatedData,
    SortState,
} from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

import apiService from '@/lib/api-service';
import { colleges, paginateColleges } from '@/routes';
import type { College } from '@/types/entities';

type CollegesResponse = PaginatedData<College>;

export default function Index() {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState('1');
    const [perPage, setPerPage] = useState(10);
    const [sort, setSort] = useState<SortState>({ key: 'name', order: 'asc' });
    const [response, setResponse] = useState<CollegesResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<College | null>(null);

    useEffect(() => {
        const controller = new AbortController();

        apiService
            .get<CollegesResponse>(paginateColleges().url, {
                params: {
                    search,
                    page,
                    perPage,
                    sort: sort.key,
                    order: sort.order,
                },
                signal: controller.signal,
            })
            .then(({ data }) => {
                setResponse(data);
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            });

        return () => controller.abort();
    }, [page, perPage, refreshKey, search, sort]);

    const columns: DataTableColumn<College>[] = [
        {
            key: 'id',
            header: '#',
            sortKey: 'id',
            render: (c) => <span className="font-medium">{c.id}</span>,
        },
        {
            key: 'name',
            header: 'Name',
            sortKey: 'name',
            render: (c) => <span className="font-medium">{c.name}</span>,
        },
        {
            key: 'students',
            header: 'Students',
            sortKey: 'student_count',
            render: (c) => c.student_count ?? 0,
        },
        {
            key: 'counselors',
            header: 'Counselors',
            sortKey: 'counselor_count',
            render: (c) => c.counselor_count ?? 0,
        },
        {
            key: 'action',
            header: 'Action',
            render: (c) => (
                <>
                    <Button
                        type="button"
                        onClick={() => {
                            openEditDialog(c);
                        }}
                        size={'icon-sm'}
                        variant={'outline'}
                    >
                        <PenIcon />
                    </Button>
                </>
            ),
        },
    ];

    const handleSearch = (value: string) => {
        setSearch(value);
        setPage('1');
    };

    const handleSort = (value: SortState) => {
        setSort(value);
        setPage('1');
    };

    const openCreateDialog = () => {
        setEditTarget(null);
        setDialogOpen(true);
    };

    const openEditDialog = (college: College) => {
        setEditTarget(college);
        setDialogOpen(true);
    };

    return (
        <>
            <Head title="Colleges" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Card>
                    <CardHeader>
                        <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center md:gap-0">
                            <h1>Colleges Table</h1>
                            <Button
                                className="w-full md:w-max"
                                size={'sm'}
                                onClick={openCreateDialog}
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
                                loading ? 'Loading colleges...' : undefined
                            }
                            onPageChange={setPage}
                            sort={sort}
                            onSortChange={handleSort}
                            toolbar={{
                                search: {
                                    value: search,
                                    onChange: handleSearch,
                                    placeholder: 'Search colleges...',
                                },
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
                        <CollegeDialog
                            college={editTarget}
                            open={dialogOpen}
                            onOpenChange={setDialogOpen}
                            onSaved={() => setRefreshKey((key) => key + 1)}
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
            title: 'Colleges',
            href: colleges(),
        },
    ],
};
