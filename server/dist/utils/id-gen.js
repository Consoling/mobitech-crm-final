"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSixDigitNumber = void 0;
const generateSixDigitNumber = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};
exports.generateSixDigitNumber = generateSixDigitNumber;
