import { Component } from '@angular/core';
import { Producto } from '../../../models/Producto';
import { ProductosService } from '../../services/productos.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-delete-product',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './delete-product.component.html',
  styleUrls: ['./delete-product.component.css']
})
export class DeleteProductComponent {
  products: Producto[] = [];
  loading: boolean = false;
  error: string = '';
  success: string = '';

  constructor(private productosService: ProductosService) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading = true;
    this.productosService.recuperarTodos().subscribe({
      next: (data) => {
        this.products = data;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'Ocurrió un error al cargar los productos';
        this.loading = false;
      }
    });
  }

  deleteProduct(producto: Producto): void {
    if (confirm(`¿Estás seguro de eliminar el producto "${producto.nombre}"?`)) {
      this.productosService.eliminarProducto(producto.ProductoID).subscribe({
        next: () => {
          this.success = `El producto "${producto.nombre}" se eliminó con éxito.`;
          // Recargar la lista actualizada desde el backend
          this.loadProducts();
          // Limpiar mensaje de éxito después de unos segundos (opcional)
          setTimeout(() => this.success = '', 3000);
        },
        error: (err) => {
          console.error(err);
          this.error = 'Ocurrió un error al eliminar el producto';
        }
      });
    }
  }
}
