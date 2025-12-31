/**
 * DEPRECATED: This file is maintained for backward compatibility only.
 *
 * All authentication and authorization logic has been consolidated into
 * /middleware/authMiddleware.js
 *
 * Please import from authMiddleware.js instead:
 *
 * import {
 *   authenticate,
 *   authorize,
 *   adminOnly,
 *   selfOrAdmin,
 *   selfOnly,
 *   authMiddleware,
 *   authorizeAdmin,
 *   authorizeSelfOrAdmin,
 *   authorizeSelfOnly
 * } from '../middleware/authMiddleware.js';
 */

// Re-export everything from authMiddleware for backward compatibility
export {
  authenticate,
  authorize,
  adminOnly,
  selfOrAdmin,
  selfOnly,
  orgadminOrAdmin,
  authenticated,
  authMiddleware,
  authorizeAdmin,
  authorizeSelfOrAdmin,
  authorizeSelfOnly,
} from "./authMiddleware.js";
