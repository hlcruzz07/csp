import { EllipsisVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type Filter = 'All' | 'Unread' | 'Responded';

interface FilterTabsProps {
    selected: Filter;
    onChange: (filter: Filter) => void;
}

export function FilterTabs({ selected, onChange }: FilterTabsProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                    <EllipsisVertical />
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
                <DropdownMenuRadioGroup
                    value={selected}
                    onValueChange={(value) => onChange(value as Filter)}
                >
                    <DropdownMenuRadioItem value="All">
                        All
                    </DropdownMenuRadioItem>

                    <DropdownMenuRadioItem value="Unread">
                        Unread
                    </DropdownMenuRadioItem>

                    <DropdownMenuRadioItem value="Responded">
                        Responded
                    </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
