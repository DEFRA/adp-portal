export type ArmsLengthBody = {
    id: string;
    timestamp: Date;
    creator: string;
    owner: string;
    readonly name: string;
    short_name?: string;
    description: string;
    url?: string;
    title: string
}
