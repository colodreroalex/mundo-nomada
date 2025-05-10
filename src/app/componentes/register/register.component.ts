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
    // Validación básica en el cliente
    if (!this.name || !this.email || !this.password) {
      this.notification = { 
        message: 'Por favor, completa todos los campos del formulario.', 
        type: 'danger' 
      };
      return;
    }

    // Validación simple de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      this.notification = { 
        message: 'Por favor, ingresa un correo electrónico válido.', 
        type: 'danger' 
      };
      return;
    }

    // Validación de contraseña (mínimo 6 caracteres)
    if (this.password.length < 6) {
      this.notification = { 
        message: 'La contraseña debe tener al menos 6 caracteres.', 
        type: 'danger' 
      };
      return;
    }

    this.authService.register(this.name, this.email, this.password).subscribe({
      next: (response) => {
        console.log('Registro exitoso', response);
        // Mostramos la notificación de éxito
        this.notification = { 
          message: 'Te has registrado exitosamente! Por favor, inicia sesión.', 
          type: 'success' 
        };
        // Limpiamos la notificación y redirigimos después de 3 segundos
        setTimeout(() => {
          this.notification = null;
          this.router.navigate(['/login']);
        }, 3000);
      },
      error: (error) => {
        console.error('Registro fallido', error);
        
        // Mostrar el mensaje específico del error
        this.notification = { 
          message: error.message || 'Error en el registro. Por favor, intenta nuevamente.', 
          type: 'danger' 
        };
        
        // No eliminamos automáticamente el mensaje de error para que el usuario pueda leerlo
        // Solo lo eliminamos si es exitoso
      }
    });
  }
}
