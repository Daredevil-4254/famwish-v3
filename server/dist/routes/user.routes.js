"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const router = (0, express_1.Router)();
// Endpoints
router.post('/', user_controller_1.createUser); // For testing setup
router.get('/:userId', user_controller_1.getUserProfile);
router.get('/clerk/:clerkId', user_controller_1.getUserByClerkId);
router.put('/:userId/tax-profile', user_controller_1.updateTaxProfile);
exports.default = router;
