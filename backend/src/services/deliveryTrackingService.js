const deliveryRepository = require("../repositories/deliveryRepository");
const deliveryTrackingRepository =
    require("../repositories/deliveryTrackingRepository");

const pool = require("../db/db");

const VALID_STATUSES = [
    "CREATED",
    "ASSIGNED",
    "PICKED_UP",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "CANCELLED"
];

async function addTrackingUpdate({
    deliveryId,
    status,
    latitude,
    longitude,
    note,
    recordedAt
}) {
    if (!deliveryId) {
        throw new Error("Delivery ID is required");
    }

    if (status && !VALID_STATUSES.includes(status)) {
        throw new Error("Invalid delivery tracking status");
    }

    const delivery =
        await deliveryRepository.findDeliveryById(deliveryId);

    if (!delivery) {
        throw new Error("Delivery not found");
    }

    const hasLatitude =
        latitude !== null && latitude !== undefined;

    const hasLongitude =
        longitude !== null && longitude !== undefined;

    if (hasLatitude !== hasLongitude) {
        throw new Error(
            "Latitude and longitude must be provided together"
        );
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        if (status) {
            const updatedDelivery =
                await deliveryRepository.updateDeliveryStatus(
                    deliveryId,
                    status,
                    client
                );

            if (!updatedDelivery) {
                throw new Error("Delivery not found");
            }
        }

        const tracking =
            await deliveryTrackingRepository.createTrackingUpdate(
                deliveryId,
                status || null,
                latitude ?? null,
                longitude ?? null,
                note || null,
                recordedAt || null,
                client
            );

        await client.query("COMMIT");

        return tracking;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

async function getTrackingHistory(deliveryId) {
    if (!deliveryId) {
        throw new Error("Delivery ID is required");
    }

    return deliveryTrackingRepository.findTrackingByDeliveryId(
        deliveryId
    );
}

async function getLatestTracking(deliveryId) {
    if (!deliveryId) {
        throw new Error("Delivery ID is required");
    }

    return deliveryTrackingRepository.findLatestTrackingByDeliveryId(
        deliveryId
    );
}

async function getCustomerTrackingHistory(
    deliveryId,
    userId
) {
    if (!deliveryId) {
        throw new Error("Delivery ID is required");
    }

    if (!userId) {
        throw new Error("User ID is required");
    }

    const delivery =
        await deliveryRepository.findDeliveryByIdAndUserId(
            deliveryId,
            userId
        );

    if (!delivery) {
        throw new Error("Delivery not found");
    }

    return deliveryTrackingRepository.findTrackingByDeliveryId(
        deliveryId
    );
}

async function getCustomerLatestTracking(
    deliveryId,
    userId
) {
    if (!deliveryId) {
        throw new Error("Delivery ID is required");
    }

    if (!userId) {
        throw new Error("User ID is required");
    }

    const delivery =
        await deliveryRepository.findDeliveryByIdAndUserId(
            deliveryId,
            userId
        );

    if (!delivery) {
        throw new Error("Delivery not found");
    }

    return deliveryTrackingRepository.findLatestTrackingByDeliveryId(
        deliveryId
    );
}

module.exports = {
    addTrackingUpdate,
    getTrackingHistory,
    getLatestTracking,
    getCustomerTrackingHistory,
    getCustomerLatestTracking
};