import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StudentRegisterService {
  private apiUrl = 'http://localhost:3200/signup';

  constructor(private http: HttpClient) {}

  signupStudent(studentData: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<any>(this.apiUrl, studentData, { headers });
  }
}
