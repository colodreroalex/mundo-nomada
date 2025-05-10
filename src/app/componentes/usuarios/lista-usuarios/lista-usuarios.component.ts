import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { User } from '../../../../models/Users';
import { UsuariosService } from '../../../services/usuarios.service';

@Component({
  selector: 'app-lista-usuarios',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './lista-usuarios.component.html',
  styleUrls: ['./lista-usuarios.component.css'],
  providers: [UsuariosService]
})
export class ListaUsuariosComponent implements OnInit {
  users: User[] = [];
  loading = false;
  error = '';
  
  // Propiedad para notificaciones
  notification: { message: string; type: string } | null = null;

  constructor(private usuariosService: UsuariosService) { }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    this.error = '';
    
    this.usuariosService.getAllUsers()
      .subscribe({
        next: (data) => {
          if (data && Array.isArray(data)) {
            this.users = data;
            this.loading = false;
            console.log('Usuarios cargados:', this.users);
          } else {
            console.error('Formato de datos inesperado:', data);
            this.error = 'La respuesta del servidor no tiene el formato esperado';
            this.loading = false;
          }
        },
        error: (err) => {
          console.error('Error al cargar usuarios:', err);
          this.error = err.message || 'Error al cargar la lista de usuarios. Por favor, inténtalo de nuevo.';
          this.loading = false;
        },
        complete: () => {
          this.loading = false;
        }
      });
  }

  // Mostrar notificación
  showNotification(message: string, type: 'success' | 'danger' | 'warning') {
    this.notification = { message, type };
    // Limpiar la notificación después de 5 segundos
    setTimeout(() => {
      this.notification = null;
    }, 5000);
  }

  // Cerrar notificación manualmente
  closeNotification() {
    this.notification = null;
  }

  deleteUser(userId: number) {
    if (confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      this.loading = true;
      // Limpiar cualquier notificación anterior
      this.notification = null;
      
      this.usuariosService.deleteUser(userId)
        .subscribe({
          next: (response) => {
            this.loading = false;
            if (response && (response.success || response.result === 'OK')) {
              // Eliminar el usuario de la lista local
              this.users = this.users.filter(user => user.id !== userId);
              // Mostrar notificación de éxito
              this.showNotification('Usuario eliminado correctamente', 'success');
            } else {
              // Mostrar mensaje de la respuesta o uno genérico
              const message = response?.mensaje || response?.message || 'Error al eliminar usuario';
              this.showNotification(message, 'warning');
            }
          },
          error: (err) => {
            this.loading = false;
            console.error('Error al eliminar usuario:', err);
            
            // Mensajes detallados para casos específicos
            if (err.message.includes('No puedes eliminar tu propia cuenta')) {
              this.showNotification('No puedes eliminar tu propia cuenta de administrador', 'danger');
            } else if (err.message.includes('único administrador')) {
              this.showNotification('No se puede eliminar al único administrador del sistema', 'danger');
            } else {
              // Mensaje genérico o desde el servidor
              this.showNotification(err.message || 'Error al eliminar usuario. Por favor, inténtalo de nuevo.', 'danger');
            }
          }
        });
    }
  }

  // Método para reintentar la carga de usuarios
  retryLoad() {
    this.loadUsers();
  }
}
