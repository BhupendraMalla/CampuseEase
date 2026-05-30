import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import * as alertify from 'alertifyjs';
import QRCode from 'qrcode';
import { environment } from '../../../../environments/environment.development';
import { KhaltiService } from '../../../core/services/khalti/khalti.service';

@Component({
  selector: 'app-student-fee',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './student-fee.component.html',
  styleUrls: ['./student-fee.component.css']
})
export class StudentFeeComponent implements OnInit {
  feeForm!: FormGroup;
  studentId: string = '';
  qrCodeDataUrl: string = '';
  showQRCode = false;
  qrScanned = false; // Track if user confirmed scanning QR code
  paymentHistory: any[] = [];
  loadingHistory = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private khalti: KhaltiService
  ) {}

  ngOnInit(): void {
    this.feeForm = this.fb.group({
      amount: ['', [Validators.required, Validators.pattern(/^[0-9]+$/)]],
      method: ['Khalti', Validators.required]
    });

    const tokenData = this.parseJwt(localStorage.getItem('userToken') || '');
    this.studentId = tokenData.userId || '';

    this.handleKhaltiReturn();
    this.fetchPaymentHistory();
  }

  // After Khalti redirects back (?pidx&status), verify the transaction server-side.
  private handleKhaltiReturn(): void {
    if (localStorage.getItem('khalti_context') !== 'fee') return;
    const { pidx } = KhaltiService.readCallback();
    if (!pidx) return;
    localStorage.removeItem('khalti_context');
    this.khalti.verify(pidx).subscribe({
      next: (res) => {
        if (res.status === 'Completed') alertify.success('Payment verified — fee paid!');
        else alertify.warning(`Payment status: ${res.status}`);
        KhaltiService.clearCallbackParams();
        this.fetchPaymentHistory();
      },
      error: () => {
        alertify.error('Could not verify payment');
        KhaltiService.clearCallbackParams();
      }
    });
  }

  parseJwt(token: string): any {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
      return {};
    }
  }

  fetchPaymentHistory() {
    this.loadingHistory = true;
    const token = localStorage.getItem('userToken') || '';
    const headers = { Authorization: `Bearer ${token}` };

    this.http.get<any[]>(`${environment.api_url}getFees/${this.studentId}`, { headers }).subscribe(
      data => {
        this.paymentHistory = data;
        this.loadingHistory = false;
      },
      err => {
        alertify.error('Failed to load payment history');
        this.loadingHistory = false;
      }
    );
  }

  payWithKhalti(): void {
    const amount = Number(this.feeForm.value.amount);
    // Remember the section + flow so we can verify after Khalti redirects back.
    localStorage.setItem('currentSection', 'student-fee');
    localStorage.setItem('khalti_context', 'fee');
    this.khalti.initiate(amount).subscribe({
      next: (res) => {
        if (res.payment_url) window.location.href = res.payment_url;
        else alertify.error('Could not start Khalti payment');
      },
      error: (err) => {
        localStorage.removeItem('khalti_context');
        alertify.error(err.error?.message || 'Failed to start Khalti payment');
      }
    });
  }

  generateQRCode(): void {
    const amount = this.feeForm.value.amount;
    const qrText = `StudentID:${this.studentId}, Amount:Rs${amount}, Purpose:College Fee`;

    QRCode.toDataURL(qrText)
      .then(url => {
        this.qrCodeDataUrl = url;
        this.showQRCode = true;
        this.qrScanned = false; // reset on new QR code generation
      })
      .catch(err => {
        console.error(err);
        alertify.error('Failed to generate QR');
      });
  }

  onSubmit(): void {
    if (this.feeForm.invalid) {
      alertify.error('Form is invalid!');
      return;
    }

    const method = this.feeForm.value.method;
    this.showQRCode = false;
    this.qrScanned = false;

    if (method === 'Cash') {
      this.submitFee('Cash');
    } else if (method === 'QR') {
      this.generateQRCode();
    } else {
      this.payWithKhalti();
    }
  }

  onQRCodeScanned(): void {
    this.qrScanned = true;
  }

  proceedWithQRPayment(): void {
    this.submitFee('QR');
  }

  submitFee(method: string, paymentPayload?: any): void {
    const token = localStorage.getItem('userToken') || '';
    const headers = { Authorization: `Bearer ${token}` };
    const payload: any = {
      studentId: this.studentId,
      amount: Number(this.feeForm.value.amount),
      method: method
    };
    if (paymentPayload) payload.paymentPayload = paymentPayload;

    console.log('Submitting fee payment:', payload);

    this.http.post(`${environment.api_url}payFee`, payload, { headers }).subscribe(
      (res: any) => {
        console.log('Fee payment response:', res);
        alertify.success(res.message || 'Fee paid successfully!');
        this.feeForm.reset({ method: 'Khalti' });
        this.showQRCode = false;
        this.qrScanned = false;
        this.fetchPaymentHistory();
      },
      (err) => {
        console.error('Fee payment error:', err);
        alertify.error(err.error?.message || 'Failed to process fee payment');
      }
    );
  }
}
