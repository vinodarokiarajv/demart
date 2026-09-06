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

                messageElement.textContent = result.message;

                console.log("Login successful");
                console.log(result.user);

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