import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';

@Component({
  selector: 'app-student-details',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './user-details.component.html',
  styleUrl: './user-details.component.css'
})
export class StudentDetailsComponent implements OnInit {
  searchTerm: string = '';
  role: string = 'student'; // default search role
  userData: any = null;
  errorMessage: string = '';
  loading: boolean = false;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {}

  searchUsers() {
    this.loading = true;
    this.errorMessage = '';
    this.userData = null;

    // If search term is empty, fetch all users of selected role
    if (!this.searchTerm.trim()) {
      const endpoint = `http://localhost:3200/user/${this.role}`;
      
      this.http.get<any>(endpoint).subscribe({
        next: (response) => {
          // Map the response appropriately for display
          if (Array.isArray(response[this.role])) {
            this.userData = {
              allUsers: response[this.role],
              count: response.count
            };
          } else {
            this.userData = response;
          }
          console.log("Fetched all users of role:", this.role, this.userData);
          this.loading = false;
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'An error occurred while fetching users.';
          this.loading = false;
        }
      });
    } else {
      // If search term provided, use search endpoint
      const params = new HttpParams()
        .set('name', this.searchTerm)
        .set('rollno', this.searchTerm)
        .set('email', this.searchTerm);

      const endpoint = `http://localhost:3200/${this.role}/search`;

      this.http.get<any>(endpoint, { params }).subscribe({
        next: (response) => {
          this.userData = response;
          console.log("Fetched user:", this.userData);
          this.loading = false;
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'An error occurred while searching.';
          this.loading = false;
        }
      });
    }
  }
}
