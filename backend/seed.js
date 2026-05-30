require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const connectdb = require('./db');
const userRegister = require('./models/signupModel');
const Department = require('./models/createDepartmentModel');
const Enrollment = require('./models/enrollmentModel');

/**
 * Idempotent seeder for CampusEase.
 *
 * Safe to run repeatedly: it UPSERTS test data by a stable key (email /
 * department / enrollment_key) and never drops the database. Existing data
 * created through the app is preserved.
 *
 * Creates ready-to-use test accounts for every primary role (all are
 * pre-verified so you can log in immediately) plus the supporting department
 * and subject-enrollment records the dashboards depend on.
 */

const today = new Date().toDateString();

// email -> plaintext password is also documented in the project README.
const TEST_USERS = [
  { name: 'Admin',     email: 'admin@campusease.com',     password: 'admin',         role: 'admin',           department: 'general',        rollno: null, address: 'Admin Office' },
  { name: 'Test Student', email: 'student@campusease.com', password: 'student123',   role: 'student',         department: 'academic',       rollno: 101,  address: 'Hostel Block A' },
  { name: 'Test Faculty', email: 'faculty@campusease.com', password: 'faculty123',   role: 'faculty',         department: 'academic',       rollno: null, address: 'Faculty Wing' },
  { name: 'Test Secretary', email: 'secretary@campusease.com', password: 'secretary123', role: 'secretary',  department: 'administration', rollno: null, address: 'Admin Block' },
  { name: 'Finance Officer', email: 'finance@campusease.com', password: 'finance123', role: 'finance-officer', department: 'finance',       rollno: null, address: 'Finance Dept' },
];

async function upsertUser(u) {
  const hashed = await bcrypt.hash(u.password, 10);
  const doc = {
    name: u.name,
    email: u.email,
    password: hashed,
    confirmPassword: hashed,
    role: u.role,
    department: u.department,
    address: u.address,
    isVerified: true,
    isPasswordSet: true,
    registereddate: today,
  };
  if (u.rollno != null) doc.rollno = u.rollno;
  await userRegister.findOneAndUpdate({ email: u.email }, { $set: doc }, { upsert: true, new: true });
  console.log(`  ✓ ${u.role.padEnd(16)} ${u.email}  (password: ${u.password})`);
}

async function seed() {
  try {
    await connectdb();
    console.log('🌱 Seeding CampusEase test data (idempotent, non-destructive)...\n');

    console.log('👤 Users:');
    for (const u of TEST_USERS) await upsertUser(u);

    console.log('\n🏛️  Department:');
    await Department.findOneAndUpdate(
      { department: 'academic' },
      { $set: { createFaculty: 'Computer Engineering', hod: 'Test Faculty', department: 'academic', description: 'Academic department (seeded)' } },
      { upsert: true, new: true }
    );
    console.log('  ✓ academic (Computer Engineering)');

    console.log('\n📚 Enrollment / subjects:');
    await Enrollment.findOneAndUpdate(
      { enrollment_key: 'CSE-2024' },
      {
        $set: {
          enrollment_key: 'CSE-2024',
          semester: '1',
          department: 'academic',
          // teacher must equal the faculty account's EMAIL — the faculty
          // dashboard matches subjects by subject.teacher === user.email.
          subjects: [
            { name: 'Mathematics I',           code: 'MTH101', credit: '4', teacher: 'faculty@campusease.com' },
            { name: 'Programming Fundamentals', code: 'CSE101', credit: '3', teacher: 'faculty@campusease.com' },
            { name: 'Digital Logic',           code: 'CSE102', credit: '3', teacher: 'faculty@campusease.com' },
          ],
        },
      },
      { upsert: true, new: true }
    );
    console.log('  ✓ enrollment_key: CSE-2024  (semester 1, 3 subjects)');

    console.log('\n✅ Seed complete. Log in at http://localhost:4200/login\n');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seed();
