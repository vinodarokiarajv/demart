const authService = require("../services/authService");

async function updateUserRole(req, res) {
    const userId = req.params.id;
    const { role } = req.body;

    if (!role) {
        return res.status(400).json({
            message: "Role is required"
        });
    }

    const allowedRoles = ["ADMIN", "CUSTOMER"];

    if (!allowedRoles.includes(role)) {
        return res.status(400).json({
            message: "Invalid role"
        });
    }

    if (!Number.isInteger(Number(userId)) || Number(userId) <= 0) {
        return res.status(400).json({
            message: "Invalid user ID"
        });
    }

    const targetUserId = Number(userId);

    try {
        const targetUser = await authService.getUserById(targetUserId);

        if (!targetUser) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (targetUserId === req.user.id) {
            return res.status(400).json({
                message: "Administrators cannot change their own role"
            });
        }

        if (
            targetUser.role === "ADMIN" &&
            role === "CUSTOMER"
        ) {
            const adminCount =
                await authService.getAdminCount();

            if (adminCount <= 1) {
                return res.status(400).json({
                    message: "Cannot remove the last administrator"
                });
            }
        }

        const user = await authService.updateUserRole(
            targetUserId,
            role
        );

        res.status(200).json({
            message: "User role updated successfully",
            user: user
        });

    } catch (error) {
        console.error("Failed to update user role:", error);

        res.status(500).json({
            message: "Failed to update user role"
        });
    }
}

async function getAllUsers(req, res) {
    try {
        const users = await authService.getAllUsers();

        res.status(200).json({
            users: users
        });

    } catch (error) {
        console.error("Failed to get users:", error);

        res.status(500).json({
            message: "Failed to retrieve users"
        });
    }
}

module.exports = {
    getAllUsers,
    updateUserRole
};