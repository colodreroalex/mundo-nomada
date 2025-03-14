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
  // Propiedad para notificaciones. type puede ser 'success', 'warning', 'danger', etc.
  notification: { message: string; type: string } | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productosService: ProductosService,
    private authService: AuthService,
    private carritoService: CarritoService
  ) {}

  ngOnInit(): void {
    // Obtenemos el ID del producto desde la URL
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const productoID = +idParam; // Convertir a number
      this.cargarProducto(productoID);
    }

    // Obtenemos el usuario actual (si existe)
    this.authService.getCurrentUserObservable().subscribe({
      next: (user) => {
        this.currentUser = user;
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

  cargarProducto(productoID: number): void {
    this.loading = true;
    this.productosService.seleccionarPorID(productoID).subscribe({
      next: (producto: Producto) => {
        this.producto = producto;
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
    // Si no hay un usuario logueado, mostramos el mensaje y redirigimos al login
    if (!this.currentUser) {
      this.notification = {
        message: 'Debes iniciar sesión para añadir productos al carrito',
        type: 'warning',
      };
      setTimeout(() => {
        this.notification = null;
        this.router.navigate(['/login']);
      }, 3000);
      return;
    }
  
    // Verifica si hay stock disponible
    if (producto.stock === 0) {
      this.notification = {
        message: 'El producto no tiene stock disponible.',
        type: 'warning',
      };
      setTimeout(() => {
        this.notification = null;
      }, 1500);
      return;
    }
  
    const user = this.currentUser;
  
    // Consultamos el carrito del usuario
    this.carritoService.getCart(user.id).subscribe((cartItems: Carrito[]) => {
      const existingCartItem = cartItems.find(
        (item) => item.producto_id === producto.ProductoID
      );
      const currentQuantity = existingCartItem ? existingCartItem.cantidad : 0;
  
      // Si la cantidad actual ya alcanzó el stock, se notifica
      if (currentQuantity >= producto.stock) {
        this.notification = {
          message: 'No quedan más unidades disponibles para este producto.',
          type: 'warning',
        };
        setTimeout(() => {
          this.notification = null;
        }, 1500);
        return;
      }
  
      // Si se puede agregar, creamos el objeto Carrito y lo añadimos
      const carritoItem: Carrito = new Carrito(
        0,                // ID generado por la base de datos
        user.id,          // ID del usuario
        producto.ProductoID,
        1,                // Se añade 1 unidad
        producto          // Objeto completo del producto
      );
  
      this.carritoService.addToCart(carritoItem).subscribe({
        next: (response: any) => {
          // Se espera que el backend devuelva un objeto con la propiedad "resultado"
          if (response.resultado === 'OK') {
            this.notification = {
              message: 'Producto añadido o actualizado en el carrito',
              type: 'success',
            };
          } else {
            // En caso de error, se muestra el mensaje recibido del backend
            this.notification = {
              message: response.mensaje || 'No quedan más unidades disponibles para este producto.',
              type: 'warning',
            };
          }
          setTimeout(() => {
            this.notification = null;
          }, 1500);
        },
        error: (err) => {
          console.error(err);
          this.notification = {
            message: 'Ocurrió un error al añadir el producto al carrito',
            type: 'danger',
          };
          setTimeout(() => {
            this.notification = null;
          }, 1500);
        },
      });
    });
  }
}