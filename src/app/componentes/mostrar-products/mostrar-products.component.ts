import { Component } from '@angular/core';
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
export class MostrarProductsComponent {
  products: Producto[] = [];
  filterName: string = '';
  filterCategory: number | null = null;
  loading: boolean = false;
  error: string = '';
  currentUser: User | null = null;

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
    this.currentUser = this.authService.getCurrentUser();
  }

  loadProducts(): void {
    this.loading = true;
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
    // Supongamos que la ruta de detalle es '/producto/:id'
    this.router.navigate(['/producto', producto.ProductoID]);
  }

  // Método para añadir el producto al carrito
  // Si no hay usuario logueado, redirige a login
  addToCart(event: Event, producto: Producto): void {
    // Evitar que el click en el botón se propague al contenedor (card)
    event.stopPropagation();

    if (!this.currentUser) {
      // Redirigir a login si no hay usuario
      this.router.navigate(['/login']);
      return;
    }

    // Si hay usuario logueado, añade el producto al carrito
    const carritoItem: Carrito = new Carrito(
      0, // El ID lo genera la base de datos
      this.currentUser.id,
      producto.ProductoID,
      1,
      producto
    );

    this.carritoService.addToCart(carritoItem).subscribe({
      next: () => {
        this.notification = { message: 'Producto añadido o actualizado en el carrito', type: 'success' };
        setTimeout(() => this.notification = null, 2000);
      },
      error: (err) => {
        console.error(err);
        this.notification = { message: 'Ocurrió un error al añadir el producto al carrito', type: 'danger' };
        setTimeout(() => this.notification = null, 2000);
      }
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
}
