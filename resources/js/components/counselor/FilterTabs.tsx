type Filter = 'All' | 'Unread';

interface FilterTabsProps {
    selected: Filter;
    onChange: (filter: Filter) => void;
}

export function FilterTabs({ selected, onChange }: FilterTabsProps) {
    return (
        <div className="flex items-center gap-2">
            {(['All', 'Unread'] as Filter[]).map((filter) => (
                <button
                    key={filter}
                    onClick={() => onChange(filter)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                        selected === filter
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                >
                    {filter}
                </button>
            ))}
        </div>
    );
}
