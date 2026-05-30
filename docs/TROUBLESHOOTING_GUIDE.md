# Campus Ease - Troubleshooting Guide

## Common Issues & Solutions

---

## 🔴 User Creation Issues

### Issue 1: "User Creation Button Not Working"

**Problem**: Create user button doesn't respond or form won't submit

**Solutions**:
1. Check browser console (F12) for errors
2. Verify form validation:
   ```
   - Name: 5+ characters, letters only
   - Email: valid format
   - Password: 6+ characters
   - Role: must be selected
   - Department: required for certain roles
   ```
3. Clear form and try again
4. Check that department field is visible for department-specific roles

**Test**:
```javascript
// Open console
userForm.valid  // should be true before submit
userForm.value  // check all fields are filled
```

---

### Issue 2: "Authorization Failed - Cannot Create User"

**Problem**: Getting 403 Forbidden error when creating users

**Solutions**:
1. **Verify Your Role**:
   - Only Super Admin, Admin, Principal, Coordinator, Director can create users
   - Login as the right role

2. **Check Token**:
   ```javascript
   // In browser console
   JSON.parse(localStorage.getItem('userToken'))
   // Should show your role
   ```

3. **Verify Target Role**:
   - Your role must have permission for the role you're creating
   - Admin can only create: Student, Faculty, Secretary
   - Principal can create: Principal, Coordinator, HOD, Director, Faculty

4. **Re-login**:
   - Logout and login again
   - Token might be expired

**Error Message Reference**:
```
"Your role (admin) cannot create users with role hod"
→ Admin cannot create HOD, need Principal/Super Admin
```

---

### Issue 3: "Department Field Not Showing"

**Problem**: Department dropdown doesn't appear in form

**Solutions**:
1. **Check Selected Role**:
   - Department shows only for: HOD, Director, Coordinator, IT Officer, Graphic Designer, Receptionist, Operations Officer, Finance Officer
   - If role is Student/Faculty, no department field needed

2. **Clear Browser Cache**:
   ```
   - Press Ctrl+Shift+Delete
   - Clear all browser data
   - Refresh page
   ```

3. **Check Form Control**:
   ```javascript
   // Open console
   userForm.get('department')  // should exist
   showDepartmentField  // should be true for HOD, etc.
   ```

---

### Issue 4: "Email Already Exists Error"

**Problem**: Cannot create user - email already registered

**Solutions**:
1. Use a different email address
2. If legitimate duplicate, delete old account first
3. Check email was typed correctly

**Database Check**:
```javascript
// MongoDB
db.registers.findOne({ email: 'user@college.edu' })
```

---

## 🔴 Login Issues

### Issue 5: "Cannot Login - User Not Verified"

**Problem**: Getting message "User is not verified. Please verify before login!"

**Solutions**:
1. Check email for verification link
2. Click verification link
3. Set password when prompted
4. Try login again

**If No Email Received**:
```javascript
// Check .env has correct email config
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_specific_password
```

---

### Issue 6: "Token Expired - Must Login Again"

**Problem**: Getting 401 Unauthorized error

**Solutions**:
1. Logout from all tabs
2. Login again to get fresh token
3. Close browser if issue persists
4. Check system time (shouldn't be far off)

**Check Token Expiration**:
```javascript
// Console
const token = JSON.parse(localStorage.getItem('userData')).token
// Look for 'exp' claim in JWT
```

---

### Issue 7: "Password Set Error Before Login"

**Problem**: Getting "Please set your password before logging in"

**Solutions**:
1. User must verify email first
2. User must set password on verification page
3. If issue persists, admin can reset via database:
   ```javascript
   db.registers.updateOne(
     { email: 'user@email.com' },
     { $set: { isPasswordSet: true } }
   )
   ```

---

## 🔴 Marks Entry Issues

### Issue 8: "Cannot Access Marks Entry - Permission Denied"

**Problem**: Getting 403 or 401 error when trying to enter marks

**Solutions**:
1. **Check Your Role**:
   - Only Faculty, Coordinator, Director, Principal can enter marks
   - Student, Admin roles cannot enter marks

2. **Check Department**:
   - Role must be in Academic department
   - Operations/Finance/Admin roles cannot enter marks

3. **Verify Token**:
   ```javascript
   // Console
   const user = JSON.parse(localStorage.getItem('userData'))
   user.role  // should be faculty, coordinator, director, or principal
   user.department  // should be academic
   ```

4. **Re-login**:
   - Token might be stale
   - Logout and login again

---

### Issue 9: "Student Not Found - Cannot Create Marks"

**Problem**: Error "Student not found" when creating marks entry

**Solutions**:
1. **Verify Student ID**:
   - Ensure student ID is correct (MongoDB ObjectId format)
   - Not the Roll Number, but the database ID

2. **Check Student Exists**:
   ```javascript
   // MongoDB
   db.registers.findById('student_id_here')
   // Should return student document
   ```

3. **Use Correct Student Email**:
   - Match exactly what's in database
   - Case-sensitive

---

### Issue 10: "Invalid Marks Value"

**Problem**: Error "Marks must be between 0 and 100"

**Solutions**:
1. Enter valid number between 0-100
2. If custom max, set totalMarks accordingly:
   - If totalMarks = 50, marks must be 0-50
   - If totalMarks = 200, marks must be 0-200

3. Example:
   ```
   Incorrect: marks=150, totalMarks=100
   Correct: marks=85, totalMarks=100
   ```

---

## 🔴 Frontend Display Issues

### Issue 11: "Role Dropdown Empty"

**Problem**: No roles showing in dropdown

**Solutions**:
1. Refresh page (Ctrl+F5)
2. Check browser console for errors
3. Verify component loaded correctly:
   ```javascript
   // Console
   userForm.get('role')  // should exist
   ```

---

### Issue 12: "Department Dropdown Disabled"

**Problem**: Department field exists but can't select

**Solutions**:
1. Ensure role requires department (HOD, Director, etc.)
2. Check form validation:
   ```javascript
   userForm.get('department')?.disabled  // shouldn't be true
   ```
3. Try different role first, then return

---

## 🔴 Backend/Database Issues

### Issue 13: "500 Internal Server Error"

**Problem**: Getting 500 error on any endpoint

**Solutions**:
1. **Check Backend Logs**:
   - Look for error messages in terminal
   - Check stack trace

2. **Verify Database Connection**:
   ```javascript
   // Backend would show connection error
   // Check MongoDB is running
   ```

3. **Common Causes**:
   - Missing .env variables
   - Database connection failed
   - Model schema mismatch

---

### Issue 14: "Cannot Parse JWT Token"

**Problem**: Error about invalid token format

**Solutions**:
1. **Check Token Format**:
   ```
   Authorization: Bearer eyJhbGci...
   // Must have "Bearer " prefix
   ```

2. **Verify Token Not Null**:
   ```javascript
   const token = localStorage.getItem('userToken')
   if (!token) {
     // Need to login
   }
   ```

3. **Check SECRET_KEY**:
   ```javascript
   // .env must have
   SECRET_KEY=your_secret_key_same_on_frontend
   ```

---

### Issue 15: "Department Field Not in Database"

**Problem**: Database queries fail for department

**Solutions**:
1. **Run Migration**:
   ```javascript
   // Manually add department to all users
   db.registers.updateMany(
     { department: { $exists: false } },
     { $set: { department: 'general' } }
   )
   ```

2. **Check Field Exists**:
   ```javascript
   db.registers.findOne({})
   // Should show department field
   ```

---

## 🔴 API & Integration Issues

### Issue 16: "CORS Error - No 'Access-Control-Allow-Origin' Header"

**Problem**: Frontend cannot reach backend API

**Solutions**:
1. **Verify CORS Configuration**:
   - Backend index.js must have:
   ```javascript
   const corsOptions = {
     origin: 'http://localhost:4200',
     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
     allowedHeaders: ['Content-Type', 'Authorization'],
     credentials: true,
   };
   app.use(cors(corsOptions));
   ```

2. **Check Frontend URL**:
   - Should match exactly (including port)
   - http://localhost:4200 (not https, not localhost:80)

3. **Restart Backend**:
   - Changes to CORS need backend restart

---

### Issue 17: "Authorization Header Not Sent"

**Problem**: Backend shows "No Authorization header"

**Solutions**:
1. **Check Service Code**:
   ```typescript
   // Must include Bearer token
   const headers = new HttpHeaders({
     'Authorization': `Bearer ${token}`
   });
   return this.http.post(url, data, { headers });
   ```

2. **Verify Token Exists**:
   ```typescript
   const token = this.getUserToken();
   if (!token) {
     // Must login first
   }
   ```

---

## ✅ Quick Diagnostic Checklist

Use this to identify issues:

- [ ] **Login First**: Are you logged in with correct role?
- [ ] **Check Token**: Does localStorage have 'userToken'?
- [ ] **Verify Role**: Is your role permitted for this action?
- [ ] **Check Department**: Is your department assigned?
- [ ] **Clear Cache**: Have you cleared browser cache?
- [ ] **Refresh Page**: Have you tried Ctrl+F5 to refresh?
- [ ] **Check Console**: Are there JavaScript errors in F12 console?
- [ ] **Restart Backend**: Have you restarted backend server?
- [ ] **MongoDB Running**: Is MongoDB database running?
- [ ] **Network Request**: Does Postman work for same endpoint?

---

## 🧪 Testing with Postman

### Test User Creation

1. **Login First**:
   - POST: `http://localhost:3200/signin`
   - Body: `{ "email": "admin@college.edu", "password": "SuperAdmin@123" }`
   - Save token from response

2. **Create User**:
   - POST: `http://localhost:3200/signupUser`
   - Headers: `Authorization: Bearer <token>`
   - Body:
   ```json
   {
     "name": "Test User",
     "email": "test@college.edu",
     "role": "faculty",
     "department": "academic",
     "address": "Test Address",
     "password": "TestPass123",
     "confirmPassword": "TestPass123"
   }
   ```

3. **Expected Response**:
   ```json
   {
     "message": "User created successfully",
     "user": { /* user data */ }
   }
   ```

---

## 📊 Performance Issues

### Issue 18: "Slow User Creation"

**Causes & Solutions**:
1. **Password Hashing**: Normal if creating user takes 1-2 seconds
2. **Email Sending**: May delay response by 2-5 seconds
3. **Database Connection**: Check MongoDB performance

---

### Issue 19: "High CPU Usage"

**Solutions**:
1. Check for infinite loops in routes
2. Verify database indexes created
3. Monitor server with `top` command

---

## 🔍 Debug Mode

### Enable Detailed Logging

**Backend**:
```javascript
// Add to routes
console.log('User role:', req.user.role);
console.log('User department:', req.user.department);
console.log('Required role:', allowedRoles);
```

**Frontend**:
```typescript
// Add to service
console.log('Token:', token);
console.log('Headers:', headers);
console.log('Response:', response);
```

---

## 📞 Getting Help

When reporting issues, include:
1. Error message (exact text)
2. Your user role
3. Steps to reproduce
4. Browser console errors
5. Backend server logs
6. Database state (if applicable)

---

## 🚨 Emergency Procedures

### Reset Everything

**Option 1: Clear User Data**
```javascript
// Delete a user
db.registers.deleteOne({ email: 'problematic@user.com' })
```

**Option 2: Reset User**
```javascript
// Fix verified status
db.registers.updateOne(
  { email: 'user@college.edu' },
  { $set: { isVerified: true, isPasswordSet: true } }
)
```

**Option 3: Re-seed Database**
```bash
# In backend directory
npm run seed  # if seed script exists
# Or manually run seed.js
node seed.js
```

---

## 📚 Additional Resources

- **API_DOCUMENTATION.md** - Complete API reference
- **ROLE_BASED_ACCESS_GUIDE.md** - Role definitions
- **QUICK_START_SETUP.md** - Initial setup
- **IMPLEMENTATION_SUMMARY.md** - Technical details

---

**Last Updated**: 2024  
**Version**: 1.0.0  
**Maintained By**: Campus Ease Development Team
