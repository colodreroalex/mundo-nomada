import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { UsuariosService } from '../../../services/usuarios.service';
import { User } from '../../../../models/Users';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-eliminar-usuario',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './eliminar-usuario.component.html',
  styleUrls: ['./eliminar-usuario.component.css'],
  providers: [UsuariosService]
})
export class EliminarUsuarioComponent implements OnInit {
  user: User | null = null;
  loading = false;
  loadingData = false;
  error = '';
  success = '';
  userId: number = 0;

  constructor(
    private usuariosService: UsuariosService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

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
          this.user = user;
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

  cancelDelete() {
    this.router.navigate(['/lista-usuarios']);
  }

  confirmDelete() {
    if (!this.userId) {
      this.error = 'ID de usuario no válido';
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    this.usuariosService.deleteUser(this.userId).subscribe({
      next: (response) => {
        console.log('Respuesta del servidor:', response);
        if (response && response.success) {
          this.success = response.mensaje || 'Usuario eliminado correctamente';
          this.loading = false;
          
          // Redirigir a la lista de usuarios después de mostrar el mensaje de éxito
          setTimeout(() => {
            this.router.navigate(['/lista-usuarios']);
          }, 2000);
        } else {
          this.error = response?.mensaje || 'Error al eliminar el usuario';
          this.loading = false;
        }
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error al eliminar usuario:', err);
        
        // Intentar extraer mensaje de error
        let errorMsg = 'Error al eliminar el usuario. Por favor, inténtalo de nuevo.';
        
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
    if (this.userId) {
      this.loadUserData(this.userId);
    }
  }
}
