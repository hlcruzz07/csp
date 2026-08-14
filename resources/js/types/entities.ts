export type CollegeProps = {
    id: number;
    code: string;
    name: string;
    has_counselor?: boolean;
    // ...whatever else is already here
};
export type UserProps = {
    id: number;
    avatar?: string;
    uuid: string;
    email: string;
    name: string;
    is_anonymous: boolean;
    pseudonym: string;
    role: string;
    assigned_college?: College;
    student_conversation?: StudentConversation;
};
export interface Message {
    id: number;
    category_id: number;
    content?: string;
    is_structured: boolean;
    sender_id: number;
    status: 'sent' | 'seen' | 'responded';
    created_at: string;
    updated_at: string;
    attachments?: Attachments[];
    category?: Categories;
    user?: UserProps;
}

export interface Notification {
    id: number;
    title: string;
    description: string;
    time: string;
}

export interface Attachments {
    id: number;
    message_id: number;
    file_url: string;
    created_at: string;
    updated_at: string;
}

export interface Categories {
    id: number;
    name: number;
    slug: string;
    description: string;
    created_at: string;
    updated_at: string;
}
export interface College {
    id: number;
    code: string;
    name: string;
    created_at: string;
    updated_at: string;
    laravel_through_key?: number;
}

export interface Counselor {
    id: number;
    uuid: string;
    name: string;
    pseudonym: string;
    email: string;
    avatar: string | null;
    role: 'counselor';
    is_anonymous: boolean;
    email_verified_at: string | null;
    two_factor_confirmed_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface StudentConversation {
    id: number;
    uuid: string;
    student_id: number;
    counselor_id: number;
    created_at: string;
    updated_at: string;
    counselor?: Counselor;
}

export interface Conversation {
    id: number;
    uuid: string;
    student_id: number;
    student: UserProps;
    unread_count: number;
    latest_message?: Message;
    counselor_id: number;
    created_at: string;
    updated_at: string;
}

export interface User {
    id: number;
    uuid: string;
    name: string;
    pseudonym: string;
    email: string;
    avatar: string | null;
    role: 'student';
    is_anonymous: boolean;
    email_verified_at: string | null;
    two_factor_confirmed_at: string | null;
    created_at: string;
    updated_at: string;
    assigned_college?: College;
    student_conversation?: StudentConversation;
}
