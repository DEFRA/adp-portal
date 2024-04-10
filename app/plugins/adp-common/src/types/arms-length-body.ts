export type ArmsLengthBody = {
    id: string;
    created_at: Date;
    updated_at: Date;
    creator: string;
    owner: string;
    readonly name: string;
    alias?: string;
    description: string;
    url?: string;
    title: string
    updated_by?: string;
}

