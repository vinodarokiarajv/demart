const aiService = require("../services/aiService");
const productService =
    require("../services/productService");
const orderService = require("../services/orderService");
const deliveryTrackingService =
    require("../services/deliveryTrackingService");

async function chat(req, res) {
    try {
        const { message, orderId } = req.body;

        if (
            !message ||
            typeof message !== "string" ||
            !message.trim()
        ) {
            return res.status(400).json({
                message: "AI message is required"
            });
        }

        let context = {
            products: [],
            order: null,
            items: [],
            tracking: null
        };

        const isProductQuestion =
            (orderId === undefined ||
            orderId === null) &&
            /product|products|price|prices|cost|costs|category|categories|rating|ratings|stock|available|availability|laptop|phone|monitor|mouse|keyboard|router|tablet/i.test(
                message
            );

        if (isProductQuestion) {
            const products =
                await productService.getAllProducts();

            const underPriceMatch =
                message.match(
                    /(?:under|below|less than)\s*[€]?\s*(\d+(?:[.,]\d{1,2})?)/i
                );

            let filteredProducts = products;

            if (underPriceMatch) {
                const maxPrice =
                    Number(
                        underPriceMatch[1].replace(",", ".")
                    );

                filteredProducts =
                    products.filter(function (product) {
                        return Number(product.price) < maxPrice;
                    });
            }

            context.products =
                filteredProducts.map(function (product) {
                    return {
                        name: product.name,
                        category: product.category,
                        price: product.price
                    };
                });
        }

        if (orderId !== undefined && orderId !== null) {
            const orderResult =
                await orderService.getOrderById(
                    orderId,
                    req.user.id
                );

            const order =
                orderResult.order;

            let latestTracking = null;

            if (order.delivery) {
                latestTracking =
                    await deliveryTrackingService
                        .getCustomerLatestTracking(
                            order.delivery.id,
                            req.user.id
                        );
            }

            context = {
                order: {
                    id: order.id,
                    status: order.status,
                    totalAmount: order.total_amount,
                    shippingAmount:
                        order.shipping_amount,
                    deliveryMethod:
                        order.delivery_method,
                    paymentStatus:
                        order.payment_status,
                    createdAt: order.created_at,
                    delivery: order.delivery
                        ? {
                            id: order.delivery.id,
                            status:
                                order.delivery.status
                        }
                        : null
                },
                items:
                    orderResult.items.map(
                        function (item) {
                            return {
                                productName:
                                    item.product_name,
                                quantity:
                                    item.quantity,
                                unitPrice:
                                    item.unit_price
                            };
                        }
                    ),
                tracking: latestTracking
                    ? {
                        status:
                            latestTracking.status,
                        description:
                            latestTracking.description,
                        createdAt:
                            latestTracking.created_at
                    }
                    : null
            };
        }

        const underPriceMatch =
            message.match(
                /(?:under|below|less than)\s*[€]?\s*(\d+(?:[.,]\d{1,2})?)/i
            );

        if (
            isProductQuestion &&
            underPriceMatch
        ) {
            const maxPrice =
                Number(
                    underPriceMatch[1].replace(",", ".")
                );

            const matchingProducts =
                context.products.filter(function (product) {
                    return Number(product.price) < maxPrice;
                });

            return res.json({
                message:
                    matchingProducts.length === 0
                        ? `No products under €${maxPrice.toFixed(2)} are available.`
                        : matchingProducts
                            .map(function (product) {
                                return `${product.name} — €${Number(product.price).toFixed(2)}`;
                            })
                            .join("\n"),
                model: "application-filter",
                provider: "demart"
            });
        }

        const prompt = [
            "You are the AI assistant built into the DeMart e-commerce application.",
            "You are responding inside DeMart, not as a general-purpose chatbot.",
            "",
            "The application has provided you with DEMART CONTEXT below.",
            "Treat that context as authoritative application data that you are allowed to use.",
            "You DO have access to the information contained in DEMART CONTEXT.",
            "",
            "Answer the user's question using only the supplied DEMART CONTEXT.",
            "DEMART CONTEXT is application data, not the user's question.",
            "Never describe, analyze, or summarize the context unless the user asks you to.",
            "Extract only the information needed to answer the user's question.",
            "For filtering questions, apply the requested condition to the supplied product data and return the matching products.",
            "Do not claim that you lack access to DeMart, the user's account, orders,",
            "delivery information, or retailer systems when the requested information",
            "is present in DEMART CONTEXT.",
            "Do not mention Amazon, eBay, or other unrelated retailers.",
            "Do not tell the user to check another website or their email when the answer",
            "can be obtained from DEMART CONTEXT.",
            "",
            "Product questions may be answered using the supplied product context.",
            "Only recommend or describe products that appear in the supplied product context.",
            "Preserve product prices and currency exactly as supplied.",
            "Do not invent product availability, ratings, prices, or specifications.",
            "",
            "Do not invent products, prices, order details, delivery information,",
            "customer information, or any other facts that are not present.",
            "Preserve all monetary values and currency exactly as supplied by DeMart.",
            "DeMart prices and order amounts are in EUR unless the supplied context explicitly states otherwise.",
            "Never convert EUR amounts to another currency.",
            "If the requested information is not present in DEMART CONTEXT,",
            "say clearly that the information is not available.",
            "Never reveal information belonging to another customer.",
            "Answer concisely and directly.",
            "",
            "USER QUESTION:",
            message.trim(),
            "",
            "DEMART CONTEXT:",
            JSON.stringify(context, null, 2)
        ].join("\n");

        const result =
            await aiService.generateResponse(
                prompt
            );

        return res.json({
            message: result.text,
            model: result.model,
            provider: result.provider
        });
    } catch (error) {
        console.error(
            "AI controller error:",
            error
        );

        if (error.message === "Order not found") {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        return res.status(503).json({
            message:
                "AI service is currently unavailable"
        });
    }
}

module.exports = {
    chat
};