import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { CollegeProps } from '@/types/entities';
import { useForm, usePage } from '@inertiajs/react';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    AsteriskIcon,
    DatabaseIcon,
    EyeIcon,
    LockIcon,
    ServerIcon,
    ShieldCheckIcon,
} from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { FormEvent, useState } from 'react';
import InputError from '@/components/input-error';
import { studentComplete } from '@/routes';
import { handleErrors } from '@/lib/utils';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

type PageProps = {
    colleges: CollegeProps[];
};

export default function CompleteStudentModal() {
    const { data, setData, processing, errors, post } = useForm({
        college_id: null as null | number,
        consent_given: false as boolean,
        crisis_given: false as boolean,
        is_anonymous: false as boolean,
    });

    const { colleges } = usePage<PageProps>().props;

    // Privacy policy dialog state.
    // Two entry points open the same dialog: checking the consent checkbox
    // (gates actual consent behind reading it) and the standalone "View
    // Privacy Policy" link (view only, does not touch consent_given).
    const [policyOpen, setPolicyOpen] = useState(false);
    const [policyMode, setPolicyMode] = useState<'confirm' | 'view'>('view');

    const handleConsentCheckboxChange = (checked: boolean) => {
        if (checked) {
            setPolicyMode('confirm');
            setPolicyOpen(true);
        } else {
            setData('consent_given', false);
        }
    };

    const handleAgreeToPolicy = () => {
        setData('consent_given', true);
        setPolicyOpen(false);
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (processing) return;

        post(studentComplete().url, {
            preserveScroll: true,

            onError: (err) => {
                handleErrors(err);
            },
        });
    };

    return (
        <Dialog open={true}>
            <DialogContent showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle>Complete Your Student Profile</DialogTitle>

                    <DialogDescription>
                        Before accessing the platform, please complete the
                        required information below and review the privacy,
                        consent, and support guidelines. Your responses help us
                        provide a safe and secure experience.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="no-scrollbar -mx-4 mt-2 mb-5 max-h-[50vh] space-y-5 overflow-y-auto px-4">
                        <div className="grid gap-3">
                            <Label>
                                College <AsteriskIcon color="red" size={12} />
                            </Label>
                            <Select
                                value={data.college_id?.toString()}
                                onValueChange={(value) =>
                                    setData('college_id', Number(value))
                                }
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Choose an option" />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectGroup>
                                        {colleges.map((item) => {
                                            const fullText = `${item.code} - ${item.name}`;
                                            const isDisabled =
                                                !item.has_counselor;

                                            return (
                                                <SelectItem
                                                    key={item.id}
                                                    value={item.id.toString()}
                                                    disabled={isDisabled}
                                                >
                                                    <TooltipProvider
                                                        delayDuration={200}
                                                    >
                                                        <Tooltip>
                                                            <TooltipTrigger
                                                                asChild
                                                            >
                                                                <span className="flex w-full items-center justify-between gap-2">
                                                                    <span className="block max-w-max truncate">
                                                                        {fullText.length >
                                                                        35
                                                                            ? fullText.slice(
                                                                                  0,
                                                                                  35,
                                                                              ) +
                                                                              '...'
                                                                            : fullText}
                                                                    </span>

                                                                    {isDisabled && (
                                                                        <span className="text-xs text-muted-foreground italic">
                                                                            Unavailable
                                                                        </span>
                                                                    )}
                                                                </span>
                                                            </TooltipTrigger>

                                                            <TooltipContent>
                                                                <p>
                                                                    {fullText}
                                                                    {isDisabled &&
                                                                        ' (no counselor currently available for this college)'}
                                                                </p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>

                            <InputError message={errors['college_id']} />
                        </div>

                        {/* Privacy Consent */}
                        <div className="space-y-3 rounded-lg border p-4">
                            <div className="flex items-center justify-between gap-2">
                                <h4 className="font-medium">
                                    Privacy & Data Usage Consent
                                </h4>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setPolicyMode('view');
                                        setPolicyOpen(true);
                                    }}
                                    className="cursor-pointer text-xs font-medium text-primary underline-offset-2 hover:underline"
                                >
                                    View Privacy Policy
                                </button>
                            </div>

                            <p className="text-sm text-muted-foreground">
                                I have read and understood the Privacy Policy
                                and consent to the collection, processing, and
                                storage of my data for the purposes of providing
                                student support services.
                            </p>

                            <div className="flex items-start gap-2">
                                <Checkbox
                                    id="privacy-consent"
                                    checked={data.consent_given}
                                    onCheckedChange={(checked) =>
                                        handleConsentCheckboxChange(
                                            checked === true,
                                        )
                                    }
                                />
                                <Label htmlFor="privacy-consent">
                                    I agree to the Privacy Policy and Data Usage
                                    Guidelines.
                                </Label>
                            </div>

                            <InputError message={errors['consent_given']} />
                        </div>

                        {/* Crisis Disclaimer */}
                        <div className="space-y-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4">
                            <h4 className="font-medium">
                                Crisis & Emergency Support Disclaimer
                            </h4>

                            <p className="text-sm text-muted-foreground">
                                This platform is intended for student support
                                and communication purposes only. It is not
                                designed to provide emergency, crisis, or
                                suicide intervention services. If you are
                                experiencing an immediate emergency, please
                                contact local emergency services or a crisis
                                hotline.
                            </p>

                            <div className="flex items-start gap-2">
                                <Checkbox
                                    id="crisis-consent"
                                    checked={data.crisis_given}
                                    onCheckedChange={(checked) =>
                                        setData(
                                            'crisis_given',
                                            checked === true,
                                        )
                                    }
                                />
                                <Label htmlFor="crisis-consent">
                                    I understand that this platform is not an
                                    emergency or crisis intervention service.
                                </Label>
                            </div>

                            <InputError message={errors['crisis_given']} />
                        </div>

                        {/* Identity Preference */}
                        <div className="grid gap-3">
                            <Label>
                                Identity Preference
                                <AsteriskIcon color="red" size={12} />
                            </Label>

                            <RadioGroup
                                value={data.is_anonymous ? 'anonymous' : 'real'}
                                onValueChange={(value) =>
                                    setData(
                                        'is_anonymous',
                                        value === 'anonymous',
                                    )
                                }
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem
                                        value="real"
                                        id="real-name"
                                    />
                                    <Label htmlFor="real-name">
                                        Use my real profile name
                                    </Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem
                                        value="anonymous"
                                        id="anonymous"
                                    />
                                    <Label htmlFor="anonymous">
                                        Remain anonymous (a pseudonym will be
                                        generated)
                                    </Label>
                                </div>
                            </RadioGroup>

                            <p className="text-sm text-muted-foreground">
                                When anonymity is enabled, practitioners will
                                only see your generated pseudonym instead of
                                your real name. You may switch between anonymous
                                and identified modes at any time through your
                                account settings.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={processing}>
                            Continue
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>

            {/* Privacy Policy dialog. Nested Dialog, controlled independently
                of the parent "Complete Your Student Profile" dialog. In
                "confirm" mode (opened by checking the consent checkbox), the
                checkbox is only actually set to true once the student clicks
                "I Agree" here; closing or cancelling leaves consent unchecked.
                In "view" mode (opened via the standalone link), it is read only
                and never touches consent_given. */}
            <Dialog open={policyOpen} onOpenChange={setPolicyOpen}>
                <DialogContent className="max-h-[85vh] overflow-hidden sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ShieldCheckIcon className="size-5 text-primary" />
                            Privacy Policy
                        </DialogTitle>
                        <DialogDescription>
                            How this counseling support platform collects,
                            processes, stores, uses, and controls access to your
                            information.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="no-scrollbar max-h-[55vh] space-y-5 overflow-y-auto pr-1">
                        <section className="space-y-1.5">
                            <h5 className="flex items-center gap-1.5 text-sm font-semibold">
                                <DatabaseIcon className="size-4 text-primary" />
                                Data Collection
                            </h5>
                            <p className="text-sm text-muted-foreground">
                                We collect the information you provide when
                                completing your profile (college department,
                                identity preference), the messages, category
                                tags, and attachments you send through the
                                platform, and basic account details such as your
                                registered email. If you choose to remain
                                anonymous, a generated pseudonym is used in
                                place of your real name for all counselor facing
                                displays.
                            </p>
                        </section>

                        <section className="space-y-1.5">
                            <h5 className="flex items-center gap-1.5 text-sm font-semibold">
                                <ServerIcon className="size-4 text-primary" />
                                Data Processing
                            </h5>
                            <p className="text-sm text-muted-foreground">
                                Your information is processed strictly to route
                                your concern to the guidance counselor assigned
                                to your college, to display your conversation
                                and case history to that counselor, and to
                                generate delivery and read status indicators.
                            </p>
                        </section>

                        <section className="space-y-1.5">
                            <h5 className="flex items-center gap-1.5 text-sm font-semibold">
                                <LockIcon className="size-4 text-primary" />
                                Data Storage & Security
                            </h5>
                            <p className="text-sm text-muted-foreground">
                                Messages are stored in encrypted form on the
                                application's infrastructure. Administrative
                                safeguards restrict decrypted access to
                                authorized system processes only, reducing the
                                risk of data leaks or exposure to parties
                                outside the platform.
                            </p>
                        </section>

                        <section className="space-y-1.5">
                            <h5 className="flex items-center gap-1.5 text-sm font-semibold">
                                <ShieldCheckIcon className="size-4 text-primary" />
                                Data Usage
                            </h5>
                            <p className="text-sm text-muted-foreground">
                                Your data is used solely to provide student
                                support services: connecting you with your
                                assigned counselor, maintaining a continuous
                                case record, and improving how guidance staff
                                organize and respond to concerns. It is not used
                                for advertising, sold to third parties, or
                                shared outside the university's guidance and
                                counseling function.
                            </p>
                        </section>

                        <section className="space-y-1.5">
                            <h5 className="flex items-center gap-1.5 text-sm font-semibold">
                                <EyeIcon className="size-4 text-primary" />
                                Access Controls
                            </h5>
                            <p className="text-sm text-muted-foreground">
                                Access follows a strict need to know model.
                                Students can only see their own case, and
                                counselors can only see students assigned to
                                their department. Counselor accounts cannot be
                                self registered; they are manually created and
                                verified by administrative staff to prevent
                                unauthorized access. If you enable anonymity,
                                your real identity is withheld from the
                                counselor's view, and only your pseudonym and
                                full message history are shown.
                            </p>
                        </section>

                        <section className="space-y-1.5 rounded-md border bg-muted/40 p-3">
                            <h5 className="text-sm font-semibold">
                                Your Rights
                            </h5>
                            <p className="text-sm text-muted-foreground">
                                Consistent with the Data Privacy Act of 2012 (RA
                                10173), you have the right to be informed about
                                how your data is processed, to access and
                                correct your personal information, and to
                                withdraw consent at any time. Withdrawing
                                consent may limit your ability to use certain
                                platform features. This platform is an
                                asynchronous support tool and is not a
                                substitute for emergency or crisis intervention
                                services.
                            </p>
                        </section>
                    </div>

                    <DialogFooter>
                        {policyMode === 'confirm' ? (
                            <>
                                <DialogClose asChild>
                                    <Button type="button" variant="outline">
                                        Cancel
                                    </Button>
                                </DialogClose>
                                <Button
                                    type="button"
                                    onClick={handleAgreeToPolicy}
                                >
                                    I Agree
                                </Button>
                            </>
                        ) : (
                            <DialogClose asChild>
                                <Button type="button">Close</Button>
                            </DialogClose>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Dialog>
    );
}
