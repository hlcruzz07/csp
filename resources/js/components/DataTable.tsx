import * as React from 'react';
import { useEffect, useState } from 'react';
import {
    ArrowDownNarrowWide,
    ArrowUpDownIcon,
    ArrowUpNarrowWide,
    ChevronDownIcon,
    RefreshCwIcon,
    SearchIcon,
    SlidersHorizontalIcon,
    XIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent } from './ui/card';

export type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

export type PaginatedData<T> = {
    data: T[];
    links: PaginationLink[];
    from: number | null;
    to: number | null;
    total: number;
};

export type SortOrder = 'asc' | 'desc';

export type SortState = {
    key: string;
    order: SortOrder;
};

export type DataTableColumn<T> = {
    /** Unique key for the column (used as React key, doesn't need to match a data field) */
    key: string;
    /** Column header label. Also used as the mobile `data-label` for TableLayout's responsive card view */
    header: string;
    /** Cell renderer, given the row and its index in the current page */
    render: (row: T, index: number) => React.ReactNode;
    headerClassName?: string;
    cellClassName?: string;
    /** Set this to the field name the backend should sort by to make the header clickable */
    sortKey?: string;
};

/** A single dropdown filter, e.g. Campus / Course / Status */
export type DataTableFilter = {
    key: string;
    label: string;
    options: string[];
    value: string | null;
    onSelect: (key: string, value: string | null) => void;
    disabled?: boolean;
    icon?: React.ElementType;
};

export type DataTableSearchConfig = {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    /** ms to wait after typing stops before calling onChange, default 500 */
    debounceMs?: number;
};

export type DataTablePerPageConfig = {
    value: number;
    options: number[];
    onChange: (value: number) => void;
};

/**
 * Everything that drives the toolbar (search box, filter dropdowns, per-page
 * size, refresh, sort, active-filter chips) bundled into a single prop so
 * DataTable itself only needs one optional prop to become fully filterable.
 *
 * Also reusable on its own via <DataTableToolbar /> if you ever need a
 * filter bar outside of a table (e.g. above a card grid).
 */
export type DataTableToolbarConfig = {
    /** Built-in debounced search box. Omit to hide it. */
    search?: DataTableSearchConfig;
    /** Dropdown filters (Campus, Course, Status, etc). Omit to hide the filter row. */
    filters?: DataTableFilter[];
    /** Per-page size dropdown. Omit to hide it. */
    perPage?: DataTablePerPageConfig;
    /** Current sort + setter — only needed if you also want a sort control in the toolbar itself. */
    sort?: SortState;
    onSortChange?: (sort: SortState) => void;
    /** Refresh button handler. Omit to hide the button. */
    onRefresh?: () => void;
    /** Called when "Clear all" is clicked, in addition to auto-clearing search/filters */
    onClearFilters?: () => void;
    /** Extra content rendered after the filter dropdowns (e.g. a date-range picker) */
    extraFilterSlot?: React.ReactNode;
    /** Label shown next to the total count badge. Defaults to "Total". */
    totalLabel?: string;
};

function getPageFromUrl(url: string | null): string | null {
    if (!url) {
        return null;
    }

    try {
        return new URL(url).searchParams.get('page');
    } catch {
        return null;
    }
}

/** A single filter dropdown trigger + menu. */
export function FilterDropdown({ filter }: { filter: DataTableFilter }) {
    const Icon = filter.icon;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    disabled={filter.disabled}
                    className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                        filter.value
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                >
                    {Icon && <Icon className="size-3.5 shrink-0" />}
                    <span>{filter.value || filter.label}</span>
                    <ChevronDownIcon className="size-3.5 shrink-0" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
                {filter.options.map((option) => (
                    <DropdownMenuItem
                        key={option}
                        onClick={() => filter.onSelect(filter.key, option)}
                    >
                        {option}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

/**
 * All filter dropdowns rendered together as one unit — pass the whole
 * `filters` array (plus optional extra slot, e.g. a date-range picker) and
 * this takes care of the "Filters" label + layout.
 */
export function FilterDropdownGroup({
    filters,
    extraFilterSlot,
}: {
    filters?: DataTableFilter[];
    extraFilterSlot?: React.ReactNode;
}) {
    if (!filters?.length && !extraFilterSlot) {
        return null;
    }

    return (
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
            <span className="mr-0.5 hidden items-center gap-1 text-xs font-medium text-muted-foreground sm:inline-flex">
                <SlidersHorizontalIcon className="size-3.5" />
                Filters
            </span>

            {(filters ?? []).map((f) => (
                <FilterDropdown key={f.key} filter={f} />
            ))}

            {extraFilterSlot}
        </div>
    );
}

/**
 * The full toolbar: search + refresh + per-page row, filter dropdowns + total
 * row, and active-filter chips row. Driven entirely by a single `toolbar`
 * config prop, so it drops into DataTable (or anywhere else) with one line.
 */
export function DataTableToolbar({
    toolbar,
    total,
}: {
    toolbar?: DataTableToolbarConfig;
    total?: number | null;
}) {
    const {
        search,
        filters,
        perPage,
        onRefresh,
        onClearFilters,
        extraFilterSlot,
    } = toolbar ?? {};

    // --- built-in debounced search -----------------------------------
    const [searchInput, setSearchInput] = useState(search?.value ?? '');

    useEffect(() => {
        setSearchInput(search?.value ?? '');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search?.value]);

    useEffect(() => {
        if (!search) {
            return;
        }

        const t = setTimeout(() => {
            if (searchInput !== search.value) {
                search.onChange(searchInput);
            }
        }, search.debounceMs ?? 500);

        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchInput]);

    if (!toolbar) {
        return null;
    }

    const hasFilterBar = !!(search || filters?.length || perPage || onRefresh);

    if (!hasFilterBar) {
        return null;
    }

    // --- active filter chips -------------------------------------------
    const activeChips: { key: string; label: string; onClear: () => void }[] =
        [];

    if (search?.value) {
        activeChips.push({
            key: '__search',
            label: `"${search.value}"`,
            onClear: () => {
                setSearchInput('');
                search.onChange('');
            },
        });
    }

    (filters ?? []).forEach((f) => {
        if (f.value) {
            activeChips.push({
                key: f.key,
                label: f.value,
                onClear: () => f.onSelect(f.key, null),
            });
        }
    });

    return (
        <div className="space-y-3">
            {/* Command bar: search + refresh + per-page */}
            <div className="flex flex-col gap-3 rounded-2xl border bg-muted/40 p-2 sm:flex-row sm:items-center">
                {search && (
                    <div className="relative flex min-w-0 flex-1 items-center">
                        <SearchIcon className="pointer-events-none absolute left-3.5 size-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder={search.placeholder ?? 'Search...'}
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="h-10 w-full rounded-full border-0 bg-background pr-4 pl-10 text-sm shadow-sm ring-1 ring-transparent transition-shadow outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
                        />
                    </div>
                )}

                {(onRefresh || perPage) && (
                    <div className="flex shrink-0 items-center gap-1.5">
                        {onRefresh && (
                            <button
                                type="button"
                                onClick={onRefresh}
                                title="Refresh"
                                className="inline-flex size-10 items-center justify-center rounded-full bg-background text-muted-foreground shadow-sm transition-colors hover:text-foreground"
                            >
                                <RefreshCwIcon className="size-4" />
                            </button>
                        )}

                        {perPage && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        type="button"
                                        className="inline-flex h-10 items-center gap-1 rounded-full bg-background px-3.5 text-sm font-medium shadow-sm"
                                    >
                                        {perPage.value}
                                        <span className="hidden text-muted-foreground sm:inline">
                                            / page
                                        </span>
                                        <ChevronDownIcon className="size-3.5 text-muted-foreground" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    className="w-32"
                                    align="end"
                                >
                                    {perPage.options.map((option) => (
                                        <DropdownMenuItem
                                            key={option}
                                            onClick={() =>
                                                perPage.onChange(option)
                                            }
                                            className={
                                                perPage.value === option
                                                    ? 'font-medium text-primary'
                                                    : ''
                                            }
                                        >
                                            {option} per page
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                )}
            </div>

            {/* Filter dropdowns + total */}
            {(filters?.length || extraFilterSlot) && (
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <FilterDropdownGroup
                        filters={filters}
                        extraFilterSlot={extraFilterSlot}
                    />

                    <div className="flex shrink-0 items-center gap-2 text-sm">
                        <span className="text-muted-foreground">
                            {toolbar.totalLabel ?? 'Total'}
                        </span>
                        <Badge className="rounded-full px-2.5 tabular-nums">
                            {Number(total ?? 0).toLocaleString()}
                        </Badge>
                    </div>
                </div>
            )}

            {/* Active filter chips */}
            {activeChips.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 border-t pt-3">
                    {activeChips.map((chip) => (
                        <span
                            key={chip.key}
                            className="inline-flex items-center gap-1 rounded-full bg-secondary py-1 pr-1 pl-2.5 text-xs font-medium text-secondary-foreground"
                        >
                            {chip.label}
                            <button
                                type="button"
                                onClick={chip.onClear}
                                className="inline-flex size-4 items-center justify-center rounded-full text-secondary-foreground/70 hover:bg-background hover:text-foreground"
                            >
                                <XIcon className="size-3" />
                            </button>
                        </span>
                    ))}

                    <button
                        type="button"
                        onClick={() => {
                            setSearchInput('');
                            search?.onChange('');
                            (filters ?? []).forEach((f) =>
                                f.onSelect(f.key, null),
                            );
                            onClearFilters?.();
                        }}
                        className="ml-1 text-xs font-medium text-muted-foreground underline-offset-2 hover:text-destructive hover:underline"
                    >
                        Clear all
                    </button>
                </div>
            )}
        </div>
    );
}

type DataTableProps<T> = {
    columns: DataTableColumn<T>[];
    paginated: PaginatedData<T> | null;
    onPageChange: (page: string) => void;
    rowKey?: (row: T, index: number) => React.Key;
    emptyMessage?: string;
    sort?: SortState;
    onSortChange?: (sort: SortState) => void;
    toolbar?: DataTableToolbarConfig;
};

export default function DataTable<T>({
    columns,
    paginated,
    onPageChange,
    rowKey,
    emptyMessage = 'No records found.',
    sort,
    onSortChange,
    toolbar,
}: DataTableProps<T>) {
    const rows = paginated?.data ?? [];

    const handleSortClick = (sortKey: string) => {
        if (!onSortChange) {
            return;
        }

        const isActive = sort?.key === sortKey;
        const nextOrder: SortOrder =
            isActive && sort?.order === 'asc' ? 'desc' : 'asc';

        onSortChange({ key: sortKey, order: nextOrder });
    };

    return (
        <Card>
            <CardContent>
                <DataTableToolbar toolbar={toolbar} total={paginated?.total} />

                <div className="relative mt-3 overflow-x-auto rounded-md lg:border">
                    <table className="table w-full text-left text-base text-foreground">
                        <thead className="lg:border-b">
                            <tr>
                                {columns.map((col) => {
                                    const isSortable =
                                        !!col.sortKey && !!onSortChange;
                                    const isActive =
                                        isSortable && sort?.key === col.sortKey;

                                    return (
                                        <th
                                            key={col.key}
                                            scope="col"
                                            className={col.headerClassName}
                                        >
                                            {isSortable ? (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleSortClick(
                                                            col.sortKey!,
                                                        )
                                                    }
                                                    className="inline-flex items-center gap-1 text-left hover:text-primary"
                                                >
                                                    {col.header}
                                                    {isActive ? (
                                                        sort?.order ===
                                                        'asc' ? (
                                                            <ArrowDownNarrowWide className="size-3.5" />
                                                        ) : (
                                                            <ArrowUpNarrowWide className="size-3.5" />
                                                        )
                                                    ) : (
                                                        <ArrowUpDownIcon className="size-3.5 opacity-40" />
                                                    )}
                                                </button>
                                            ) : (
                                                col.header
                                            )}
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody className="lg:border-b">
                            {rows.map((row, index) => (
                                <tr
                                    key={rowKey ? rowKey(row, index) : index}
                                    className="hover:bg-muted/50"
                                >
                                    {columns.map((col) => (
                                        <td
                                            key={col.key}
                                            data-label={col.header}
                                            className={col.cellClassName}
                                        >
                                            {col.render(row, index)}
                                        </td>
                                    ))}
                                </tr>
                            ))}

                            {rows.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={columns.length}
                                        className="force-center p-3 text-center"
                                    >
                                        {emptyMessage}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td
                                    colSpan={columns.length}
                                    className="px-6 py-4"
                                >
                                    <div className="flex w-full flex-col items-center justify-between gap-3 sm:flex-row">
                                        <p className="text-sm text-muted-foreground">
                                            Showing{' '}
                                            <span className="font-medium">
                                                {paginated?.from ?? 0}
                                            </span>
                                            –
                                            <span className="font-medium">
                                                {paginated?.to ?? 0}
                                            </span>{' '}
                                            of{' '}
                                            <span className="font-medium">
                                                {paginated?.total ?? 0}
                                            </span>
                                        </p>

                                        <div className="flex flex-wrap gap-2">
                                            {paginated?.links?.map(
                                                (link, idx) => {
                                                    const page = getPageFromUrl(
                                                        link.url,
                                                    );

                                                    return (
                                                        <button
                                                            key={idx}
                                                            disabled={!link.url}
                                                            onClick={(e) => {
                                                                e.preventDefault();

                                                                if (!page) {
                                                                    return;
                                                                }

                                                                onPageChange(
                                                                    page,
                                                                );
                                                            }}
                                                            className={`rounded px-3 py-1 ${
                                                                link.active
                                                                    ? 'bg-primary text-white dark:text-black'
                                                                    : 'bg-muted text-muted-foreground hover:bg-muted/70'
                                                            }`}
                                                            type="button"
                                                        >
                                                            <span
                                                                dangerouslySetInnerHTML={{
                                                                    __html: link.label,
                                                                }}
                                                            />
                                                        </button>
                                                    );
                                                },
                                            )}
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
