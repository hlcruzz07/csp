import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';

import { ReactElement, cloneElement } from 'react';

interface TooltipButtonProps {
    button: ReactElement<{ onClick?: () => void }>;
    onButtonClick?: () => void;
    content: string;
}

export function TooltipButton({
    button,
    onButtonClick,
    content,
}: TooltipButtonProps) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                {cloneElement(button, {
                    onClick: onButtonClick,
                })}
            </TooltipTrigger>

            <TooltipContent>
                <p>{content}</p>
            </TooltipContent>
        </Tooltip>
    );
}
