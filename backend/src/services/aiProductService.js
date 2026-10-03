const conversationStates = new Map();

function getState(userId) {
    if (!conversationStates.has(userId)) {
        conversationStates.set(userId, {
            topic: null,
            category: null,
            productType: null,
            priceFilter: null,
            lastResult: []
        });
    }

    return conversationStates.get(userId);
}

function resetState(userId) {
    conversationStates.delete(userId);
}

function normalize(value) {
    return String(value || "")
        .trim()
        .toLowerCase();
}

function extractPriceFilter(message) {
    const underMatch = message.match(
        /(?:under|below|less than)\s*[€]?\s*(\d+(?:[.,]\d{1,2})?)/i
    );

    if (underMatch) {
        return {
            operator: "under",
            value: Number(
                underMatch[1].replace(",", ".")
            )
        };
    }

    const overMatch = message.match(
        /(?:above|over|more than)\s*[€]?\s*(\d+(?:[.,]\d{1,2})?)/i
    );

    if (overMatch) {
        return {
            operator: "over",
            value: Number(
                overMatch[1].replace(",", ".")
            )
        };
    }

    return null;
}

function extractProductType(message) {
    const types = [
        "laptop",
        "phone",
        "monitor",
        "mouse",
        "keyboard",
        "router",
        "tablet",
        "headset",
        "camera",
        "gamepad",
        "storage"
    ];

    const lowerMessage = normalize(message);

    return types.find(function (type) {
        return lowerMessage.includes(type);
    }) || null;
}

function findCategory(message, products) {
    const lowerMessage = normalize(message);

    const categories = [
        ...new Set(
            products
                .map(function (product) {
                    return product.category;
                })
                .filter(Boolean)
        )
    ];

    return categories.find(function (category) {
        const normalizedCategory =
            normalize(category);

        return (
            lowerMessage === normalizedCategory ||
            new RegExp(
                `\\\\b${normalizedCategory.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}\\\\b`,
                "i"
            ).test(lowerMessage)
        );
    }) || null;
}

function isFollowUp(message) {
    return /^(show me|show|list|display|which|what about|how about|tell me more|more|all|the ones|those|these)/i
        .test(message.trim());
}

function updateState(userId, message, products) {
    const state = getState(userId);

    const category =
        findCategory(message, products);

    const productType =
        extractProductType(message);

    const priceFilter =
        extractPriceFilter(message);

    if (category) {
        state.category = category;
        state.topic = "products";
    }

    if (productType) {
        state.productType = productType;
        state.topic = "products";
    }

    if (priceFilter) {
        state.priceFilter = priceFilter;
        state.topic = "products";
    }

    if (
        !category &&
        !productType &&
        !priceFilter &&
        isFollowUp(message)
    ) {
        state.topic = "products";
    }

    return state;
}

function productMatchesType(product, productType) {
    if (!productType) {
        return true;
    }

    const name =
        normalize(product.name);

    const category =
        normalize(product.category);

    return (
        name.includes(productType) ||
        category.includes(productType)
    );
}

function applyFilters(products, state) {
    let result = products;

    if (state.category) {
        result = result.filter(function (product) {
            return (
                normalize(product.category) ===
                normalize(state.category)
            );
        });
    }

    if (state.productType) {
        result = result.filter(function (product) {
            return productMatchesType(
                product,
                state.productType
            );
        });
    }

    if (state.priceFilter) {
        const value =
            state.priceFilter.value;

        if (
            state.priceFilter.operator ===
            "under"
        ) {
            result = result.filter(function (product) {
                return Number(product.price) < value;
            });
        }

        if (
            state.priceFilter.operator ===
            "over"
        ) {
            result = result.filter(function (product) {
                return Number(product.price) > value;
            });
        }
    }

    return result;
}

function setLastResult(userId, products) {
    const state = getState(userId);

    state.lastResult = products.map(function (product) {
        return {
            name: product.name,
            category: product.category,
            price: product.price
        };
    });

    return state;
}

function getLastResult(userId) {
    return getState(userId).lastResult;
}

function buildProductList(products) {
    if (!products.length) {
        return "No matching products are currently available.";
    }

    return products
        .map(function (product) {
            return `${product.name} — €${Number(product.price).toFixed(2)}`;
        })
        .join("\n");
}

module.exports = {
    getState,
    resetState,
    updateState,
    applyFilters,
    setLastResult,
    getLastResult,
    buildProductList,
    extractPriceFilter,
    extractProductType,
    findCategory
};
