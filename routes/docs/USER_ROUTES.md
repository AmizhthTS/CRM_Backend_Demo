# User Routes - API Reference

## Overview

User routes handle user profile management, authentication, and related operations. All `/api/users/*` routes require authentication and enforce ownership-based access control.

---

## Authorization Rules for `/api/users/*`

### Access Control Matrix

```
A user can access a route if:
1. User is an ADMIN (any role = 'admin'), OR
2. User is accessing their OWN userId (req.params.userId === req.user.userId)
```

**Middleware Check:**

```javascript
if (req.user.role !== "admin" && req.user.userId !== req.params.userId) {
  return res.status(403).json({
    response: {
      responseStatus: 403,
      responseMessage: "Unauthorized: You can only access your own profile",
    },
  });
}
```

---

## User Routes Summary Table

### Authentication Routes

| Method | Route                      | Access    | Model Fields          |
| ------ | -------------------------- | --------- | --------------------- |
| POST   | `/api/auth/register`       | Public    | name, email, password |
| POST   | `/api/users/auth/register` | Public    | name, email, password |
| POST   | `/api/auth/login`          | Public    | email, password       |
| POST   | `/api/users/auth/login`    | Public    | email, password       |
| POST   | `/api/users/auth/logout`   | JWT Token | (none)                |

---

### User Profile Routes (`/api/users/*`)

| Method | Route                                | Access        | Model Fields                                                         |
| ------ | ------------------------------------ | ------------- | -------------------------------------------------------------------- |
| GET    | `/api/users/:userId`                 | Self \| Admin | \_id, name, email, role, createdAt, updatedAt                        |
| PUT    | `/api/users/:userId`                 | Self \| Admin | name, email                                                          |
| PATCH  | `/api/users/:userId`                 | Self \| Admin | name, email (⛔ role, password, email change requires admin/special) |
| POST   | `/api/users/:userId/change-password` | Self Only     | currentPassword, newPassword                                         |
| DELETE | `/api/users/:userId`                 | Self \| Admin | (none)                                                               |

---

### User Management Routes (Admin Only)

| Method | Route                     | Access     | Model Fields                       |
| ------ | ------------------------- | ---------- | ---------------------------------- |
| GET    | `/api/users`              | Admin Only | \_id, name, email, role, createdAt |
| PUT    | `/api/users/:userId/role` | Admin Only | role                               |

---

### UserMeta Routes

| Method | Route                        | Access    | Model Fields                                                                                                                                     |
| ------ | ---------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| POST   | `/api/user-meta/save`        | JWT Token | userId, avatar (url, alt), contacts (phoneNumber, countryCode, email, address, alternativePhoneNumber, alternativeCountryCode, alternativeEmail) |
| GET    | `/api/user-meta/get/:userId` | JWT Token | userId, avatar, contacts                                                                                                                         |
| GET    | `/api/user-meta/get`         | Public    | userId, avatar, contacts                                                                                                                         |

---

### Detailed Route Information

#### GET `/api/users/:userId`

| Property           | Value                            |
| ------------------ | -------------------------------- |
| **Method**         | GET                              |
| **Auth Required**  | ✅ Yes (JWT Token)               |
| **Access**         | Self OR Admin                    |
| **Purpose**        | Fetch user profile by ID         |
| **Who Can Access** | The user themselves OR any admin |

**Request:**

```
GET /api/users/507f1f77bcf86cd799439011
Authorization: <jwt_token>
```

**Success Response (200):**

```json
{
  "response": {
    "responseStatus": 200,
    "responseMessage": "User fetched successfully"
  },
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "createdAt": "2025-11-22T10:30:00Z",
    "updatedAt": "2025-11-22T10:30:00Z"
  }
}
```

**Error Response (403 Forbidden):**

```json
{
  "response": {
    "responseStatus": 403,
    "responseMessage": "Unauthorized: You can only access your own profile"
  }
}
```

---

#### PUT `/api/users/:userId`

| Property           | Value                                   |
| ------------------ | --------------------------------------- |
| **Method**         | PUT                                     |
| **Auth Required**  | ✅ Yes (JWT Token)                      |
| **Access**         | Self OR Admin                           |
| **Purpose**        | Update user profile (name, email)       |
| **Who Can Access** | The user themselves OR any admin        |
| **Cannot Update**  | password, role (use separate endpoints) |

**Request:**

```
PUT /api/users/507f1f77bcf86cd799439011
Authorization: <jwt_token>
Content-Type: application/json

{
  "name": "John Smith",
  "email": "johnsmith@example.com"
}
```

**Success Response (200):**

```json
{
  "response": {
    "responseStatus": 200,
    "responseMessage": "User updated successfully"
  },
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Smith",
    "email": "johnsmith@example.com",
    "role": "user",
    "updatedAt": "2025-11-22T11:45:00Z"
  }
}
```

**Error Response (403 Forbidden):**

```json
{
  "response": {
    "responseStatus": 403,
    "responseMessage": "Unauthorized: You can only update your own profile"
  }
}
```

---

#### PATCH `/api/users/:userId`

| Property           | Value                                   |
| ------------------ | --------------------------------------- |
| **Method**         | PATCH                                   |
| **Auth Required**  | ✅ Yes (JWT Token)                      |
| **Access**         | Self OR Admin                           |
| **Purpose**        | Partial update user profile             |
| **Who Can Access** | The user themselves OR any admin        |
| **Safeguards**     | ⛔ Cannot update: role, password, email |

**Request:**

```
PATCH /api/users/507f1f77bcf86cd799439011
Authorization: <jwt_token>
Content-Type: application/json

{
  "name": "John Smith"
}
```

**Allowed Fields:**

- `name` - User's full name only

**Protected Fields (Ignored):**

- `email` - Use separate endpoint or admin operation
- `password` - Use `/change-password` endpoint
- `role` - Use `/role` endpoint (admin only)
- `_id` - Cannot be changed
- `createdAt` - Auto-managed
- `updatedAt` - Auto-managed

**Success Response (200):**

```json
{
  "response": {
    "responseStatus": 200,
    "responseMessage": "User updated successfully"
  },
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Smith",
    "email": "john@example.com",
    "role": "user",
    "updatedAt": "2025-11-22T11:50:00Z"
  }
}
```

**Error Response (403 Forbidden):**

```json
{
  "response": {
    "responseStatus": 403,
    "responseMessage": "Unauthorized: You can only update your own profile"
  }
}
```

**Error Response (400 Bad Request - Attempting Protected Field):**

```json
{
  "response": {
    "responseStatus": 400,
    "responseMessage": "Cannot update protected fields: email, password, role"
  }
}
```

---

#### POST `/api/users/:userId/change-password`

| Property           | Value                                  |
| ------------------ | -------------------------------------- |
| **Method**         | POST                                   |
| **Auth Required**  | ✅ Yes (JWT Token)                     |
| **Access**         | Self ONLY (not admin)                  |
| **Purpose**        | Change user password                   |
| **Who Can Access** | Only the user themselves               |
| **Security**       | Requires current password verification |

**Request:**

```
POST /api/users/507f1f77bcf86cd799439011/change-password
Authorization: <jwt_token>
Content-Type: application/json

{
  "currentPassword": "oldPassword123",
  "newPassword": "newSecurePassword456"
}
```

**Validation Rules:**

- New password must be different from current password
- New password must be at least 8 characters
- Current password must match existing password
- Only the user themselves can change their password (not admin)

**Success Response (200):**

```json
{
  "response": {
    "responseStatus": 200,
    "responseMessage": "Password changed successfully"
  }
}
```

**Error Response (401 Unauthorized):**

```json
{
  "response": {
    "responseStatus": 401,
    "responseMessage": "Current password is incorrect"
  }
}
```

**Error Response (403 Forbidden):**

```json
{
  "response": {
    "responseStatus": 403,
    "responseMessage": "You cannot change another user's password"
  }
}
```

---

#### DELETE `/api/users/:userId`

| Property           | Value                                            |
| ------------------ | ------------------------------------------------ |
| **Method**         | DELETE                                           |
| **Auth Required**  | ✅ Yes (JWT Token)                               |
| **Access**         | Self OR Admin                                    |
| **Purpose**        | Delete user account                              |
| **Who Can Access** | The user themselves OR any admin                 |
| **Consequence**    | Account permanently deleted, cannot be recovered |

**Request:**

```
DELETE /api/users/507f1f77bcf86cd799439011
Authorization: <jwt_token>
```

**Success Response (200):**

```json
{
  "response": {
    "responseStatus": 200,
    "responseMessage": "User deleted successfully"
  }
}
```

**Error Response (403 Forbidden):**

```json
{
  "response": {
    "responseStatus": 403,
    "responseMessage": "Unauthorized: You can only delete your own account"
  }
}
```

---

### User Management Routes (Admin Only)

#### GET `/api/users`

| Property           | Value                                    |
| ------------------ | ---------------------------------------- |
| **Method**         | GET                                      |
| **Auth Required**  | ✅ Yes (JWT Token)                       |
| **Role Required**  | 🔐 Admin ONLY                            |
| **Purpose**        | List all users with pagination & filters |
| **Who Can Access** | Only users with role = 'admin'           |

**Request:**

```
GET /api/users?role=user&page=1&limit=10&search=john
Authorization: <jwt_token>
```

**Query Parameters:**
| Parameter | Type | Optional | Description |
|-----------|------|----------|-------------|
| `role` | String | Yes | Filter by role (admin, manager, staff, user, wholesalerUser) |
| `page` | Number | Yes | Page number (default: 1) |
| `limit` | Number | Yes | Results per page (default: 10) |
| `search` | String | Yes | Search by name or email |

**Success Response (200):**

```json
{
  "response": {
    "responseStatus": 200,
    "responseMessage": "Users fetched successfully"
  },
  "users": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "createdAt": "2025-11-22T10:30:00Z"
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "role": "manager",
      "createdAt": "2025-11-22T09:15:00Z"
    }
  ],
  "total": 2,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

**Error Response (403 Forbidden):**

```json
{
  "response": {
    "responseStatus": 403,
    "responseMessage": "Admin access required"
  }
}
```

---

#### PUT `/api/users/:userId/role`

| Property           | Value                                       |
| ------------------ | ------------------------------------------- |
| **Method**         | PUT                                         |
| **Auth Required**  | ✅ Yes (JWT Token)                          |
| **Role Required**  | 🔐 Admin ONLY                               |
| **Purpose**        | Change user role (admin privilege)          |
| **Who Can Access** | Only users with role = 'admin'              |
| **Valid Roles**    | admin, manager, staff, user, wholesalerUser |

**Request:**

```
PUT /api/users/507f1f77bcf86cd799439011/role
Authorization: <jwt_token>
Content-Type: application/json

{
  "role": "manager"
}
```

**Success Response (200):**

```json
{
  "response": {
    "responseStatus": 200,
    "responseMessage": "User role updated successfully"
  },
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "manager",
    "updatedAt": "2025-11-22T12:00:00Z"
  }
}
```

**Error Response (403 Forbidden):**

```json
{
  "response": {
    "responseStatus": 403,
    "responseMessage": "Admin access required"
  }
}
```

**Error Response (400 Bad Request):**

```json
{
  "response": {
    "responseStatus": 400,
    "responseMessage": "Invalid role. Valid roles: admin, manager, staff, user, wholesalerUser"
  }
}
```

---

### Admin Wholesale Management (`/api/admin/users/*`)

| Method | Route                        | Purpose                            | Notes                                      |
| ------ | ---------------------------- | ---------------------------------- | ------------------------------------------ |
| POST   | `/api/admin/users/wholesale` | Create wholesale account           | Sends welcome email with temp password     |
| GET    | `/api/admin/users`           | List users with filters/pagination | Supports `role`, `search`, `page`, `limit` |
| GET    | `/api/admin/users/stats`     | Aggregate counts by role           | Used for dashboards                        |
| GET    | `/api/admin/users/:id`       | Fetch specific user                | Returns profile without password           |
| PUT    | `/api/admin/users/:id`       | Update user name/email/role        | Validates email uniqueness                 |
| PATCH  | `/api/admin/users/:id/role`  | Change role only                   | Emails user about role changes             |
| DELETE | `/api/admin/users/:id`       | Delete user                        | Blocks deleting your own account           |

All routes require a valid JWT token and `role = admin`. Apply the `token` header exactly as the rest of the API.

---

## Complete Route Access Control Table

| Route                                | Method | Auth | Admin Only | Self Access | Public |
| ------------------------------------ | ------ | ---- | ---------- | ----------- | ------ |
| `/api/auth/register`                 | POST   | ❌   | ❌         | ✅          | ✅     |
| `/api/auth/login`                    | POST   | ❌   | ❌         | ✅          | ✅     |
| `/api/users/auth/logout`             | POST   | ✅   | ❌         | ✅          | ❌     |
| `/api/users/:userId`                 | GET    | ✅   | ❌         | ✅          | ❌     |
| `/api/users/:userId`                 | PUT    | ✅   | ❌         | ✅          | ❌     |
| `/api/users/:userId/change-password` | POST   | ✅   | ❌         | ✅ Only     | ❌     |
| `/api/users/:userId`                 | DELETE | ✅   | ❌         | ✅          | ❌     |
| `/api/users`                         | GET    | ✅   | ✅         | ❌          | ❌     |
| `/api/users/:userId/role`            | PUT    | ✅   | ✅         | ❌          | ❌     |
| `/api/admin/users/wholesale`         | POST   | ✅   | ✅         | ❌          | ❌     |
| `/api/admin/users`                   | GET    | ✅   | ✅         | ❌          | ❌     |
| `/api/admin/users/stats`             | GET    | ✅   | ✅         | ❌          | ❌     |
| `/api/admin/users/:id`               | GET    | ✅   | ✅         | ❌          | ❌     |
| `/api/admin/users/:id`               | PUT    | ✅   | ✅         | ❌          | ❌     |
| `/api/admin/users/:id`               | DELETE | ✅   | ✅         | ❌          | ❌     |
| `/api/admin/users/:id/role`          | PATCH  | ✅   | ✅         | ❌          | ❌     |

---

## Authorization Implementation

### Middleware for Self/Admin Access

```javascript
// Applies to: /api/users/:userId, /api/users/:userId/change-password, DELETE /api/users/:userId
export const authorizeSelfOrAdmin = (req, res, next) => {
  const requestedUserId = req.params.userId;
  const currentUserId = req.user.userId;
  const isAdmin = req.user.role === "admin";

  if (requestedUserId !== currentUserId && !isAdmin) {
    return res.status(403).json({
      response: {
        responseStatus: 403,
        responseMessage: "Unauthorized: You can only access your own profile",
      },
    });
  }

  next();
};
```

### Middleware for Admin-Only Access

```javascript
// Applies to: GET /api/users, PUT /api/users/:userId/role
export const authorizeAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      response: {
        responseStatus: 403,
        responseMessage: "Admin access required",
      },
    });
  }

  next();
};
```

### Middleware for Password Change (Self Only)

```javascript
// Applies to: POST /api/users/:userId/change-password
export const authorizeSelfOnly = (req, res, next) => {
  const requestedUserId = req.params.userId;
  const currentUserId = req.user.userId;

  if (requestedUserId !== currentUserId) {
    return res.status(403).json({
      response: {
        responseStatus: 403,
        responseMessage: "You cannot change another user's password",
      },
    });
  }

  next();
};
```

---

## Common Error Responses

| Status | Error        | Reason                                         |
| ------ | ------------ | ---------------------------------------------- |
| 400    | Bad Request  | Invalid input format or missing fields         |
| 401    | Unauthorized | Invalid/expired token or wrong password        |
| 403    | Forbidden    | User doesn't have permission for this resource |
| 404    | Not Found    | User ID doesn't exist                          |
| 409    | Conflict     | Email already registered                       |
| 500    | Server Error | Internal server error                          |

---

## Usage Examples

### Example 1: User accessing their own profile

```bash
# User with ID 507f1f77bcf86cd799439011 accessing their own data
curl -X GET http://localhost:5000/api/users/507f1f77bcf86cd799439011 \
  -H "Authorization: <jwt_token_for_507f1f77bcf86cd799439011>"
# Response: ✅ 200 OK
```

### Example 2: User attempting unauthorized access

```bash
# User with ID 507f1f77bcf86cd799439011 trying to access another user's data
curl -X GET http://localhost:5000/api/users/507f1f77bcf86cd799439012 \
  -H "Authorization: <jwt_token_for_507f1f77bcf86cd799439011>"
# Response: ❌ 403 Forbidden
```

### Example 3: Admin accessing any user

```bash
# Admin user accessing another user's data
curl -X GET http://localhost:5000/api/users/507f1f77bcf86cd799439012 \
  -H "Authorization: <jwt_token_for_admin>"
# Response: ✅ 200 OK (because user is admin)
```

### Example 4: Unauthorized access (no token)

```bash
# No authentication token provided
curl -X GET http://localhost:5000/api/users/507f1f77bcf86cd799439011
# Response: ❌ 401 Unauthorized
```

---

## Implementation Checklist

- [ ] Implement `authMiddleware` for token verification
- [ ] Implement `authorizeSelfOrAdmin` middleware for profile routes
- [ ] Implement `authorizeAdmin` middleware for admin routes
- [ ] Implement `authorizeSelfOnly` middleware for password changes
- [ ] Add input validation on all endpoints
- [ ] Hash passwords with bcrypt (10 salt rounds)
- [ ] Verify email uniqueness on registration/update
- [ ] Add rate limiting on auth endpoints
- [ ] Add comprehensive error handling
- [ ] Add logging for security audits
- [ ] Test all authorization scenarios
- [ ] Document in API specification
