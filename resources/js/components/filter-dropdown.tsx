import { capitalizeString, cn } from '@/lib/utils';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { ChevronsUpDownIcon } from 'lucide-react';
import { ReactNode } from 'react';

type FilterDropdownProps = {
    label: string;
    value: any | null;
    options: any[];
    onChange: (value: any | null) => void;
    icon?: ReactNode;
    allowClear?: boolean;
    className?: string;
};

export default function FilterDropdown({
    label,
    value,
    options,
    onChange,
    icon,
    allowClear = false,
    className,
}: FilterDropdownProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    className={cn('flex items-center gap-2', className)}
                >
                    {icon && icon}
                    {label}

                    {value !== null && value !== undefined && (
                        <Badge variant={'destructive'}>
                            {typeof value === 'number'
                                ? value
                                : capitalizeString(value)}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-max">
                {options.map((item) => {
                    const isActive = value === item;

                    return (
                        <DropdownMenuCheckboxItem
                            key={item}
                            checked={isActive}
                            onCheckedChange={() => {
                                if (!allowClear) {
                                    // ✅ always select, never uncheck
                                    onChange(item);
                                } else {
                                    // optional toggle mode
                                    onChange(isActive ? null : item);
                                }
                            }}
                        >
                            {typeof item === 'number'
                                ? item
                                : capitalizeString(item)}
                        </DropdownMenuCheckboxItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
