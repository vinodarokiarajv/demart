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

        const messageElement =
            document.getElementById("register-message");

        const firstNameInput =
            document.getElementById("register-first-name");

        const lastNameInput =
            document.getElementById("register-last-name");

        const emailInput =
            document.getElementById("register-email");

        const passwordInput =
            document.getElementById("register-password");

        const confirmPasswordInput =
            document.getElementById("confirm-password");

        const streetInput =
            document.getElementById("register-street");

        const postalCodeInput =
            document.getElementById("register-postal-code");

        const cityInput =
            document.getElementById("register-city");

        const countryInput =
            document.getElementById("register-country");

        const firstName = firstNameInput.value.trim();
        const lastName = lastNameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        const street = streetInput.value.trim();
        const postalCode = postalCodeInput.value.trim();
        const city = cityInput.value.trim();
        const country = countryInput.value.trim();

        if (!firstName) {
            messageElement.textContent = "First name is required";
            return;
        }

        if (!lastName) {
            messageElement.textContent = "Last name is required";
            return;
        }

        if (!email) {
            messageElement.textContent = "Email is required";
            return;
        }

        if (!password) {
            messageElement.textContent = "Password is required";
            return;
        }

        if (!confirmPassword) {
            messageElement.textContent =
                "Please confirm your password";
            return;
        }

        if (password !== confirmPassword) {
            messageElement.textContent =
                "Passwords do not match";
            return;
        }

        if (!street) {
            messageElement.textContent =
                "Street address is required";
            return;
        }

        if (!postalCode) {
            messageElement.textContent =
                "Postal code is required";
            return;
        }

        if (!city) {
            messageElement.textContent =
                "City is required";
            return;
        }

        if (!country) {
            messageElement.textContent =
                "Country is required";
            return;
        }

        try {
            const response = await fetch(
                "http://localhost:3000/api/auth/register",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        firstName: firstName,
                        lastName: lastName,
                        email: email,
                        password: password,
                        street: street,
                        postalCode: postalCode,
                        city: city,
                        country: country
                    })
                }
            );

            const result = await response.json();

            if (response.ok) {
                messageElement.textContent =
                    result.message;

                registerForm.reset();

                setTimeout(function () {
                    window.location.href = "login.html";
                }, 1200);
            } else {
                messageElement.textContent =
                    result.message;
            }
        } catch (error) {
            console.error(
                "Registration request failed:",
                error
            );

            messageElement.textContent =
                "Unable to connect to the server";
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

/* ========================================
   Navigation State
   ======================================== */

function getStoredUser() {
    try {
        const user = localStorage.getItem("demartUser");

        return user ? JSON.parse(user) : null;

    } catch (error) {

        console.error(
            "Failed to read stored user:",
            error
        );

        localStorage.removeItem("demartUser");

        return null;
    }
}

function getCartStorageKey() {
    const user = getStoredUser();

    if (user && user.id) {
        return `demartCart:user:${user.id}`;
    }

    return "demartCart:guest";
}

function getStoredCart() {
    try {
        const cart = localStorage.getItem(getCartStorageKey());
        return cart ? JSON.parse(cart) : [];
    } catch (error) {
        console.error("Failed to read stored cart:", error);
        return [];
    }
}

function saveCart(cart) {
    localStorage.setItem(
        getCartStorageKey(),
        JSON.stringify(cart)
    );
}

function clearStoredCart() {
    localStorage.removeItem(getCartStorageKey());
}

function updateNavigation() {

    const user = getStoredUser();

    const loginLink =
        document.getElementById("login-link");

    const registerLink =
        document.getElementById("register-link");

    const accountLink =
        document.getElementById("account-link");

    const ordersLink =
        document.getElementById("orders-link");

    const adminUsersLink =
        document.getElementById("admin-users-link");

    const adminOrdersLink =
        document.getElementById("admin-orders-link");

    const logoutLink =
        document.getElementById("logout-link");

    const isLoggedIn =
        Boolean(user && user.token);

    const isAdmin =
        Boolean(
            isLoggedIn &&
            user.role === "ADMIN"
        );

    if (loginLink) {
        loginLink.style.display =
            isLoggedIn ? "none" : "";
    }

    if (registerLink) {
        registerLink.style.display =
            isLoggedIn ? "none" : "";
    }

    if (accountLink) {
    accountLink.style.display = isLoggedIn ? "inline-flex" : "none";
}

if (ordersLink) {
    ordersLink.style.display = isLoggedIn ? "inline-flex" : "none";
}

if (adminUsersLink) {
    adminUsersLink.style.display = isAdmin ? "inline-flex" : "none";
}

if (adminOrdersLink) {
    adminOrdersLink.style.display = isAdmin ? "inline-flex" : "none";
}

if (logoutLink) {
    logoutLink.style.display = isLoggedIn ? "inline-flex" : "none";
}
}

updateNavigation();

const logoutLink =
    document.getElementById("logout-link");

if (logoutLink) {

    logoutLink.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            localStorage.removeItem("demartUser");

            window.location.href =
                "../index.html";
        }
    );
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

    let cart = getStoredCart();

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

    saveCart(cart);

    console.log("Product added to cart:", product.name);
}

const productContainer = document.querySelector(".product-container");

if (productContainer) {

    const productSearchInput = document.querySelector(
        '.product-controls input[type="search"]'
    );

    const productSuggestions = document.querySelector(
        ".product-suggestions"
    );

    const productCategorySelect = document.querySelector(
        '.product-controls select[aria-label="Filter by category"]'
    );

    const productSortSelect = document.querySelector(
        '.product-controls select[aria-label="Sort products"]'
    );

    let allProducts = [];

    function renderProducts(products) {

        productContainer.innerHTML = "";

        if (products.length === 0) {

            const noResultsMessage = document.createElement("div");
            noResultsMessage.className = "no-products-message";

            noResultsMessage.innerHTML = `
                <h3>No products found</h3>
                <p>
                    Try changing your search or filter criteria.
                </p>
            `;

            productContainer.appendChild(noResultsMessage);
            return;
        }

        products.forEach(function (product) {

            const productCard = document.createElement("article");
            productCard.className = "product-card";

            productCard.innerHTML = `
                <div class="product-image">
                    <img
                        src="${product.image_url}"
                        alt="${product.name}"
                    >
                </div>

                <div class="product-info">

                    <p class="product-category">
                        ${product.category}
                    </p>

                    <h3>${product.name}</h3>

                    <p class="product-price">
                        €${Number(product.price).toFixed(2)}
                    </p>

                    <p class="product-rating">
                        ${product.rating} / 5
                    </p>

                    <div class="product-actions">

                        <a href="product-details.html?id=${product.id}">
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

            addToCartButton.addEventListener("click", function () {
                addToCart(product);
            });

            productContainer.appendChild(productCard);
        });
    }

    function renderProductSuggestions() {

    if (!productSuggestions || !productSearchInput) {
        return;
    }

    const searchTerm = productSearchInput.value
        .trim()
        .toLowerCase();

    productSuggestions.innerHTML = "";

    if (!searchTerm) {
        productSuggestions.style.display = "none";
        return;
    }

    const matchingProducts = allProducts
        .filter(function (product) {
            return product.name
                .toLowerCase()
                .includes(searchTerm);
        })
        .slice(0, 5);

    if (matchingProducts.length === 0) {
        productSuggestions.style.display = "none";
        return;
    }

    matchingProducts.forEach(function (product) {

        const suggestion = document.createElement("button");

        suggestion.type = "button";
        suggestion.className = "product-suggestion";

        const name = document.createElement("span");
name.className = "product-suggestion-name";
name.textContent = product.name;

const category = document.createElement("span");
category.className = "product-suggestion-category";
category.textContent = product.category;

suggestion.appendChild(name);
suggestion.appendChild(category);

        suggestion.addEventListener("click", function () {

            window.location.href =
                `product-details.html?id=${product.id}`;

        });

            productSuggestions.appendChild(suggestion);
        });

        productSuggestions.style.display = "block";
    }

    function applyProductFilters() {

        const searchTerm = productSearchInput
            ? productSearchInput.value.trim().toLowerCase()
            : "";

        const selectedCategory = productCategorySelect
            ? productCategorySelect.value
            : "";

        const selectedSort = productSortSelect
            ? productSortSelect.value
            : "";

        let filteredProducts = allProducts.filter(function (product) {

            const matchesSearch =
                product.name.toLowerCase().includes(searchTerm);

            const matchesCategory =
                !selectedCategory ||
                product.category === selectedCategory;

            return matchesSearch && matchesCategory;
        });

        if (selectedSort === "price-low") {

            filteredProducts.sort(function (a, b) {
                return Number(a.price) - Number(b.price);
            });

        } else if (selectedSort === "price-high") {

            filteredProducts.sort(function (a, b) {
                return Number(b.price) - Number(a.price);
            });

        } else if (selectedSort === "name") {

            filteredProducts.sort(function (a, b) {
                return a.name.localeCompare(
                    b.name,
                    undefined,
                    { sensitivity: "base" }
                );
            });
        }

        renderProducts(filteredProducts);
    }

    async function loadProducts() {

        try {

            const response = await fetch(
                "http://localhost:3000/api/products"
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || "Failed to load products"
                );
            }

            allProducts = result.products;

            applyProductFilters();

        } catch (error) {

            console.error("Failed to load products:", error);

            productContainer.innerHTML = `
                <div class="no-products-message">
                    <h3>Unable to load products</h3>
                    <p>
                        Please try again later.
                    </p>
                </div>
            `;
        }
    }

    if (productSearchInput) {

        productSearchInput.addEventListener(
            "input",
            function () {
                renderProductSuggestions();
                applyProductFilters();
            }
        );
    }

    document.addEventListener("click", function (event) {

    if (
        productSuggestions &&
        productSearchInput &&
        !productSearchInput.contains(event.target) &&
        !productSuggestions.contains(event.target)
    ) {
        productSuggestions.style.display = "none";
        }

    });

    if (productCategorySelect) {
        productCategorySelect.addEventListener(
            "change",
            applyProductFilters
        );
    }

    if (productSortSelect) {
        productSortSelect.addEventListener(
            "change",
            applyProductFilters
        );
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
            getStoredCart();

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

    saveCart(updatedCart);

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

    saveCart(cart);

    loadCart();
});

        });
    }

    loadCart();
}

/* ========================================
   Checkout User Information
   ======================================== */

const checkoutPage =
    document.querySelector(".checkout-page");

if (checkoutPage) {

    const checkoutUser = JSON.parse(
        localStorage.getItem("demartUser")
    );

    if (!checkoutUser || !checkoutUser.token) {

        window.location.href = "login.html";

    } else {

        const emailField =
            document.getElementById("email");

        const firstNameField =
            document.getElementById("first-name");

        const lastNameField =
            document.getElementById("last-name");

        const streetField =
            document.getElementById("street");

        const postalCodeField =
            document.getElementById("postal-code");

        const cityField =
            document.getElementById("city");

        const countryField =
            document.getElementById("country");

        if (emailField && checkoutUser.email) {
            emailField.value =
                checkoutUser.email;
        }

        if (firstNameField && checkoutUser.first_name) {
            firstNameField.value =
                checkoutUser.first_name;
        }

        if (lastNameField && checkoutUser.last_name) {
            lastNameField.value =
                checkoutUser.last_name;
        }

        if (streetField && checkoutUser.street) {
            streetField.value =
                checkoutUser.street;
        }

        if (postalCodeField && checkoutUser.postal_code) {
            postalCodeField.value =
                checkoutUser.postal_code;
        }

        if (cityField && checkoutUser.city) {
            cityField.value =
                checkoutUser.city;
        }

        if (countryField && checkoutUser.country) {
            countryField.value =
                String(checkoutUser.country).trim();
        }
    }
}

const checkoutProductsContainer =
    document.getElementById("checkout-products");


if (checkoutProductsContainer && checkoutPage) {

    const standardDelivery =
        document.getElementById("standard-delivery");

    const expressDelivery =
        document.getElementById("express-delivery");

    function getSelectedDeliveryMethod() {

        if (
            expressDelivery &&
            expressDelivery.checked
        ) {
            return "express";
        }

        return "standard";
    }

    function calculateCheckoutShipping(subtotal) {

        const deliveryMethod =
            getSelectedDeliveryMethod();

        if (deliveryMethod === "express") {
            return 9.99;
        }

        if (subtotal >= 100) {
            return 0;
        }

        return 4.99;
    }

    function loadCheckout() {

        const cart =
            getStoredCart();

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

            if (placeOrderButton) {
                placeOrderButton.disabled = true;
            }

            return;
        }

        cart.forEach(function (item) {

            const itemTotal =
                Number(item.price) * Number(item.quantity);

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
            calculateCheckoutShipping(subtotal);

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

    if (standardDelivery) {
        standardDelivery.addEventListener(
            "change",
            loadCheckout
        );
    }

    if (expressDelivery) {
        expressDelivery.addEventListener(
            "change",
            loadCheckout
        );
    }

    loadCheckout();
}


const placeOrderButton =
    document.getElementById("place-order-button");

if (placeOrderButton) {

    placeOrderButton.addEventListener(
        "click",
        async function () {

            const user = getStoredUser();

            if (!user || !user.token) {
                window.location.href = "login.html";
                return;
            }

            const cart = getStoredCart();

            if (cart.length === 0) {
                alert("Your cart is empty.");
                return;
            }

            const firstNameField =
                document.getElementById("first-name");

            const lastNameField =
                document.getElementById("last-name");

            const streetField =
                document.getElementById("street");

            const postalCodeField =
                document.getElementById("postal-code");

            const cityField =
                document.getElementById("city");

            const countryField =
                document.getElementById("country");

            const standardDelivery =
                document.getElementById("standard-delivery");

            const expressDelivery =
                document.getElementById("express-delivery");

            const cardPayment =
                document.getElementById("card-payment");

            const paypalPayment =
                document.getElementById("paypal-payment");

            const firstName =
                firstNameField
                    ? firstNameField.value.trim()
                    : "";

            const lastName =
                lastNameField
                    ? lastNameField.value.trim()
                    : "";

            const street =
                streetField
                    ? streetField.value.trim()
                    : "";

            const postalCode =
                postalCodeField
                    ? postalCodeField.value.trim()
                    : "";

            const city =
                cityField
                    ? cityField.value.trim()
                    : "";

            const country =
                countryField
                    ? countryField.value.trim()
                    : "";

            if (!firstName) {
                alert("First name is required.");
                return;
            }

            if (!lastName) {
                alert("Last name is required.");
                return;
            }

            if (!street) {
                alert("Street address is required.");
                return;
            }

            if (!postalCode) {
                alert("Postal code is required.");
                return;
            }

            if (!city) {
                alert("City is required.");
                return;
            }

            if (!country) {
                alert("Country is required.");
                return;
            }

            const deliveryMethod =
                expressDelivery &&
                expressDelivery.checked
                    ? "express"
                    : "standard";

            const paymentMethod =
                paypalPayment &&
                paypalPayment.checked
                    ? "paypal"
                    : "card";

            if (
                !standardDelivery?.checked &&
                !expressDelivery?.checked
            ) {
                alert("Please select a delivery method.");
                return;
            }

            if (
                !cardPayment?.checked &&
                !paypalPayment?.checked
            ) {
                alert("Please select a payment method.");
                return;
            }

            const items = cart.map(function (item) {
                return {
                    productId: item.id,
                    quantity: item.quantity
                };
            });

            const shippingAddress = {
                name: `${firstName} ${lastName}`.trim(),
                street: street,
                postalCode: postalCode,
                city: city,
                country: country
            };

            placeOrderButton.disabled = true;
            placeOrderButton.textContent =
                "Placing Order...";

            try {

                const response = await fetch(
                    "http://localhost:3000/api/orders",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type": "application/json",
                            "Authorization":
                                `Bearer ${user.token}`
                        },

                        body: JSON.stringify({
                            items: items,
                            shippingAddress: shippingAddress,
                            deliveryMethod: deliveryMethod,
                            paymentMethod: paymentMethod
                        })
                    }
                );

                const result =
                    await response.json();

                if (!response.ok) {
                    throw new Error(
                        result.message ||
                        "Failed to place order"
                    );
                }

                clearStoredCart();

                window.location.href =
                    `order-confirmation.html?orderId=${result.order.id}`;

            } catch (error) {

                console.error(
                    "Failed to place order:",
                    error
                );

                alert(
                    error.message ||
                    "Failed to place order. Please try again."
                );

                placeOrderButton.disabled = false;
                placeOrderButton.textContent =
                    "Place Order";
            }
        }
    );
}

/* ========================================
   Order Confirmation
   ======================================== */

const orderDetailsContainer =
    document.getElementById("order-details");

if (orderDetailsContainer) {

    async function loadOrderConfirmation() {

        const user = getStoredUser();

        if (!user || !user.token) {
            window.location.href = "login.html";
            return;
        }

        const urlParams =
            new URLSearchParams(window.location.search);

        const orderId =
            urlParams.get("orderId");

        if (!orderId) {

            orderDetailsContainer.innerHTML = `
                <div class="order-error">
                    <h3>Order Not Found</h3>
                    <p>No order ID was provided.</p>
                    <a href="orders.html" class="account-button">
                        Back to My Orders
                    </a>
                </div>
            `;

            return;
        }

        try {

            const response = await fetch(
                `http://localhost:3000/api/orders/${orderId}`,
                {
                    method: "GET",
                    headers: {
                        "Authorization":
                            `Bearer ${user.token}`
                    }
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message ||
                    "Failed to load order"
                );
            }

            const order = result.order;
            const items = result.items || [];

            const orderDate =
                new Date(order.created_at);

            const formattedDate =
                orderDate.toLocaleString();

            const statusClass =
                String(order.status || "").toLowerCase();

            const deliveryMethod =
                String(order.delivery_method || "standard")
                    .toLowerCase();

            const paymentMethod =
                String(order.payment_method || "card")
                    .toLowerCase();

            const paymentStatus =
                String(order.payment_status || "PENDING")
                    .toLowerCase();

            const shippingAmount =
                Number(order.shipping_amount || 0);

            const deliveryLabel =
                deliveryMethod === "express"
                    ? "Express Delivery"
                    : "Standard Delivery";

            const paymentLabel =
                paymentMethod === "paypal"
                    ? "PayPal"
                    : "Credit / Debit Card";

            const paymentStatusLabel =
                paymentStatus === "paid"
                    ? "Paid"
                    : paymentStatus === "failed"
                        ? "Failed"
                        : "Pending";

            let itemsHtml = "";

            items.forEach(function (item) {

                const itemTotal =
                    Number(item.unit_price) *
                    Number(item.quantity);

                itemsHtml += `
                    <div class="order-item">

                        <div class="order-item-image">
                            <img
                                src="${item.image_url}"
                                alt="${item.product_name}">
                        </div>

                        <div class="order-item-info">

                            <h3>
                                ${item.product_name}
                            </h3>

                            <p>
                                Quantity: ${item.quantity}
                            </p>

                            <p>
                                €${Number(item.unit_price).toFixed(2)}
                                each
                            </p>

                        </div>

                        <div class="order-item-total">
                            €${itemTotal.toFixed(2)}
                        </div>

                    </div>
                `;
            });

            const shippingAddress =
                order.shipping_name ||
                order.shipping_street ||
                order.shipping_city ||
                order.shipping_postal_code ||
                order.shipping_country
                    ? `
                        <div class="order-info-section">

                            <h2>Shipping Address</h2>

                            <p>
                                ${order.shipping_name || ""}
                            </p>

                            <p>
                                ${order.shipping_street || ""}
                            </p>

                            <p>
                                ${order.shipping_postal_code || ""}
                                ${order.shipping_city || ""}
                            </p>

                            <p>
                                ${order.shipping_country || ""}
                            </p>

                        </div>
                    `
                    : "";

            orderDetailsContainer.innerHTML = `

                <div class="order-success-header">

                    <h1>Order Confirmed</h1>

                    <p>
                        Thank you for your order.
                    </p>

                </div>

                <div class="order-summary">

                    <div class="order-summary-item">

                        <span>Order Number</span>

                        <strong>
                            #${order.id}
                        </strong>

                    </div>

                    <div class="order-summary-item">

                        <span>Order Date</span>

                        <strong>
                            ${formattedDate}
                        </strong>

                    </div>

                    <div class="order-summary-item">

                        <span>Status</span>

                        <strong class="order-status ${statusClass}">
                            ${order.status}
                        </strong>

                    </div>

                </div>

                <div class="order-info-grid">

                    <div class="order-info-section">

                        <h2>Delivery</h2>

                        <p>
                            <strong>
                                ${deliveryLabel}
                            </strong>
                        </p>

                        <p>
                            ${
                                deliveryMethod === "express"
                                    ? "1–2 business days"
                                    : "3–5 business days"
                            }
                        </p>

                    </div>

                    <div class="order-info-section">

                        <h2>Payment</h2>

                        <p>
                            <strong>
                                ${paymentLabel}
                            </strong>
                        </p>

                        <p>
                            Status:
                            <strong>
                                ${paymentStatusLabel}
                            </strong>
                        </p>

                    </div>

                </div>

                ${shippingAddress}

                <div class="order-items">

                    <h2>Order Items</h2>

                    ${itemsHtml}

                </div>

                <div class="order-confirmation-breakdown">

                    <div class="order-confirmation-total">

                        <span>Shipping</span>

                        <span>
                            ${
                                shippingAmount === 0
                                    ? "Free"
                                    : `€${shippingAmount.toFixed(2)}`
                            }
                        </span>

                    </div>

                    <div class="order-confirmation-total">

                        <span>Total</span>

                        <span>
                            €${Number(order.total_amount).toFixed(2)}
                        </span>

                    </div>

                </div>

                <div class="order-confirmation-actions">

                    <a
                        href="orders.html"
                        class="account-button">
                        View My Orders
                    </a>

                    <a
                        href="products.html"
                        class="account-button">
                        Continue Shopping
                    </a>

                </div>
            `;

        } catch (error) {

            console.error(
                "Failed to load order:",
                error
            );

            orderDetailsContainer.innerHTML = `
                <div class="order-error">

                    <h3>
                        Unable to Load Order
                    </h3>

                    <p>
                        ${error.message}
                    </p>

                    <a
                        href="orders.html"
                        class="account-button">
                        Back to My Orders
                    </a>

                </div>
            `;
        }
    }

    loadOrderConfirmation();
}



/* ========================================
   Customer Orders
   ======================================== */

const ordersContainer =
    document.getElementById("orders-container");

if (ordersContainer) {

    async function loadCustomerOrders() {

        const user =
            JSON.parse(localStorage.getItem("demartUser"));

        if (!user || !user.token) {

            window.location.href = "login.html";

            return;
        }

        try {

            const response = await fetch(
                "http://localhost:3000/api/orders",
                {
                    method: "GET",
                    headers: {
                        "Authorization":
                            `Bearer ${user.token}`
                    }
                }
            );

            const result = await response.json();

            if (!response.ok) {

                throw new Error(
                    result.message ||
                    "Failed to load orders"
                );
            }

            const orders = result.orders || [];

            if (orders.length === 0) {

                ordersContainer.innerHTML = `
                    <div class="orders-empty">

                        <h2>No Orders Yet</h2>

                        <p>
                            You have not placed any orders yet.
                        </p>

                        <a href="products.html"
                           class="account-button">
                            Start Shopping
                        </a>

                    </div>
                `;

                return;
            }

            let ordersHtml = "";

            orders.forEach(function (order) {

                const orderDate =
                    new Date(order.created_at);

                const formattedDate =
                    orderDate.toLocaleString();

                const total =
                    Number(order.total_amount).toFixed(2);

                ordersHtml += `
                    <article class="order-card">

                        <div class="order-card-header">

                            <div>
                                <h2>
                                    Order #${order.id}
                                </h2>

                                <p>
                                    ${formattedDate}
                                </p>
                            </div>

                            <span class="
                                order-status
                                order-status-${order.status.toLowerCase()}
                            ">
                                ${order.status}
                            </span>

                        </div>

                        <div class="order-card-details">

                            <div>
                                <strong>Total</strong>
                                <span>
                                    €${total}
                                </span>
                            </div>

                            <div>
                                <strong>Status</strong>
                                <span>
                                    ${order.status}
                                </span>
                            </div>

                        </div>

                        <div class="order-card-actions">

                            <a
                                href="order-confirmation.html?orderId=${order.id}"
                                class="account-button">
                                View Details
                            </a>

                        </div>

                    </article>
                `;
            });

            ordersContainer.innerHTML = ordersHtml;

        } catch (error) {

            console.error(
                "Failed to load customer orders:",
                error
            );

            ordersContainer.innerHTML = `
                <div class="orders-empty">

                    <h2>Unable to Load Orders</h2>

                    <p>
                        ${error.message}
                    </p>

                    <button
                        type="button"
                        class="account-button"
                        onclick="location.reload()">
                        Try Again
                    </button>

                </div>
            `;
        }
    }

    loadCustomerOrders();
}

const deleteAccountButton = document.getElementById(
    "delete-account-button"
);

const deleteAccountMessage = document.getElementById(
    "delete-account-message"
);

if (deleteAccountButton) {

    deleteAccountButton.addEventListener("click", async function () {

        const storedUser = localStorage.getItem("demartUser");

        if (!storedUser) {
            window.location.href = "login.html";
            return;
        }

        const currentUser = JSON.parse(storedUser);

        const confirmed = window.confirm(
            "Are you sure you want to delete your DeMart account?\n\n" +
            "Your personal account information will be removed. " +
            "This action cannot be undone."
        );

        if (!confirmed) {
            return;
        }

        deleteAccountButton.disabled = true;
        deleteAccountButton.textContent = "Deleting...";

        try {

            const response = await fetch(
                "http://localhost:3000/api/auth/me",
                {
                    method: "DELETE",
                    headers: {
                        "Authorization":
                            `Bearer ${currentUser.token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Account deletion failed"
                );
            }

            clearStoredCart();
            localStorage.removeItem("demartUser");

            window.location.href = "../index.html";

        } catch (error) {

            console.error(
                "Account deletion error:",
                error
            );

            deleteAccountMessage.textContent =
                error.message ||
                "Account deletion failed. Please try again.";

            deleteAccountButton.disabled = false;
            deleteAccountButton.textContent =
                "Delete My Account";
        }
    });
}

/* ========================================
   Active Navigation Item
   ======================================== */

function updateActiveNavigation() {

    const currentPath = window.location.pathname;

    const navLinks = document.querySelectorAll(".main-nav a");

    navLinks.forEach(function (link) {

        link.classList.remove("active");

        const href = link.getAttribute("href");

        if (!href || href === "#") {
            return;
        }

        const linkPath =
            new URL(href, window.location.href).pathname;

        let isActive = linkPath === currentPath;

        /*
         * Group related pages under their primary navigation item.
         */

        if (
            currentPath.endsWith("/product-details.html") &&
            linkPath.endsWith("/products.html")
        ) {
            isActive = true;
        }

        if (
            currentPath.endsWith("/checkout.html") &&
            linkPath.endsWith("/cart.html")
        ) {
            isActive = true;
        }

        if (
            currentPath.endsWith("/order-confirmation.html") &&
            linkPath.endsWith("/orders.html")
        ) {
            isActive = true;
        }

        if (isActive) {
            link.classList.add("active");
        }
    });
}
updateActiveNavigation();