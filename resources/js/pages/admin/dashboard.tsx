import { Head } from '@inertiajs/react';
import {
    Building2,
    GraduationCap,
    Paperclip,
    MessagesSquare,
    MessageSquareText,
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

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
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

interface MessageDatum {
    date: string;
    messages: number;
}

interface ConversationDatum {
    date: string;
    conversations: number;
}

interface StatusDatum {
    status: string;
    label: string;
    value: number;
}

interface DashboardProps {
    stats: Stats;
    roleDistribution: RoleDatum[];
    messageActivity: MessageDatum[];
    conversationActivity: ConversationDatum[];
    statusDistribution: StatusDatum[];
}

const roleChartConfig = {
    value: { label: 'Users' },
    students: { label: 'Students', color: 'var(--chart-1)' },
    counselors: { label: 'Counselors', color: 'var(--chart-2)' },
} satisfies ChartConfig;

const activityChartConfig = {
    messages: { label: 'Messages', color: 'var(--chart-3)' },
} satisfies ChartConfig;

const conversationChartConfig = {
    conversations: { label: 'Conversations', color: 'var(--chart-4)' },
} satisfies ChartConfig;

const statusChartConfig = {
    value: { label: 'Messages' },
    sent: { label: 'Sent', color: 'var(--chart-1)' },
    seen: { label: 'Seen', color: 'var(--chart-2)' },
    responded: { label: 'Responded', color: 'var(--chart-3)' },
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

export default function Dashboard({
    stats,
    roleDistribution,
    messageActivity,
    conversationActivity,
    statusDistribution,
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
                                                ) {
                                                    return null;
                                                }

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
                <Card className="border-sidebar-border/70 dark:border-sidebar-border">
                    <CardHeader>
                        <CardTitle>Conversation activity</CardTitle>
                        <CardDescription>
                            New conversations over the last 14 days
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer
                            config={conversationChartConfig}
                            className="h-[260px] w-full"
                        >
                            <BarChart data={conversationActivity}>
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
                                    content={<ChartTooltipContent />}
                                />
                                <Bar
                                    dataKey="conversations"
                                    fill="var(--color-conversations)"
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
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
