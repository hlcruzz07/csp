import { Head } from '@inertiajs/react';
import {
    Building2,
    GraduationCap,
    MessagesSquare,
    UsersRound,
} from 'lucide-react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Label,
    Pie,
    PieChart,
    XAxis,
} from 'recharts';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart';
import { Separator } from '@/components/ui/separator';
import { adminDashboard } from '@/routes';

interface Stats {
    students: number;
    counselors: number;
    colleges: number;
    conversations: number;
}

interface RoleDatum {
    role: string;
    label: string;
    value: number;
}

interface CollegeDatum {
    college: string;
    students: number;
}

interface MessageDatum {
    date: string;
    messages: number;
}

interface RecentConversation {
    id: string | number;
    student: string | null;
    counselor: string | null;
    preview: string;
    updatedAt: string | null;
}

interface DashboardProps {
    stats: Stats;
    roleDistribution: RoleDatum[];
    collegeDistribution: CollegeDatum[];
    messageActivity: MessageDatum[];
    recentConversations: RecentConversation[];
}

const roleChartConfig = {
    value: { label: 'Users' },
    students: { label: 'Students', color: 'var(--chart-1)' },
    counselors: { label: 'Counselors', color: 'var(--chart-2)' },
} satisfies ChartConfig;

const collegeChartConfig = {
    students: { label: 'Students', color: 'var(--chart-1)' },
} satisfies ChartConfig;

const activityChartConfig = {
    messages: { label: 'Messages', color: 'var(--chart-3)' },
} satisfies ChartConfig;

function StatCard({
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
                <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="text-3xl font-semibold tracking-tight">
                        {value.toLocaleString()}
                    </p>
                </div>
                <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Icon className="size-5 text-primary" />
                </div>
            </CardContent>
        </Card>
    );
}

function initials(name: string | null) {
    if (!name) return '?';
    return name
        .split(' ')
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

export default function Dashboard({
    stats,
    roleDistribution,
    collegeDistribution,
    messageActivity,
    recentConversations,
}: DashboardProps) {
    const roleData = roleDistribution.map((row) => ({
        ...row,
        fill: `var(--color-${row.role})`,
    }));
    const totalUsers = stats.students + stats.counselors;

    return (
        <>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Stat cards */}
                <div className="grid auto-rows-min gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        label="Students"
                        value={stats.students}
                        icon={GraduationCap}
                    />
                    <StatCard
                        label="Counselors"
                        value={stats.counselors}
                        icon={UsersRound}
                    />
                    <StatCard
                        label="Colleges"
                        value={stats.colleges}
                        icon={Building2}
                    />
                    <StatCard
                        label="Conversations"
                        value={stats.conversations}
                        icon={MessagesSquare}
                    />
                </div>

                {/* Charts row */}
                <div className="grid gap-4 lg:grid-cols-3">
                    <Card className="border-sidebar-border/70 lg:col-span-2 dark:border-sidebar-border">
                        <CardHeader>
                            <CardTitle>Message activity</CardTitle>
                            <CardDescription>
                                Messages sent over the last 14 days
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer
                                config={activityChartConfig}
                                className="h-[260px] w-full"
                            >
                                <BarChart data={messageActivity}>
                                    <CartesianGrid
                                        vertical={false}
                                        strokeDasharray="4 4"
                                    />
                                    <XAxis
                                        dataKey="date"
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={8}
                                        interval="preserveStartEnd"
                                    />
                                    <ChartTooltip
                                        content={
                                            <ChartTooltipContent
                                                hideLabel={false}
                                            />
                                        }
                                    />
                                    <Bar
                                        dataKey="messages"
                                        fill="var(--color-messages)"
                                        radius={[4, 4, 0, 0]}
                                    />
                                </BarChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>

                    <Card className="border-sidebar-border/70 dark:border-sidebar-border">
                        <CardHeader>
                            <CardTitle>User mix</CardTitle>
                            <CardDescription>
                                Students vs. counselors
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer
                                config={roleChartConfig}
                                className="mx-auto aspect-square h-[220px]"
                            >
                                <PieChart>
                                    <ChartTooltip
                                        content={
                                            <ChartTooltipContent hideLabel />
                                        }
                                    />
                                    <Pie
                                        data={roleData}
                                        dataKey="value"
                                        nameKey="label"
                                        innerRadius={60}
                                        strokeWidth={4}
                                    >
                                        <Label
                                            content={({ viewBox }) => {
                                                if (
                                                    !viewBox ||
                                                    !('cx' in viewBox)
                                                )
                                                    return null;
                                                return (
                                                    <text
                                                        x={viewBox.cx}
                                                        y={viewBox.cy}
                                                        textAnchor="middle"
                                                        dominantBaseline="middle"
                                                    >
                                                        <tspan
                                                            x={viewBox.cx}
                                                            y={viewBox.cy}
                                                            className="fill-foreground text-2xl font-semibold"
                                                        >
                                                            {totalUsers.toLocaleString()}
                                                        </tspan>
                                                        <tspan
                                                            x={viewBox.cx}
                                                            y={
                                                                (viewBox.cy ??
                                                                    0) + 20
                                                            }
                                                            className="fill-muted-foreground text-xs"
                                                        >
                                                            total users
                                                        </tspan>
                                                    </text>
                                                );
                                            }}
                                        />
                                    </Pie>
                                </PieChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* Colleges + recent conversations */}
                <div className="grid flex-1 gap-4 lg:grid-cols-3">
                    <Card className="border-sidebar-border/70 lg:col-span-2 dark:border-sidebar-border">
                        <CardHeader>
                            <CardTitle>Students by college</CardTitle>
                            <CardDescription>
                                Top colleges by enrolled students
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer
                                config={collegeChartConfig}
                                className="h-[240px] w-full"
                            >
                                <BarChart
                                    data={collegeDistribution}
                                    layout="vertical"
                                    margin={{ left: 8 }}
                                >
                                    <CartesianGrid
                                        horizontal={false}
                                        strokeDasharray="4 4"
                                    />
                                    <XAxis type="number" hide />
                                    <ChartTooltip
                                        content={<ChartTooltipContent />}
                                    />
                                    <Bar
                                        dataKey="students"
                                        fill="var(--color-students)"
                                        radius={4}
                                    />
                                </BarChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>

                    <Card className="border-sidebar-border/70 dark:border-sidebar-border">
                        <CardHeader>
                            <CardTitle>Recent conversations</CardTitle>
                            <CardDescription>
                                Latest activity across students
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-1">
                            {recentConversations.length === 0 && (
                                <p className="text-sm text-muted-foreground">
                                    No conversations yet.
                                </p>
                            )}
                            {recentConversations.map((conversation, index) => (
                                <div key={conversation.id}>
                                    <div className="flex items-center gap-3 py-2">
                                        <Avatar className="size-9 shrink-0">
                                            <AvatarFallback className="text-xs">
                                                {initials(conversation.student)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="truncate text-sm font-medium">
                                                    {conversation.student ??
                                                        'Anonymous student'}
                                                </p>
                                                <span className="shrink-0 text-xs text-muted-foreground">
                                                    {conversation.updatedAt}
                                                </span>
                                            </div>
                                            <p className="truncate text-xs text-muted-foreground">
                                                {conversation.preview}
                                            </p>
                                        </div>
                                    </div>
                                    {index < recentConversations.length - 1 && (
                                        <Separator />
                                    )}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: adminDashboard(),
        },
    ],
};
