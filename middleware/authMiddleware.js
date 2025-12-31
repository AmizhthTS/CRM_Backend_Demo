import jwt from "jsonwebtoken";

/**
 * STEP 1: JWT TOKEN VERIFICATION MIDDLEWARE
 * Decodes and verifies the JWT token from request headers
 * Attaches decoded user info to req.user
 */
export const authenticate = (req, res, next) => {
  const token = req.headers.token;

  if (!token) {
    return res.status(401).json({
      response: {
        responseStatus: 401,
        responseMessage: "No token provided",
      },
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { userId, role, email, iat, exp }
    next();
  } catch (error) {
    return res.status(401).json({
      response: {
        responseStatus: 401,
        responseMessage: "Invalid or expired token",
      },
    });
  }
};

/**
 * STEP 2: ROLE-BASED AUTHORIZATION MIDDLEWARE
 * Flexible authorization that supports: 'admin', 'user', 'wholesalerUser', 'self'
 *
 * Usage:
 *   authorize(['admin'])                    - Admin only
 *   authorize(['admin', 'self'])            - Admin or the user themselves
 *   authorize(['admin', 'wholesalerUser'])      - Admin or wholesalerUser
 *   authorize(['self'])                     - User can only access their own resource
 *
 * @param {Array<string>} allowedRoles - Array of allowed roles or 'self'
 * @returns {Function} Express middleware function
 */
export const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    const userRole = req.user?.role;
    const currentUserId = req.user?.userId;
    const requestedUserId = req.params.userId || req.params.id;

    // Check if user has required role
    const hasRole = allowedRoles.includes(userRole);
    // Check if 'self' is allowed and user is accessing their own resource
    const isSelf =
      allowedRoles.includes("self") &&
      requestedUserId &&
      currentUserId === requestedUserId;
    // Admin always has access (unless specifically excluded)
    const isAdmin = userRole === "admin";
    if (hasRole || isSelf || (isAdmin && allowedRoles.includes("admin"))) {
      return next();
    }
    // Determine appropriate error message
    let errorMessage = "Access denied";
    if (allowedRoles.includes("self") && !isSelf) {
      errorMessage = "You can only access your own resources";
    } else if (allowedRoles.includes("admin")) {
      errorMessage = "Admin access required";
    }

    return res.status(403).json({
      response: {
        responseStatus: 403,
        responseMessage: errorMessage,
      },
    });
  };
};

/**
 * COMMON MIDDLEWARE COMBINATIONS
 * Pre-configured middleware chains for common use cases
 */

// Admin only access
export const adminOnly = [authenticate, authorize(["admin"])];

// User can access their own resource OR admin can access any
export const selfOrAdmin = [authenticate, authorize(["self", "admin"])];

// Self only (for sensitive operations like password changes)
export const selfOnly = [authenticate, authorize(["self"])];

// Wholesaler or admin
export const orgadminOrAdmin = [authenticate, authorize(["orgadmin", "admin"])];

// Any authenticated user
export const authenticated = [authenticate];

/**
 * BACKWARD COMPATIBILITY EXPORTS
 * These maintain compatibility with existing code
 */
export const authMiddleware = authenticate;
export const authorizeAdmin = authorize(["admin"]);
export const authorizeSelfOrAdmin = authorize(["self", "admin"]);
export const authorizeSelfOnly = authorize(["self"]);
