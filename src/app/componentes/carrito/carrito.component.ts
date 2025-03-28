import { Component, OnInit } from '@angular/core';
import { CarritoService } from '../../services/carrito.service';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { Carrito } from '../../../models/Carrito';
import { User } from '../../../models/Users';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Producto } from '../../../models/Producto';

@Component({
  selector: 'app-carrito',
  imports: [CommonModule, RouterLink],
  templateUrl: './carrito.component.html',
  styleUrls: ['./carrito.component.css'],
})
export class CarritoComponent implements OnInit {
  carrito: Carrito[] = [];
  currentUser: User | null = null;
  loading: boolean = false;
  error: string = '';
  total: number = 0;
  subtotal: number = 0;
  iva: number = 0;
  envio: number = 0;
  totalConIvaYEnvio: number = 0;
  envioGratisMinimo: number = 60; // Mínimo para envío gratis
  costoEnvioNormal: number = 3.5; // Costo de envío cuando no se alcanza el mínimo
  ivaPorcentaje: number = 21; // IVA para productos de moda (21%)

  // Propiedad para notificaciones: type puede ser 'success', 'warning', 'danger', etc.
  notification: { message: string; type: string } | null = null;

  constructor(private carritoService: CarritoService, private authService: AuthService, private http: HttpClient) {}

  ngOnInit(): void {
    this.authService.getCurrentUserObservable().subscribe((user) => {
      this.currentUser = user;
      const userId = user ? user.id : 0;
      this.loadCarrito(userId);
      this.loadTotal(userId);
  
      // Actualización más frecuente para invitados (10 segundos) y normal para usuarios (30 segundos)
      const refreshInterval = !user ? 10000 : 30000;
      setInterval(() => {
        this.refreshCart(userId);
      }, refreshInterval);
    });
  }
  
  refreshCart(userId: number): void {
    // Para usuarios invitados, forzar una actualización de los datos del servidor
    if (userId === 0 && this.carrito.length > 0) {
      // Obtener IDs de productos en el carrito
      const productIds = this.carrito.map(item => item.producto_id);
      
      // Llamar directamente a la API para obtener información actualizada
      this.http.post<any>('http://localhost/mundonomada/api_php/Carrito/getUpdatedProducts.php', { ids: productIds })
        .subscribe({
          next: (response) => {
            console.log('Refresh Cart Response:', response);
            
            // Si la respuesta está vacía o no contiene productos, limpiar el carrito local
            if (!response || !response.products || response.products.length === 0) {
              console.warn('No se encontraron productos en el servidor. Limpiando carrito local.');
              this.carrito = [];
              this.carritoService.saveLocalCart([]);
              this.notification = {
                message: 'El carrito se ha vaciado porque los productos ya no están disponibles.',
                type: 'warning'
              };
              setTimeout(() => this.notification = null, 3000);
              
              // Recalcular total (que será 0)
              this.loadTotal(userId);
              return;
            }
            
            // Continuar con la lógica normal si hay productos
            const productsMap = new Map<number, Producto>();
            response.products.forEach((p: any) => {
              const producto = new Producto(
                p.ProductoID,
                p.nombre,
                p.precio,
                p.descripcion,
                p.stock,
                p.categoriaID,
                p.imagen
              );
              productsMap.set(p.ProductoID, producto);
            });
            
            // Verificar si hay cambios en el stock
            let stockChanged = false;
            const cartaActualizado = this.carrito.filter(item => {
              // Si el producto existe en la respuesta del servidor
              if (productsMap.has(item.producto_id)) {
                const productoActualizado = productsMap.get(item.producto_id);
                // Comprobar si el stock ha cambiado
                if (item.producto && productoActualizado && item.producto.stock !== productoActualizado.stock) {
                  stockChanged = true;
                }
                // Actualizar la información del producto
                if (productoActualizado) {
                  item.producto = productoActualizado;
                  // Solo mantener productos con stock > 0
                  return item.producto.stock > 0;
                }
              }
              // Si el producto no existe en el servidor, marcamos que hubo cambio y lo eliminamos
              stockChanged = true;
              return false;
            });
            
            // Si algún producto fue eliminado por falta de stock
            if (cartaActualizado.length !== this.carrito.length) {
              stockChanged = true;
            }
            
            // Actualizar el carrito solo si hubo cambios
            if (stockChanged) {
              this.carrito = cartaActualizado;
              // Actualizar localStorage
              this.carritoService.saveLocalCart(cartaActualizado);
              // Mostrar notificación
              this.notification = {
                message: 'El inventario ha cambiado. Se ha actualizado su carrito.',
                type: 'warning'
              };
              setTimeout(() => this.notification = null, 3000);
              
              // Recalcular total
              this.loadTotal(userId);
            }
            
            console.log('Carrito actualizado automáticamente:', this.carrito);
          },
          error: (err) => {
            console.error('Error al actualizar el carrito con datos recientes:', err);
          }
        });
    } else {
      // Para usuarios registrados, usar el método normal
      this.carritoService.getCart(userId).subscribe({
        next: (data) => {
          // Verificar si hay cambios en el carrito
          const stockChanged = this.detectStockChanges(this.carrito, data);
          this.carrito = data;
          
          // Recalcular total si hubo cambios
          if (stockChanged) {
            this.loadTotal(userId);
            this.notification = {
              message: 'El inventario ha cambiado. Se ha actualizado su carrito.',
              type: 'warning'
            };
            setTimeout(() => this.notification = null, 3000);
          }
          
          console.log('Carrito actualizado automáticamente:', this.carrito);
        },
        error: (err) => {
          console.error('Error al actualizar el carrito automáticamente:', err);
        }
      });
    }
  }

  // Detecta cambios en el stock de productos
  detectStockChanges(oldCart: Carrito[], newCart: Carrito[]): boolean {
    if (!oldCart || !newCart) return false;
    
    // Mapear productos antiguos por ID para fácil comparación
    const oldProductMap = new Map<number, number>();
    oldCart.forEach(item => {
      if (item.producto) {
        oldProductMap.set(item.producto.ProductoID, item.producto.stock);
      }
    });
    
    // Verificar si algún producto tiene stock diferente
    for (const item of newCart) {
      if (item.producto && oldProductMap.has(item.producto.ProductoID)) {
        const oldStock = oldProductMap.get(item.producto.ProductoID);
        if (oldStock !== item.producto.stock) {
          return true;
        }
      }
    }
    
    // Verificar si hay productos que ya no están en el carrito nuevo
    for (const item of oldCart) {
      if (item.producto) {
        const exists = newCart.some(newItem => 
          newItem.producto && newItem.producto.ProductoID === item.producto?.ProductoID
        );
        if (!exists) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  loadCarrito(userId: number): void {
    this.loading = true;
    this.carritoService.getCart(userId).subscribe({
      next: (data) => {
        this.carrito = data;
        this.loading = false;
        this.checkStock();
      },
      error: (err) => {
        console.error(err);
        this.notification = { message: 'Ocurrió un error al cargar el carrito.', type: 'danger' };
        this.loading = false;
        setTimeout(() => this.notification = null, 2000);
      }
    });
  }

  loadTotal(userId: number): void {
    this.carritoService.getTotal(userId).subscribe({
      next: (data) => {
        this.subtotal = data;
        this.calcularTotales();
      },
      error: (err) => {
        console.error(err);
        this.notification = { message: 'Ocurrió un error al cargar el total.', type: 'danger' };
        setTimeout(() => this.notification = null, 2000);
      },
    });
  }

  // Método para calcular todos los totales: IVA, envío y total final
  calcularTotales(): void {
    // Calcular el IVA (21% del subtotal)
    this.iva = this.subtotal * (this.ivaPorcentaje / 100);
    
    // Determinar si aplica costo de envío
    this.envio = this.subtotal >= this.envioGratisMinimo ? 0 : this.costoEnvioNormal;
    
    // Calcular el total final (subtotal + IVA + envío)
    this.totalConIvaYEnvio = this.subtotal + this.iva + this.envio;
    
    // Mantener el total actual para compatibilidad con el código existente
    this.total = this.subtotal;
  }

  // Verifica si hay productos con stock 0 y muestra un mensaje
  checkStock(): void {
    const outOfStockItems = this.carrito.filter(item => item.producto?.stock === 0);
    if (outOfStockItems.length > 0) {
      this.notification = {
        message: 'Algunos productos en tu carrito ya no están disponibles. Alguien debio comprarlo y no quedan mas ud.',
        type: 'warning',
      };
      setTimeout(() => this.notification = null, 3000);
      this.carrito = this.carrito.filter(item => item.producto && item.producto.stock > 0);
      // Actualizar el carrito en localStorage
      if (!this.currentUser) {
        this.carritoService.saveLocalCart(this.carrito);
      }
    }
  }

  // Incrementa la cantidad y actualiza el carrito
  increment(item: Carrito): void {
    if (item.producto && item.cantidad < item.producto.stock) {
      item.cantidad++;
      this.updateItem(item);
    } else {
      this.notification = {
        message: 'No quedan más unidades disponibles para este producto.',
        type: 'warning',
      };
      setTimeout(() => this.notification = null, 1500);
    }
  }
  
  // Decrementa la cantidad y actualiza el carrito
  decrement(item: Carrito): void {
    if (item.cantidad > 1) {
      item.cantidad--;
      this.updateItem(item);
    }
  }

  // Actualiza la cantidad en el carrito (backend o localStorage)
  updateItem(item: Carrito): void {
    this.carritoService.updateCart(item).subscribe({
      next: () => {
        const userId = this.currentUser ? this.currentUser.id : 0;
        this.loadTotal(userId);
        this.notification = { message: 'Cantidad actualizada.', type: 'success' };
        setTimeout(() => this.notification = null, 1500);
      },
      error: (err) => {
        console.error(err);
        this.notification = { message: 'Ocurrió un error al actualizar la cantidad.', type: 'danger' };
        setTimeout(() => this.notification = null, 2000);
      },
    });
  }

  // Elimina el producto del carrito
  removeItem(item: Carrito): void {
    const userId = this.currentUser ? this.currentUser.id : 0;
    this.carritoService.removeItem(item.id, userId).subscribe({
      next: () => {
        this.carrito = this.carrito.filter((c) => c.id !== item.id);
        this.loadTotal(userId);
        this.notification = { message: 'Producto eliminado del carrito.', type: 'success' };
        setTimeout(() => this.notification = null, 1500);
      },
      error: (err) => {
        console.error(err);
        this.notification = { message: 'Ocurrió un error al eliminar el producto.', type: 'danger' };
        setTimeout(() => this.notification = null, 2000);
      },
    });
  }
}