import { Head } from '@inertiajs/react';
import { PenIcon, TrashIcon, UserPlus2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import DataTable from '@/components/DataTable';
import type {
    DataTableColumn,
    PaginatedData,
    SortState,
} from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import apiService from '@/lib/api-service';
import {
    deleteGuidedPrompt,
    deletePrompt,
    guidedPrompts,
    paginateGuidedPrompts,
} from '@/routes';
import type { GuidedPrompt } from '@/types/entities';
import GuidedPromptDialog from '@/components/prompts/GuidedPromptDialog';
import { toast } from 'sonner';

type GuidedPromptsResponse = PaginatedData<GuidedPrompt>;

export default function Index() {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState('1');
    const [perPage, setPerPage] = useState(10);
    const [sort, setSort] = useState<SortState>({ key: 'id', order: 'asc' });
    const [response, setResponse] = useState<GuidedPromptsResponse | null>(
        null,
    );
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<GuidedPrompt | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<GuidedPrompt | null>(null);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        const controller = new AbortController();

        apiService
            .get<GuidedPromptsResponse>(paginateGuidedPrompts().url, {
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

    const columns: DataTableColumn<GuidedPrompt>[] = [
        {
            key: 'id',
            header: '#',
            sortKey: 'id',
            render: (g) => <span className="font-medium">{g.id}</span>,
        },
        {
            key: 'name',
            header: 'Name',
            sortKey: 'name',
            render: (g) => <span className="font-medium">{g.name}</span>,
        },
        {
            key: 'action',
            header: 'Action',
            render: (g) => (
                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        type="button"
                        onClick={() => {
                            openEditDialog(g);
                        }}
                        size={'icon-sm'}
                        variant={'outline'}
                    >
                        <PenIcon />
                    </Button>
                    <Button
                        type="button"
                        onClick={() => {
                            openDeleteDialog(g);
                        }}
                        size={'icon-sm'}
                        variant={'destructive'}
                    >
                        <TrashIcon />
                    </Button>
                </div>
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

    const openEditDialog = (guidedPrompt: GuidedPrompt) => {
        setEditTarget(guidedPrompt);
        setDialogOpen(true);
    };

    const openDeleteDialog = (guidedPrompt: GuidedPrompt) => {
        setDeleteTarget(guidedPrompt);
        setDeleteOpen(true);
    };

    const handleDelete = () => {
        if (!deleteTarget) return;

        setDeleting(true);

        apiService
            .delete(deletePrompt(deleteTarget.id!).url)
            .then(() => {
                toast.success('Guided prompt deleted.');
                setRefreshKey((key) => key + 1);
                setDeleteOpen(false);
                setDeleteTarget(null);
            })
            .catch(() => {
                toast.error('Failed to delete guided prompt.');
            })
            .finally(() => {
                setDeleting(false);
            });
    };

    return (
        <>
            <Head title="Guided Prompts" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Card>
                    <CardHeader>
                        <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center md:gap-0">
                            <h1>Guided Prompts Table</h1>
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
                                loading
                                    ? 'Loading guided prompts...'
                                    : undefined
                            }
                            onPageChange={setPage}
                            sort={sort}
                            onSortChange={handleSort}
                            toolbar={{
                                search: {
                                    value: search,
                                    onChange: handleSearch,
                                    placeholder: 'Search guided prompts...',
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
                        <GuidedPromptDialog
                            guidedPrompt={editTarget}
                            open={dialogOpen}
                            onOpenChange={setDialogOpen}
                            onSaved={() => setRefreshKey((key) => key + 1)}
                        />
                        <AlertDialog
                            open={deleteOpen}
                            onOpenChange={setDeleteOpen}
                        >
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>
                                        Delete guided prompt?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                        {deleteTarget
                                            ? `This will permanently delete "${deleteTarget.name}". This action cannot be undone.`
                                            : 'This action cannot be undone.'}
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel disabled={deleting}>
                                        Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={(event) => {
                                            event.preventDefault();
                                            handleDelete();
                                        }}
                                        disabled={deleting}
                                    >
                                        {deleting ? 'Deleting...' : 'Delete'}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

Index.layout = {
    breadcrumbs: [
        {
            title: 'Guided Prompts',
            href: guidedPrompts(),
        },
    ],
};
