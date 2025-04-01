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

  deleteUser(userId: number) {
    if (confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      this.loading = true;
      this.usuariosService.deleteUser(userId)
        .subscribe({
          next: (response) => {
            this.loading = false;
            if (response && (response.success || response.result === 'OK')) {
              // Eliminar el usuario de la lista local
              this.users = this.users.filter(user => user.id !== userId);
              alert('Usuario eliminado correctamente');
            } else {
              alert(response?.mensaje || response?.message || 'Error al eliminar usuario');
            }
          },
          error: (err) => {
            this.loading = false;
            console.error('Error al eliminar usuario:', err);
            alert(err.message || 'Error al eliminar usuario. Por favor, inténtalo de nuevo.');
          }
        });
    }
  }

  // Método para reintentar la carga de usuarios
  retryLoad() {
    this.loadUsers();
  }
}
