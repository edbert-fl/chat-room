export interface Message {
    author: User,
    content: string,
    read: boolean,
    sentAt: Date,
}

export interface User {
    id: number,
    name: string,
}

export const dateTimeFormat = "MM/DD/YYYY h:mm A"