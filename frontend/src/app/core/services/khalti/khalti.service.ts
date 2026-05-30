import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment.development';

/**
 * Khalti ePayment (KPG-2) client.
 *
 * Flow: initiate() -> redirect the browser to payment_url -> Khalti returns to
 * the dashboard with ?pidx&status -> verify(pidx) confirms via the lookup API.
 * The secret key lives only on the backend; nothing sensitive is in the SPA.
 */
@Injectable({ providedIn: 'root' })
export class KhaltiService {
  constructor(private http: HttpClient) {}

  /** Ask the backend to create a Khalti payment; resolves to { payment_url, pidx, feeId }. */
  initiate(amount: number): Observable<{ payment_url: string; pidx: string; feeId: string }> {
    return this.http.post<{ payment_url: string; pidx: string; feeId: string }>(
      `${environment.api_url}khalti/initiate`,
      { amount }
    );
  }

  /** Verify a transaction by pidx after the Khalti redirect. */
  verify(pidx: string): Observable<{ status: string; transaction_id?: string; fee?: any }> {
    return this.http.post<{ status: string; transaction_id?: string; fee?: any }>(
      `${environment.api_url}khalti/verify`,
      { pidx }
    );
  }

  /** Read Khalti callback params (pidx, status, ...) from the current URL. */
  static readCallback(): { pidx: string | null; status: string | null } {
    const q = new URLSearchParams(window.location.search);
    return { pidx: q.get('pidx'), status: q.get('status') };
  }

  /** Remove Khalti query params from the address bar after handling them. */
  static clearCallbackParams(): void {
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}
