import { Head } from '@inertiajs/react';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import { adminDashboard } from '@/routes';
import { Card, CardContent } from '@/components/ui/card';
import { useMemo, useState } from 'react';
import DataTable, { type DataTableColumn } from '@/components/DataTable';
import { Counselor, User } from '@/types/entities';
import apiService from '@/lib/api-service';

export default function Index() {
    const [search, setSearch] = useState('');
    const [campus, setCampus] = useState<string | null>(null);

    const columns: DataTableColumn<Counselor>[] = [
        { key: 'name', header: 'Name', sortKey: 'name', render: (c) => c.name },
        {
            key: 'campus',
            header: 'Campus',
            render: (c) => c.email,
        },
    ];
    return (
        <>
            <Head title="Students" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                    </div>
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                    </div>
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                    </div>
                </div>

                <DataTable
                    columns={columns}
                    paginated={{
                        data: [],
                        links: [],
                        total: 0,
                        from: null,
                        to: null,
                    }}
                    onPageChange={(page) => console.log('go to page', page)}
                    toolbar={{
                        search: { value: search, onChange: setSearch },
                        filters: [
                            {
                                key: 'campus',
                                label: 'Campus',
                                value: campus,
                                options: ['Talisay', 'Alijis'],
                                onSelect: (_, value) => setCampus(value),
                            },
                        ],
                        perPage: {
                            value: 10,
                            options: [10, 25, 50, 100],
                            onChange: (value) =>
                                console.log('go to page', value),
                        },
                        sort: {
                            key: 'name',
                            order: 'asc',
                        },
                        onSortChange: (sort) => console.log('sort', sort),
                    }}
                />
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
