// src/index.test.ts
import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { validateRecord, updateRecordWithValidation } from './index.ts'; // Assuming index.ts is where your functions are
import type { MyRecord, UpdatedRecord, ValidationResult, UpdateResult } from './types.ts';

// --- Global Setup for Date Mocking ---
test.before(() => {
    // Enable mocking for Date API
    // This ensures that new Date() and Date.now() return predictable values during tests.
    (mock as any).timers.enable({
        apis: ['Date'],
        now: 1678886400000 // Fixed timestamp: March 15, 2023 12:00:00 PM UTC
    });
});

test.after(() => {
    // Reset the Date mock after all tests are done
    (mock as any).timers.reset();
});

// Helper for deep copying objects, correctly handling Date objects.
// This is used within the test file to create independent copies of test data,
// especially for initialRecord, to ensure tests don't mutate shared state
// and to provide a clean 'expected' value for deepStrictEqual comparisons.
function deepCopyForTest<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    if (obj instanceof Date) {
        // Create a new Date object from the original's time to ensure deep copy
        return new Date(obj.getTime()) as T;
    }
    if (Array.isArray(obj)) {
        // Recursively deep copy array elements
        return (obj as any[]).map(item => deepCopyForTest(item)) as T;
    }
    // Handle plain objects: recursively deep copy properties
    const copy = {} as T;
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            (copy as any)[key] = deepCopyForTest((obj as any)[key]);
        }
    }
    return copy;
}


// --- Test Suite for validateRecord function ---
test('validateRecord function', async (context) => {
    // Example: A valid record for testing
    const validRecord: MyRecord = {
        id: 'rec123',
        name: 'Test Product',
        price: 99.99,
        tags: ['electronics', 'gadget'],
        createdAt: new Date('2023-01-01T00:00:00.000Z'),
        updatedAt: new Date('2023-01-01T00:00:00.000Z'),
    };

    await context.test('should return a valid record for correct input', () => {
        // Use deepCopyForTest to ensure the record passed to validateRecord is a fresh copy
        const recordToValidate = deepCopyForTest(validRecord);
        const result = validateRecord(recordToValidate);
        // Expect the result to be valid and the record to be identical to the validated one
        assert.deepStrictEqual(result, { isValid: true, record: recordToValidate });
    });

    await context.test('should return an error if record is not an object', () => {
        const result = validateRecord(null as any);
        assert.deepStrictEqual(result, { isValid: false, errors: ['Record must be an object.'] });
    });

    await context.test('should return an error if id is missing', () => {
        const invalidRecord = { ...validRecord, id: undefined };
        const result = validateRecord(invalidRecord as any);
        assert.deepStrictEqual(result, { isValid: false, errors: ['ID is required and must be a string.'] });
    });

    await context.test('should return an error if id is not a string', () => {
        const invalidRecord = { ...validRecord, id: 123 as any };
        const result = validateRecord(invalidRecord as any);
        assert.deepStrictEqual(result, { isValid: false, errors: ['ID is required and must be a string.'] });
    });

    await context.test('should return an error if id is an empty string', () => {
        const invalidRecord = { ...validRecord, id: '   ' }; // String with only spaces
        const result = validateRecord(invalidRecord as any);
        assert.deepStrictEqual(result, { isValid: false, errors: ['ID is required and must be a string.'] });
    });

    await context.test('should return an error if name is missing', () => {
        const invalidRecord = { ...validRecord, name: undefined };
        const result = validateRecord(invalidRecord as any);
        assert.deepStrictEqual(result, { isValid: false, errors: ['Name is required and must be a non-empty string.'] });
    });

    await context.test('should return an error if name is not a string', () => {
        const invalidRecord = { ...validRecord, name: 123 as any };
        const result = validateRecord(invalidRecord as any);
        assert.deepStrictEqual(result, { isValid: false, errors: ['Name is required and must be a non-empty string.'] });
    });

    await context.test('should return an error if name is an empty string', () => {
        const invalidRecord = { ...validRecord, name: '   ' }; // String with only spaces
        const result = validateRecord(invalidRecord);
        assert.deepStrictEqual(result, { isValid: false, errors: ['Name is required and must be a non-empty string.'] });
    });

    await context.test('should return an error if price is missing', () => {
        const invalidRecord = { ...validRecord, price: undefined };
        const result = validateRecord(invalidRecord as any);
        assert.deepStrictEqual(result, { isValid: false, errors: ['Price is required and must be a number.'] });
    });

    await context.test('should return an error if price is not a number', () => {
        const invalidRecord = { ...validRecord, price: 'invalid' as any };
        const result = validateRecord(invalidRecord);
        assert.deepStrictEqual(result, { isValid: false, errors: ['Price is required and must be a number.'] });
    });

    await context.test('should return an error if price is NaN', () => {
        const invalidRecord = { ...validRecord, price: NaN };
        const result = validateRecord(invalidRecord);
        assert.deepStrictEqual(result, { isValid: false, errors: ['Price is required and must be a number.'] });
    });

    await context.test('should return an error if tags are missing', () => {
        const invalidRecord = { ...validRecord, tags: undefined };
        const result = validateRecord(invalidRecord as any);
        assert.deepStrictEqual(result, { isValid: false, errors: ['Tags are required and must be an array.'] });
    });

    await context.test('should return an error if tags are not an array', () => {
        const invalidRecord = { ...validRecord, tags: 'not an array' as any };
        const result = validateRecord(invalidRecord);
        assert.deepStrictEqual(result, { isValid: false, errors: ['Tags are required and must be an array.'] });
    });

    await context.test('should return an error if any tag is not an alphanumeric string', () => {
        const invalidRecord = { ...validRecord, tags: ['valid', 'invalid!'] };
        const result = validateRecord(invalidRecord);
        assert.deepStrictEqual(result, { isValid: false, errors: ['All tags must be alphanumeric strings.'] });
    });

    await context.test('should correctly round price to two decimal places', () => {
        const recordWithLongPrice = { ...validRecord, price: 123.4567 };
        const result = validateRecord(recordWithLongPrice);
        const expectedRecord = { ...recordWithLongPrice, price: 123.46 };
        assert.deepStrictEqual(result, { isValid: true, record: expectedRecord });
    });

    await context.test('should return multiple errors if multiple fields are invalid', () => {
        const invalidRecord = {
            id: 123 as any, // Invalid ID type
            name: '',       // Empty name
            price: 'abc' as any, // Invalid price type
            tags: 'not an array' as any, // Invalid tags type
        };
        const result = validateRecord(invalidRecord);
        assert.deepStrictEqual(result, {
            isValid: false,
            errors: [
                'ID is required and must be a string.',
                'Name is required and must be a non-empty string.',
                'Price is required and must be a number.',
                'Tags are required and must be an array.',
            ],
        });
    });
});

// --- Test Suite for updateRecordWithValidation function ---
test('updateRecordWithValidation function', async (context) => {
    const initialRecord: MyRecord = {
        id: 'rec123',
        name: 'Original Product',
        price: 50.00,
        tags: ['old', 'product'],
        createdAt: new Date('2023-01-01T00:00:00.000Z'),
        updatedAt: new Date('2023-01-01T00:00:00.000Z'),
    };

    // This Date object will be the expected 'updatedAt' value due to the global mock.
    const mockedUpdatedAt = new Date(1678886400000);

    await context.test('should successfully update a record with valid changes', () => {
        const updates: UpdatedRecord = { name: 'Updated Product', price: 75.50 };
        const result = updateRecordWithValidation(initialRecord, updates);
        const expectedRecord: MyRecord = {
            ...initialRecord,
            name: 'Updated Product',
            price: 75.50,
            updatedAt: mockedUpdatedAt, // Expect the mocked Date object
        };
        assert.deepStrictEqual(result, { isValid: true, record: expectedRecord });
    });

    await context.test('should add new properties if provided in updates', () => {
        const updates: UpdatedRecord = { description: 'A new description' };
        const result = updateRecordWithValidation(initialRecord, updates);
        const expectedRecord: MyRecord = {
            ...initialRecord,
            description: 'A new description',
            updatedAt: mockedUpdatedAt, // Expect the mocked Date object
        };
        assert.deepStrictEqual(result, { isValid: true, record: expectedRecord });
    });

    await context.test('should return an error if updates lead to an invalid state (e.g., empty name)', () => {
        const updates: UpdatedRecord = { name: '' };
        const result = updateRecordWithValidation(initialRecord, updates);
        assert.deepStrictEqual(result, { isValid: false, errors: ['Name is required and must be a non-empty string.'] });
    });

    await context.test('should return an error if updates lead to an invalid state (e.g., invalid price)', () => {
        const updates: UpdatedRecord = { price: 'invalid' as any };
        const result = updateRecordWithValidation(initialRecord, updates);
        assert.deepStrictEqual(result, { isValid: false, errors: ['Price is required and must be a number.'] });
    });

    await context.test('should return an error if updates lead to an invalid state (e.g., invalid tag)', () => {
        const updates: UpdatedRecord = { tags: ['valid', 'invalid!'] };
        const result = updateRecordWithValidation(initialRecord, updates); // Pass updates here
        assert.deepStrictEqual(result, { isValid: false, errors: ['All tags must be alphanumeric strings.'] });
    });

    await context.test('should handle updates that do not change existing fields but are valid', () => {
        const updates: UpdatedRecord = { name: 'Original Product' }; // Same name, but valid
        const result = updateRecordWithValidation(initialRecord, updates);
        const expectedRecord: MyRecord = {
            ...initialRecord,
            name: 'Original Product', // Name remains the same
            updatedAt: mockedUpdatedAt, // Expect the mocked Date object
        };
        assert.deepStrictEqual(result, { isValid: true, record: expectedRecord });
    });

    await context.test('should correctly round updated price', () => {
        const updates: UpdatedRecord = { price: 123.4567 };
        const result = updateRecordWithValidation(initialRecord, updates);
        const expectedRecord: MyRecord = {
            ...initialRecord,
            price: 123.46,
            updatedAt: mockedUpdatedAt, // Expect the mocked Date object
        };
        assert.deepStrictEqual(result, { isValid: true, record: expectedRecord });
    });

    await context.test('should not modify the original record object', () => {
        // Create a deep copy of the initial record to compare against later
        const originalRecordCopy = deepCopyForTest(initialRecord);
        const updates: UpdatedRecord = { name: 'New Name' };
        // Call the function, but don't use its return value for this specific assertion
        updateRecordWithValidation(initialRecord, updates);
        // Assert that the original record object remains unchanged
        assert.deepStrictEqual(initialRecord, originalRecordCopy);
    });

    await context.test('should handle empty updates object', () => {
        const updates: UpdatedRecord = {};
        const result = updateRecordWithValidation(initialRecord, updates);
        const expectedRecord: MyRecord = {
            ...initialRecord,
            // Even with empty updates, updatedAt should be updated by the function
            updatedAt: mockedUpdatedAt,
        };
        assert.deepStrictEqual(result, { isValid: true, record: expectedRecord });
    });

    await context.test('should handle updates to tags array', () => {
        const updates: UpdatedRecord = { tags: ['new', 'tags'] };
        const result = updateRecordWithValidation(initialRecord, updates);
        const expectedRecord: MyRecord = {
            ...initialRecord,
            tags: ['new', 'tags'],
            updatedAt: mockedUpdatedAt, // Expect the mocked Date object
        };
        assert.deepStrictEqual(result, { isValid: true, record: expectedRecord });
    });

    await context.test('should not update tags if content is identical (order-independent)', () => {
        const initialTags = ['tag1', 'tag2'];
        // Create a record with specific tags for this test
        const recordWithTags: MyRecord = deepCopyForTest({ ...initialRecord, tags: initialTags });
        const updates: UpdatedRecord = { tags: ['tag2', 'tag1'] }; // Same tags, different order

        const result = updateRecordWithValidation(recordWithTags, updates);

        const expectedRecord: MyRecord = {
            ...recordWithTags,
            updatedAt: mockedUpdatedAt, // Expect the mocked Date object
        };

        assert.deepStrictEqual(result, { isValid: true, record: expectedRecord });

        // Also assert that the tags array itself is considered identical (order-independent check)
        // Note: deepStrictEqual for arrays checks order. If your updateRecordWithValidation
        // reorders tags, this specific assertion might need adjustment or a custom comparison.
        // Assuming it preserves order if content is identical.
        assert.deepStrictEqual(result.record?.tags, initialTags);
    });
});