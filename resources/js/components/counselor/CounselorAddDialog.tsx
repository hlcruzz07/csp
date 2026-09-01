import { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { College } from '@/types/entities';
import { createCounselor } from '@/routes';
import { useIsMobile } from '@/hooks/use-mobile';
import { handleErrors } from '@/lib/utils';

const UNASSIGNED = 'unassigned';

interface CounselorAddDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    colleges: College[];
    onSaved: () => void;
}

interface CounselorAddFormState {
    name: string;
    email: string;
    password: string;
    assigned_college_id: string;
}

const EMPTY_FORM: CounselorAddFormState = {
    name: '',
    email: '',
    password: '',
    assigned_college_id: UNASSIGNED,
};

export default function CounselorAddDialog({
    open,
    onOpenChange,
    colleges,
    onSaved,
}: CounselorAddDialogProps) {
    const { data, setData, errors, clearErrors, reset, post, processing } =
        useForm<CounselorAddFormState>(EMPTY_FORM);

    // Reset the form whenever the dialog is closed, so the next time it
    // opens it starts blank rather than showing the last entry.
    useEffect(() => {
        if (!open) {
            reset();
            clearErrors();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const handleSubmit = () => {
        post(createCounselor().url, {
            preserveScroll: true,
            onSuccess: () => {
                onSaved();
                onOpenChange(false);
                reset();
            },
            onError: (err) => {
                handleErrors(err);
            },
        });
    };

    const { isMobile } = useIsMobile() as any;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Add counselor</DialogTitle>
                    <DialogDescription>
                        Create a new counselor profile.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="name">
                            Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            aria-invalid={!!errors.name}
                            placeholder="Enter Name"
                        />
                        {errors.name && (
                            <p className="text-sm text-destructive">
                                {errors.name}
                            </p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">
                            Email <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            aria-invalid={!!errors.email}
                            placeholder="Enter Email"
                        />
                        {errors.email && (
                            <p className="text-sm text-destructive">
                                {errors.email}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">
                            Password <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="password"
                            type="password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            aria-invalid={!!errors.password}
                            placeholder="Enter password"
                        />
                        {errors.password && (
                            <p className="text-sm text-destructive">
                                {errors.password}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="assigned_college_id">
                            Assigned college{' '}
                            <span className="text-destructive">*</span>
                        </Label>
                        <Select
                            value={data.assigned_college_id}
                            onValueChange={(value) =>
                                setData('assigned_college_id', value)
                            }
                        >
                            <SelectTrigger
                                id="assigned_college_id"
                                className="w-full"
                            >
                                <SelectValue placeholder="Select a college" />
                            </SelectTrigger>
                            <SelectContent className="w-full" align="center">
                                {colleges.map((option) => (
                                    <SelectItem
                                        key={option.id}
                                        value={String(option.id)}
                                    >
                                        {isMobile
                                            ? option.name.length > 35
                                                ? option.name.slice(0, 35) +
                                                  '...'
                                                : option.name
                                            : option.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.assigned_college_id && (
                            <p className="text-sm text-destructive">
                                {errors.assigned_college_id}
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
                        disabled={processing}
                    >
                        {processing ? 'Creating...' : 'Add counselor'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
