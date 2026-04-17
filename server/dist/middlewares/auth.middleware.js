"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireClerkAuth = exports.attachClerkAuth = void 0;
const express_1 = require("@clerk/express");
// Global middleware that injects the auth state into the request object
exports.attachClerkAuth = (0, express_1.clerkMiddleware)();
// Middleware to protect routes that require authentication
exports.requireClerkAuth = (0, express_1.requireAuth)();
