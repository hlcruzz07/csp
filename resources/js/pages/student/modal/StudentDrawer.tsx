import InputError from '@/components/input-error';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useInitials } from '@/hooks/use-initials';
import { handleErrors, normalizeName, resolveAvatarUrl } from '@/lib/utils';
import { useForm, usePage } from '@inertiajs/react';
import {
    CameraIcon,
    EllipsisVerticalIcon,
    InfoIcon,
    Loader2Icon,
    LogOutIcon,
    SaveIcon,
    XIcon,
} from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import ManagePasskeys from '@/components/manage-passkeys';
import { Checkbox } from '@/components/ui/checkbox';
import { FormEvent, useRef, useState } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { counselorUpdate, studentUpdateProfile } from '@/routes';
import PasswordInput from '@/components/password-input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { LogoutModal } from './LogoutModal';
import AppearanceTabs from '@/components/appearance-tabs';
interface StudentDrawerProps {
    onSave?: () => void;
}
export function StudentDrawer({ onSave }: StudentDrawerProps) {
    const getInitials = useInitials();
    const { auth } = usePage<any>().props;
    const isStudent = auth.user.role === 'student';

    const formRef = useRef<HTMLFormElement>(null);
    const defaultValues = {
        avatar: null as null | File,
        pseudonym: auth.user?.pseudonym ?? '',
        name: auth.user?.name ?? '',
        email: auth.user?.email ?? '',
        is_anonymous: auth.user?.is_anonymous ?? false,
        new_password: '',
    };
    const { data, setData, errors, processing, post, clearErrors, setError } =
        useForm(defaultValues);

    const onCancel = () => {
        setData(defaultValues);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }

        if (previewUrlRef.current) {
            URL.revokeObjectURL(previewUrlRef.current);
            previewUrlRef.current = null;
        }

        clearErrors();
    };
    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (processing) return;

        if (isStudent) {
            post(studentUpdateProfile().url, {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => {
                    setData((data) => ({
                        ...data,
                        new_password: '',
                    }));
                    if (onSave) onSave;
                    setOpenDrawer(false);
                },
                onError: (err) => {
                    handleErrors(err);
                },
            });

            return;
        }

        post(counselorUpdate().url, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setData((data) => ({
                    ...data,
                    new_password: '',
                }));
                if (onSave) onSave;
                setOpenDrawer(false);
            },
            onError: (err) => {
                handleErrors(err);
            },
        });
    };

    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const previewUrlRef = useRef<string | null>(null);

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };
    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 2MB limit (matches your backend max:2048)
        const MAX_SIZE = 2 * 1024 * 1024;

        // allowed types
        const allowedTypes = ['image/jpeg', 'image/png'];

        // ❌ validate type
        if (!allowedTypes.includes(file.type)) {
            toast.error('Only JPG and PNG images are allowed.');
            setError('avatar', 'Only JPG and PNG images are allowed.');
            e.target.value = '';
            return;
        }

        // ❌ validate size
        if (file.size > MAX_SIZE) {
            toast.error('Image must not exceed 2MB.');
            setError('avatar', 'Image must not exceed 2MB.');
            e.target.value = '';
            return;
        }

        // cleanup previous preview
        if (previewUrlRef.current) {
            URL.revokeObjectURL(previewUrlRef.current);
        }

        const url = URL.createObjectURL(file);
        previewUrlRef.current = url;

        setData('avatar', file);
        setError('avatar', '');
    };

    const avatarPreview = data.avatar
        ? previewUrlRef.current
        : resolveAvatarUrl(auth.user?.avatar);

    const [openLogout, setOpenLogout] = useState(false);
    const [openDrawer, setOpenDrawer] = useState(false);

    return (
        <>
            <LogoutModal open={openLogout} setOpen={setOpenLogout} />
            <Drawer
                open={openDrawer}
                direction="right"
                onOpenChange={(open) => {
                    setOpenDrawer(open);
                    if (!open) {
                        onCancel();
                    }
                }}
            >
                <DrawerTrigger asChild>
                    <Button
                        variant={'outline'}
                        type="button"
                        className="cursor-pointer"
                        size={'sm'}
                    >
                        <EllipsisVerticalIcon />
                    </Button>
                </DrawerTrigger>
                <DrawerContent>
                    <DrawerHeader>
                        <DrawerTitle>Student Profile</DrawerTitle>
                        <DrawerDescription className="text-xs md:text-sm">
                            Manage your profile and view information related to
                            your counseling services.
                        </DrawerDescription>
                    </DrawerHeader>
                    <form
                        ref={formRef}
                        className="no-scrollbar overflow-y-auto px-4"
                        onSubmit={handleSubmit}
                    >
                        <div className="flex items-center justify-center">
                            <AppearanceTabs />
                        </div>
                        <div className="mt-5 flex flex-col items-center gap-3">
                            <div className="relative">
                                <Avatar className="size-20 overflow-hidden rounded-full md:size-40">
                                    <AvatarImage
                                        src={avatarPreview ?? undefined}
                                        alt={normalizeName(auth.user?.name)}
                                        className="object-cover"
                                    />
                                    <AvatarFallback className="rounded-full bg-neutral-200 text-black md:text-xl dark:bg-neutral-700 dark:text-white">
                                        {getInitials(
                                            normalizeName(auth.user?.name) ??
                                                '',
                                        )}
                                    </AvatarFallback>
                                </Avatar>

                                <Input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                                    hidden
                                    onChange={handleAvatarChange}
                                />

                                <Button
                                    type="button"
                                    onClick={handleAvatarClick}
                                    className="absolute right-0 bottom-0 size-7 cursor-pointer rounded-full lg:size-10"
                                    size="icon"
                                >
                                    <CameraIcon />
                                </Button>
                            </div>

                            <InputError message={errors['avatar']} />
                        </div>

                        <div className="mt-5 space-y-5">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Department</Label>

                                <Input
                                    value={auth.user?.assigned_college.name}
                                    disabled
                                    className="truncate"
                                />
                            </div>
                            {isStudent && (
                                <div className="grid gap-2">
                                    <Label
                                        htmlFor="pseudonym"
                                        className="flex items-center gap-1"
                                    >
                                        Pseudonym
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    size="icon"
                                                    className="size-5"
                                                    variant="secondary"
                                                    type="button"
                                                >
                                                    <InfoIcon className="size-3" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent
                                                align="end"
                                                className="max-w-xs"
                                            >
                                                <p>
                                                    A pseudonym is the name
                                                    displayed to counselors when
                                                    you choose to remain
                                                    anonymous. Your real
                                                    identity will be hidden, and
                                                    this pseudonym will be used
                                                    instead during conversations
                                                    and interactions within the
                                                    system.
                                                </p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </Label>

                                    <Input
                                        id="pseudonym"
                                        name="pseudonym"
                                        placeholder="Enter Pseudonym"
                                        value={data.pseudonym}
                                        onChange={(e) =>
                                            setData('pseudonym', e.target.value)
                                        }
                                    />

                                    <InputError message={errors.pseudonym} />
                                </div>
                            )}

                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>

                                <Input
                                    id="name"
                                    name="name"
                                    placeholder="Enter Name"
                                    disabled={!isStudent}
                                    value={data.name}
                                    onChange={(e) =>
                                        setData('name', e.target.value)
                                    }
                                />

                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>

                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="Enter Email"
                                    value={data.email}
                                    disabled={!isStudent}
                                    onChange={(e) =>
                                        setData('email', e.target.value)
                                    }
                                />

                                <InputError message={errors.email} />
                            </div>

                            {isStudent && (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="new_password">
                                            New Password
                                        </Label>

                                        <PasswordInput
                                            id="new_password"
                                            name="new_password"
                                            placeholder="Enter New Password"
                                            value={data.new_password}
                                            onChange={(e) =>
                                                setData(
                                                    'new_password',
                                                    e.target.value,
                                                )
                                            }
                                        />

                                        <InputError
                                            message={errors.new_password}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label
                                            htmlFor="is_anonymous"
                                            className="flex items-center gap-2"
                                        >
                                            <Checkbox
                                                id="is_anonymous"
                                                name="is_anonymous"
                                                checked={data.is_anonymous}
                                                onCheckedChange={(checked) =>
                                                    setData(
                                                        'is_anonymous',
                                                        Boolean(checked),
                                                    )
                                                }
                                            />
                                            Remain Anonymous
                                        </Label>

                                        <p className="text-sm text-muted-foreground">
                                            When enabled, your pseudonym will be
                                            displayed instead of your real name
                                            during counseling sessions.
                                        </p>

                                        <InputError
                                            message={errors.is_anonymous}
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </form>
                    <DrawerFooter>
                        <Button
                            onClick={() => formRef.current?.requestSubmit()}
                            type="submit"
                            disabled={processing}
                            className="grow"
                        >
                            {processing ? (
                                <>
                                    Saving <Spinner />
                                </>
                            ) : (
                                <>
                                    Save Changes <SaveIcon />
                                </>
                            )}
                        </Button>
                        <Button
                            type="button"
                            onClick={() => setOpenLogout(true)}
                            variant={'destructive'}
                        >
                            Logout <LogOutIcon />
                        </Button>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        </>
    );
}
