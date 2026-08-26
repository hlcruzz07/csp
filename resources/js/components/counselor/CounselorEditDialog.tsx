import { useEffect, useRef, useState } from 'react';
import { useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import { Pencil } from 'lucide-react';
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
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import type { College, Counselor } from '@/types/entities';
import { Switch } from '../ui/switch';
import { updateCounselor } from '@/routes';
import { useIsMobile } from '@/hooks/use-mobile';
import { handleErrors } from '@/lib/utils';

const UNASSIGNED = 'unassigned';

interface CounselorEditDialogProps {
    counselor: Counselor | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    colleges: College[];
    onSaved: () => void;
}

interface CounselorFormState {
    name: string;
    email: string;
    new_password: string;
    assigned_college_id: string;
    is_anonymous: boolean;
    avatar: File | null;
}

const EMPTY_FORM: CounselorFormState = {
    name: '',
    email: '',
    new_password: '',
    assigned_college_id: UNASSIGNED,
    is_anonymous: false,
    avatar: null,
};

/**
 * Resolves a counselor's stored avatar value into a displayable URL.
 * - OAuth avatars are already full URLs (e.g. Google) — used as-is.
 * - Locally uploaded avatars are relative paths under storage/app/public/avatars,
 *   served via the public disk symlink at /storage/...
 */
function resolveAvatarUrl(avatar?: string | null): string | undefined {
    if (!avatar) return undefined;
    if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
        return avatar;
    }
    return `/storage/${avatar}`;
}

function getInitials(name: string): string {
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');
}

export default function CounselorEditDialog({
    counselor,
    open,
    onOpenChange,
    colleges,
    onSaved,
}: CounselorEditDialogProps) {
    const { data, setData, errors, clearErrors, reset, patch, processing } =
        useForm<CounselorFormState>(EMPTY_FORM);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    // Reset form state whenever a different counselor is loaded into the dialog.
    // Deliberately not depending on `form` itself here — useForm returns a new
    // object each render, so including it would loop.
    useEffect(() => {
        if (!counselor) {
            reset();
            clearErrors();
            setAvatarPreview(null);

            return;
        }

        const assignedCollege = counselor.assigned_college;
        const assignedCollegeOption = assignedCollege
            ? colleges.find(
                  (option) =>
                      option.id === assignedCollege.id ||
                      option.name === assignedCollege.name,
              )
            : undefined;

        setData({
            name: counselor.name,
            email: counselor.email,
            new_password: '',
            assigned_college_id: assignedCollegeOption
                ? String(assignedCollegeOption.id)
                : UNASSIGNED,
            is_anonymous: counselor.is_anonymous,
            avatar: null,
        });
        clearErrors();
        setAvatarPreview(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [counselor, colleges]);

    // Build/revoke an object URL preview whenever a new file is picked.
    useEffect(() => {
        if (!data.avatar) {
            return;
        }

        const objectUrl = URL.createObjectURL(data.avatar);
        setAvatarPreview(objectUrl);

        return () => URL.revokeObjectURL(objectUrl);
    }, [data.avatar]);

    const handleAvatarPick = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        setData('avatar', file);
        // allow re-selecting the same file later and trigger onChange again
        e.target.value = '';
    };

    const handleSubmit = () => {
        if (!counselor) {
            return;
        }

        // Inertia auto-detects the File in `data.avatar`, switches this to a
        // multipart POST, and spoofs the method as PATCH — no extra config needed.
        patch(updateCounselor(counselor.id).url, {
            preserveScroll: true,
            onSuccess: () => {
                onSaved();
                onOpenChange(false);
            },
            onError: (err) => {
                handleErrors(err);
            },
        });
    };

    const { isMobile } = useIsMobile() as any;

    const displayedAvatarUrl =
        avatarPreview ?? resolveAvatarUrl(counselor?.avatar);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Edit counselor</DialogTitle>
                    <DialogDescription>
                        Update {counselor?.name ?? 'this counselor'}&apos;s
                        profile details.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-2">
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="group relative shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            aria-label="Change avatar"
                        >
                            <Avatar className="h-16 w-16 border">
                                <AvatarImage
                                    src={displayedAvatarUrl}
                                    alt={counselor?.name ?? 'Counselor'}
                                />
                                <AvatarFallback>
                                    {counselor
                                        ? getInitials(counselor.name)
                                        : '?'}
                                </AvatarFallback>
                            </Avatar>
                            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100">
                                <Pencil className="h-5 w-5 text-white" />
                            </span>
                        </button>

                        <div className="space-y-1">
                            <p className="text-sm font-medium">Avatar</p>
                            <p className="text-sm text-muted-foreground">
                                Click the photo to upload a new one.
                            </p>
                            {errors.avatar && (
                                <p className="text-sm text-destructive">
                                    {errors.avatar}
                                </p>
                            )}
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarPick}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="name">
                            Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            aria-invalid={!!errors.name}
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
                        />
                        {errors.email && (
                            <p className="text-sm text-destructive">
                                {errors.email}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="new_password">New password</Label>
                        <Input
                            id="new_password"
                            type="password"
                            value={data.new_password}
                            onChange={(e) =>
                                setData('new_password', e.target.value)
                            }
                            placeholder="Leave blank to keep the current password"
                            aria-invalid={!!errors.new_password}
                        />
                        {errors.new_password && (
                            <p className="text-sm text-destructive">
                                {errors.new_password}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="assigned_college_id">
                            Assigned college
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
                        {processing ? 'Saving...' : 'Save changes'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
