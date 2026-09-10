import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { GuidedPrompt } from '@/types/entities';
import { createPrompt, updatePrompt } from '@/routes';
type GuidedPromptForm = {
    name: string;
};

const EMPTY_FORM: GuidedPromptForm = { name: '' };

type GuidedPromptDialogProps = {
    guidedPrompt: GuidedPrompt | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSaved: () => void;
};

export default function GuidedPromptDialog({
    guidedPrompt,
    open,
    onOpenChange,
    onSaved,
}: GuidedPromptDialogProps) {
    const {
        data,
        setData,
        errors,
        clearErrors,
        reset,
        post,
        patch,
        processing,
    } = useForm<GuidedPromptForm>(EMPTY_FORM);
    const isEditing = Boolean(guidedPrompt);

    useEffect(() => {
        if (guidedPrompt) {
            setData({ name: guidedPrompt.name });
        } else if (open) {
            reset();
        }
        clearErrors();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [guidedPrompt, open]);

    const handleSubmit = () => {
        const options = {
            preserveScroll: true,
            onSuccess: () => {
                onSaved();
                onOpenChange(false);
                reset();
            },
        };

        if (guidedPrompt) {
            patch(updatePrompt(guidedPrompt.id!).url, options);
        } else {
            post(createPrompt().url, options);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? 'Edit guided prompt' : 'Add guided prompt'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'Update the wording of this guided prompt.'
                            : 'Create a guided prompt counselors can send to students.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="guided-prompt-name">Prompt</Label>
                        <Input
                            id="guided-prompt-name"
                            value={data.name}
                            onChange={(event) =>
                                setData('name', event.target.value)
                            }
                            aria-invalid={Boolean(errors.name)}
                            placeholder="e.g. Can you walk me through what happened?"
                        />
                        {errors.name && (
                            <p className="text-sm text-destructive">
                                {errors.name}
                            </p>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={processing}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={processing || !data.name.trim()}
                    >
                        {processing
                            ? 'Saving...'
                            : isEditing
                              ? 'Save changes'
                              : 'Create prompt'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
