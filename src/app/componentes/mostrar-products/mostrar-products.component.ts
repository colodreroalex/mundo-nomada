import { Component } from '@angular/core';
import { Producto } from '../../../models/Producto';
import { ProductosService } from '../../services/productos.service';
import { CarritoService } from '../../services/carrito.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User } from '../../../models/Users';
import { AuthService } from '../../services/auth.service';
import { Carrito } from '../../../models/Carrito';
import { ActivatedRoute } from '@angular/router';

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

  constructor(
    private productosService: ProductosService,
    private carritoService: CarritoService,
    private authService: AuthService, 
    private route: ActivatedRoute

  ) {}

  // ngOnInit(): void {
  //   this.loadProducts();
  //   this.currentUser = this.authService.getCurrentUser();
  // }
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
  

  // loadProducts(): void {
  //   this.loading = true;
  //   this.productosService.recuperarTodos().subscribe({
  //     next: (data) => {
  //       this.products = data;
  //       this.loading = false;
  //     },
  //     error: (err) => {
  //       console.error(err);
  //       this.error = 'Ocurrió un error al cargar los productos';
  //       this.loading = false;
  //     }
  //   });
  // }

  loadProducts(): void {
    this.loading = true;
    if (this.filterCategory !== null) {
      // Se usa el endpoint que filtra en el backend
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
      // Se cargan todos los productos
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
 
  addToCart(producto: Producto): void {
    if (this.currentUser) {
      // Crea el objeto Carrito. Nota: el backend usará "producto_id" y "cantidad"
      const carritoItem: Carrito = new Carrito(
        0, // El ID lo genera la base de datos
        this.currentUser.id,
        producto.ProductoID,
        1,
        producto // Se pasa el objeto completo para mapear la información
      );
      this.carritoService.addToCart(carritoItem).subscribe({
        next: (res) => {
          alert('Producto añadido o actualizado en el carrito');
        },
        error: (err) => {
          console.error(err);
          alert('Ocurrió un error al añadir el producto al carrito');
        }
      });
    } else {
      alert('Debes iniciar sesión para añadir productos al carrito');
    }
  }

  // Getter para devolver los productos filtrados según el nombre
  // get filteredProducts(): Producto[] {
  //   if (!this.filterName) {
  //     return this.products;
  //   }
  //   return this.products.filter(producto =>
  //     producto.nombre.toLowerCase().includes(this.filterName.toLowerCase())
  //   );
  // }
  // Getter para devolver los productos filtrados por nombre y categoría
  // Si aún deseas filtrar por nombre localmente, puedes mantener este getter
  get filteredProducts(): Producto[] {
    if (!this.filterName) {
      return this.products;
    }
    return this.products.filter(producto =>
      producto.nombre.toLowerCase().includes(this.filterName.toLowerCase())
    );
  }
}