# Campus Ease - Role-Based Access Control & Department System
## Complete Implementation Guide

---

## 📋 Overview

The Campus Ease application now supports a comprehensive role-based access control (RBAC) system with department-based permissions. This guide explains the new features and how to use them.

---

## 🎯 New Roles & Departments

### Role Hierarchy

#### **Super Admin**
- **Permissions**: Full access to all departments and features
- **Can Create**: Any user type
- **Can Delete**: Any user
- **Can View**: All student details, assets, fees, marks
- **Department**: N/A (access all)

#### **Academic Department**
- **Principal**
  - View student details
  - View marks
  - Approve marks entry
  - Department: Academic

- **Coordinator**
  - View student details
  - View marks
  - Manage marks entry
  - Manage academic staff
  - Department: Academic

- **HOD (Head of Department)**
  - View student details
  - View marks in their department
  - Monitor marks entry
  - Department: Academic

- **Director**
  - View student details
  - Manage department operations
  - Department: Academic

- **Faculty/Teacher**
  - View students
  - **Enter marks for students** (NEW)
  - View marks entered
  - Department: Academic

#### **Administration Department**
- **IT Officer** - Manage IT systems, view student details
- **Graphic Designer** - Design materials, view student details
- **Receptionist** - Front desk operations, view student details
- **Secretary** - Administrative support, view student details
- **Department**: Administration

#### **Operations Department**
- **Operations Officer**
  - View college assets
  - Manage operations
  - Department: Operations

#### **Finance Department**
- **Finance Officer**
  - View student fees/dues
  - Manage financial records
  - Department: Finance

#### **General Roles**
- **Student** - View own data, view marks
- **Admin** - Legacy admin role (limited to student/faculty/secretary management)

---

## 👥 User Creation - Step by Step

### How to Create Users

1. **Login** as Super Admin, Admin, Principal, Coordinator, or Director
2. Navigate to **User Management Dashboard**
3. Fill in the form:
   - **Full Name**: User's full name
   - **Email**: Valid email address
   - **Role**: Select the role
   - **Department**: Required for department-specific roles
   - **Address**: Physical address
   - **Password & Confirm Password**: Set account password
   - **Roll Number** (optional): For students/teachers

### Role-Specific User Creation

#### ✅ Can Create (by Role):
- **Super Admin**: All roles
- **Admin**: Student, Faculty, Secretary only
- **Principal**: Principal, Coordinator, HOD, Director, Faculty
- **Coordinator**: Faculty, HOD, Coordinator
- **Director**: Faculty, HOD
- **Faculty/Teachers**: Cannot create users
- **Other Roles**: Cannot create users

#### Department Assignment Rules:
Department is **required** for:
- HOD
- Director
- Coordinator
- IT Officer
- Graphic Designer
- Receptionist
- Operations Officer
- Finance Officer

---

## 📊 Marks Entry Feature (NEW)

### Overview
Teachers can now enter marks for students with different mark types and manage academic records.

### Access Control
- **Who Can Enter**: Faculty, Coordinator, Director, Principal
- **Who Can View**: Students (own marks), Faculty (entered by them), Academic staff
- **Who Can Manage**: Coordinator, Director, Principal, Super Admin

### Mark Types
- **Internal** - Continuous evaluation
- **Assignment** - Assignment submissions
- **Quiz** - Quick assessments
- **Midterm** - Mid-semester exams
- **Final** - Final exams
- **Other** - Custom mark type

### How to Enter Marks

#### Backend API Endpoints:

1. **Create Marks Entry** (POST `/marks/create`)
   ```json
   {
     "studentId": "student_id_here",
     "studentEmail": "student@email.com",
     "subjectId": "subject_id_here",
     "subjectName": "Mathematics",
     "marks": 85,
     "marksType": "internal",
     "totalMarks": 100,
     "remarks": "Good performance",
     "semester": 4,
     "academicYear": "2024-2025"
   }
   ```

2. **Update Marks Entry** (PUT `/marks/update/{id}`)
   ```json
   {
     "marks": 90,
     "remarks": "Improved performance"
   }
   ```

3. **View Student Marks** (GET `/marks/student/{studentId}`)

4. **View Teacher's Entered Marks** (GET `/marks/teacher/{teacherId}`)

5. **View All Marks** (GET `/marks/all`)
   - Query parameters: `?semester=4&academicYear=2024-2025&department=academic`

6. **Delete Marks** (DELETE `/marks/{id}`)
   - Coordinator, Director, Principal, Super Admin only

---

## 🔐 Department-Based Access Control

### How It Works

When a user logs in:
1. Token contains `role` and `department`
2. System checks if user can access requested resource
3. Department restrictions are enforced

### Department Restrictions

| Department | Roles | What They Can Access |
|------------|-------|---------------------|
| **Academic** | Principal, Coordinator, HOD, Director, Faculty | Student info, marks, academic records |
| **Administration** | IT Officer, Designer, Receptionist, Secretary | Student info, office operations |
| **Operations** | Operations Officer | College assets, equipment |
| **Finance** | Finance Officer | Student fees, financial records |
| **General** | Student, Admin | Own data, assigned resources |

---

## 🛠️ Implementation Details

### Backend Files Modified

1. **middleware/authRoles.js** (NEW)
   - Role-based authorization
   - Department verification
   - Permission checking

2. **models/signupModel.js** (UPDATED)
   - Added `department` field
   - Added new role types

3. **models/createDepartmentModel.js** (UPDATED)
   - Added `roles` array
   - Added `department` field

4. **models/marksEntryModel.js** (NEW)
   - Marks storage schema
   - Tracks student, teacher, marks, type

5. **routes/sendemailRoutes.js** (UPDATED)
   - Added role authorization checks
   - User creation now validates permissions

6. **routes/userRoute.js** (UPDATED)
   - Added authorization to delete endpoint
   - Included department in JWT token
   - Added role checks for user updates

7. **routes/marksEntryRoutes.js** (NEW)
   - Full marks management API
   - Role-based access control

8. **index.js** (UPDATED)
   - Registered marksEntryRoutes

### Frontend Files Modified

1. **auth.guard.ts** (UPDATED)
   - Added role-based access checking
   - Added department-based access checking
   - Route data can specify `requiredRoles` and `requiredDepartments`

2. **user-management.component.html** (UPDATED)
   - Added all new roles to dropdown
   - Added department selection field
   - Conditional display for department field

3. **user-management.component.ts** (UPDATED)
   - Added `department` form control
   - Added `showDepartmentField` property
   - Added `onRoleChange()` method
   - List of department-required roles

---

## 🚀 Usage Examples

### Example 1: Create a Teacher
```
Role: Faculty
Department: Academic
Name: John Smith
Email: john@college.edu
```

### Example 2: Create an IT Officer
```
Role: IT Officer
Department: Administration
Name: Ram Kumar
Email: ram@college.edu
```

### Example 3: Create a Finance Officer
```
Role: Finance Officer
Department: Finance
Name: Priya Singh
Email: priya@college.edu
```

---

## 📝 Important Notes

1. **Department is Required for**:
   - HOD, Director, Coordinator (Academic Department)
   - IT Officer, Graphic Designer, Receptionist (Administration)
   - Operations Officer (Operations)
   - Finance Officer (Finance)

2. **Authorization Checks**:
   - All user creation goes through `/signupUser` endpoint
   - Requires Bearer token authentication
   - Role must have `canCreateUsers` permission for target role

3. **JWT Token Now Contains**:
   - email, userId, name, rollno, role, **department** (NEW)

4. **Password Requirements**:
   - Minimum 6 characters
   - Must match confirm password
   - Hashed with bcrypt before storage

5. **User Verification**:
   - `isVerified`: Must be true to login
   - `isPasswordSet`: Must be true to login
   - Verification email sent automatically

---

## 🔍 Troubleshooting

### Issue: User Creation Fails with "Access Denied"
- **Solution**: Ensure your account has permission to create that role
- Check your role and the target role's permissions

### Issue: Department Field Not Showing
- **Solution**: Department field appears only for department-specific roles
- Make sure role is one of: HOD, Director, Coordinator, IT Officer, etc.

### Issue: Marks Entry Not Working
- **Solution**: Verify you have Faculty or higher academic role
- Check that department is set to "Academic"

### Issue: Token Expired Error
- **Solution**: Re-login to refresh the token
- Tokens expire based on SECRET_KEY settings

---

## 📞 Support

For issues or questions:
1. Check the authorization middleware logs
2. Verify JWT token contains department field
3. Ensure role is in the ROLE_PERMISSIONS list
4. Check database for user's department and role values

---

## 🎓 Next Steps

1. **Create Users**: Start with Super Admin, then create department heads
2. **Set Up Departments**: Assign roles to departments
3. **Enable Marks Entry**: Teachers can now enter marks
4. **Configure Access**: Adjust permissions in authRoles.js if needed
5. **Monitor**: Check logs for authorization issues

---

**Version**: 1.0.0  
**Last Updated**: 2024  
**Status**: Production Ready
