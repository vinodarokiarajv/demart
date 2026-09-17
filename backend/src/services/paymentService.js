const Stripe = require("stripe");

const config = require("../config");

const stripe = new Stripe(config.stripe.secretKey);

async function createCheckoutSession({
    order,
    items,
    customerEmail
}) {
    const lineItems = items.map((item) => ({
        price_data: {
            currency: "eur",
            product_data: {
                name: item.productName || `Product ${item.productId}`
            },
            unit_amount: Math.round(
                Number(item.unitPrice) * 100
            )
        },
        quantity: item.quantity
    }));

    if (Number(order.shipping_amount) > 0) {
        lineItems.push({
            price_data: {
                currency: "eur",
                product_data: {
                    name:
                        order.delivery_method === "express"
                            ? "Express Shipping"
                            : "Standard Shipping"
                },
                unit_amount: Math.round(
                    Number(order.shipping_amount) * 100
                )
            },
            quantity: 1
        });
    }

    return await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: lineItems,
        customer_email: customerEmail,
        client_reference_id: String(order.id),
        metadata: {
            orderId: String(order.id),
            userId: String(order.user_id)
        },
        success_url:
            `${config.frontendUrl}/pages/order-confirmation.html?orderId=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url:
            `${config.frontendUrl}/pages/checkout.html?payment=cancelled&orderId=${order.id}`,
        payment_method_types: ["card"]
    });
}

module.exports = {
    createCheckoutSession
};
