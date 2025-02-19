export type Message = {
    id: string;
    content: string;
    role: 'assistant' | 'user';
    createdAt: Date;
};

export type ApiResponse = {
    message?: string;
    threadId?: string;
    error?: string;
};