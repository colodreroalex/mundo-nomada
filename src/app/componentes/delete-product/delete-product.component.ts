import { Component, OnInit } from '@angular/core';
import { Producto } from '../../../models/Producto';
import { Categoria } from '../../../models/Categoria';
import { ProductosService } from '../../services/productos.service';
import { AuthService } from '../../services/auth.service';
import { CategoriasService } from '../../services/categorias.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-delete-product',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './delete-product.component.html',
  styleUrls: ['./delete-product.component.css']
})
export class DeleteProductComponent implements OnInit {
  products: Producto[] = [];
  filteredProducts: Producto[] = [];
  categorias: Categoria[] = [];
  selectedCategoryId: number | null = null;
  searchTerm: string = '';
  loading: boolean = false;
  loadingCategorias: boolean = false;
  error: string = '';
  success: string = '';
  isAdmin: boolean = false;

  constructor(
    private productosService: ProductosService,
    private authService: AuthService,
    private categoriasService: CategoriasService
  ) { }

  ngOnInit(): void {
    // Verificar si el usuario tiene permisos de administrador
    this.authService.getCurrentUserObservable().subscribe(user => {
      if (user && user.role === 'admin') {
        this.isAdmin = true;
        this.loadProducts();
        this.loadCategorias();
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
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'Ocurrió un error al cargar los productos';
        this.loading = false;
      }
    });
  }
  
  loadCategorias(): void {
    this.loadingCategorias = true;
    this.categoriasService.getCategorias().subscribe({
      next: (categorias) => {
        this.categorias = categorias;
        this.loadingCategorias = false;
      },
      error: (err) => {
        console.error('Error al cargar categorías:', err);
        this.loadingCategorias = false;
      }
    });
  }
  
  applyFilters(): void {
    // Hacemos una copia de todos los productos
    let result = [...this.products];
    
    // Filtrar por categoría si hay una seleccionada
    if (this.selectedCategoryId) {
      result = result.filter(producto => 
        producto.categoriaID === this.selectedCategoryId);
    }
    
    // Filtrar por término de búsqueda (nombre del producto)
    if (this.searchTerm.trim() !== '') {
      const searchTermLower = this.searchTerm.toLowerCase().trim();
      result = result.filter(producto => 
        producto.nombre.toLowerCase().includes(searchTermLower));
    }
    
    // Actualizar los productos filtrados
    this.filteredProducts = result;
  }
  
  onCategoryChange(): void {
    this.applyFilters();
  }
  
  onSearchChange(): void {
    this.applyFilters();
  }
  
  clearFilters(): void {
    this.selectedCategoryId = null;
    this.searchTerm = '';
    this.applyFilters();
  }

  deleteProduct(producto: Producto): void {
    // Limpiar mensajes previos
    this.error = '';
    this.success = '';
    
    if (!this.isAdmin) {
      this.error = 'No tienes permisos para eliminar productos';
      return;
    }

    if (confirm(`¿Estás seguro de eliminar el producto "${producto.nombre}"?`)) {
      console.log('ID del producto a eliminar:', producto.ProductoID);
      
      // Mostrar indicador de carga
      this.loading = true;
      
      // Verificar que estamos autenticados
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser || currentUser.role !== 'admin') {
        this.error = 'Necesitas ser administrador para eliminar productos';
        this.loading = false;
        return;
      }
      
      // Realizar la eliminación
      this.productosService.eliminarProducto(producto.ProductoID).subscribe({
        next: (response) => {
          console.log('Respuesta exitosa del servicio:', response);
          this.success = `El producto "${producto.nombre}" se eliminó con éxito.`;
          // Recargar la lista actualizada desde el backend
          this.loadProducts();
          this.loading = false;
          // Limpiar mensaje de éxito después de unos segundos
          setTimeout(() => this.success = '', 3000);
        },
        error: (err: any) => {
          console.error('Error al eliminar producto:', err);
          this.loading = false;
          
          if (err && err.message) {
            this.error = err.message;
          } else {
            this.error = 'Ocurrió un error al eliminar el producto. Verifica que tu sesión esté activa y tengas permisos de administrador.';
          }
          
          // Intentar recargar los productos en caso de error
          // para asegurar que se muestra el estado actual
          this.loadProducts();

          // Forzar una nueva verificación de sesión
          this.authService.checkSession();
        }
      });
    }
  }
}
