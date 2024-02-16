export type ArmsLengthBody = {
    id: string;
    created_at: Date;
    updated_at?: Date;
    creator: string;
    owner: string;
    readonly name: string;
    alias?: string;
    description: string;
    url?: string;
    title: string
}

export type DeliveryProgramme = {
    id: string; 
    created_at: Date;
    updated_at?: Date;
    programme_manager: string[];
    title: string;
    readonly name: string;
    alias?: string;
    description: string;
    finance_code?: string;
    arms_length_body: string;
    delivery_programme_code: string;
    url?: string;
}