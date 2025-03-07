import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Producto } from '../../../models/Producto';
import { ProductosService } from '../../services/productos.service';
import { AuthService } from '../../services/auth.service';
import { CarritoService } from '../../services/carrito.service';
import { Carrito } from '../../../models/Carrito';
import { User } from '../../../models/Users';

@Component({
  selector: 'app-detalle-producto',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detalle-producto.component.html',
  styleUrls: ['./detalle-producto.component.css'],
})
export class DetalleProductoComponent implements OnInit {
  producto: Producto | null = null; // Almacena el producto
  currentUser: User | null = null; // Usuario actual (si está logueado)
  loading: boolean = false;
  error: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productosService: ProductosService,
    private authService: AuthService,
    private carritoService: CarritoService
  ) {}

  ngOnInit(): void {
    // Al iniciar, obtenemos el ID del producto desde la URL
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const productoID = +idParam; // Convertir a number
      this.cargarProducto(productoID);
    }

    // Obtenemos el usuario actual (si existe)
    this.currentUser = this.authService.getCurrentUser();
  }

  // detalle-producto.component.ts
  cargarProducto(productoID: number): void {
    this.loading = true;
    this.productosService.seleccionarPorID(productoID).subscribe({
      next: (producto: Producto) => {
        this.producto = producto; // ya no es un array
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'Ocurrió un error al cargar el producto';
        this.loading = false;
      },
    });
  }

  addToCart(producto: Producto): void {
    // Validar que el stock sea mayor que 0
    if (producto.stock === 0 || +producto.stock === 0) {
      alert('El producto no tiene stock disponible.');
      return;
    }
  
    // Si no hay usuario logueado, redirigimos a Login
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }
  
    // Si hay usuario, creamos el objeto Carrito y lo enviamos
    const carritoItem: Carrito = new Carrito(
      0, // ID generado por la BD
      this.currentUser.id,
      producto.ProductoID,
      1, // Cantidad por defecto
      producto // Se pasa el objeto completo del producto
    );
  
    this.carritoService.addToCart(carritoItem).subscribe({
      next: () => {
        alert('Producto añadido o actualizado en el carrito');
      },
      error: (err) => {
        console.error(err);
        alert('Ocurrió un error al añadir el producto al carrito');
      },
    });
  }
  
}
