const storedUser = localStorage.getItem("demartUser");

const currentPage = window.location.pathname;

const isLoginPage = currentPage.endsWith("/login.html");
const isRegisterPage = currentPage.endsWith("/register.html");

if (storedUser && (isLoginPage || isRegisterPage)) {
    window.location.replace("account.html");
}

window.addEventListener("pageshow", function () {

    const currentStoredUser = localStorage.getItem("demartUser");

    const currentPath = window.location.pathname;

    const onLoginPage = currentPath.endsWith("/login.html");
    const onRegisterPage = currentPath.endsWith("/register.html");

    if (currentStoredUser && (onLoginPage || onRegisterPage)) {
        window.location.replace("account.html");
    }

});

const registerForm = document.getElementById("register-form");

if (registerForm) {

    registerForm.addEventListener("submit", async function (event) {

        event.preventDefault();
        const messageElement = document.getElementById("register-message");

        const nameInput = document.getElementById("register-name");
        const emailInput = document.getElementById("register-email");
        const passwordInput = document.getElementById("register-password");
        const confirmPasswordInput = document.getElementById("confirm-password");

        const name = nameInput.value;
        const email = emailInput.value;
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        if (name.trim() === "") {
    messageElement.textContent = "Name is required";
    return;
}

if (email.trim() === "") {
    messageElement.textContent = "Email is required";
    return;
}

if (password.trim() === "") {
    messageElement.textContent = "Password is required";
    return;
}

if (confirmPassword.trim() === "") {
    messageElement.textContent = "Please confirm your password";
    return;
}

if (password !== confirmPassword) {
    messageElement.textContent = "Passwords do not match";
    return;
} else {

            try {

                const response = await fetch(
                    "http://localhost:3000/api/auth/register",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type": "application/json"
                        },

                        body: JSON.stringify({
                            name: name,
                            email: email,
                            password: password
                        })
                    }
                );

                const result = await response.json();

                if (response.ok) {
    messageElement.textContent = result.message;

    registerForm.reset();

    setTimeout(function () {
        window.location.href = "login.html";
    }, 1200);
} else {
    messageElement.textContent = result.message;
}

            } catch (error) {

                console.error("Registration request failed:", error);

            }

        }

    });

}

const loginForm = document.getElementById("login-form");

if (loginForm) {

    loginForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const emailInput = document.getElementById("login-email");
        const passwordInput = document.getElementById("login-password");
        const messageElement = document.getElementById("login-message");

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (email === "") {

            messageElement.textContent = "Email is required";
            return;

        }

        if (password === "") {

            messageElement.textContent = "Password is required";
            return;

        }

        try {

            const response = await fetch(
                "http://localhost:3000/api/auth/login",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        email: email,
                        password: password
                    })
                }
            );

            const result = await response.json();

            if (response.ok) {

    localStorage.setItem(
        "demartUser",
        JSON.stringify(result.user)
    );

    window.location.href = "products.html";

} else {

                messageElement.textContent = result.message;

                console.log("Login failed:", result.message);

            }

        } catch (error) {

            console.error("Login request failed:", error);

            messageElement.textContent =
                "Unable to connect to the server";

        }

    });

}

const loginLink = document.getElementById("login-link");
const registerLink = document.getElementById("register-link");
const accountLink = document.getElementById("account-link");
const logoutLink = document.getElementById("logout-link");

if (storedUser) {

    if (loginLink) {
        loginLink.style.display = "none";
    }

    if (registerLink) {
        registerLink.style.display = "none";
    }

    if (accountLink) {
        accountLink.style.display = "inline";
    }

    if (logoutLink) {
        logoutLink.style.display = "inline";
    }

} else {

    if (accountLink) {
        accountLink.style.display = "none";
    }

    if (logoutLink) {
        logoutLink.style.display = "none";
    }

}

if (logoutLink) {

    logoutLink.addEventListener("click", function (event) {

        event.preventDefault();

        localStorage.removeItem("demartUser");

        window.location.href = "../index.html";

    });

}

const accountName = document.getElementById("account-name");
const accountEmail = document.getElementById("account-email");
const accountCreated = document.getElementById("account-created");

const accountUser = localStorage.getItem("demartUser");

if (accountUser) {

    const user = JSON.parse(accountUser);

    if (accountName) {
        accountName.textContent = user.name;
    }

    if (accountEmail) {
        accountEmail.textContent = user.email;
    }

    if (accountCreated) {
        accountCreated.textContent = new Date(
            user.created_at
        ).toLocaleDateString();
    }

}

const accountPage = document.querySelector(".account-container");

if (accountPage) {

    const accountUser = localStorage.getItem("demartUser");

    if (!accountUser) {

        window.location.href = "login.html";

    }

}

function addToCart(product, quantity = 1) {

    let cart = JSON.parse(localStorage.getItem("demartCart")) || [];

    const existingItem = cart.find(function (item) {
        return item.id === product.id;
    });

    if (existingItem) {

        existingItem.quantity += quantity;

    } else {

        cart.push({
            id: product.id,
            name: product.name,
            category: product.category,
            price: Number(product.price),
            image_url: product.image_url,
            quantity: quantity
        });

    }

    localStorage.setItem(
        "demartCart",
        JSON.stringify(cart)
    );

    console.log("Product added to cart:", product.name);
}

const productContainer = document.querySelector(".product-container");

if (productContainer) {

    async function loadProducts() {

        try {

            const response = await fetch(
                "http://localhost:3000/api/products"
            );

            const result = await response.json();

            productContainer.innerHTML = "";

            result.products.forEach(function (product) {

                const productCard = document.createElement("article");

                productCard.className = "product-card";

                productCard.innerHTML = `
                    <div class="product-image">
                        <img src="${product.image_url}" alt="${product.name}">
                    </div>

                    <div class="product-info">

                        <p class="product-category">
                            ${product.category}
                        </p>

                        <h3>${product.name}</h3>

                        <p class="product-price">
                            €${product.price}
                        </p>

                        <p class="product-rating">
                            ${product.rating} / 5
                        </p>

                        <div class="product-actions">

                            <a href="product-details.html?id=${product.id}">
                                View Details
                            </a>

                            <button type="button" class="add-to-cart-button">
    Add to Cart
</button>

                        </div>

                    </div>
                `;

                const addToCartButton =
    productCard.querySelector(".add-to-cart-button");

addToCartButton.addEventListener("click", function () {

    addToCart(product);

});

productContainer.appendChild(productCard);

            });

        } catch (error) {

            console.error("Failed to load products:", error);

        }
    }

    loadProducts();
}

const featuredProductContainer = document.querySelector(
    ".featured-product-container"
);

if (featuredProductContainer) {

    async function loadFeaturedProducts() {

        try {

            const response = await fetch(
                "http://localhost:3000/api/products"
            );

            const result = await response.json();

            featuredProductContainer.innerHTML = "";

            result.products.slice(0, 3).forEach(function (product) {

                const productCard = document.createElement("article");

                productCard.className = "product-card";

                productCard.innerHTML = `
                    <div class="product-image">
                        <img src="${product.image_url}" alt="${product.name}">
                    </div>

                    <div class="product-info">

                        <p class="product-category">
                            ${product.category}
                        </p>

                        <h3>${product.name}</h3>

                        <p class="product-price">
                            €${product.price}
                        </p>

                        <p class="product-rating">
                            ${product.rating} / 5
                        </p>

                        <div class="product-actions">

                            <a href="pages/product-details.html?id=${product.id}">
                                View Details
                            </a>

                            <button
                                type="button"
                                class="add-to-cart-button"
                            >
                                Add to Cart
                            </button>

                        </div>

                    </div>
                `;

                const addToCartButton =
                    productCard.querySelector(".add-to-cart-button");

                addToCartButton.addEventListener(
                    "click",
                    function () {
                        addToCart(product);
                    }
                );

                featuredProductContainer.appendChild(productCard);

            });

        } catch (error) {

            console.error(
                "Failed to load featured products:",
                error
            );

        }

    }

    loadFeaturedProducts();

}

const productDetails = document.querySelector(".product-details");

if (productDetails) {
    async function loadProductDetails() {
        try {
            const params = new URLSearchParams(window.location.search);
const productId = params.get("id");

if (!productId) {
    document.querySelector("#product-error").hidden = false;
    productDetails.hidden = true;
    return;
}

            const response = await fetch(
                `http://localhost:3000/api/products/${productId}`
            );

            if (!response.ok) {
    document.querySelector("#product-error").hidden = false;
    productDetails.hidden = true;
    return;
}

            const result = await response.json();
            const product = result.product;

            document.querySelector("#product-image").src =
                product.image_url;

            document.querySelector("#product-image").alt =
                product.name;

            document.querySelector("#product-category").textContent =
                product.category;

            document.querySelector("#product-name").textContent =
                product.name;

            document.querySelector("#product-rating").textContent =
                `${product.rating} / 5`;

            document.querySelector("#product-price").textContent =
                `€${product.price}`;

            document.querySelector("#product-stock").textContent =
                `In stock: ${product.stock_quantity}`;

            document.querySelector("#product-description").textContent =
                product.description;

            document.querySelector("#product-information").textContent =
                product.description;

            document
    .querySelector("#product-add-to-cart")
    .addEventListener("click", function () {

        const button = this;

        const quantityInput =
            document.querySelector("#quantity");

        const quantity = Number(quantityInput.value);

        addToCart(product, quantity);

        button.textContent = "Added to Cart ✓";
        button.classList.add("added");

        setTimeout(function () {

            button.textContent = "Add to Cart";
            button.classList.remove("added");

        }, 1000);
    });

        } catch (error) {
            console.error("Failed to load product details:", error);
        }
    }

    loadProductDetails();
}

const cartItemsContainer = document.getElementById("cart-items");

if (cartItemsContainer) {

    function loadCart() {

        const cart =
            JSON.parse(localStorage.getItem("demartCart")) || [];

            let subtotal = 0;

cart.forEach(function (item) {
    subtotal += item.price * item.quantity;
});

const shipping = subtotal >= 100 || subtotal === 0 ? 0 : 4.99;
const total = subtotal + shipping;

document.querySelector("#cart-subtotal").textContent =
    `€${subtotal.toFixed(2)}`;

document.querySelector("#cart-shipping").textContent =
    shipping === 0 ? "Free" : `€${shipping.toFixed(2)}`;

document.querySelector("#cart-total").textContent =
    `€${total.toFixed(2)}`;

        cartItemsContainer.innerHTML = "";

if (cart.length === 0) {

    cartItemsContainer.innerHTML = `
        <div class="empty-cart">
            <h3>Your cart is empty</h3>
            <p>
                You haven't added any products to your cart yet.
            </p>
            <a href="products.html">
                Continue Shopping
            </a>
        </div>
    `;

    document.querySelector("#cart-subtotal").textContent = "€0.00";
document.querySelector("#cart-shipping").textContent = "€0.00";
document.querySelector("#cart-total").textContent = "€0.00";

    return;
}

cart.forEach(function (item) {

            const cartItem = document.createElement("article");

            cartItem.className = "cart-item";

            cartItem.innerHTML = `
                <div class="cart-item-image">
                    <img src="${item.image_url}" alt="${item.name}">
                </div>

                <div class="cart-item-info">

                    <p class="product-category">
                        ${item.category}
                    </p>

                    <h3>${item.name}</h3>

                    <p class="cart-item-price">
                        €${item.price.toFixed(2)}
                    </p>

                </div>

                <div class="cart-item-quantity">

                    <label for="quantity-${item.id}">
                        Quantity
                    </label>

                    <input
    id="quantity-${item.id}"
    type="number"
    value="${item.quantity}"
    min="1"
    class="cart-quantity-input"
>

                </div>

                <div class="cart-item-total">

                    <p>
                        €${(item.price * item.quantity).toFixed(2)}
                    </p>

                    <button type="button" class="remove-cart-item">
    Remove
</button>

                </div>
            `;

            cartItemsContainer.appendChild(cartItem);

            const removeButton =
    cartItem.querySelector(".remove-cart-item");

removeButton.addEventListener("click", function () {

    const updatedCart = cart.filter(function (cartItem) {
        return cartItem.id !== item.id;
    });

    localStorage.setItem(
        "demartCart",
        JSON.stringify(updatedCart)
    );

    loadCart();
});

            const quantityInput =
    cartItem.querySelector(".cart-quantity-input");

quantityInput.addEventListener("change", function () {

    const newQuantity = Number(quantityInput.value);

    if (newQuantity < 1) {
        quantityInput.value = item.quantity;
        return;
    }

    item.quantity = newQuantity;

    localStorage.setItem(
        "demartCart",
        JSON.stringify(cart)
    );

    loadCart();
});

        });
    }

    loadCart();
}

const checkoutProductsContainer =
    document.getElementById("checkout-products");

if (checkoutProductsContainer) {

    function loadCheckout() {

        const cart =
            JSON.parse(localStorage.getItem("demartCart")) || [];

        checkoutProductsContainer.innerHTML = "";

        let subtotal = 0;

        if (cart.length === 0) {

            checkoutProductsContainer.innerHTML = `
                <div class="empty-cart">
                    <h3>Your cart is empty</h3>
                    <p>
                        Add some products before proceeding to checkout.
                    </p>
                    <a href="products.html">
                        Continue Shopping
                    </a>
                </div>
            `;

            document.querySelector("#checkout-subtotal").textContent =
                "€0.00";

            document.querySelector("#checkout-shipping").textContent =
                "€0.00";

            document.querySelector("#checkout-total").textContent =
                "€0.00";

            return;
        }

        cart.forEach(function (item) {

            const itemTotal =
                item.price * item.quantity;

            subtotal += itemTotal;

            const checkoutProduct =
                document.createElement("div");

            checkoutProduct.className =
                "checkout-product";

            checkoutProduct.innerHTML = `
                <div>
                    <strong>${item.name}</strong>
                    <span>Qty: ${item.quantity}</span>
                </div>

                <span>
                    €${itemTotal.toFixed(2)}
                </span>
            `;

            checkoutProductsContainer.appendChild(
                checkoutProduct
            );
        });

        const shipping =
            subtotal >= 100 ? 0 : 4.99;

        const total =
            subtotal + shipping;

        document.querySelector("#checkout-subtotal").textContent =
            `€${subtotal.toFixed(2)}`;

        document.querySelector("#checkout-shipping").textContent =
            shipping === 0
                ? "Free"
                : `€${shipping.toFixed(2)}`;

        document.querySelector("#checkout-total").textContent =
            `€${total.toFixed(2)}`;
    }

    loadCheckout();
}

const placeOrderButton = document.getElementById("place-order-button");

if (placeOrderButton) {

    placeOrderButton.addEventListener("click", async function () {

        const user = JSON.parse(
            localStorage.getItem("demartUser")
        );

        if (!user || !user.token) {
            window.location.href = "login.html";
            return;
        }

        const cart =
            JSON.parse(localStorage.getItem("demartCart")) || [];

        if (cart.length === 0) {
            alert("Your cart is empty.");
            return;
        }

        const items = cart.map(function (item) {
            return {
                productId: item.id,
                quantity: item.quantity
            };
        });

        placeOrderButton.disabled = true;
        placeOrderButton.textContent = "Placing Order...";

        try {

            const response = await fetch(
                "http://localhost:3000/api/orders",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${user.token}`
                    },
                    body: JSON.stringify({
                        items: items
                    })
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || "Failed to place order"
                );
            }

            localStorage.removeItem("demartCart");

            window.location.href =
                `order-confirmation.html?orderId=${result.order.id}`;

        } catch (error) {

            console.error("Failed to place order:", error);

            alert(error.message);

            placeOrderButton.disabled = false;
            placeOrderButton.textContent = "Place Order";
        }
    });
}