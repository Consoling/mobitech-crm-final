"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidIMEI = isValidIMEI;
function isValidIMEI(imei) {
    if (!/^\d{15}$/.test(imei))
        return false;
    let sum = 0;
    for (let i = 0; i < 14; i++) {
        let digit = parseInt(imei[i]);
        if (i % 2 === 1) {
            digit *= 2;
            if (digit > 9)
                digit -= 9;
        }
        sum += digit;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === parseInt(imei[14]);
}
