import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Producto } from '../../../models/Producto';
import { ProductosService } from '../../services/productos.service';
import { CarritoService } from '../../services/carrito.service';
import { AuthService } from '../../services/auth.service';
import { Carrito } from '../../../models/Carrito';
import { User } from '../../../models/Users';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-mostrar-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mostrar-products.component.html',
  styleUrls: ['./mostrar-products.component.css']
})
export class MostrarProductsComponent implements OnInit {
  products: Producto[] = [];
  filterName: string = '';
  filterCategory: number | null = null;
  loading: boolean = false;
  error: string = '';
  currentUser: User | null = null;
  currentPage: number = 1;
  itemsPerPage: number = 10;
  sortOption: string = 'relevance';

  // Propiedad para notificaciones: type puede ser 'success', 'warning', 'danger', etc.
  notification: { message: string; type: string } | null = null;

  constructor(
    private productosService: ProductosService,
    private carritoService: CarritoService,
    private authService: AuthService, 
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['categoriaID']) {
        this.filterCategory = +params['categoriaID'];
        console.log('Filtrando por categoría:', this.filterCategory);
      } else {
        this.filterCategory = null;
      }
      this.loadProducts();
    });

    this.authService.getCurrentUserObservable().subscribe({
      next: (user) => {
        this.currentUser = user;
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

  loadProducts(): void {
    this.loading = true;
    this.currentPage = 1; // Reiniciar la página al cargar nuevos productos
    if (this.filterCategory !== null) {
      this.productosService.getProductsByCategory(this.filterCategory).subscribe({
        next: (data) => {
          this.products = data;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error en getProductsByCategory:', err);
          this.error = 'Ocurrió un error al cargar los productos filtrados por categoría';
          this.loading = false;
        }
      });
    } else {
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
  }

  // Método para ver el detalle del producto al hacer clic en la tarjeta
  verDetalleProducto(producto: Producto): void {
    this.router.navigate(['/producto', producto.ProductoID]);
  }

  // Método para añadir el producto al carrito
  addToCart(event: Event, producto: Producto): void {
    // Evitar que el click en el botón se propague al contenedor (card)
    event.stopPropagation();

    // Si no hay usuario logueado, se tratará como invitado (userId = 0)
    const userId = this.currentUser ? this.currentUser.id : 0;

    // Verificar stock disponible
    if (producto.stock === 0) {
      this.notification = {
        message: 'El producto no tiene stock disponible.',
        type: 'warning',
      };
      setTimeout(() => this.notification = null, 2000);
      return;
    }

    // Para usuarios invitados, solicitar verificación en tiempo real del stock
    if (userId === 0) {
      this.loading = true;
      this.carritoService.verificarStockActualizado(producto.ProductoID).subscribe({
        next: (productoActualizado) => {
          this.loading = false;
          
          // Si no hay stock, mostrar mensaje y salir
          if (productoActualizado.stock === 0) {
            this.notification = {
              message: 'El producto ya no tiene stock disponible.',
              type: 'warning',
            };
            setTimeout(() => this.notification = null, 2000);
            return;
          }
          
          // Continuar con el proceso de agregar al carrito con la información actualizada
          this.procesarAgregarAlCarrito(userId, productoActualizado);
        },
        error: (err) => {
          this.loading = false;
          console.error('Error al verificar stock actualizado:', err);
          // Continuar con el proceso usando los datos actuales, aunque no sean los más recientes
          this.procesarAgregarAlCarrito(userId, producto);
        }
      });
    } else {
      // Para usuarios registrados, continuar normalmente
      this.procesarAgregarAlCarrito(userId, producto);
    }
  }
  
  // Método auxiliar para continuar el proceso de agregar al carrito
  procesarAgregarAlCarrito(userId: number, producto: Producto): void {
    // Consultar el carrito actual (para validar si ya está añadido, etc.)
    this.carritoService.getCart(userId).subscribe((cartItems: Carrito[]) => {
      const existingCartItem = cartItems.find(
        (item) => item.producto_id === producto.ProductoID
      );
      const currentQuantity = existingCartItem ? existingCartItem.cantidad : 0;
      if (currentQuantity >= producto.stock) {
        this.notification = {
          message: 'No quedan más unidades disponibles para este producto.',
          type: 'warning',
        };
        setTimeout(() => this.notification = null, 2000);
        return;
      }

      // Crear el objeto Carrito y añadirlo
      const carritoItem: Carrito = new Carrito(
        0,              // ID (se asignará en backend o se genera para localStorage)
        userId,         // 0 si es invitado
        producto.ProductoID,
        1,              // Se añade 1 unidad
        producto        // Objeto completo del producto
      );

      this.carritoService.addToCart(carritoItem).subscribe({
        next: (response: any) => {
          // Se espera que el backend devuelva un objeto con la propiedad "resultado"
          if (response && response.resultado === 'OK') {
            this.notification = {
              message: 'Producto añadido al carrito',
              type: 'success',
            };
          } else {
            this.notification = {
              message: 'Producto añadido al carrito',
              type: 'success',
            };
          }
          setTimeout(() => this.notification = null, 2000);
        },
        error: (err) => {
          console.error(err);
          this.notification = {
            message: 'Ocurrió un error al añadir el producto al carrito',
            type: 'danger',
          };
          setTimeout(() => this.notification = null, 2000);
        }
      });
    });
  }

  // Getter para devolver los productos filtrados por nombre
  get filteredProducts(): Producto[] {
    if (!this.filterName) {
      return this.products;
    }
    return this.products.filter(producto =>
      producto.nombre.toLowerCase().includes(this.filterName.toLowerCase())
    );
  }

  // Métodos para la ordenación de productos
  sortProducts(option: string): void {
    this.sortOption = option;
    this.currentPage = 1; // Volver a la primera página cuando se ordena
    
    let sortedProducts = [...this.products];
    
    switch(option) {
      case 'price-asc':
        sortedProducts.sort((a, b) => a.precio - b.precio);
        break;
      case 'price-desc':
        sortedProducts.sort((a, b) => b.precio - a.precio);
        break;
      case 'newest':
        // Ordenar por ID asumiendo que IDs más altos son productos más recientes
        sortedProducts.sort((a, b) => b.ProductoID - a.ProductoID);
        break;
      case 'relevance':
      default:
        // Por defecto, no hacemos ordenación especial
        break;
    }
    
    this.products = sortedProducts;
  }

  // Métodos para la paginación
  goToPage(page: number): void {
    if (page > 0 && page <= this.totalPages) {
      this.currentPage = page;
      
      // Desplazar al inicio de la sección de productos de manera segura
      const productGrid = document.querySelector('.product-grid');
      if (productGrid) {
        window.scrollTo({
          top: productGrid.getBoundingClientRect().top + window.scrollY - 100,
          behavior: 'smooth'
        });
      }
    }
  }

  get totalPages(): number {
    return Math.ceil(this.filteredProducts.length / this.itemsPerPage);
  }

  get paginatedProducts(): Producto[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredProducts.slice(startIndex, startIndex + this.itemsPerPage);
  }

  // Método para limpiar filtros
  clearFilters(): void {
    this.filterName = '';
    this.filterCategory = null;
    this.sortOption = 'relevance';
    this.currentPage = 1;
    this.loadProducts();
  }
}