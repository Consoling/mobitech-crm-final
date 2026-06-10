"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.noCache = void 0;
const noCache = (_req, res, next) => {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    res.set("Surrogate-Control", "no-store");
    next();
};
exports.noCache = noCache;
