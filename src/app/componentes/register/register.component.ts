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

  // Propiedad para notificaciones: message y type (success, danger, etc.)
  notification: { message: string; type: string } | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  register() {
    this.authService.register(this.name, this.email, this.password).subscribe({
      next: (response) => {
        console.log('Registro exitoso', response);
        // Mostramos la notificación de éxito
        this.notification = { message: 'Te has registrado exitosamente! Por favor, inicia sesión.', type: 'success' };
        // Limpiamos la notificación y redirigimos después de 3 segundos
        setTimeout(() => {
          this.notification = null;
          this.router.navigate(['/login']);
        }, 3000);
      },
      error: (error) => {
        console.error('Registro fallido', error);
        // Notificación de error
        this.notification = { message: 'Error en el registro. Por favor, intenta nuevamente.', type: 'danger' };
        // Limpiar la notificación después de 3 segundos
        setTimeout(() => {
          this.notification = null;
        }, 3000);
      }
    });
  }
}
