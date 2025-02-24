import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  imports: [CommonModule, FormsModule],
  styleUrls: ['./login.component.css'], 
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  rememberMe: boolean = false;
  errorMessage: string = ''; // Propiedad para el mensaje de error

  constructor(private authService: AuthService, private router: Router) {}

  login() {
    console.log("Password enviado:", this.password, this.password.length);
    // Se envían email, password y rememberMe al servicio
    this.authService.login(this.email, this.password, this.rememberMe).subscribe({
      next: (response) => {
        console.log('Login successful', response);
        if (this.authService.isAdmin()){
          this.router.navigate(['/adminPanel']);
        } else {
          this.router.navigate(['/mostrarProductos']);
        }
      },
      error: (error) => {
        console.error('Login failed', error);
        this.errorMessage = error.error && error.error.error 
          ? error.error.error 
          : 'Ocurrió un error inesperado. Por favor, inténtalo de nuevo.';
      }
    });
  }
  
}
