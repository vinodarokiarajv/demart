const authService = require("../services/authService");

async function register(req, res) {
    const firstName = req.body.firstName?.trim();
    const lastName = req.body.lastName?.trim();
    const email = req.body.email?.trim();
    const password = req.body.password;
    const street = req.body.street?.trim();
    const postalCode = req.body.postalCode?.trim();
    const city = req.body.city?.trim();
    const country = req.body.country?.trim();

    if (
        !firstName ||
        !lastName ||
        !email ||
        !password ||
        !street ||
        !postalCode ||
        !city ||
        !country
    ) {
        return res.status(400).json({
            message: "All registration fields are required"
        });
    }

    if (!email.includes("@")) {
        return res.status(400).json({
            message: "Please enter a valid email address"
        });
    }

    if (password.length < 8) {
        return res.status(400).json({
            message: "Password must be at least 8 characters"
        });
    }

    if (!/[A-Z]/.test(password)) {
        return res.status(400).json({
            message: "Password must contain at least one uppercase letter"
        });
    }

    if (!/[a-z]/.test(password)) {
        return res.status(400).json({
            message: "Password must contain at least one lowercase letter"
        });
    }

    if (!/[0-9]/.test(password)) {
        return res.status(400).json({
            message: "Password must contain at least one number"
        });
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
        return res.status(400).json({
            message: "Password must contain at least one special character"
        });
    }

    try {
        const user = await authService.registerUser(
            firstName,
            lastName,
            email,
            password,
            street,
            postalCode,
            city,
            country
        );

        res.status(201).json({
            message: "User registered successfully",
            user: user
        });
    } catch (error) {
        console.error("Registration error:", error);

        if (error.code === "23505") {
            return res.status(409).json({
                message: "Email address is already registered"
            });
        }

        res.status(500).json({
            message: "Registration failed"
        });
    }
}


async function login(req, res) {

    const email = req.body.email?.trim();
    const password = req.body.password;

    if (!email || !password) {

        return res.status(400).json({
            message: "Email and password are required"
        });

    }

    try {

        const user = await authService.loginUser(
            email,
            password
        );

        if (!user) {

            return res.status(401).json({
                message: "Invalid email or password"
            });

        }

        res.status(200).json({
            message: "Login successful",
            user: user
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Login failed"
        });

    }
}

async function me(req, res) {

    try {

        const user = await authService.getUserById(req.user.id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.status(200).json({
            message: "Authenticated user",
            user: user
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to retrieve user"
        });

    }

}

module.exports = {
    register,
    login,
    me
};