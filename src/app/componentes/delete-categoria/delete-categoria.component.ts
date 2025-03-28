import { Component } from '@angular/core';
import { Categoria } from '../../../models/Categoria';
import { CategoriasService } from '../../services/categorias.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-delete-categoria',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './delete-categoria.component.html',
  styleUrls: ['./delete-categoria.component.css']
})
export class DeleteCategoriaComponent {
  categorias: Categoria[] = [];
  loading: boolean = false;
  error: string = '';
  success: string = '';

  constructor(private categoriasService: CategoriasService) {}

  ngOnInit(): void {
    this.loadCategorias();
  }

  loadCategorias(): void {
    this.loading = true;
    this.categoriasService.getCategorias().subscribe({
      next: (data) => {
        this.categorias = data;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'Ocurrió un error al cargar las categorías';
        this.loading = false;
      }
    });
  }

  deleteCategoria(categoria: Categoria): void {
    if (confirm(`¿Estás seguro de eliminar la categoría "${categoria.Nombre}"?`)) {
      this.categoriasService.eliminarCategoria(categoria.CategoriaID).subscribe({
        next: () => {
          this.success = `La categoría "${categoria.Nombre}" se eliminó con éxito.`;
          this.loadCategorias(); // Recargar la lista actualizada
          setTimeout(() => this.success = '', 3000); // Limpiar el mensaje de éxito
        },
        error: (err) => {
          console.error(err);
          this.error = 'Ocurrió un error al eliminar la categoría. Lo mas seguro es que la CATEGORIA este ASOCIADA A ALGUN PRODUCTO';
        }
      });
    }
  }
}
