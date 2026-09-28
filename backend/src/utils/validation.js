function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidText(value, maxLength) {
    return (
        typeof value === "string" &&
        value.trim().length > 0 &&
        value.trim().length <= maxLength
    );
}

function isValidOptionalText(value, maxLength) {
    if (
        value === undefined ||
        value === null ||
        (typeof value === "string" && value.trim() === "")
    ) {
        return true;
    }

    return (
        typeof value === "string" &&
        value.trim().length <= maxLength
    );
}

function isValidPhone(phone) {
    return (
        typeof phone === "string" &&
        /^\+?[0-9][0-9\s()-]{6,29}$/.test(phone.trim())
    );
}

function isValidPostalCode(postalCode) {
    return (
        typeof postalCode === "string" &&
        /^[A-Za-z0-9][A-Za-z0-9\s-]{1,19}$/.test(postalCode.trim())
    );
}

function validateAddressFields({
    firstName,
    lastName,
    phone,
    street,
    postalCode,
    city,
    country,
    addressLine2,
    landmark
}) {
    if (!isValidText(firstName, 100)) {
        return "First name must be between 1 and 100 characters";
    }

    if (!isValidText(lastName, 100)) {
        return "Last name must be between 1 and 100 characters";
    }

    if (!isValidPhone(phone)) {
        return "Please enter a valid phone number";
    }

    if (!isValidText(street, 200)) {
        return "Street must be between 1 and 200 characters";
    }

    if (!isValidPostalCode(postalCode)) {
        return "Please enter a valid postal code";
    }

    if (!isValidText(city, 100)) {
        return "City must be between 1 and 100 characters";
    }

    if (!isValidText(country, 100)) {
        return "Country must be between 1 and 100 characters";
    }

    if (!isValidOptionalText(addressLine2, 100)) {
        return "Address line 2 must not exceed 100 characters";
    }

    if (!isValidOptionalText(landmark, 100)) {
        return "Landmark must not exceed 100 characters";
    }

    return null;
}

module.exports = {
    isValidEmail,
    validateAddressFields
};