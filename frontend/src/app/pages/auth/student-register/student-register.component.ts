import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { StudentRegisterService } from '../../../core/services/student-register/student-register.service';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import * as alertify from 'alertifyjs';

@Component({
  selector: 'app-student-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './student-register.component.html',
  styleUrls: ['./student-register.component.css']
})
export class StudentRegisterComponent {
  studentForm: FormGroup;
  message: string = '';
  isError: boolean = false;
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private studentService: StudentRegisterService,
    private router: Router
  ) {
    this.studentForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      rollno: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
      address: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.studentForm.valid) {
      const { password, confirmPassword } = this.studentForm.value;

      if (password !== confirmPassword) {
        this.isError = true;
        this.message = 'Passwords do not match.';
        return;
      }

      this.isLoading = true;
      const formData = {
        ...this.studentForm.value,
        role: 'student'
      };

      this.studentService.signupStudent(formData).subscribe({
        next: (res: any) => {
          this.isLoading = false;
          this.message = res.message;
          this.isError = false;
          this.studentForm.reset();
          alertify.success('Signup successful! Please log in.');
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        },
        error: (err: any) => {
          this.isLoading = false;
          this.isError = true;
          this.message = err.error?.message || 'Something went wrong. Please try again.';
          console.error('Signup error:', err);
        }
      });
    } else {
      this.studentForm.markAllAsTouched();
      this.isError = true;
      this.message = 'Please fill out all fields correctly.';
    }
  }
}
