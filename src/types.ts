// src/types.ts
export interface MyRecord {
    id: string;
    name: string;
    price: number;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
    [key: string]: any; // Allow for additional properties like 'description'
}

export type UpdatedRecord = Partial<Omit<MyRecord, 'id' | 'createdAt'>> & {
    [key: string]: any; // Allow for adding new properties
};

export interface ValidationResult {
    isValid: boolean;
    record?: MyRecord;
    errors?: string[];
}

export interface UpdateResult {
    isValid: boolean;
    record?: MyRecord;
    errors?: string[];
}