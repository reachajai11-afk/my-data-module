// src/app.ts
import { validateRecord, updateRecordWithValidation } from "./index.js";
// --- Example Usage ---
// 1. Initial Valid Record
const validRecord = {
    id: 'prod-001',
    name: 'Premium Widget',
    price: 29.99,
    tags: ['widget', 'premium', 'electronics'],
    details: { weight: 0.5, color: 'blue' },
    quantity: 100,
    createdAt: new Date(), // Added missing property
    updatedAt: new Date(), // Added missing property
};
console.log('--- Initial Valid Record ---');
console.log('Record:', validRecord);
const validationResult = validateRecord(validRecord);
console.log('Validation Result:', validationResult);
// 2. Update with valid changes
console.log('\n--- Update 1: Valid Changes ---');
const updates1 = {
    name: 'Super Widget Pro',
    price: 35.50,
    tags: ['widget', 'pro', 'electronics', 'new'],
};
const result1 = updateRecordWithValidation(validRecord, updates1);
if (result1.isValid && result1.record) {
    console.log('Updated Record:', result1.record);
}
else {
    console.error('Error updating record:', result1.errors); // Corrected to .errors
}
// 3. Update with invalid changes (e.g., empty name)
console.log('\n--- Update 2: Invalid Name ---');
const updates2 = {
    name: '', // Invalid name
};
const result2 = updateRecordWithValidation(validRecord, updates2);
if (result2.isValid && result2.record) {
    console.log('Updated Record:', result2.record);
}
else {
    console.error('Error updating record:', result2.errors); // Corrected to .errors
}
// 4. Update with invalid changes (e.g., invalid price type)
console.log('\n--- Update 3: Invalid Price Type ---');
const updates3 = {
    price: 'forty', // Invalid price type
};
const result3 = updateRecordWithValidation(validRecord, updates3);
if (result3.isValid && result3.record) {
    console.log('Updated Record:', result3.record);
}
else {
    console.error('Error updating record:', result3.errors); // Corrected to .errors
}
// 5. Update with new custom property
console.log('\n--- Update 4: Add New Property ---');
const updates4 = {
    manufacturer: 'Acme Corp',
};
const result4 = updateRecordWithValidation(validRecord, updates4);
if (result4.isValid && result4.record) {
    console.log('Updated Record:', result4.record);
}
else {
    console.error('Error updating record:', result4.errors); // Corrected to .errors
}
// 6. Update with price that needs rounding
console.log('\n--- Update 5: Price Rounding ---');
const updates5 = {
    price: 123.45678,
};
const result5 = updateRecordWithValidation(validRecord, updates5);
if (result5.isValid && result5.record) {
    console.log('Updated Record:', result5.record);
}
else {
    console.error('Error updating record:', result5.errors); // Corrected to .errors
}
// 7. Demonstrate original record is not mutated
console.log('\n--- Original Record After Updates ---');
console.log('Original Record (should be unchanged):', validRecord);
