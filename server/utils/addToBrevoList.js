// server/utils/addToBrevoList.js

const axios = require('axios');

async function addToBrevoList(email) {
    const apiKey = process.env.BREVO_API_KEY;
    const listId = 6;  // Replace with your actual Brevo list ID for the 1-Week Program.

    const data = {
        email: email,
        listIds: [listId],
        updateEnabled: true
    };

    try {
        const response = await axios.post(
            'https://api.brevo.com/v3/contacts',
            data,
            {
                headers: {
                    'api-key': apiKey,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log(`✅ Brevo: Added ${email} to Free 1-Week Program list`);
    } catch (error) {
        console.error(`❌ Brevo: Failed to add ${email}`, error.response?.data || error.message);
    }
}

module.exports = addToBrevoList;
