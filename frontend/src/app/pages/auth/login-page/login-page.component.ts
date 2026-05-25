import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserAuthService } from '../../../core/services/user_auth/user-auth.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import * as alertify from 'alertifyjs';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.css'
})
export class LoginPageComponent implements OnInit, OnDestroy {
  loginForm!: FormGroup;
  showPassword = false;

  constructor(
    private userSignIn: UserAuthService,
    private formBuilder: FormBuilder,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });

    this.checkUserToken();
  }

  checkUserToken(): void {
    // Check if user just logged out (sessionStorage flag)
    const justLoggedOut = sessionStorage.getItem('justLoggedOut');
    if (justLoggedOut) {
      // User just logged out, clear the flag and don't auto-redirect
      sessionStorage.removeItem('justLoggedOut');
      this.clearAllAuthData();
      return;
    }

    const userToken = localStorage.getItem('userToken');
    const userData = localStorage.getItem('userData');
    const userRole = localStorage.getItem('userRole');
    
    // Strict validation: ALL auth fields must exist and be valid
    if (userToken && userData && userRole) {
      try {
        const parsedData = JSON.parse(userData);
        // Verify userData has required fields
        if (parsedData?.email && parsedData?.password && userRole.length > 0 && userToken.length > 0) {
          this.router.navigate(['/dashboard']);
          return;
        }
      } catch (error) {
        console.warn('Auth data validation failed:', error);
      }
    }
    
    // If we reach here, auth data is incomplete or invalid - clear it
    this.clearAllAuthData();
  }

  clearAllAuthData(): void {
    // Clear all authentication-related data
    localStorage.removeItem('userData');
    localStorage.removeItem('userToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('currentSection');
    localStorage.removeItem('userID');
    // Also clear any other potential auth keys
    const authKeys = Object.keys(localStorage).filter(key => 
      key.includes('user') || key.includes('token') || key.includes('auth')
    );
    authKeys.forEach(key => localStorage.removeItem(key));
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  ngOnDestroy(): void {
    // Clean up: clear the logout flag when leaving login page
    sessionStorage.removeItem('justLoggedOut');
  }

 loginButton(): void {
  if (this.loginForm.valid) {
    this.userSignIn.postUserSignIn(this.loginForm.value).subscribe({
      next: (res) => {
        const message = res?.message?.toLowerCase() || '';

        if (message === 'login sucessfull') {
          // Clear old auth data before setting new credentials
          this.clearAllAuthData();
          
          // Set new credentials
          localStorage.setItem('userData', JSON.stringify(this.loginForm.value));
          localStorage.setItem('userRole', res.role);
          localStorage.setItem('userToken', res.token);
          
          // Clear the logout flag to allow normal operation
          sessionStorage.removeItem('justLoggedOut');
          
          this.router.navigate(['/dashboard']);
          alertify.success('Login Successful');
        } else if (message.includes('not found')) {
          this.clearAllAuthData();
          alertify.error('Email not found');
        } else if (message.includes('not verified')) {
          this.clearAllAuthData();
          alertify.error('User is not verified. Please verify before login!');
        } else if (message.includes('password is incorrect')) {
          this.clearAllAuthData();
          alertify.error('Incorrect password');
        } else {
          this.clearAllAuthData();
          alertify.error(res.message || 'Login failed');
        }
      },
      error: (err) => {
        // Clear any partial auth data on error
        this.clearAllAuthData();
        
        const errorMessage = err?.error?.message?.toLowerCase() || '';
        const role = err?.error?.userData?.role?.toLowerCase();

        if (
          err.status === 403 &&
          errorMessage.includes('set your password') &&
          role !== 'admin'
        ) {
          alertify.error('Please change your password first');
        } else {
          alertify.error('Login failed. Try again.');
        }
      }
    });
  } else {
    alertify.error('Invalid form');
  }
}
}
