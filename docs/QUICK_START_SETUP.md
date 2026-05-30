# Campus Ease - Quick Start Setup Guide

## 🚀 Initial System Setup

After deploying the role-based access control system, follow these steps to set up your campus:

---

## Step 1: Bootstrap Super Admin (One-Time)

Since user creation now requires authorization, you need to set up an initial Super Admin through direct database insertion.

### Option A: Modify seed.js
Add this to your `seed.js` file in the backend:

```javascript
const superAdminUser = {
  name: 'Campus Admin',
  email: 'admin@college.edu',
  address: 'College Campus',
  password: await bcrypt.hash('SuperAdmin@123', 10),
  confirmPassword: await bcrypt.hash('SuperAdmin@123', 10),
  role: 'super-admin',
  department: 'general',
  registereddate: new Date().toDateString(),
  isVerified: true,
  isPasswordSet: true
};

await userRegister.create(superAdminUser);
console.log('✅ Super Admin created');
```

### Option B: Use Postman/API Client

1. Add user directly via MongoDB:
```javascript
db.registers.insertOne({
  name: 'Campus Admin',
  email: 'admin@college.edu',
  address: 'College Campus',
  password: '$2b$10$...', // hashed password
  role: 'super-admin',
  department: 'general',
  isVerified: true,
  isPasswordSet: true
})
```

---

## Step 2: Login as Super Admin

1. Go to login page: `http://localhost:4200/login`
2. Enter credentials:
   - Email: `admin@college.edu`
   - Password: `SuperAdmin@123`
3. You should see the dashboard

---

## Step 3: Navigate to User Management

1. From dashboard, go to **User Management**
2. You should see the new role dropdown with all roles

---

## Step 4: Create Department Heads

### Create Principal (Academic Department)
```
Name: Dr. Principal Name
Email: principal@college.edu
Role: Principal
Department: Academic
Address: College Campus
Password: Your_secure_password
```

### Create Finance Officer
```
Name: Finance Officer Name
Email: finance@college.edu
Role: Finance Officer
Department: Finance
Address: College Campus
Password: Your_secure_password
```

### Create Operations Officer
```
Name: Operations Officer Name
Email: operations@college.edu
Role: Operations Officer
Department: Operations
Address: College Campus
Password: Your_secure_password
```

### Create IT Officer
```
Name: IT Officer Name
Email: it@college.edu
Role: IT Officer
Department: Administration
Address: College Campus
Password: Your_secure_password
```

---

## Step 5: Create Academic Staff

### Create a Coordinator
```
Name: Coordinator Name
Email: coordinator@college.edu
Role: Coordinator
Department: Academic
Address: College Campus
Password: Your_secure_password
```

### Create a HOD (Head of Department)
```
Name: HOD Name
Email: hod@college.edu
Role: HOD
Department: Academic
Address: College Campus
Password: Your_secure_password
```

### Create Teachers/Faculty
```
Name: Teacher Name
Email: teacher@college.edu
Role: Faculty
Department: Academic
Address: College Campus
Password: Your_secure_password
```

---

## Step 6: Create Administration Staff

### Create IT Officer
```
Role: IT Officer
Department: Administration
```

### Create Receptionist
```
Role: Receptionist
Department: Administration
```

### Create Graphic Designer
```
Role: Graphic Designer
Department: Administration
```

### Create Secretary
```
Role: Secretary
Department: Administration
```

---

## Step 7: Create Students

### Standard Student Creation
```
Name: Student Name
Email: student@college.edu
Role: Student
Department: General (auto-selected)
Roll Number: 001
Address: Student Address
Password: Your_secure_password
```

---

## ✅ Verification Checklist

After setup, verify:

- [ ] Super Admin can login
- [ ] Super Admin can create all user types
- [ ] Principal can create Faculty and HOD
- [ ] Faculty can only view (cannot create users)
- [ ] Students receive verification emails
- [ ] Teachers can access marks entry
- [ ] Finance Officer can view fees
- [ ] Operations Officer can view assets

---

## 🔑 Default Test Credentials

After setup, you'll have these users (customize passwords in production):

| Role | Email | Password | Department |
|------|-------|----------|-----------|
| Super Admin | admin@college.edu | SuperAdmin@123 | General |
| Principal | principal@college.edu | Principal@123 | Academic |
| Coordinator | coordinator@college.edu | Coord@123 | Academic |
| HOD | hod@college.edu | HOD@123 | Academic |
| Faculty | teacher@college.edu | Teacher@123 | Academic |
| Finance Officer | finance@college.edu | Finance@123 | Finance |
| IT Officer | it@college.edu | IT@123 | Administration |
| Operations | operations@college.edu | Ops@123 | Operations |

---

## 📱 Next Steps After Setup

1. **Import Existing Students**: Use Excel/CSV import if available
2. **Verify All Users**: Check verification status in database
3. **Test Access**: Login as different roles to verify permissions
4. **Enable Marks Entry**: Teachers can start entering marks
5. **Configure Departments**: Add courses/subjects to departments
6. **Set Schedules**: Create class schedules
7. **Enroll Students**: Link students to courses

---

## ⚠️ Important Security Notes

1. **Change Default Passwords**: Immediately change all default passwords
2. **Use HTTPS**: In production, always use HTTPS
3. **Protect SECRET_KEY**: Keep your JWT secret key secure
4. **Email Configuration**: Verify email settings in .env file
5. **Backup Database**: Regular backups before production

---

## 🆘 Common Issues During Setup

### Issue: "User not found" when login
- Verify user was created in database
- Check email spelling
- Ensure `isVerified: true` and `isPasswordSet: true`

### Issue: "Authorization failed" when creating users
- Verify your role has permission
- Check ROLE_PERMISSIONS in authRoles.js
- Login again to refresh token

### Issue: Department not required for HOD
- Clear form cache: F12 → Application → Local Storage → Clear
- Refresh page
- Select HOD role again

### Issue: Marks entry not working
- Ensure user role is Faculty/Coordinator/Director/Principal
- Check token includes department field
- Verify subject exists in system

---

## 📊 Database Verification

To verify your setup, check these collections:

```javascript
// Check users are created with correct fields
db.registers.find().pretty()

// Should have department field for all users
db.registers.findOne({ email: 'admin@college.edu' })

// Check marks entries
db.marksentries.count()
```

---

## 🎯 Success Indicators

Your setup is successful when:
- ✅ Super Admin successfully logs in
- ✅ User Management dashboard loads
- ✅ All new roles appear in dropdown
- ✅ Department field appears for appropriate roles
- ✅ Users can be created without authorization errors
- ✅ Teachers can access marks entry feature
- ✅ Finance Officer can view fees
- ✅ Operations Officer can view assets

---

**Ready to go!** Your Campus Ease system is now configured with comprehensive role-based access control. 🎓
