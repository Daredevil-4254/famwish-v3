"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ngo_controller_1 = require("../controllers/ngo.controller");
const router = (0, express_1.Router)();
router.post('/', ngo_controller_1.createNgo); // Admin action
exports.default = router;
