import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

// Component Imports
import { SemesterEnrollComponent } from '../../../pages/component/semester-enroll/semester-enroll.component';
import { AcademicRecordsComponent } from '../../../pages/component/academic-records/academic-records.component';
import { AttendanceRecordComponent } from '../../../pages/component/attendance-record/attendance-record.component';
import { CourseEnrollComponent } from '../../../pages/component/course-enroll/course-enroll.component';
import { DiscussionComponent } from '../../../pages/component/discussion/discussion.component';
import { FeedbackComponent } from '../../../pages/component/feedback/feedback.component';
import { IdCardComponent } from '../../../pages/component/id-card/id-card.component';
import { JoinClubsComponent } from '../../../pages/component/join-clubs/join-clubs.component';
import { SponsorshipComponent } from '../../../pages/component/sponsorship/sponsorship.component';
import { AssignmentComponent } from '../../../pages/component/assignment/assignment.component';
import { CourseRecordComponent } from '../../../pages/teacher-component/course-record/course-record.component';
import { InternalRecordsComponent } from '../../../pages/teacher-component/internal-records/internal-records.component';
import { ModelQuestionComponent } from '../../../pages/teacher-component/model-question/model-question.component';
import { AssignmentMaterialsComponent } from '../../../pages/teacher-component/assignment-materials/assignment-materials.component';
import { StudentWorkComponent } from '../../../pages/teacher-component/student-work/student-work.component';
import { UserManagementComponent } from '../../../pages/admin-component/user-management/user-management.component';
import { EnrollmentKeyComponent } from '../../../pages/admin-component/enrollment-key/enrollment-key.component';
import { ProfileComponent } from '../../../pages/component/profile/profile.component';
import { JobVacancyComponent } from '../../../pages/admin-component/job-vacancy/job-vacancy.component';
import { ListCourseComponent } from '../../../pages/admin-component/list-course/list-course.component';
import { EventsComponent } from '../../../pages/component/events/events.component';
import { DepartmentComponent } from '../../../pages/component/department/department.component';
import { OurCourseComponent } from '../../../pages/component/our-course/our-course.component';
import { StudentDetailsComponent } from '../../../pages/component/user-details/user-details.component';
import { PaymentComponent } from '../../../pages/component/payment/payment.component';
import { UserAuthService } from '../../../core/services/user_auth/user-auth.service';
import { ChatComponent } from '../../../pages/component/chat/chat.component';
import { AdminCvListComponent } from '../../../pages/admin-component/admin-cv-list/admin-cv-list.component';
import { StudentFeeComponent } from '../../../pages/component/student-fee/student-fee.component';
import { AdminFeeComponent } from '../../../pages/admin-component/admin-fee/admin-fee.component';
import { AdminScheduleComponent } from '../../../pages/admin-component/admin-schedule/admin-schedule.component';
import { UserScheduleComponent } from '../../../pages/component/user-schedule/user-schedule.component';
import { AcademicComponent } from '../../../pages/component/academic/academic.component';
import { FaceComponent } from '../../../pages/component/face/face.component';
import { FaceRegisterComponent } from '../../../pages/component/face-register/face-register.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ChatComponent,
    SemesterEnrollComponent,
    AcademicRecordsComponent,
    AttendanceRecordComponent,
    CourseEnrollComponent,
    DiscussionComponent,
    FeedbackComponent,
    IdCardComponent,
    JoinClubsComponent,
    SponsorshipComponent,
    AssignmentComponent,
    AssignmentMaterialsComponent,
    CourseRecordComponent,
    InternalRecordsComponent,
    ModelQuestionComponent,
    StudentWorkComponent,
    UserManagementComponent,
    EnrollmentKeyComponent,
    ProfileComponent,
    JobVacancyComponent,
    ListCourseComponent,
    EventsComponent,
    DepartmentComponent,
    OurCourseComponent,
    StudentDetailsComponent,
    PaymentComponent,
    AdminCvListComponent,
    StudentFeeComponent,
    AdminFeeComponent,
    AdminScheduleComponent,
    UserScheduleComponent,
    AcademicComponent,
    FaceComponent,
    FaceRegisterComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  currentSection: string = 'basic';
  showUserProfileData: any = null;
  userRole: string | null = null;
  searchQuery!: string;
  searchResults: any;
  isDarkTheme: boolean = false;

  constructor(
    private router: Router,
    private userService: UserAuthService,
    private http: HttpClient
  ) {
    this.userService.getuserDataLogin().subscribe((res) => {
      this.showUserProfileData = res.data;
    });
  }

  ngOnInit(): void {
    this.userRole = localStorage.getItem('userRole');
    
    // Validate and load currentSection
    const savedSection = localStorage.getItem('currentSection');
    
    // Determine default section based on role
    let defaultSection = 'profile';
    if (this.userRole === 'admin') {
      defaultSection = 'user-management';
    } else if (this.userRole === 'teacher' || this.userRole === 'faculty') {
      defaultSection = 'course-record';
    }
    
    // Use saved section only if it's valid for the current role
    if (savedSection) {
      const isValidSection = this.isValidSectionForRole(savedSection, this.userRole);
      this.currentSection = isValidSection ? savedSection : defaultSection;
    } else {
      this.currentSection = defaultSection;
    }

    // Load theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      this.isDarkTheme = true;
      document.body.classList.add('dark-mode');
    }
  }

  // Sections each role's sidebar actually exposes (mirrors the dashboard
  // template's role gates). Used to reject a stale `currentSection` left in
  // localStorage by a different role, without blocking legitimate navigation.
  private sectionsByRole: { [role: string]: string[] } = {
    student: ['profile', 'change-password', 'chat', 'student-fee', 'attendance-record', 'face-attendance', 'semester', 'our-courses', 'user-schedule', 'join-club', 'id-card', 'assignment', 'model-question', 'sponsorship', 'feedback', 'events', 'discussion', 'academic'],
    admin: ['user-management', 'search-data', 'admin-fee', 'join-club', 'department', 'admin-schedule', 'enrollment-key', 'list-course', 'our-courses', 'face-register', 'result', 'academic', 'payment', 'events', 'job-vacancy', 'feedback', 'cv-submission', 'sponsorship', 'discussion', 'profile'],
    secretary: ['profile', 'change-password', 'join-club', 'discussion', 'events'],
    faculty: ['profile', 'change-password', 'chat', 'our-courses', 'attendance-record', 'face-attendance', 'face-register', 'user-schedule', 'assignment-record', 'model-question', 'academic', 'events', 'feedback', 'internal-records', 'student-work-record', 'discussion'],
  };

  isValidSectionForRole(section: string, role: string | null): boolean {
    if (!role) return true;
    const key = role === 'teacher' ? 'faculty' : role;
    const allowed = this.sectionsByRole[key];
    // Roles without a dedicated menu (e.g. finance-officer) only see the
    // default profile view — don't block their navigation.
    if (!allowed) return true;
    return allowed.includes(section);
  }

  showSection(section: string): void {
    // Security check: only allow sections valid for the current role
    if (this.isValidSectionForRole(section, this.userRole)) {
      this.currentSection = section;
      localStorage.setItem('currentSection', section);
    } else {
      console.warn(`Access denied: Section ${section} not allowed for role ${this.userRole}`);
      // Reset to default section
      this.currentSection = this.userRole === 'admin' ? 'user-management' : 'profile';
      localStorage.setItem('currentSection', this.currentSection);
    }
  }

  toggleTheme(event: any): void {
    this.isDarkTheme = event.target.checked;

    if (this.isDarkTheme) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  }

  LogoutButton(): void {
    // Set flag to prevent auto-redirect after logout
    sessionStorage.setItem('justLoggedOut', 'true');
    
    // Clear auth-related data but preserve theme preference
    const savedTheme = localStorage.getItem('theme');
    localStorage.removeItem('userData');
    localStorage.removeItem('userToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('currentSection');
    localStorage.removeItem('userID');
    
    // Clear any other auth-related keys
    const authKeys = Object.keys(localStorage).filter(key => 
      key.includes('user') || key.includes('token') || key.includes('auth')
    );
    authKeys.forEach(key => localStorage.removeItem(key));
    
    // Restore theme if it was set
    if (savedTheme) {
      localStorage.setItem('theme', savedTheme);
    }
    
    // Navigate to login
    this.router.navigate(['/login']);
  }
}
