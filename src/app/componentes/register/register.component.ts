import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  imports: [CommonModule, FormsModule],
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  name: string = '';
  email: string = '';
  password: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  register() {
    this.authService.register(this.name, this.email, this.password).subscribe({
      next: (response) => {
        console.log('Registro exitoso', response);
        alert('Te has registrado exitosamente! Por favor, inicia sesión.');
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Registro fallido', error);
        alert('Error en el registro. Por favor, intenta nuevamente.');
      }
    });
  }
}