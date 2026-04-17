"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNgo = void 0;
const ngo_model_1 = require("../models/ngo.model");
const createNgo = async (req, res) => {
    try {
        const newNgo = new ngo_model_1.Ngo(req.body);
        await newNgo.save();
        res.status(201).json(newNgo);
    }
    catch (error) {
        res.status(400).json({ message: 'Failed to create NGO', error: error.message });
    }
};
exports.createNgo = createNgo;
