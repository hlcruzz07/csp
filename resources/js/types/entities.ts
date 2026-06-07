export type CollegeProps = {
    id: number;
    code: string;
    name: string;
};

export type UserProps = {
    id: number;
    uuid: string;
    email: string;
    name: string;
    is_anonymous: boolean;
    pseudonym: string;
    role: string;
};
