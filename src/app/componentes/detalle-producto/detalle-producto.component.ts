import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Producto } from '../../../models/Producto';
import { ProductosService } from '../../services/productos.service';
import { AuthService } from '../../services/auth.service';
import { CarritoService } from '../../services/carrito.service';
import { Carrito } from '../../../models/Carrito';
import { User } from '../../../models/Users';
import { Location } from '@angular/common';

@Component({
  selector: 'app-detalle-producto',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detalle-producto.component.html',
  styleUrls: ['./detalle-producto.component.css'],
})
export class DetalleProductoComponent implements OnInit {
  producto: Producto | null = null;
  currentUser: User | null = null;
  loading: boolean = false;
  error: string = '';
  // Propiedad para notificaciones: type puede ser 'success', 'warning', 'danger', etc.
  notification: { message: string; type: string } | null = null;
  
 

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productosService: ProductosService,
    private authService: AuthService,
    private carritoService: CarritoService,
    private location: Location
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const productoID = +idParam;
      this.cargarProducto(productoID);
    }

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
        // Asegurarse de que stock es un número
        if (producto) {
          // Normalizar el valor del stock a número
          producto.stock = Number(producto.stock);
          
          // Si es NaN, asignar 0
          if (isNaN(producto.stock)) {
            producto.stock = 0;
          }
        }
        
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

  // Método para volver a la página anterior
  goBack(): void {
    this.location.back();
  }

  // Métodos auxiliares para el control de stock
  hasStock(producto: Producto): boolean {
    const result = producto && Number(producto.stock) > 5;
    console.log(`DEBUG - hasStock: ${result}, stock: ${producto?.stock}`);
    return result;
  }

  hasLowStock(producto: Producto): boolean {
    const result = producto && Number(producto.stock) <= 5 && Number(producto.stock) > 0;
    console.log(`DEBUG - hasLowStock: ${result}, stock: ${producto?.stock}`);
    return result;
  }

  isOutOfStock(producto: Producto): boolean {
    if (!producto) return true;
    const stockNum = Number(producto.stock);
    const result = isNaN(stockNum) || stockNum === 0;
    console.log(`DEBUG - isOutOfStock: ${result}, stock: ${producto?.stock}, stockNum: ${stockNum}`);
    return result;
  }

  addToCart(producto: Producto): void {
    // Si no hay usuario logueado, se tratará como invitado (userId = 0)
    const userId = this.currentUser ? this.currentUser.id : 0;

    // Verificar stock disponible
    if (this.isOutOfStock(producto)) {
      this.notification = {
        message: 'El producto no tiene stock disponible.',
        type: 'warning',
      };
      setTimeout(() => {
        this.notification = null;
      }, 1500);
      return;
    }

    // Para usuarios invitados, solicitar verificación en tiempo real del stock
    if (userId === 0) {
      this.loading = true;
      this.carritoService.verificarStockActualizado(producto.ProductoID).subscribe({
        next: (productoActualizado) => {
          this.loading = false;
          
          // Normalizar el stock aquí también
          if (productoActualizado) {
            productoActualizado.stock = Number(productoActualizado.stock);
            if (isNaN(productoActualizado.stock)) {
              productoActualizado.stock = 0;
            }
          }
          
          // Actualizar la vista con el stock real
          this.producto = productoActualizado;
          
          // Si no hay stock, mostrar mensaje y salir
          if (this.isOutOfStock(productoActualizado)) {
            this.notification = {
              message: 'El producto ya no tiene stock disponible.',
              type: 'warning',
            };
            setTimeout(() => this.notification = null, 1500);
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
        setTimeout(() => {
          this.notification = null;
        }, 1500);
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
            message: err.mensaje || 'Ocurrió un error al añadir el producto al carrito',
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
