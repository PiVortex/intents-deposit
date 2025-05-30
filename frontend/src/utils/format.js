/**
 * Formats a number string by dividing it by the specified number of decimals
 * @param {string|number} value The number string to format
 * @param {number} decimals The number of decimal places to divide by
 * @returns {string} Formatted string with proper decimal places
 */
export function formatDecimalAmount(value, decimals) {

    // Handle zero case and invalid inputs
    if (value === null || value === undefined || value === "0" || value === "" || value === 0) {
        return "0";
    }

    try {
        // Convert to string if it's a number or any other type
        if (typeof value !== 'string') {
            value = String(value);
        }

        // Additional validation
        if (typeof value !== 'string' || !value) {
            console.warn('Invalid value after conversion:', value);
            return "0";
        }

        // Remove any existing commas and trim whitespace
        value = value.replace(/,/g, "").trim();

        // Validate after trim
        if (!value) {
            return "0";
        }

        // Ensure decimals is a valid number
        if (typeof decimals !== 'number' || isNaN(decimals)) {
            console.warn('Invalid decimals value:', decimals);
            return value;
        }

        // Pad the value with leading zeros if needed
        value = value.padStart(decimals + 1, "0");

        // Split into whole and fractional parts
        const wholePart = value.slice(0, -decimals) || "0";
        const fractionPart = value.slice(-decimals);

        // Format the whole part with commas
        const formattedWhole = formatWithCommas(wholePart);

        // Combine parts and remove trailing zeros
        const result = trimTrailingZeroes(`${formattedWhole}.${fractionPart}`);
        return result;
    } catch (error) {
        console.error('Error in formatDecimalAmount:', error, {
            value,
            type: typeof value,
            decimals
        });
        return "0";
    }
}

/**
 * Removes trailing zeros after the decimal point
 * @param {string} value The string to process
 * @returns {string} String with trailing zeros removed
 */
function trimTrailingZeroes(value) {
    if (typeof value !== 'string') {
        console.warn('trimTrailingZeroes received non-string:', value);
        return "0";
    }
    return value.replace(/\.?0*$/, "");
}

/**
 * Formats a number string with commas for thousands
 * @param {string} value The string to format
 * @returns {string} String with commas added
 */
function formatWithCommas(value) {
    if (typeof value !== 'string') {
        console.warn('formatWithCommas received non-string:', value);
        return "0";
    }
    const pattern = /(-?\d+)(\d{3})/;
    while (pattern.test(value)) {
        value = value.replace(pattern, "$1,$2");
    }
    return value;
}

/**
 * Parses a decimal string into its smallest unit
 * @param {string|undefined} amount The decimal string to parse
 * @param {number} decimals The number of decimal places to multiply by
 * @returns {string|null} The parsed amount in smallest units
 */
export function parseDecimalAmount(amount, decimals) {
    if (!amount) {
        return null;
    }

    try {
        // Convert to string if it's a number or any other type
        if (typeof amount !== 'string') {
            amount = String(amount);
        }

        // Additional validation
        if (typeof amount !== 'string' || !amount) {
            console.warn('Invalid amount after conversion:', amount);
            return null;
        }

        // Remove commas and trim
        amount = amount.replace(/,/g, "").trim();

        // Validate after trim
        if (!amount) {
            return null;
        }

        // Ensure decimals is a valid number
        if (typeof decimals !== 'number' || isNaN(decimals)) {
            console.warn('Invalid decimals value:', decimals);
            return amount;
        }

        // Split into whole and fractional parts
        const split = amount.split(".");
        const wholePart = split[0];
        const fracPart = split[1] || "";

        if (split.length > 2 || fracPart.length > decimals) {
            throw new Error(`Cannot parse '${amount}' as decimal amount`);
        }

        // Combine parts and pad with zeros
        return trimLeadingZeroes(wholePart + fracPart.padEnd(decimals, "0"));
    } catch (error) {
        console.error('Error in parseDecimalAmount:', error);
        return null;
    }
}

/**
 * Removes leading zeros from a string
 * @param {string} value The string to process
 * @returns {string} String with leading zeros removed
 */
function trimLeadingZeroes(value) {
    if (typeof value !== 'string') {
        console.warn('trimLeadingZeroes received non-string:', value);
        return "0";
    }
    value = value.replace(/^0+/, "");
    if (value === "") {
        return "0";
    }
    return value;
} 