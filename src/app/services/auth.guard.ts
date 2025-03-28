import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { User } from '../../models/Users';

@Injectable({
  providedIn: 'root'
})

export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const expectedRole = route.data['role'];
    const user: User | null = this.authService.getCurrentUser();

    if (user && (!expectedRole || user.role === expectedRole)) {
      return true;
    }

    // Redirige a una página de acceso denegado o a la página principal
    this.router.navigate(['/main']);
    return false;
  }
}

// export class AuthGuard implements CanActivate {

//   constructor(private authService: AuthService, private router: Router) {}

//   canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
//     const expectedRole = route.data['role'];
//     const user: User | null = this.authService.getCurrentUser();

//     if (user && (!expectedRole || user.role === expectedRole)) {
//       return true;
//     }

//     this.router.navigate(['/main']);
//     return false;
//   }
// }