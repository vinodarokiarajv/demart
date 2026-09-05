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
