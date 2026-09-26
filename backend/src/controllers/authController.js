const authService = require("../services/authService");

const {
    isValidEmail,
    validateAddressFields
} = require("../utils/validation");

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

    if (!isValidEmail(email)) {
        return res.status(400).json({
            message: "Please enter a valid email address"
        });
    }

    const addressValidationError = validateAddressFields({
            firstName,
            lastName,
            street,
            postalCode,
            city,
            country
        });

    if (addressValidationError) {
        return res.status(400).json({
            message: addressValidationError
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

async function forgotPassword(req, res) {

    const email = String(req.body.email || "")
        .trim()
        .toLowerCase();

    if (!email) {
        return res.status(400).json({
            message: "Email is required"
        });
    }

    if (!isValidEmail(email)) {
        return res.status(400).json({
            message: "Please enter a valid email address"
        });
    }

    try {

        const resetToken =
            await authService.createPasswordResetToken(email);

        /*
         * Do not reveal whether the email exists.
         * This prevents account enumeration.
         */

        const response = {
            message:
                "If an account exists for this email, a password reset link has been generated."
        };

        if (resetToken && process.env.NODE_ENV !== "production") {
            response.resetUrl = `http://localhost:3000/pages/reset-password.html?token=${resetToken}`;
        }

        return res.status(200).json(response);

    } catch (error) {

        console.error(
            "Forgot password error:",
            error
        );

        return res.status(500).json({
            message: "Password reset request failed"
        });
    }
}

async function resetPassword(req, res) {

    const resetToken = String(
        req.body.token || ""
    ).trim();

    const newPassword = req.body.newPassword;

    if (!resetToken) {
        return res.status(400).json({
            message: "Password reset token is required"
        });
    }

    if (!newPassword) {
        return res.status(400).json({
            message: "New password is required"
        });
    }

    if (newPassword.length < 8) {
        return res.status(400).json({
            message: "Password must be at least 8 characters"
        });
    }

    if (!/[A-Z]/.test(newPassword)) {
        return res.status(400).json({
            message:
                "Password must contain at least one uppercase letter"
        });
    }

    if (!/[a-z]/.test(newPassword)) {
        return res.status(400).json({
            message:
                "Password must contain at least one lowercase letter"
        });
    }

    if (!/[0-9]/.test(newPassword)) {
        return res.status(400).json({
            message:
                "Password must contain at least one number"
        });
    }

    if (!/[^A-Za-z0-9]/.test(newPassword)) {
        return res.status(400).json({
            message:
                "Password must contain at least one special character"
        });
    }

    try {

        const resetSuccessful =
            await authService.resetPassword(
                resetToken,
                newPassword
            );

        if (!resetSuccessful) {
            return res.status(400).json({
                message:
                    "This password reset link is invalid or has expired."
            });
        }

        return res.status(200).json({
            message:
                "Your password has been reset successfully."
        });

    } catch (error) {

        console.error("Password reset error:", error);

        return res.status(500).json({
            message: "Password reset failed"
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

async function updateMe(req, res) {
    const firstName = req.body.firstName?.trim();
    const lastName = req.body.lastName?.trim();
    const email = req.body.email?.trim();
    const street = req.body.street?.trim();
    const postalCode = req.body.postalCode?.trim();
    const city = req.body.city?.trim();
    const country = req.body.country?.trim();

    if (
        !firstName ||
        !lastName ||
        !email ||
        !street ||
        !postalCode ||
        !city ||
        !country
    ) {
        return res.status(400).json({
            message: "All account fields are required"
        });
    }

    if (!isValidEmail(email)) {
        return res.status(400).json({
            message: "Please enter a valid email address"
        });
    }

    const addressValidationError = validateAddressFields({
            firstName,
            lastName,
            street,
            postalCode,
            city,
            country
        });

    if (addressValidationError) {
        return res.status(400).json({
            message: addressValidationError
        });
    }

    try {
        const user = await authService.updateUser(
            req.user.id,
            firstName,
            lastName,
            email,
            street,
            postalCode,
            city,
            country
        );

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.status(200).json({
            message: "Account updated successfully",
            user: user
        });

    } catch (error) {
        console.error("Account update error:", error);

        if (error.code === "23505") {
            return res.status(409).json({
                message: "Email address is already registered"
            });
        }

        res.status(500).json({
            message: "Account update failed"
        });
    }
}

async function deleteMe(req, res) {
    try {
        const user = await authService.deleteUserAccount(
            req.user.id
        );

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.status(200).json({
            message: "Account deleted successfully"
        });

    } catch (error) {
        console.error("Account deletion error:", error);

        res.status(500).json({
            message: "Account deletion failed"
        });
    }
}

module.exports = {
    register,
    login,
    forgotPassword,
    resetPassword,
    me,
    updateMe,
    deleteMe
};