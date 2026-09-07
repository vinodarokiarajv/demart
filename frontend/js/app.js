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

            console.log("Name is required");

        } else if (email.trim() === "") {

            console.log("Email is required");

        } else if (password.trim() === "") {

            console.log("Password is required");

        } else if (confirmPassword.trim() === "") {

            console.log("Please confirm your password");

        } else if (password !== confirmPassword) {

            console.log("Passwords do not match");

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

const storedUser = localStorage.getItem("demartUser");

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

                            <button type="button">
                                Add to Cart
                            </button>

                        </div>

                    </div>
                `;

                productContainer.appendChild(productCard);

            });

        } catch (error) {

            console.error("Failed to load products:", error);

        }
    }

    loadProducts();
}