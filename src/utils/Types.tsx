export interface Message {
    author: User,
    content: string,
    read: boolean,
    sentAt: Date,
}

export interface User {
    id: number,
    username: string,
    email: string,
    created_at: Date,
}

export const dateTimeFormat = "MM/DD/YYYY h:mm A"