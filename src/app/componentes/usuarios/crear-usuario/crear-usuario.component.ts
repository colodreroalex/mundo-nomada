import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UsuariosService } from '../../../services/usuarios.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-crear-usuario',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './crear-usuario.component.html',
  styleUrls: ['./crear-usuario.component.css'],
  providers: [UsuariosService]
})
export class CrearUsuarioComponent {
  userForm: FormGroup;
  loading = false;
  error = '';
  success = '';

  constructor(
    private fb: FormBuilder,
    private usuariosService: UsuariosService,
    private router: Router
  ) {
    this.userForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['user', Validators.required]
    });
  }

  onSubmit() {
    // Marcar todos los campos como tocados para mostrar errores de validación
    if (this.userForm.invalid) {
      Object.keys(this.userForm.controls).forEach(key => {
        const control = this.userForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    const userData = this.userForm.value;
    console.log('Datos a enviar:', userData);
    
    this.usuariosService.createUser(userData)
      .subscribe({
        next: (response) => {
          console.log('Respuesta del servidor:', response);
          if (response && (response.success || response.result === 'OK')) {
            this.success = response.mensaje || response.message || 'Usuario creado correctamente';
            this.loading = false;
            
            // Resetear el formulario
            this.userForm.reset({
              role: 'user'
            });
            
            // Redirigir a la lista de usuarios después de 2 segundos
            setTimeout(() => {
              this.router.navigate(['/lista-usuarios']);
            }, 2000);
          } else {
            this.error = response?.mensaje || response?.message || 'Error al crear el usuario';
            this.loading = false;
          }
        },
        error: (err: HttpErrorResponse) => {
          console.error('Error al crear usuario:', err);
          
          // Intentar extraer mensaje de error
          let errorMsg = 'Error al crear el usuario. Por favor, inténtalo de nuevo.';
          
          if (err.error) {
            if (typeof err.error === 'string') {
              try {
                const parsedError = JSON.parse(err.error);
                errorMsg = parsedError.mensaje || errorMsg;
              } catch (e) {
                // No es un JSON válido
              }
            } else if (err.error.mensaje) {
              errorMsg = err.error.mensaje;
            }
          }
          
          this.error = errorMsg;
          this.loading = false;
        }
      });
  }
  
  // Método para reintentar
  retry() {
    this.error = '';
    this.success = '';
  }
}
