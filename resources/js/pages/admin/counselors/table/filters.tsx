import FilterDropdown from '@/components/filter-dropdown';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    CheckCheckIcon,
    ChevronsUpDownIcon,
    ListFilter,
    RefreshCwIcon,
} from 'lucide-react';
import { useState } from 'react';

type FilterState = {
    search: string | null;
    action: string | null;
    email: string | null;
    ip_address: string | null;
    browser: string | null;
    status: string | null;
    created_at_from: string | null;
    created_at_to: string | null;
    show: number;
    sort: string;
    order: 'asc' | 'desc';
};

const DEFAULT_FILTERS: FilterState = {
    search: null,
    action: null,
    email: null,
    ip_address: null,
    browser: null,
    status: null,
    created_at_from: null,
    created_at_to: null,
    show: 10,
    sort: 'id',
    order: 'desc',
};

export default function Filters() {
    const [filter, setFilter] = useState<FilterState>(DEFAULT_FILTERS);

    const resetFilter = () => {
        setFilter(DEFAULT_FILTERS);
    };
    return (
        <div className="space-y-3">
            <div className="flex flex-col gap-3 lg:flex-row">
                <div className="flex grow gap-3">
                    <Button variant="outline">
                        <RefreshCwIcon />
                    </Button>
                    <Input placeholder="Search.." />
                </div>
                <div className="flex gap-3">
                    <FilterDropdown
                        label="Show"
                        value={filter.show}
                        options={[10, 20, 30]}
                        onChange={(value: number) =>
                            setFilter((prev) => ({
                                ...prev,
                                show: value,
                            }))
                        }
                        icon={<ChevronsUpDownIcon />}
                        className="grow"
                    />

                    <FilterDropdown
                        label="Sort by"
                        value={filter.sort}
                        options={['id', 'name', 'email']}
                        onChange={(value: string) =>
                            setFilter((prev) => ({
                                ...prev,
                                sort: value,
                            }))
                        }
                        icon={<ListFilter />}
                        className="grow"
                    />
                </div>
            </div>

            <div className="flex flex-wrap gap-3">
                <FilterDropdown
                    label="Sort by"
                    value={filter.sort}
                    options={['id', 'name', 'email']}
                    onChange={(value: string) =>
                        setFilter((prev) => ({
                            ...prev,
                            sort: value,
                        }))
                    }
                    icon={<ListFilter />}
                    className="w-max"
                />
                <FilterDropdown
                    label="Sort by"
                    value={filter.sort}
                    options={['id', 'name', 'email']}
                    onChange={(value: string) =>
                        setFilter((prev) => ({
                            ...prev,
                            sort: value,
                        }))
                    }
                    icon={<ListFilter />}
                    className="w-max"
                />
            </div>
        </div>
    );
}
