import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import { environment } from '../../../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class UserAuthService {

  constructor(private http:HttpClient) { }
  login(credentials: { email: string; password: string }) {
    return this.http.post<any>('http://localhost:3200/login', credentials).pipe(
      tap(({ accessToken }) => {
        try {
          localStorage.setItem('userToken', accessToken);
        } catch (error) {
          console.warn('Could not save login token to storage:', error);
        }
      })
    );
  }

postuserRegister(obj:any):Observable<any>{
  const token = this.getUserToken();
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`
  });
  return this.http.post(environment.api_url+'signupUser', obj, { headers });
}
postUserSignIn(obj:any):Observable<any>{
  return this.http.post(environment.api_url+'signin',obj)
}
getuserData():Observable<any>{
  return this.http.get(environment.api_url+'userdata')
}
getuserDataLogin():Observable<any>{
  const token = this.getUserToken();
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`
  });
  return this.http.get(environment.api_url+'getuserdata', { headers })
}
getTeacherData():Observable<any>{
  return this.http.get(environment.api_url+'user/faculty')
}
getStudentData():Observable<any>{
  return this.http.get(environment.api_url+'user/student')
}
getSecretarytData():Observable<any>{
  return this.http.get(environment.api_url+'user/secretary')
}
getIdCardData(): Observable<any> {
  const token = this.getUserToken(); // assuming token is stored in localStorage under 'userToken'
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`
  });

  return this.http.get(environment.api_url + 'idcard', { headers });
}

saveProfile(userId: string,data: FormData): Observable<any> {
  return this.http.put<any>(environment.api_url+(`userdata/${userId}`), data);
}
getProfile(): Observable<any> {
  return this.http.get<any>(environment.api_url+'profileData')
}
changePassword(userId: string, data: any, options: { headers: HttpHeaders }): Observable<any> {
  return this.http.put(environment.api_url+(`password/${userId}`), data, options);
}

setUserData(user:any){
  try {
    localStorage.setItem('userData',JSON.stringify(user))
  } catch (error) {
    console.warn('Could not save user data to storage:', error);
  }
}
getUserData(){
  try {
    return JSON.parse(localStorage.getItem('userData')||'{}')
  } catch (error) {
    console.warn('Could not retrieve user data from storage:', error);
    return {};
  }
}
setUserRole(role: string) {
  try {
    localStorage.setItem('userRole', role);
  } catch (error) {
    console.warn('Could not save user role to storage:', error);
  }
}

getUserRole() {
  try {
    return localStorage.getItem('userRole');
  } catch (error) {
    console.warn('Could not retrieve user role from storage:', error);
    return null;
  }
}

setUserToken(token: string) {
  try {
    localStorage.setItem('userToken', token);
  } catch (error) {
    console.warn('Could not save user token to storage:', error);
  }
}

getUserToken() {
  try {
    return localStorage.getItem('userToken');
  } catch (error) {
    console.warn('Could not retrieve user token from storage:', error);
    return null;
  }
}

delStudentList(id: string): Observable<any> {
  return this.http.delete<any>(environment.api_url + `user/${id}`);
}

delSecretaryList(id: string): Observable<any> {
  return this.http.delete<any>(environment.api_url + `user/${id}`);
}

delTeacherList(id: string): Observable<any> {
  return this.http.delete(environment.api_url + `user/${id}`);
}

updateUser(id: string, userData: any): Observable<any> {
  return this.http.put(environment.api_url + `userdata/${id}`, userData);
}

updateUserById(id: string, updatedData: any): Observable<any> {
  const token = localStorage.getItem('userToken');
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`
  });
  return this.http.put(`${environment.api_url}updateUser/${id}`, updatedData, { headers });
}


isLoggedIn(): Observable<boolean> {
  const authToken = localStorage.getItem('userToken');
  return of(!!authToken); // Convert the existence of authToken into a boolean
}

verifyUserAccount(userId: string): Observable<any> {
  const token = localStorage.getItem('userToken');
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`
  });
  return this.http.put(environment.api_url + 'verifyUser/' + userId, {}, { headers });
}

logout() {
  localStorage.removeItem('userData');
  localStorage.removeItem('userRole');
  localStorage.removeItem('userToken');
}

}
