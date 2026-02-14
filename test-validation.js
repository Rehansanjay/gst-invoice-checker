const fetch = require('node-fetch');

async function testValidation() {
    const baseUrl = 'http://localhost:3000/api';

    console.log('--- Testing Quick Check Validation ---');
    try {
        // invalid data
        const res = await fetch(`${baseUrl}/quick-check`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                invoiceData: { invoiceNumber: '' }, // Missing required fields
                guestEmail: 'not-an-email'
            })
        });
        const data = await res.json();
        console.log('Status:', res.status);
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (e) { console.error(e); }

    console.log('\n--- Testing Purchase Package Validation ---');
    try {
        const res = await fetch(`${baseUrl}/purchase-package`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: 'not-a-uuid',
                packageType: 'invalid_pack'
            })
        });
        const data = await res.json();
        console.log('Status:', res.status);
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (e) { console.error(e); }
}

testValidation();
