import { Component } from '@angular/core';
import { UserAuthService } from '../../../core/services/user_auth/user-auth.service';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment.development';
import * as alertify from 'alertifyjs';
import { KhaltiService } from '../../../core/services/khalti/khalti.service';

const ID_CARD_FEE = 100; // Rs

@Component({
  selector: 'app-id-card',
  standalone: true,
  imports: [CommonModule,ReactiveFormsModule],
  templateUrl: './id-card.component.html',
  styleUrl: './id-card.component.css'
})
export class IdCardComponent {
  showUserProfileData:any=null;
  enrollForm!: FormGroup;

  constructor(private userService:UserAuthService,private formBuilder: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private khalti: KhaltiService
  ){
    this.showUserProfile()
  }
  ngOnInit(): void {
    this.enrollForm = this.formBuilder.group({
      email: ['', ],
      name: ['', ],
      rollno: ['', ],
      semester: ['', ],
      contactNo: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      department: ['',],
      reason: ['', Validators.required],

    });
    this.showUserProfile()
    this.handleKhaltiReturn()
  }

  // After Khalti redirects back, verify and then submit the stored ID-card request.
  private handleKhaltiReturn(): void {
    if (localStorage.getItem('khalti_context') !== 'idcard') return;
    const { pidx } = KhaltiService.readCallback();
    const stored = localStorage.getItem('idcard_pending');
    if (!pidx || !stored) return;
    localStorage.removeItem('khalti_context');
    localStorage.removeItem('idcard_pending');
    this.khalti.verify(pidx).subscribe({
      next: (res) => {
        KhaltiService.clearCallbackParams();
        if (res.status === 'Completed') {
          alertify.success('Payment verified — submitting ID card request');
          this.submitForm(JSON.parse(stored), pidx);
        } else {
          alertify.warning(`Payment status: ${res.status}`);
        }
      },
      error: () => { KhaltiService.clearCallbackParams(); alertify.error('Could not verify payment'); }
    });
  }
  showUserProfile() {
    this.userService.getIdCardData().subscribe((res) => {
      console.log(res);
      // this.showUserProfileData = res.data;
      // console.log(this.showUserProfileData);
      this.showUserProfileData = res;
      debugger

    });
  }
  makePayment(): void {
    // Persist the form so we can submit it after the Khalti redirect returns.
    localStorage.setItem('idcard_pending', JSON.stringify(this.enrollForm.value));
    localStorage.setItem('currentSection', 'id-card');
    localStorage.setItem('khalti_context', 'idcard');
    this.khalti.initiate(ID_CARD_FEE).subscribe({
      next: (res) => {
        if (res.payment_url) window.location.href = res.payment_url;
        else alertify.error('Could not start Khalti payment');
      },
      error: (err) => {
        localStorage.removeItem('khalti_context');
        localStorage.removeItem('idcard_pending');
        alertify.error(err.error?.message || 'Failed to start Khalti payment');
      }
    });
  }

  onSubmit(): void {
    if (this.enrollForm.valid) {
      this.makePayment();
    } else {
      alert('Form is not valid. Please fill all required fields.');
    }
  }

submitForm(formData: any, pidx?: string): void {
  const token = localStorage.getItem('userToken') || '';
  const headers = { Authorization: `Bearer ${token}` };

  this.http.post(`${environment.api_url}postIdCard`, { ...formData, paymentPayload: { pidx } }, { headers }).subscribe(
    (res: any) => {
      alertify.success(res.message);
      this.router.navigate(['/success']);
    },
    (err) => {
      alertify.error('Failed to submit request. Please try again.');
    }
  );
}
}
