// src/index.ts
import type { MyRecord, UpdatedRecord, ValidationResult, UpdateResult } from './types.ts';

// Helper for deep copying objects, correctly handling Date objects
function deepCopy<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    if (obj instanceof Date) {
        // Crucial: Create a new Date object from the original's time
        return new Date(obj.getTime()) as T;
    }
    if (Array.isArray(obj)) {
        return (obj as any[]).map(item => deepCopy(item)) as T;
    }
    // Handle plain objects
    const copy = {} as T;
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            (copy as any)[key] = deepCopy((obj as any)[key]);
        }
    }
    return copy;
}

/**
 * Validates a record object against predefined rules.
 * @param record The record object to validate.
 * @returns A ValidationResult indicating success or failure with errors.
 */
export function validateRecord(record: any): ValidationResult {
    const errors: string[] = [];

    if (typeof record !== 'object' || record === null) {
        errors.push('Record must be an object.');
        return { isValid: false, errors };
    }

    // Validate ID
    if (typeof record.id !== 'string' || record.id.trim().length === 0) {
        errors.push('ID is required and must be a string.');
    }

    // Validate Name
    if (typeof record.name !== 'string' || record.name.trim().length === 0) {
        errors.push('Name is required and must be a non-empty string.');
    }

    // Validate Price
    if (typeof record.price !== 'number' || isNaN(record.price)) {
        errors.push('Price is required and must be a number.');
    } else {
        // Round price to two decimal places
        record.price = parseFloat(record.price.toFixed(2));
    }

    // Validate Tags
    if (!Array.isArray(record.tags)) {
        errors.push('Tags are required and must be an array.');
    } else {
        if (record.tags.some((tag: any) => typeof tag !== 'string' || !/^[a-zA-Z0-9]+$/.test(tag))) {
            errors.push('All tags must be alphanumeric strings.');
        }
    }

    if (errors.length > 0) {
        return { isValid: false, errors };
    }

    return { isValid: true, record: record as MyRecord };
}

/**
 * Updates an existing record with new data, performing validation.
 * @param currentRecord The original record object.
 * @param updates The partial record object with updates.
 * @returns An UpdateResult indicating success or failure with errors.
 */
export function updateRecordWithValidation(currentRecord: MyRecord, updates: UpdatedRecord): UpdateResult {
    // Create a deep copy to avoid modifying the original record
    // Use the custom deepCopy function to preserve Date objects
    const updatedRecord: MyRecord = deepCopy(currentRecord);

    // Always update `updatedAt` as the record is being "updated" (even if no fields change)
    updatedRecord.updatedAt = new Date(Date.now());

    for (const key in updates) {
        if (Object.prototype.hasOwnProperty.call(updates, key)) {
            const newValue = (updates as any)[key];
            const oldValue = (updatedRecord as any)[key];

            // Special handling for price to compare rounded values
            if (key === 'price' && typeof newValue === 'number' && typeof oldValue === 'number') {
                if (parseFloat(newValue.toFixed(2)) !== parseFloat(oldValue.toFixed(2))) {
                    (updatedRecord as any)[key] = newValue;
                }
            } else if (key === 'tags' && Array.isArray(newValue) && Array.isArray(oldValue)) {
                // Compare arrays by content (after sorting for consistent comparison)
                // Create copies before sorting to avoid mutating original arrays if they were passed by reference
                const sortedNewValue = [...newValue].sort();
                const sortedOldValue = [...oldValue].sort();
                if (JSON.stringify(sortedNewValue) !== JSON.stringify(sortedOldValue)) {
                    (updatedRecord as any)[key] = newValue;
                }
            }
            else if (newValue !== oldValue) {
                (updatedRecord as any)[key] = newValue;
            }
        }
    }

    const validationResult = validateRecord(updatedRecord);

    if (!validationResult.isValid) {
        return { isValid: false, errors: validationResult.errors };
    }

    return { isValid: true, record: validationResult.record };
}