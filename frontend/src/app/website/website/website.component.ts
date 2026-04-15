import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { EventService } from '../../core/services/event-service/event.service';
import { JobVacancyService } from '../../core/services/jobVacancy-service/job-vacancy.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { EnrollmentService } from '../../core/services/enrollment_service/enrollment.service'; // can remove if unused elsewhere
import { UserAuthService } from '../../core/services/user_auth/user-auth.service';
import { ClubService } from '../../core/services/club_service/club.service';
import { DepartmentService } from '../../core/services/department-service/department.service';

@Component({
  selector: 'app-website',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './website.component.html',
  styleUrls: ['./website.component.css']
})
export class WebsiteComponent implements OnInit {
  eventList: any[] = [];
  jobVacancyList: any[] = [];
  showTeacherData: any[] = [];
  showTeacherCount: number = 0;
  showStudentData: any[] = [];
  showStudentCount: number = 0;
  showSecretaryData: any[] = [];
  showSecretaryCount: number = 0;
  jobVacancyCount: number = 0;

  constructor(
    private router: Router,
    private eventService: EventService,
    private jobVacancyService: JobVacancyService,
    private userService: UserAuthService,
    private clubService: ClubService,
    private departmentService: DepartmentService,
    private enrollmentService: EnrollmentService, // keep only if used elsewhere
  ) {}

  loginButton() {
    this.router.navigate(['login']);
  }

  registerButton() {
    this.router.navigate(['register']);
  }

  ngOnInit(): void {
    this.getEventList();
    this.getJobVacancyList();
    this.teacherData();
    this.secretaryCount();
    this.studentCount();
  }

  getEventList() {
    this.eventService.getEventListList().subscribe((res) => {
      console.log('Events:', res);
      this.eventList = res;
    }, (error) => {
      console.error('Error loading events:', error);
      this.eventList = [];
    });
  }

  getJobVacancyList() {
    this.jobVacancyService.getAnswerAssignment().subscribe((res) => {
      console.log('Job Vacancies:', res);
      this.jobVacancyList = res;
      this.jobVacancyCount = res.length;
    }, (error) => {
      console.error('Error loading job vacancies:', error);
      this.jobVacancyList = [];
      this.jobVacancyCount = 0;
    });
  }

  studentCount() {
    this.userService.getStudentData().subscribe((res) => {
      this.showStudentCount = res.count;
      this.showStudentData = res.student;
    }, (error) => {
      console.error('Error loading student data:', error);
      this.showStudentCount = 0;
      this.showStudentData = [];
    });
  }

  secretaryCount() {
    this.userService.getSecretarytData().subscribe((res) => {
      this.showSecretaryCount = res.count;
      this.showSecretaryData = res.secretary;
    }, (error) => {
      console.error('Error loading secretary data:', error);
      this.showSecretaryCount = 0;
      this.showSecretaryData = [];
    });
  }

  teacherData() {
    this.userService.getTeacherData().subscribe((res) => {
      this.showTeacherCount = res.count;
      this.showTeacherData = res.faculty;
    }, (error) => {
      console.error('Error loading teacher data:', error);
      this.showTeacherCount = 0;
      this.showTeacherData = [];
    });
  }

  goToSubmitCV(){
    this.router.navigate(['/cv-submission']);
  }
}
