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

export type DeliveryProgramme = {
    id: string;
    timestamp: Date;
    creator: string;
    owner: string;
    title: string
    readonly name: string;
    alias?: string;
    description: string;
    finance_code?: string;
    arms_length_body: string;
    delivery_programme_code: number;
    url?: string;
}