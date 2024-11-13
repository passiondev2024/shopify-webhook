const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

app.post('/webhook', async (req, res) => {
    const orderData = req.body;

    // Extract customer info and the passcode from the order  
    const orderId = orderData.id;
    const passcode = orderData.shipping_address.company ? orderData.shipping_address.company : 'CollegeV';
    console.log('----------passcode----------------', passcode);

    if (!passcode) {
        return res.sendStatus(400); // Bail if passcode can't be found.  
    }

    // Add tag based on the passcode to the order  
    try {
        await addTagToOrder(orderId, passcode);
        res.sendStatus(200);
    } catch (error) {
        console.error('Error tagging order:', error);
        res.sendStatus(500);
    }
});

const addTagToOrder = async (orderId, passcode) => {
    const order = await getOrderById(orderId);
    let newTags = '';

    if (order.tags) {
        const currentTags = order.tags.split(',').map(tag => tag.trim());
        if (!currentTags.includes(passcode)) {
            currentTags.push(passcode);
            newTags = currentTags.join(',');
        } else {
            newTags = order.tags; // If the passcode tag already exists, keep the existing tags  
        }
    } else {
        newTags = passcode;
    }

    await axios({
        method: 'put',
        url: `https://schoolmoi-et-marie.myshopify.com/admin/api/2024-10/orders/${orderId}.json`,
        headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': process.env.SHOPIFY_API_ACCESS_TOKEN,
        },
        data: {
            order: {
                id: orderId,
                tags: newTags,
            },
        },
    });
};

const getOrderById = async (orderId) => {
    const response = await axios({
        method: 'get',
        url: `https://schoolmoi-et-marie.myshopify.com/admin/api/2024-10/orders/${orderId}.json`,
        headers: {
            'X-Shopify-Access-Token': process.env.SHOPIFY_API_ACCESS_TOKEN,
        },
    });

    return response.data.order;
};

// Start the server  
app.listen(3000, () => {
    console.log('Server is listening on port 3000');
});