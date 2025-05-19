import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CategoriasService } from '../../services/categorias.service';
import { Categoria } from '../../../models/Categoria';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-add-categoria',
  templateUrl: './add-categorias.component.html',
  styleUrls: ['./add-categorias.component.css'], 
  imports: [FormsModule, CommonModule],
})
export class AddCategoriaComponent {
  categoria: Categoria = new Categoria(0, '', '');
  // Propiedad para notificaciones (tipo: 'success', 'warning', 'danger', etc.)
  notification: { message: string; type: string } | null = null;

  constructor(private categoriasService: CategoriasService, private router: Router) {}

  addCategoria() {
    // Verificamos que los campos no estén vacíos
    if (!this.categoria.Nombre || !this.categoria.Descripcion) {
      this.notification = { message: 'Por favor, completa todos los campos.', type: 'warning' };
      setTimeout(() => {
        this.notification = null;
      }, 1000);
      return;
    }

    // Llamamos al servicio para agregar la categoría
    this.categoriasService.addCategoria(this.categoria).subscribe({
      next: (res) => {
        if (res.resultado === 'OK') {
          this.notification = { message: res.mensaje, type: 'success' };
          setTimeout(() => {
            this.notification = null;
            // Redirigimos, por ejemplo, a la lista de categorías
            this.router.navigate(['/categorias']);
          }, 1000);
          // Limpiamos el formulario
          this.categoria = new Categoria(0, '', '');
        } else {
          this.notification = { message: res.mensaje, type: 'warning' };
          setTimeout(() => {
            this.notification = null;
          }, 1000);
        }
      },
      error: (error) => {
        console.error(error);
        this.notification = { message: 'Error al agregar la categoría. Verifique que no exista e intente de nuevo.', type: 'danger' };
        setTimeout(() => {
          this.notification = null;
        }, 1000);
      }
    });
  }
}
