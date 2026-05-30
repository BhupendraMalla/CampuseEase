require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const connectdb = require('./db');

const User = require('./models/signupModel');
const Department = require('./models/createDepartmentModel');
const Enrollment = require('./models/enrollmentModel');
const Event = require('./models/eventModel');
const Club = require('./models/addClubModel');
const Vacancy = require('./models/jobVacancy');
const Schedule = require('./models/classScheduleModel');
const ModelQuestion = require('./models/giveQuestionModel');
const Assignment = require('./models/giveAssignmentModel');
const AcademicRecord = require('./models/AcademicRecordModel');
const Discussion = require('./models/discussionModel');
const Feedback = require('./models/FeedbackModel');
const Sponsorship = require('./models/sponsorshipModel');
const Marks = require('./models/marksEntryModel');
const Fee = require('./models/feeModel');

/**
 * Idempotent, NON-destructive full-database seeder for CampusEase.
 *
 * - Never drops the database; upserts by a stable key so re-runs are safe.
 * - ALL login credentials live here (in the DB), NOT in .env. .env only holds
 *   infra secrets (Mongo URI, JWT secret, Khalti keys).
 * - Seeds one ready-to-use, pre-verified account per role plus demo content for
 *   every major feature, so the app is fully populated out of the box.
 *
 * Test credentials (also documented in the project README):
 *   admin@campusease.com     / admin
 *   student@campusease.com   / student123
 *   faculty@campusease.com   / faculty123
 *   secretary@campusease.com / secretary123
 *   finance@campusease.com   / finance123
 *   Semester enrollment key: CSE-2024
 */

const today = new Date().toDateString();

const TEST_USERS = [
  { name: 'Admin',           email: 'admin@campusease.com',     password: 'admin',        role: 'admin',           department: 'general',        rollno: null, address: 'Admin Office' },
  { name: 'Test Student',    email: 'student@campusease.com',   password: 'student123',   role: 'student',         department: 'academic',       rollno: 101,  address: 'Hostel Block A' },
  { name: 'Test Faculty',    email: 'faculty@campusease.com',   password: 'faculty123',   role: 'faculty',         department: 'academic',       rollno: null, address: 'Faculty Wing' },
  { name: 'Test Secretary',  email: 'secretary@campusease.com', password: 'secretary123', role: 'secretary',       department: 'administration', rollno: 9001, address: 'Admin Block' },
  { name: 'Finance Officer', email: 'finance@campusease.com',   password: 'finance123',   role: 'finance-officer', department: 'finance',        rollno: 9002, address: 'Finance Dept' },
];

async function upsertUser(u) {
  const hashed = await bcrypt.hash(u.password, 10);
  const doc = {
    name: u.name, email: u.email, password: hashed, confirmPassword: hashed,
    role: u.role, department: u.department, address: u.address,
    isVerified: true, isPasswordSet: true, registereddate: today,
  };
  if (u.rollno != null) doc.rollno = u.rollno;
  return User.findOneAndUpdate({ email: u.email }, { $set: doc }, { upsert: true, new: true });
}

// Insert `doc` only if nothing matches `query` (keeps the seed idempotent).
async function seedOnce(Model, query, doc, label) {
  const existing = await Model.findOne(query);
  if (existing) { console.log(`  • ${label}: exists`); return existing; }
  const created = await Model.create(doc);
  console.log(`  ✓ ${label}: created`);
  return created;
}

async function seed() {
  try {
    await connectdb();
    console.log('🌱 Seeding CampusEase (idempotent, non-destructive)...\n');

    console.log('👤 Users:');
    const users = {};
    for (const u of TEST_USERS) { const saved = await upsertUser(u); users[u.role] = saved; console.log(`  ✓ ${u.role.padEnd(15)} ${u.email}  (${u.password})`); }
    const student = users['student'], faculty = users['faculty'];

    console.log('\n🏛️  Department:');
    const dept = await Department.findOneAndUpdate(
      { department: 'academic' },
      { $set: { createFaculty: 'Computer Engineering', hod: 'Test Faculty', department: 'academic', description: 'Academic department (seeded)' } },
      { upsert: true, new: true }
    );
    console.log('  ✓ academic / Computer Engineering');

    console.log('\n📚 Enrollment:');
    const enrollment = await Enrollment.findOneAndUpdate(
      { enrollment_key: 'CSE-2024' },
      { $set: { enrollment_key: 'CSE-2024', semester: '1', department: 'academic', subjects: [
        { name: 'Mathematics I',           code: 'MTH101', credit: '4', teacher: 'faculty@campusease.com' },
        { name: 'Programming Fundamentals', code: 'CSE101', credit: '3', teacher: 'faculty@campusease.com' },
        { name: 'Digital Logic',           code: 'CSE102', credit: '3', teacher: 'faculty@campusease.com' },
      ] } },
      { upsert: true, new: true }
    );
    const subjectId = enrollment.subjects?.[0]?._id;
    console.log('  ✓ key CSE-2024 (3 subjects)');

    console.log('\n🎉 Content:');
    await seedOnce(Event, { eventName: 'Orientation Day 2026' }, { eventName: 'Orientation Day 2026', eventDate: '2026-06-15', location: 'Main Auditorium', description: 'Welcome program for new students.', createdBy: 'admin@campusease.com', createdDate: today }, 'event: Orientation Day');
    await seedOnce(Event, { eventName: 'Tech Fest 2026' }, { eventName: 'Tech Fest 2026', eventDate: '2026-07-10', location: 'Innovation Hall', description: 'Annual technology festival.', createdBy: 'admin@campusease.com', createdDate: today }, 'event: Tech Fest');
    await seedOnce(Club, { clubName: 'Coding Club' }, { clubStatus: 'Active', clubName: 'Coding Club', contactNumber: '9800000010', contactEmail: 'secretary@campusease.com', createdDate: today }, 'club: Coding Club');
    await seedOnce(Vacancy, { vacancyPosition: 'Lecturer - Computer Engineering' }, { vacancyPosition: 'Lecturer - Computer Engineering', vacancyExperience: '2+ years', vacancyLevel: 'Masters', vacancySubject: 'Programming', vacancyQualification: 'M.Sc/M.Tech CS', time: 'Full-time', vacancySalary: 'Negotiable' }, 'job vacancy');
    await seedOnce(Schedule, { subject: 'Programming Fundamentals', day: 'Monday' }, { subject: 'Programming Fundamentals', faculty: faculty._id, department: dept._id, day: 'Monday', block: 'A', date: new Date('2026-06-01'), timeFrom: '10:00', timeTo: '11:00', roomNo: 'CS-101', semester: '1' }, 'schedule: Mon');
    await seedOnce(Schedule, { subject: 'Mathematics I', day: 'Tuesday' }, { subject: 'Mathematics I', faculty: faculty._id, department: dept._id, day: 'Tuesday', block: 'A', date: new Date('2026-06-02'), timeFrom: '11:00', timeTo: '12:00', roomNo: 'CS-102', semester: '1' }, 'schedule: Tue');
    await seedOnce(ModelQuestion, { subject: 'Programming Fundamentals' }, { subject: 'Programming Fundamentals', model_question: 'Q1. Explain variables, data types and operators with examples.', file: '' }, 'model question');
    await seedOnce(Assignment, { assignmentName: 'Assignment 1: Loops & Functions' }, { subject: 'Programming Fundamentals', assignmentName: 'Assignment 1: Loops & Functions', assignmentFile: '', remarks: 'Submit as PDF.', dueDate: '2026-06-20' }, 'assignment');
    await seedOnce(AcademicRecord, { Rollno: student.rollno, Subject: 'Programming Fundamentals' }, { Name: student.name, Rollno: student.rollno, Subject: 'Programming Fundamentals', Credit: 3, Grade: 85 }, 'academic record');
    await seedOnce(Discussion, { discussion_topic: 'Semester exam schedule finalization' }, { discussion_topic: 'Semester exam schedule finalization', date: today, decision_by: 'Admin', decision: 'Exams start July 1st.' }, 'discussion');
    await seedOnce(Feedback, { feedbackBy: 'student@campusease.com', feedbackFor: 'faculty@campusease.com' }, { feedbackBy: 'student@campusease.com', feedbackFor: 'faculty@campusease.com', feedbackGroup: 'Teacher', feedbackAbout: 'Very clear and helpful lectures.' }, 'feedback');
    await seedOnce(Sponsorship, { name: 'Test Student', topic: 'Merit scholarship' }, { name: 'Test Student', faculty: 'Computer Engineering', semester: '1', status: 'Pending', topic: 'Merit scholarship', money: '25000', reason: 'Top of class', date: today, decision: 'Pending' }, 'sponsorship');
    await seedOnce(Marks, { studentEmail: 'student@campusease.com', subjectName: 'Programming Fundamentals' }, { studentId: student._id, studentEmail: 'student@campusease.com', subjectId: subjectId || student._id, subjectName: 'Programming Fundamentals', marks: 42, marksType: 'internal', totalMarks: 50, remarks: 'Good', semester: '1', academicYear: '2026' }, 'marks');
    await seedOnce(Fee, { receiptNumber: 'RCPT-SEED-1' }, { studentId: student._id, amount: 15000, method: 'Cash', status: 'Paid', receiptNumber: 'RCPT-SEED-1' }, 'fee: Paid');
    await seedOnce(Fee, { receiptNumber: 'RCPT-SEED-2' }, { studentId: student._id, amount: 5000, method: 'Online', status: 'Pending', receiptNumber: 'RCPT-SEED-2' }, 'fee: Pending');

    console.log('\n✅ Seed complete. Log in at http://localhost:4200/login\n');
    console.log('   Credentials are in the DB (see table above) and the README.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seed();
