import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserAuthService } from './core/services/user_auth/user-auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authservice = inject(UserAuthService)
  
  let isLoggedIn = false;
  let userData: any = null;
  try {
    userData = localStorage.getItem('userData');
    const userToken = localStorage.getItem('userToken');
    const userRole = localStorage.getItem('userRole');
    // User is logged in only if ALL required tokens exist
    isLoggedIn = userData !== null && userToken !== null && userRole !== null;
  } catch (error) {
    console.warn('Storage access blocked by browser tracking prevention:', error);
    isLoggedIn = false;
  }

  if(!isLoggedIn){
    // Set flag to prevent auto-redirect on login page
    sessionStorage.setItem('justLoggedOut', 'true');
    router.navigate(['/login'])
    return false;
  }

  // Check role-based access if required roles are specified in route data
  if (route.data && route.data['requiredRoles']) {
    try {
      const userDataObj = JSON.parse(userData);
      const userRole = userDataObj?.role || localStorage.getItem('userRole');
      const requiredRoles = route.data['requiredRoles'] as string[];
      
      if (!userRole || !requiredRoles.includes(userRole)) {
        console.warn(`Access denied: User role ${userRole} not in required roles`, requiredRoles);
        sessionStorage.setItem('justLoggedOut', 'true');
        router.navigate(['/dashboard']);
        return false;
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
      sessionStorage.setItem('justLoggedOut', 'true');
      router.navigate(['/login']);
      return false;
    }
  }

  // Check department-based access if required departments are specified in route data
  if (route.data && route.data['requiredDepartments']) {
    try {
      const userDataObj = JSON.parse(userData);
      const userDepartment = userDataObj?.department;
      const requiredDepartments = route.data['requiredDepartments'] as string[];
      
      if (!userDepartment || !requiredDepartments.includes(userDepartment)) {
        console.warn(`Access denied: User department ${userDepartment} not in required departments`, requiredDepartments);
        sessionStorage.setItem('justLoggedOut', 'true');
        router.navigate(['/dashboard']);
        return false;
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
      return false;
    }
  }

  return true;
};
// import { Observable } from 'rxjs';
// import { map } from 'rxjs/operators';
// import { UserAuthService } from './core/services/user_auth/user-auth.service';

// @Injectable({
//   providedIn: 'root'
// })
// export class authGuard implements CanActivate {

//   constructor(private authService: UserAuthService, private router: Router) {}

//   canActivate(
//     route: ActivatedRouteSnapshot,
//     state: RouterStateSnapshot
//   ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
//     if (this.authService.isLoggedIn()) {
//       return true; // Allow navigation
//     } else {
//       // Navigate to login page with returnUrl
//       return this.router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
//     }
//   }
// }