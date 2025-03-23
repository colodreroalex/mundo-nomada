import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '../../../models/Users';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoriasService } from '../../services/categorias.service';
import { Categoria } from '../../../models/Categoria';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [RouterModule, FormsModule, CommonModule],
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css'],
})
export class MenuComponent implements OnInit {
  isCollapsed: boolean = true;
  currentUser: User | null = null;
  // Propiedad para almacenar las categorías obtenidas de la base de datos
  categorias: Categoria[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
    private categoriasService: CategoriasService
  ) {
    // Suscribirse al observable para actualizar el estado del usuario
    this.authService.getCurrentUserObservable().subscribe((user) => {
      this.currentUser = user;
    });
  }

  ngOnInit(): void {
    this.getCategorias();
  }

  // Método para obtener las categorías desde el servicio
  getCategorias(): void {
    this.categoriasService.getCategorias().subscribe({
      next: (data) => {
        this.categorias = data;
      },
      error: (err) => {
        console.error('Error al obtener las categorías', err);
      },
    });
  }

  toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  logout(): void {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      this.authService.logout().subscribe({
        next: () => {
          // Redirigir al usuario a la página de login tras cerrar sesión
          this.router.navigate(['/login']);
        },
        error: (error) => {
          console.error('Error al cerrar sesión', error);
        },
      });
    }
  }
}
