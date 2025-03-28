import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CarritoService } from '../../services/carrito.service';
import { AuthService } from '../../services/auth.service';
import { Carrito } from '../../../models/Carrito';
import { User } from '../../../models/Users';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { PdfService } from '../../services/pdf.service';
import { ReceiptComponent } from '../receipt/receipt.component';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [FormsModule, CommonModule, ReceiptComponent],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {
  carrito: Carrito[] = [];
  total: number = 0;
  loading: boolean = false;
  error: string = '';
  feedbackMessage: string = ''; // Mensaje de feedback para el usuario
  currentUser: User | null = null;

  // Variables para el recibo
  orderCompleted: boolean = false;
  orderId: string = '';

  constructor(
    private carritoService: CarritoService,
    private authService: AuthService,
    private router: Router,
    private http: HttpClient,
    private pdfService: PdfService
  ) {}

  ngOnInit(): void {
    this.authService.getCurrentUserObservable().subscribe((user) => {
      this.currentUser = user;
      const userId = user ? user.id : 0;
      this.loadCarrito(userId);
    });
  }

  loadCarrito(userId: number): void {
    this.loading = true;
    this.carritoService.getCart(userId).subscribe({
      next: (data) => {
        this.carrito = data;
        this.total = this.carrito.reduce(
          (acc, item) => acc + (item.producto?.precio || 0) * item.cantidad,
          0
        );
        this.loading = false;
        this.checkStock();
        if (this.carrito && this.carrito.length > 0) {
          setTimeout(() => {
            this.renderPayPalButton();
          }, 500);
        }
      },
      error: (err) => {
        console.error(err);
        this.error = 'Ocurrió un error al cargar el carrito';
        this.loading = false;
      }
    });
  }

  // Verifica si hay productos con stock 0 y muestra un mensaje
  checkStock(): boolean {
    const outOfStockItems = this.carrito.filter(item => !item.producto || item.producto.stock < item.cantidad);
    if (outOfStockItems.length > 0) {
      this.error = 'Algunos productos en tu carrito ya no están disponibles o no tienen suficiente stock: ' + 
                   outOfStockItems.map(item => item.producto?.nombre).join(', ');
      
      // Actualizar carrito para eliminar productos sin stock
      this.carrito = this.carrito.filter(item => item.producto && item.producto.stock >= item.cantidad);
      
      // Si es usuario invitado, actualizar localStorage
      if (!this.currentUser) {
        this.carritoService.saveLocalCart(this.carrito);
      }
      
      return false;
    }
    return true;
  }

  renderPayPalButton(): void {
    if ((window as any).paypal) {
      (window as any).paypal.Buttons({
        createOrder: (data: any, actions: any): Promise<string> => {
          return actions.order.create({
            purchase_units: [{
              amount: {
                value: this.total.toFixed(2) // Total a pagar
              }
            }]
          });
        },
        onApprove: (data: any, actions: any): Promise<void> => {
          return actions.order.capture().then((details: any) => {
            this.finalizePurchase();
          });
        },
        onError: (err: any): void => {
          console.error(err);
          this.error = 'Error en el proceso de pago. Inténtalo de nuevo.';
        }
      }).render('#paypal-button-container');
    }
  }

  finalizePurchase(): void {
    const userId = this.currentUser ? this.currentUser.id : 0;
    this.loading = true;
    this.error = '';
    this.feedbackMessage = '';
    
    // Primero, obtener los IDs de los productos en el carrito
    const productIds = this.carrito.map(item => item.producto_id);
    
    // Obtener la información más reciente de stock directamente del servidor
    this.http.post<any>('http://localhost/mundonomada/api_php/Carrito/getUpdatedProducts.php', { ids: productIds })
      .subscribe({
        next: (response) => {
          // Crear un mapa con la información actualizada de los productos
          const productsMap = new Map<number, any>();
          response.products.forEach((p: any) => {
            const prod = {
              ProductoID: p.ProductoID,
              nombre: p.nombre,
              precio: p.precio,
              descripcion: p.descripcion,
              stock: p.stock,
              categoriaID: p.categoriaID,
              imagen: p.imagen
            };
            productsMap.set(p.ProductoID, prod);
          });
          
          // Actualizar cada ítem del carrito con la información de stock más reciente
          this.carrito = this.carrito.map(item => {
            if (productsMap.has(item.producto_id)) {
              item.producto = productsMap.get(item.producto_id);
            }
            return item;
          });
          
          // Verificar si todos los productos tienen stock suficiente
          const outOfStockItems = this.carrito.filter(
            item => !item.producto || item.producto.stock < item.cantidad
          );
          
          if (outOfStockItems.length > 0) {
            this.loading = false;
            const itemNames = outOfStockItems.map(item => item.producto?.nombre).join(', ');
            this.error = `Algunos productos en su carrito ya no están disponibles o han sido adquiridos por otro usuario: ${itemNames}`;
            
            // Actualizar el carrito para el usuario
            this.carrito = this.carrito.filter(
              item => item.producto && item.producto.stock >= item.cantidad
            );
            
            // Si es usuario invitado, actualizar localStorage
            if (!this.currentUser) {
              this.carritoService.saveLocalCart(this.carrito);
            }
            
            return;
          }
          
          // Si todo está bien, proceder con la compra
          this.carritoService.finalizePurchase(this.carrito).subscribe({
            next: (response) => {
              this.loading = false;
              this.feedbackMessage = 'Compra realizada con éxito';
              
              // Generar ID de orden
              this.orderId = `ORD-${new Date().getTime()}`;
              
              // Mostrar el recibo y no redirigir inmediatamente
              this.orderCompleted = true;
              
              // Opcional: guardar una copia del carrito antes de limpiarlo
              const carritoCompletado = [...this.carrito];
              
              // Limpiar el carrito después de la compra exitosa
              if (!this.currentUser) {
                this.carritoService.saveLocalCart([]);
              }
            },
            error: (err) => {
              this.loading = false;
              console.error(err);
              this.error = err.mensaje || 'Error al finalizar la compra. Intente nuevamente.';
            }
          });
        },
        error: (err) => {
          this.loading = false;
          console.error(err);
          this.error = 'Ocurrió un error al verificar el stock de los productos. Intente nuevamente.';
        }
      });
  }

  /**
   * Genera el PDF del recibo después de una compra exitosa
   */
  downloadReceipt(): void {
    this.pdfService.generateReceiptPdf(this.carrito, this.total, this.currentUser, this.orderId);
  }

  /**
   * Redirige al usuario después de completar el proceso
   */
  goToHome(): void {
    this.router.navigate(['/']);
  }
}