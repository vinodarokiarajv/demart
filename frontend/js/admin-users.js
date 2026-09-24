const adminUsersTableBody =
document.getElementById("admin-users-table-body");

const adminUsersMessage =
document.getElementById("admin-users-message");

const adminUser = JSON.parse(
localStorage.getItem("demartUser")
);

/* ========================================
Admin Access Protection
======================================== */

if (!adminUser || !adminUser.token) {

window.location.href = "login.html";

} else if (adminUser.role !== "ADMIN") {

window.location.href = "home.html";

}

/* ========================================
Message
======================================== */

function showAdminUsersMessage(message, isError = false) {

adminUsersMessage.textContent = message;

adminUsersMessage.hidden = false;

if (isError) {
    adminUsersMessage.classList.add("error");
} else {
    adminUsersMessage.classList.remove("error");
}

}

/* ========================================
Load Users
======================================== */

async function loadAdminUsers() {

try {

    const response = await fetch(
        "http://localhost:3000/api/admin/users",
        {
            method: "GET",

            headers: {
                "Authorization":
                    `Bearer ${adminUser.token}`
            }
        }
    );

    const result = await response.json();

    if (!response.ok) {

        throw new Error(
            result.message ||
            "Failed to load users"
        );

    }

    adminUsersTableBody.innerHTML = "";

    result.users.forEach(function (user) {

        const row =
            document.createElement("tr");

        row.setAttribute("data-testid", "admin-user-row");
        row.setAttribute("data-user-id", user.id);

        const isCurrentAdmin =
            user.id === adminUser.id;

        row.innerHTML = `

            <td>
                ${user.id}
            </td>

            <td>
                ${user.name}
            </td>

            <td>
                ${user.email}
            </td>

            <td>

                <select
                    class="admin-role-select"
                    data-testid="admin-role-select"
                    data-user-id="${user.id}"
                    ${isCurrentAdmin ? "disabled" : ""}
                >

                    <option
                        value="CUSTOMER"
                        ${user.role === "CUSTOMER" ? "selected" : ""}
                    >
                        CUSTOMER
                    </option>

                    <option
                        value="ADMIN"
                        ${user.role === "ADMIN" ? "selected" : ""}
                    >
                        ADMIN
                    </option>

                </select>

            </td>

            <td>

                ${
                    isCurrentAdmin
                        ? "<span data-testid=\"current-admin-label\">Current Admin</span>"
                        : `
                            <button
                                type="button"
                                class="admin-role-update-button"
                                data-testid="admin-role-update"
                                data-user-id="${user.id}"
                                data-current-role="${user.role}"
                            >
                                Update Role
                            </button>
                        `
                }

            </td>
        `;

        adminUsersTableBody.appendChild(row);

    });

    attachRoleUpdateHandlers();

} catch (error) {

    console.error(
        "Failed to load admin users:",
        error
    );

    showAdminUsersMessage(
        error.message,
        true
    );

}

}

/* ========================================
Update User Role
======================================== */

function attachRoleUpdateHandlers() {

const updateButtons =
    document.querySelectorAll(
        ".admin-role-update-button"
    );

updateButtons.forEach(function (button) {

    button.addEventListener(
        "click",
        async function () {

            const userId =
                button.dataset.userId;

            const roleSelect =
                document.querySelector(
                    `.admin-role-select[data-user-id="${userId}"]`
                );

            const newRole =
                roleSelect.value;

            const currentRole =
                button.dataset.currentRole;

            if (newRole === currentRole) {

                showAdminUsersMessage(
                    "No role change was made."
                );

                return;

            }

            button.disabled = true;

            button.textContent =
                "Updating...";

            try {

                const response =
                    await fetch(
                        `http://localhost:3000/api/admin/users/${userId}/role`,
                        {
                            method: "PATCH",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                "Authorization":
                                    `Bearer ${adminUser.token}`
                            },

                            body: JSON.stringify({
                                role: newRole
                            })
                        }
                    );

                const result =
                    await response.json();

                if (!response.ok) {

                    throw new Error(
                        result.message ||
                        "Failed to update user role"
                    );

                }

                showAdminUsersMessage(
                    `User ${userId} role updated successfully.`
                );

                await loadAdminUsers();

            } catch (error) {

                console.error(
                    "Failed to update user role:",
                    error
                );

                showAdminUsersMessage(
                    error.message,
                    true
                );

                button.disabled = false;

                button.textContent =
                    "Update Role";
            }

        }
    );

});

}

/* ========================================
Load Page
======================================== */

if (
adminUser &&
adminUser.token &&
adminUser.role === "ADMIN"
) {

loadAdminUsers();

}