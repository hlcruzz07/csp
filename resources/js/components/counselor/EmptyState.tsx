import { MessageCircleQuestion } from 'lucide-react';

export function EmptyState() {
    return (
        <div className="flex h-full w-full items-center justify-center">
            <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-200">
                    <MessageCircleQuestion
                        size={40}
                        className="text-gray-500"
                    />
                </div>
                <h1 className="text-xl font-semibold">No Message Selected</h1>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                    Choose a conversation from the sidebar to start chatting.
                </p>
            </div>
        </div>
    );
}
