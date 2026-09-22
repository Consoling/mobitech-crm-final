"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendErrorLogEvent = void 0;
const sendErrorLogEvent = (eventCode, eventTitle, eventMessage) => {
    console.log(`Error Log Event - Code: ${eventCode}, Title: ${eventTitle}, Message: ${eventMessage}`);
};
exports.sendErrorLogEvent = sendErrorLogEvent;
