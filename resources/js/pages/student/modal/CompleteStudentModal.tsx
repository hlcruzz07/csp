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
import { AsteriskIcon } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { FormEvent, FormEventHandler, useState } from 'react';
import { ReactFormState } from 'react-dom/client';
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
                                                                        ' — no counselor currently available for this college'}
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
                            <h4 className="font-medium">
                                Privacy & Data Usage Consent
                            </h4>

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
                                        setData(
                                            'consent_given',
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
                        <Button
                            type="submit"
                            disabled={processing}
                            // disabled={
                            //     !data.college_id ||
                            //     !data.consent_given ||
                            //     !data.crisis_given
                            // }
                        >
                            Continue
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
