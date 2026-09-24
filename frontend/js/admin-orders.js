const adminOrdersTableBody =
    document.getElementById("admin-orders-table-body");

const adminOrdersMessage =
    document.getElementById("admin-orders-message");

const adminOrdersCount =
    document.getElementById("admin-orders-count");

const adminOrderUser =
    JSON.parse(localStorage.getItem("demartUser"));

/* ========================================
   Admin Access Protection
   ======================================== */

if (!adminOrderUser || !adminOrderUser.token) {

    window.location.href = "login.html";

} else if (adminOrderUser.role !== "ADMIN") {

    window.location.href = "home.html";
}

/* ========================================
   Message
   ======================================== */

function showAdminOrdersMessage(message, isError = false) {

    adminOrdersMessage.textContent = message;
    adminOrdersMessage.hidden = false;

    adminOrdersMessage.classList.toggle(
        "error",
        isError
    );
}

/* ========================================
   Status Options
   ======================================== */

function getAvailableStatuses(currentStatus) {

    const transitions = {

        PENDING: [
            "CONFIRMED",
            "CANCELLED"
        ],

        CONFIRMED: [
            "PROCESSING",
            "CANCELLED"
        ],

        PROCESSING: [
            "SHIPPED"
        ],

        SHIPPED: [
            "DELIVERED"
        ],

        DELIVERED: [],

        CANCELLED: []

    };

    return transitions[currentStatus] || [];
}

/* ========================================
   Format Date
   ======================================== */

function formatOrderDate(value) {

    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleDateString(
        "en-GB",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}

/* ========================================
   Format Currency
   ======================================== */

function formatCurrency(value) {

    const amount = Number(value);

    if (Number.isNaN(amount)) {
        return "€0.00";
    }

    return amount.toLocaleString(
        "de-DE",
        {
            style: "currency",
            currency: "EUR"
        }
    );
}

/* ========================================
   Status Class
   ======================================== */

function getStatusClass(status) {

    return `order-status order-status-${String(
        status
    ).toLowerCase()}`;
}

/* ========================================
   Load Orders
   ======================================== */

async function loadAdminOrders() {

    try {

        adminOrdersTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="admin-orders-loading">
                    Loading orders...
                </td>
            </tr>
        `;

        const response = await fetch(
            "http://localhost:3000/api/admin/orders",
            {
                method: "GET",
                headers: {
                    "Authorization":
                        `Bearer ${adminOrderUser.token}`
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

        adminOrdersCount.textContent =
            orders.length;

        renderAdminOrders(orders);

    } catch (error) {

        console.error(
            "Failed to load admin orders:",
            error
        );

        adminOrdersCount.textContent = "—";

        adminOrdersTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="admin-orders-empty" data-testid="admin-orders-error">
                    <strong>Unable to load orders</strong>
                    <span>
                        ${error.message}
                    </span>
                    <button
                        type="button"
                        class="admin-orders-retry-button"
                        id="admin-orders-retry-button"
                        data-testid="admin-orders-retry"
                    >
                        Retry
                    </button>
                </td>
            </tr>
        `;

        const retryButton =
            document.getElementById(
                "admin-orders-retry-button"
            );

        if (retryButton) {

            retryButton.addEventListener(
                "click",
                loadAdminOrders
            );
        }
    }
}

/* ========================================
   Render Orders
   ======================================== */

function renderAdminOrders(orders) {

    if (!orders.length) {

        adminOrdersTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="admin-orders-empty" data-testid="admin-orders-empty">
                    <strong>No orders yet</strong>
                    <span>
                        Customer orders will appear here
                        after they are placed.
                    </span>
                </td>
            </tr>
        `;

        return;
    }

    adminOrdersTableBody.innerHTML = "";

    orders.forEach(function (order) {

        const row =
            document.createElement("tr");

        row.setAttribute("data-testid", "admin-order-row");
        row.setAttribute("data-order-id", order.id);

        const availableStatuses =
            getAvailableStatuses(order.status);

        const statusOptions = [
            `<option value="${order.status}" selected>
                ${order.status}
            </option>`,
            ...availableStatuses.map(function (status) {
                return `
                    <option value="${status}">
                        ${status}
                    </option>
                `;
            })
        ].join("");

        const hasTransitions =
            availableStatuses.length > 0;

        row.innerHTML = `

            <td>
                <strong data-testid="admin-order-number">
                    #${order.id}
                </strong>
            </td>

            <td>
                <div class="admin-order-customer">
                    <strong data-testid="admin-order-customer-name">
                        ${order.customer_name}
                    </strong>
                    <span data-testid="admin-order-customer-email">
                        ${order.customer_email}
                    </span>
                </div>
            </td>

            <td data-testid="admin-order-date">
                ${formatOrderDate(order.created_at)}
            </td>

            <td>
                <strong data-testid="admin-order-total">
                    ${formatCurrency(order.total_amount)}
                </strong>
            </td>

            <td>
                <span
                    class="${getStatusClass(order.status)}"
                    data-testid="admin-order-status">
                    ${order.status}
                </span>
            </td>

            <td>

                ${
                    hasTransitions
                    ? `
                        <div class="admin-order-action">

                            <select
                                class="admin-order-status-select"
                                data-testid="admin-order-status-select"
                                data-order-id="${order.id}"
                            >
                                ${statusOptions}
                            </select>

                            <button
                                type="button"
                                class="admin-order-update-button"
                                data-testid="admin-order-update"
                                data-order-id="${order.id}"
                                data-current-status="${order.status}"
                            >
                                Update
                            </button>

                        </div>
                    `
                    : `
                        <span
                            class="admin-order-terminal"
                            data-testid="admin-order-terminal">
                            No further action
                        </span>
                    `
                }

            </td>
        `;

        adminOrdersTableBody.appendChild(row);
    });

    attachOrderUpdateHandlers();
}

/* ========================================
   Update Order Status
   ======================================== */

function attachOrderUpdateHandlers() {

    const buttons =
        document.querySelectorAll(
            ".admin-order-update-button"
        );

    buttons.forEach(function (button) {

        button.addEventListener(
            "click",
            async function () {

                const orderId =
                    button.dataset.orderId;

                const select =
                    document.querySelector(
                        `.admin-order-status-select[data-order-id="${orderId}"]`
                    );

                if (!select) {
                    return;
                }

                const newStatus =
                    select.value;

                const currentStatus =
                    button.dataset.currentStatus;

                if (newStatus === currentStatus) {

                    showAdminOrdersMessage(
                        "No status change was made."
                    );

                    return;
                }

                button.disabled = true;
                select.disabled = true;
                button.textContent = "Updating...";

                try {

                    const response =
                        await fetch(
                            `http://localhost:3000/api/admin/orders/${orderId}/status`,
                            {
                                method: "PATCH",
                                headers: {
                                    "Content-Type":
                                        "application/json",

                                    "Authorization":
                                        `Bearer ${adminOrderUser.token}`
                                },
                                body: JSON.stringify({
                                    status: newStatus
                                })
                            }
                        );

                    const result =
                        await response.json();

                    if (!response.ok) {

                        throw new Error(
                            result.message ||
                            "Failed to update order status"
                        );
                    }

                    showAdminOrdersMessage(
                        `Order #${orderId} status updated successfully.`
                    );

                    await loadAdminOrders();

                } catch (error) {

                    console.error(
                        "Failed to update order status:",
                        error
                    );

                    showAdminOrdersMessage(
                        error.message,
                        true
                    );

                    button.disabled = false;
                    select.disabled = false;
                    button.textContent = "Update";
                }
            }
        );
    });
}

/* ========================================
   Load Page
   ======================================== */

if (
    adminOrderUser &&
    adminOrderUser.token &&
    adminOrderUser.role === "ADMIN"
) {
    loadAdminOrders();
}
