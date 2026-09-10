import { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { createCollege, updateCollege } from '@/routes';
import type { College } from '@/types/entities';
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

type CollegeForm = {
    name: string;
    code: string;
};

const EMPTY_FORM: CollegeForm = { name: '', code: '' };

type CollegeDialogProps = {
    college: College | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSaved: () => void;
};

export default function CollegeDialog({
    college,
    open,
    onOpenChange,
    onSaved,
}: CollegeDialogProps) {
    const {
        data,
        setData,
        errors,
        clearErrors,
        reset,
        post,
        patch,
        processing,
    } = useForm<CollegeForm>(EMPTY_FORM);
    const isEditing = Boolean(college);

    useEffect(() => {
        if (college) {
            setData({ name: college.name, code: college.code });
        } else if (open) {
            reset();
        }
        clearErrors();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [college, open]);

    const handleSubmit = () => {
        const options = {
            preserveScroll: true,
            onSuccess: () => {
                onSaved();
                onOpenChange(false);
                reset();
            },
        };

        if (college) {
            patch(updateCollege(college.id).url, options);
        } else {
            post(createCollege().url, options);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? 'Edit college' : 'Add college'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'Update the college name and code.'
                            : 'Create a college for counselor and student assignments.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="college-name">Name</Label>
                        <Input
                            id="college-name"
                            value={data.name}
                            onChange={(event) =>
                                setData('name', event.target.value)
                            }
                            aria-invalid={Boolean(errors.name)}
                            placeholder="e.g. College of Engineering"
                        />
                        {errors.name && (
                            <p className="text-sm text-destructive">
                                {errors.name}
                            </p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="college-code">Code</Label>
                        <Input
                            id="college-code"
                            value={data.code}
                            onChange={(event) =>
                                setData(
                                    'code',
                                    event.target.value.toUpperCase(),
                                )
                            }
                            aria-invalid={Boolean(errors.code)}
                            placeholder="e.g. COE"
                        />
                        {errors.code && (
                            <p className="text-sm text-destructive">
                                {errors.code}
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
                        disabled={
                            processing || !data.name.trim() || !data.code.trim()
                        }
                    >
                        {processing
                            ? 'Saving...'
                            : isEditing
                              ? 'Save changes'
                              : 'Create college'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
