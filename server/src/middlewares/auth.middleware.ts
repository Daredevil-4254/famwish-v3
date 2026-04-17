import { clerkMiddleware, requireAuth } from '@clerk/express';

// Global middleware that injects the auth state into the request object
export const attachClerkAuth = clerkMiddleware();

// Middleware to protect routes that require authentication
export const requireClerkAuth = requireAuth();
