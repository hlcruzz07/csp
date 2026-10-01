import { Head } from '@inertiajs/react';
import dayjs from 'dayjs';
import { PenIcon, UserPlus2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import DataTable from '@/components/DataTable';
import type {
    DataTableColumn,
    PaginatedData,
    SortState,
} from '@/components/DataTable';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useInitials } from '@/hooks/use-initials';
import apiService from '@/lib/api-service';
import { normalizeName, resolveAvatarUrl } from '@/lib/utils';
import { accounts, paginateUsers } from '@/routes';
import UserDialog, { ManagedUser } from '@/components/user/UserDialog';

type UsersResponse = PaginatedData<ManagedUser>;

const displayNameOf = (user: ManagedUser) =>
    user.name ? normalizeName(user.name) : (user.pseudonym ?? '—');

export default function Index() {
    const getInitials = useInitials();

    const [search, setSearch] = useState('');
    const [page, setPage] = useState('1');
    const [perPage, setPerPage] = useState(10);
    const [sort, setSort] = useState<SortState>({ key: 'name', order: 'asc' });
    const [response, setResponse] = useState<UsersResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<ManagedUser | null>(null);

    useEffect(() => {
        const controller = new AbortController();

        apiService
            .get<UsersResponse>(paginateUsers().url, {
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

    const columns: DataTableColumn<ManagedUser>[] = [
        {
            key: 'name',
            header: 'User',
            sortKey: 'name',
            render: (u) => {
                const displayName = displayNameOf(u);

                return (
                    <div className="flex items-center gap-3">
                        <Avatar className="size-9 overflow-hidden rounded-full">
                            <AvatarImage
                                src={resolveAvatarUrl(u.avatar)}
                                alt={displayName}
                                className="object-cover"
                            />
                            <AvatarFallback className="rounded-lg bg-neutral-200 text-xs text-black dark:bg-neutral-700 dark:text-white">
                                {getInitials(displayName)}
                            </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{displayName}</span>
                    </div>
                );
            },
        },
        {
            key: 'email',
            header: 'Email',
            sortKey: 'email',
            render: (u) => <span>{u.email}</span>,
        },
        {
            key: 'role',
            header: 'Role',
            sortKey: 'role',
            render: (u) => (
                <Badge
                    variant={u.role === 'admin' ? 'default' : 'secondary'}
                    className="capitalize"
                >
                    {u.role}
                </Badge>
            ),
        },
        {
            key: 'created_at',
            header: 'Created',
            sortKey: 'created_at',
            render: (u) => dayjs(u.created_at).format('MMM D, YYYY'),
        },
        {
            key: 'action',
            header: 'Action',
            render: (u) => (
                <Button
                    type="button"
                    onClick={() => openEditDialog(u)}
                    size={'icon-sm'}
                    variant={'outline'}
                    title="Edit user"
                >
                    <PenIcon />
                </Button>
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

    const openEditDialog = (user: ManagedUser) => {
        setEditTarget(user);
        setDialogOpen(true);
    };

    return (
        <>
            <Head title="Users" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Card>
                    <CardHeader>
                        <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center md:gap-0">
                            <h1>Users Table</h1>

                            <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
                                <Button
                                    className="w-full md:w-max"
                                    size={'sm'}
                                    onClick={openCreateDialog}
                                >
                                    <UserPlus2 /> Add admin
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <DataTable
                            columns={columns}
                            paginated={response}
                            emptyMessage={
                                loading ? 'Loading users...' : undefined
                            }
                            onPageChange={setPage}
                            sort={sort}
                            onSortChange={handleSort}
                            toolbar={{
                                search: {
                                    value: search,
                                    onChange: handleSearch,
                                    placeholder: 'Search name or email...',
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
                        <UserDialog
                            user={editTarget}
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
            title: 'Accounts',
            href: accounts(),
        },
    ],
};
