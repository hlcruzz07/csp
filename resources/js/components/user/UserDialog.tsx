import { useForm } from '@inertiajs/react';
import { Eye, EyeOff, ImagePlus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { Spinner } from '@/components/ui/spinner';
import { useInitials } from '@/hooks/use-initials';
import { normalizeName, resolveAvatarUrl } from '@/lib/utils';
import { createAccount, updateUser } from '@/routes';

export type ManagedUser = {
    id: number;
    uuid: string;
    name: string | null;
    pseudonym: string | null;
    email: string;
    avatar: string | null;
    role: 'admin' | 'counselor' | 'student';
    is_anonymous: boolean;
    created_at: string;
};

interface UserDialogProps {
    // null = create a new admin account, otherwise edit this user
    user: ManagedUser | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSaved: () => void;
}

const MAX_AVATAR_MB = 2;

export default function UserDialog({
    user,
    open,
    onOpenChange,
    onSaved,
}: UserDialogProps) {
    const isEdit = user !== null;
    const getInitials = useInitials();
    const fileRef = useRef<HTMLInputElement | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);

    const { data, setData, post, processing, errors, clearErrors, transform } =
        useForm({
            name: '',
            email: '',
            password: '',
            avatar: null as File | null,
        });

    // Reset the form every time the dialog opens (or switches to another user)
    useEffect(() => {
        if (!open) return;

        setData({
            name: user?.name ?? '',
            email: user?.email ?? '',
            password: '',
            avatar: null,
        });
        clearErrors();
        setShowPassword(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, user?.id]);

    // Local preview for a newly chosen picture
    useEffect(() => {
        if (!data.avatar) {
            setPreview(null);
            return;
        }

        const url = URL.createObjectURL(data.avatar);
        setPreview(url);

        return () => URL.revokeObjectURL(url);
    }, [data.avatar]);

    const handleAvatar = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > MAX_AVATAR_MB * 1024 * 1024) {
            toast.error(`Image must be ${MAX_AVATAR_MB}MB or smaller`);
            e.target.value = '';
            return;
        }

        setData('avatar', file);
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        if (processing) return;

        const options = {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                onOpenChange(false);
                onSaved();
            },
        };

        if (isEdit && user) {
            // Only send what actually changed/was filled in
            transform((d) => {
                const payload: Record<string, unknown> = {
                    name: d.name,
                    email: d.email,
                };
                if (d.password) payload.password = d.password;
                if (d.avatar) payload.avatar = d.avatar;
                return payload;
            });

            post(updateUser(user.id).url, options);
            return;
        }

        transform((d) => {
            const payload: Record<string, unknown> = {
                name: d.name,
                email: d.email,
                password: d.password,
            };
            if (d.avatar) payload.avatar = d.avatar;
            return payload;
        });
        post(createAccount().url, options);
    };

    const displayName = user?.name
        ? normalizeName(user.name)
        : (user?.pseudonym ?? '');

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {isEdit ? 'Edit user' : 'Add admin account'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEdit
                            ? 'Update the name, email, password or profile picture.'
                            : 'Creates a new administrator account.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="space-y-4">
                    <div className="flex items-center gap-4">
                        <Avatar className="size-16 overflow-hidden rounded-full">
                            <AvatarImage
                                src={preview ?? resolveAvatarUrl(user?.avatar)}
                                alt={displayName || data.name}
                                className="object-cover"
                            />
                            <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                                {getInitials(displayName || data.name)}
                            </AvatarFallback>
                        </Avatar>

                        <div className="space-y-1">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => fileRef.current?.click()}
                            >
                                <ImagePlus className="size-4" />
                                {data.avatar
                                    ? 'Choose another'
                                    : isEdit
                                      ? 'Change picture'
                                      : 'Upload picture'}
                            </Button>
                            <p className="text-xs text-muted-foreground">
                                JPG, PNG or WEBP, up to {MAX_AVATAR_MB}MB.
                            </p>
                            {errors.avatar && (
                                <p className="text-xs text-destructive">
                                    {errors.avatar}
                                </p>
                            )}
                        </div>

                        <input
                            ref={fileRef}
                            type="file"
                            hidden
                            accept=".jpg,.jpeg,.png,.webp"
                            onChange={handleAvatar}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="user-name">Name</Label>
                        <Input
                            id="user-name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder={
                                isEdit && user?.role === 'admin'
                                    ? 'Optional for administrators'
                                    : 'Full name'
                            }
                            maxLength={50}
                            required={!isEdit}
                            autoComplete="off"
                        />
                        {errors.name && (
                            <p className="text-xs text-destructive">
                                {errors.name}
                            </p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="user-email">Email</Label>
                        <Input
                            id="user-email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="name@example.com"
                            autoComplete="off"
                        />
                        {errors.email && (
                            <p className="text-xs text-destructive">
                                {errors.email}
                            </p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="user-password">
                            {isEdit ? 'New password' : 'Password'}
                        </Label>
                        <div className="relative">
                            <Input
                                id="user-password"
                                type={showPassword ? 'text' : 'password'}
                                value={data.password}
                                onChange={(e) =>
                                    setData('password', e.target.value)
                                }
                                placeholder={
                                    isEdit
                                        ? 'Leave blank to keep the current password'
                                        : 'At least 8 characters'
                                }
                                autoComplete="new-password"
                                className="pr-10"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute top-0 right-0 size-9 text-muted-foreground"
                                onClick={() => setShowPassword((v) => !v)}
                                title={
                                    showPassword
                                        ? 'Hide password'
                                        : 'Show password'
                                }
                            >
                                {showPassword ? (
                                    <EyeOff className="size-4" />
                                ) : (
                                    <Eye className="size-4" />
                                )}
                            </Button>
                        </div>
                        {errors.password && (
                            <p className="text-xs text-destructive">
                                {errors.password}
                            </p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing && <Spinner />}
                            {isEdit ? 'Save changes' : 'Create account'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
