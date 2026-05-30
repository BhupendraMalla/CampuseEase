# Campus Ease - API Documentation
## Marks Entry & Role-Based Access Control

---

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

### JWT Token Structure
```json
{
  "email": "user@college.edu",
  "userId": "507f1f77bcf86cd799439011",
  "name": "User Name",
  "rollno": 123,
  "role": "faculty",
  "department": "academic"
}
```

---

## User Management Endpoints

### Create User (User Registration)
- **Endpoint**: `POST /signupUser`
- **Auth**: Required (Bearer Token)
- **Allowed Roles**: Super Admin, Admin, Principal, Coordinator, Director
- **Request Body**:
```json
{
  "name": "John Smith",
  "email": "john@college.edu",
  "address": "Campus Address",
  "password": "SecurePass123",
  "confirmPassword": "SecurePass123",
  "role": "faculty",
  "department": "academic",
  "rollno": 101
}
```

- **Success Response** (201):
```json
{
  "message": "User created successfully",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Smith",
    "email": "john@college.edu",
    "role": "faculty",
    "department": "academic",
    "isVerified": false,
    "isPasswordSet": false
  }
}
```

- **Error Response** (403):
```json
{
  "message": "Your role (admin) cannot create users with role hod"
}
```

---

### Update User
- **Endpoint**: `PUT /updateUser/:id`
- **Auth**: Required (Bearer Token)
- **Allowed Roles**: Any authenticated user (self-update) or Super Admin/Admin/Principal/Coordinator/Director
- **Request Body**:
```json
{
  "name": "Jane Smith",
  "email": "jane@college.edu",
  "address": "New Address",
  "role": "faculty",
  "department": "academic"
}
```

- **Success Response** (200):
```json
{
  "message": "User updated successfully",
  "user": { /* updated user object */ }
}
```

---

### Delete User
- **Endpoint**: `DELETE /user/:id`
- **Auth**: Required (Bearer Token)
- **Allowed Roles**: Super Admin, Admin, Principal, Coordinator, Director
- **Success Response** (200):
```json
{
  "message": "User deleted successfully",
  "user": { /* deleted user object */ }
}
```

- **Error Response** (403):
```json
{
  "message": "Your role (admin) cannot delete users with role hod"
}
```

---

### Get Faculty Users
- **Endpoint**: `GET /user/faculty`
- **Auth**: Not Required
- **Response** (200):
```json
{
  "faculty": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Dr. John Smith",
      "email": "john@college.edu",
      "role": "faculty",
      "department": "academic"
    }
  ],
  "count": 15
}
```

---

### Get Student Users
- **Endpoint**: `GET /user/student`
- **Auth**: Not Required
- **Response** (200):
```json
{
  "student": [ /* student objects */ ],
  "count": 250
}
```

---

### Get Secretary Users
- **Endpoint**: `GET /user/secretary`
- **Auth**: Not Required
- **Response** (200):
```json
{
  "secretary": [ /* secretary objects */ ],
  "count": 5
}
```

---

## Marks Entry Endpoints

### Create Marks Entry
- **Endpoint**: `POST /marks/create`
- **Auth**: Required (Bearer Token)
- **Allowed Roles**: Faculty, Coordinator, Director, Principal, Super Admin
- **Request Body**:
```json
{
  "studentId": "507f1f77bcf86cd799439011",
  "studentEmail": "student@college.edu",
  "subjectId": "507f1f77bcf86cd799439012",
  "subjectName": "Mathematics",
  "marks": 85,
  "marksType": "internal",
  "totalMarks": 100,
  "remarks": "Good performance",
  "semester": 4,
  "academicYear": "2024-2025"
}
```

- **Success Response** (201):
```json
{
  "message": "Marks entry created successfully",
  "marksEntry": {
    "_id": "507f1f77bcf86cd799439013",
    "studentId": "507f1f77bcf86cd799439011",
    "studentEmail": "student@college.edu",
    "marks": 85,
    "marksType": "internal",
    "teacherEmail": "teacher@college.edu",
    "enteredAt": "2024-01-15T10:30:00Z"
  }
}
```

- **Validation Errors** (400):
```json
{
  "message": "Marks must be between 0 and 100"
}
```

---

### Update Marks Entry
- **Endpoint**: `PUT /marks/update/:id`
- **Auth**: Required (Bearer Token)
- **Allowed Roles**: Faculty (own entries only), Coordinator, Director, Principal, Super Admin
- **Request Body**:
```json
{
  "marks": 90,
  "marksType": "assignment",
  "remarks": "Improved performance",
  "totalMarks": 100
}
```

- **Success Response** (200):
```json
{
  "message": "Marks entry updated successfully",
  "marksEntry": { /* updated marks object */ }
}
```

---

### Get Student Marks
- **Endpoint**: `GET /marks/student/:studentId`
- **Auth**: Required (Bearer Token)
- **Allowed Roles**: Student (own marks), Faculty, Coordinator, Director, Principal, Super Admin, Finance Officer
- **Query Parameters**: None
- **Success Response** (200):
```json
{
  "marks": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "studentId": "507f1f77bcf86cd799439011",
      "subjectName": "Mathematics",
      "marks": 85,
      "marksType": "internal",
      "totalMarks": 100,
      "remarks": "Good performance",
      "enteredAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### Get Teacher's Marks
- **Endpoint**: `GET /marks/teacher/:teacherId`
- **Auth**: Required (Bearer Token)
- **Allowed Roles**: Faculty (own entries), Coordinator, Director, Principal, Super Admin
- **Success Response** (200):
```json
{
  "marks": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "teacherId": "507f1f77bcf86cd799439014",
      "studentId": "507f1f77bcf86cd799439011",
      "studentEmail": "student@college.edu",
      "marks": 85,
      "subjectName": "Mathematics",
      "marksType": "internal"
    }
  ]
}
```

---

### Get All Marks (Admin View)
- **Endpoint**: `GET /marks/all`
- **Auth**: Required (Bearer Token)
- **Allowed Roles**: Coordinator, Director, Principal, Super Admin
- **Query Parameters**:
  - `semester` (optional): Filter by semester
  - `academicYear` (optional): Filter by academic year
  - `department` (optional): Filter by department

- **Example**: `/marks/all?semester=4&academicYear=2024-2025&department=academic`

- **Success Response** (200):
```json
{
  "marks": [ /* array of marks objects */ ],
  "count": 45
}
```

---

### Get Subject Marks
- **Endpoint**: `GET /marks/subject/:subjectId`
- **Auth**: Required (Bearer Token)
- **Allowed Roles**: Faculty, Coordinator, Director, Principal, Super Admin
- **Success Response** (200):
```json
{
  "marks": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "studentId": "507f1f77bcf86cd799439011",
      "studentEmail": "student@college.edu",
      "marks": 85,
      "marksType": "internal"
    }
  ]
}
```

---

### Delete Marks Entry
- **Endpoint**: `DELETE /marks/:id`
- **Auth**: Required (Bearer Token)
- **Allowed Roles**: Coordinator, Director, Principal, Super Admin
- **Success Response** (200):
```json
{
  "message": "Marks entry deleted successfully"
}
```

- **Error Response** (403):
```json
{
  "message": "You can only delete marks from your department"
}
```

---

## Login Endpoint

### User Sign In
- **Endpoint**: `POST /signin`
- **Auth**: Not Required
- **Request Body**:
```json
{
  "email": "user@college.edu",
  "password": "UserPassword123"
}
```

- **Success Response** (200):
```json
{
  "message": "Login Sucessfull",
  "role": "faculty",
  "department": "academic",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

- **Error Response** (403):
```json
{
  "message": "Please set your password before logging in."
}
```

---

## Mark Types

Valid values for `marksType`:
- `internal` - Continuous/internal evaluation
- `assignment` - Assignment marks
- `quiz` - Quiz/test marks
- `midterm` - Mid-semester exam
- `final` - Final exam
- `other` - Custom/other marks

---

## Roles Reference

| Role | Can Create Users | Can Delete Users | Department |
|------|------------------|------------------|-----------|
| super-admin | ✅ All | ✅ All | N/A |
| admin | ✅ Limited | ✅ Limited | N/A |
| principal | ✅ Academic | ✅ Academic | Academic |
| coordinator | ✅ Faculty | ✅ Faculty | Academic |
| director | ✅ Faculty | ✅ Faculty | Academic |
| faculty | ❌ No | ❌ No | Academic |
| it-officer | ❌ No | ❌ No | Administration |
| receptionist | ❌ No | ❌ No | Administration |
| operations-officer | ❌ No | ❌ No | Operations |
| finance-officer | ❌ No | ❌ No | Finance |
| student | ❌ No | ❌ No | General |

---

## Error Codes & Messages

| Code | Message | Meaning |
|------|---------|---------|
| 400 | All fields are required | Missing required fields |
| 400 | Passwords do not match | Password and confirm don't match |
| 400 | Marks must be between 0 and 100 | Invalid marks value |
| 401 | Unauthorized request | No token or invalid token |
| 403 | Access denied | User doesn't have required role |
| 403 | You cannot delete this user | Authorization check failed |
| 404 | User not found | User doesn't exist |
| 409 | Already registered | Email already exists |
| 500 | Something went wrong | Server error |

---

## Rate Limiting

Currently no rate limiting. In production, implement:
- 10 requests per minute for login
- 100 requests per minute for general endpoints
- 50 requests per minute for mark entry

---

## CORS Configuration

**Allowed Origins**: `http://localhost:4200`  
**Allowed Methods**: GET, POST, PUT, DELETE, OPTIONS, PATCH  
**Allowed Headers**: Content-Type, Authorization  
**Credentials**: Enabled

---

## Best Practices

1. **Always use HTTPS** in production
2. **Validate input** on frontend before sending
3. **Handle token expiration** with login redirect
4. **Use Bearer tokens** correctly in Authorization header
5. **Catch all error responses** for user feedback
6. **Implement retry logic** for network failures
7. **Store token securely** (not in localStorage for sensitive apps)

---

## Testing with Postman

### Import Collection
1. Export from API docs
2. Set `baseURL` variable to `http://localhost:3200`
3. Set `token` variable with valid JWT from login endpoint

### Example Test Flow
1. POST `/signin` → Get token
2. POST `/marks/create` → Create marks (use token)
3. GET `/marks/all` → View all marks
4. PUT `/marks/update/{id}` → Update marks
5. DELETE `/marks/{id}` → Delete marks

---

**Last Updated**: 2024  
**API Version**: 1.0.0  
**Status**: Production Ready
