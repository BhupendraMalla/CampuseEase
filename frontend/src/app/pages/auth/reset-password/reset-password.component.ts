import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
  ValidatorFn
} from '@angular/forms';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import * as alertify from 'alertifyjs';

// Custom validator to check if newPassword and confirmPassword match
function passwordMatchValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const newPassword = control.get('newPassword');
    const confirmPassword = control.get('confirmPassword');

    if (!newPassword || !confirmPassword) {
      return null;
    }

    return newPassword.value === confirmPassword.value
      ? null
      : { passwordMismatch: true };
  };
}

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, RouterModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  emailForm!: FormGroup;
  changePasswordForm!: FormGroup;
  passwordForm!: FormGroup;
  token: string | null = null;
  isResetMode = false;
  isChangeMode = false;
  isChangingPassword = false;
  
  // Password visibility toggles
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Extract token from query string
    this.token = this.route.snapshot.queryParamMap.get('token');
    const mode = this.route.snapshot.queryParamMap.get('mode');
    this.isResetMode = !!this.token;
    this.isChangeMode = mode === 'change';

    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.changePasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      currentPassword: ['', Validators.required]
    });

    this.passwordForm = this.fb.group(
      {
        newPassword: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]]
      },
      { validators: passwordMatchValidator() }
    );
  }

  togglePasswordVisibility(field: string): void {
    if (field === 'current') {
      this.showCurrentPassword = !this.showCurrentPassword;
    } else if (field === 'new') {
      this.showNewPassword = !this.showNewPassword;
    } else if (field === 'confirm') {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  requestResetLink(): void {
    if (this.emailForm.invalid) return;

    const email = this.emailForm.value.email;

    this.http.post<any>('http://localhost:3200/request-reset-password', { email }).subscribe({
      next: (res) => {
        alertify.success(res.message || 'Reset link sent to email');
        console.log('Reset link:', res.resetUrl); // For dev
      },
      error: (err) => {
        alertify.error(err.error?.message || 'Failed to send reset link');
      }
    });
  }

  resetPassword(): void {
    if (this.passwordForm.invalid || !this.token) return;

    const { newPassword, confirmPassword } = this.passwordForm.value;

    this.http.post<any>(
      `http://localhost:3200/reset-password?token=${this.token}`,
      { newPassword, confirmPassword }
    ).subscribe({
      next: (res) => {
        alertify.success('Password reset successful');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        alertify.error(err.error?.message || 'Password reset failed');
      }
    });
  }

  verifyCredentials(): void {
    if (this.changePasswordForm.invalid) return;

    const { email, currentPassword } = this.changePasswordForm.value;

    this.http.post<any>('http://localhost:3200/verify-credentials', { email, password: currentPassword }).subscribe({
      next: (res) => {
        alertify.success('Credentials verified. Enter new password.');
        this.isChangingPassword = true;
      },
      error: (err) => {
        alertify.error(err.error?.message || 'Invalid email or password');
      }
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid || this.changePasswordForm.invalid) return;

    const { email, currentPassword } = this.changePasswordForm.value;
    const { newPassword, confirmPassword } = this.passwordForm.value;

    this.http.post<any>('http://localhost:3200/change-password', { 
      email, 
      currentPassword, 
      newPassword, 
      confirmPassword 
    }).subscribe({
      next: (res) => {
        alertify.success('Password changed successfully');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        alertify.error(err.error?.message || 'Failed to change password');
      }
    });
  }
}
