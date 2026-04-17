"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.socket = void 0;
const socket_io_client_1 = require("socket.io-client");
const URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:8080';
// Create a single, shared socket instance.
// The 'autoConnect: false' option prevents it from connecting immediately.
// We will manually connect when a component that needs it mounts.
exports.socket = (0, socket_io_client_1.io)(URL, {
    autoConnect: false,
});
