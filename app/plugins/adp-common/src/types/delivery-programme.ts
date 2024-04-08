export type DeliveryProgramme = {
    id: string; 
    created_at: Date;
    updated_at: Date;
    programme_managers: ProgrammeManager[];
    title: string;
    readonly name: string;
    alias?: string;
    description: string;
    finance_code?: string;
    arms_length_body_id: string;
    delivery_programme_code: string;
    url?: string;
    updated_by?: string;
}

export type ProgrammeManager = {
    id: string, 
    delivery_programme_id: string;
    aad_entity_ref_id: string;
    email: string;
    name: string;
}