import { Component, OnInit } from '@angular/core';
import { Producto } from '../../../models/Producto';
import { ProductosService } from '../../services/productos.service';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-delete-product',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './delete-product.component.html',
  styleUrls: ['./delete-product.component.css']
})
export class DeleteProductComponent implements OnInit {
  products: Producto[] = [];
  loading: boolean = false;
  error: string = '';
  success: string = '';
  isAdmin: boolean = false;

  constructor(
    private productosService: ProductosService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    // Verificar si el usuario tiene permisos de administrador
    this.authService.getCurrentUserObservable().subscribe(user => {
      if (user && user.role === 'admin') {
        this.isAdmin = true;
        this.loadProducts();
      } else {
        this.error = 'No tienes permisos para acceder a esta funcionalidad';
      }
    });
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
    if (!this.isAdmin) {
      this.error = 'No tienes permisos para eliminar productos';
      return;
    }

    if (confirm(`¿Estás seguro de eliminar el producto "${producto.nombre}"?`)) {
      console.log('ID del producto a eliminar:', producto.ProductoID);
      
      // Verificamos sesión antes de intentar eliminar
      this.authService.checkSession();
      
      // Intentamos con URL con el formato específico que espera el servidor
      this.productosService.eliminarProducto(producto.ProductoID).subscribe({
        next: (response) => {
          console.log('Respuesta exitosa del servicio:', response);
          this.success = `El producto "${producto.nombre}" se eliminó con éxito.`;
          // Recargar la lista actualizada desde el backend
          this.loadProducts();
          // Limpiar mensaje de éxito después de unos segundos (opcional)
          setTimeout(() => this.success = '', 3000);
        },
        error: (err) => {
          console.error('Error en componente:', err);
          
          this.error = 'Ocurrió un error al eliminar el producto. Verifica que tu sesión esté activa y tengas permisos de administrador.';
        }
      });
    }
  }
}
