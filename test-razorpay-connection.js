const Razorpay = require('razorpay');
const fs = require('fs');
const path = require('path');

// manually load .env.local
const envPath = path.resolve(__dirname, '.env.local');
const envConfig = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envConfig.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        envVars[key.trim()] = value.trim();
    }
});

const key_id = envVars['NEXT_PUBLIC_RAZORPAY_KEY_ID'];
const key_secret = envVars['RAZORPAY_KEY_SECRET'];

console.log('Testing Razorpay Connection...');
console.log('Key ID:', key_id ? 'Found' : 'Missing');
console.log('Key Secret:', key_secret ? 'Found' : 'Missing');

if (!key_id || !key_secret) {
    console.error('ERROR: Missing keys in .env.local');
    process.exit(1);
}

const razorpay = new Razorpay({
    key_id: key_id,
    key_secret: key_secret,
});

async function testOrder() {
    try {
        console.log('Attempting to create a test order...');
        const order = await razorpay.orders.create({
            amount: 100, // ₹1
            currency: 'INR',
            receipt: 'test_receipt_001',
        });
        console.log('SUCCESS: Order created!');
        console.log('Order ID:', order.id);
        console.log('Status:', order.status);
    } catch (error) {
        console.error('FAILURE: Could not create order.');
        console.error('Error:', error);
    }
}

testOrder();
