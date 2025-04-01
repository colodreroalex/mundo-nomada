import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { UsuariosService } from '../../../services/usuarios.service';
import { User } from '../../../../models/Users';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-editar-usuario',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './editar-usuario.component.html',
  styleUrls: ['./editar-usuario.component.css'],
  providers: [UsuariosService]
})
export class EditarUsuarioComponent implements OnInit {
  userForm: FormGroup;
  loading = false;
  loadingData = false;
  error = '';
  success = '';
  userId: number = 0;
  
  constructor(
    private fb: FormBuilder,
    private usuariosService: UsuariosService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.userForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', []], // Contraseña opcional para actualizaciones
      role: ['user', Validators.required]
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.userId = +params['id'];
        this.loadUserData(this.userId);
      } else {
        this.error = 'ID de usuario no proporcionado';
        setTimeout(() => this.router.navigate(['/lista-usuarios']), 2000);
      }
    });
  }

  loadUserData(id: number) {
    this.loadingData = true;
    this.error = '';

    this.usuariosService.getUserById(id).subscribe({
      next: (user: User) => {
        if (user) {
          // Excluimos la contraseña en el formulario de edición
          this.userForm.patchValue({
            name: user.name,
            email: user.email,
            role: user.role
          });
          console.log('Datos de usuario cargados:', user);
          this.loadingData = false;
        } else {
          this.error = 'No se encontró información para este usuario';
          this.loadingData = false;
          setTimeout(() => this.router.navigate(['/lista-usuarios']), 2000);
        }
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error al cargar datos del usuario:', err);
        
        // Intentar extraer mensaje de error
        let errorMsg = 'No se pudo cargar la información del usuario';
        
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
        this.loadingData = false;
      }
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

    const userData = {
      ...this.userForm.value,
      id: this.userId
    };

    console.log('Datos a enviar:', userData);

    // Si no se proporciona contraseña, la eliminamos del objeto para no actualizarla
    if (!userData.password) {
      delete userData.password;
    }

    this.usuariosService.updateUser(userData).subscribe({
      next: (response) => {
        console.log('Respuesta del servidor:', response);
        if (response && (response.success || response.result === 'OK')) {
          this.success = response.mensaje || response.message || 'Usuario actualizado correctamente';
          this.loading = false;
          
          // Redirigir a la lista de usuarios después de mostrar el mensaje de éxito
          setTimeout(() => {
            this.router.navigate(['/lista-usuarios']);
          }, 2000);
        } else {
          this.error = response?.mensaje || response?.message || 'Error al actualizar el usuario';
          this.loading = false;
        }
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error al actualizar usuario:', err);
        
        // Intentar extraer mensaje de error
        let errorMsg = 'Error al actualizar el usuario. Por favor, inténtalo de nuevo.';
        
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
