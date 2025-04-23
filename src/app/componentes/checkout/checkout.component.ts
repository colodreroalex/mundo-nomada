import { Component, OnInit, OnDestroy, Renderer2, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { CarritoService } from '../../services/carrito.service';
import { AuthService } from '../../services/auth.service';
import { Carrito } from '../../../models/Carrito';
import { User } from '../../../models/Users';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { PdfService } from '../../services/pdf.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit, OnDestroy {
  carrito: Carrito[] = [];
  total: number = 0;
  subtotal: number = 0;
  iva: number = 0;
  envio: number = 0;
  totalConIvaYEnvio: number = 0;
  loading: boolean = false;
  error: string = '';
  feedbackMessage: string = ''; // Mensaje de feedback para el usuario
  currentUser: User | null = null;

  // Variables para el recibo
  orderCompleted: boolean = false;
  orderId: string = '';
  orderData: any = null;

  // Formulario de datos de envío
  shippingForm: FormGroup;
  formSubmitted: boolean = false;

  // Suscripciones
  private subscriptions: Subscription[] = [];

  constructor(
    private carritoService: CarritoService,
    private authService: AuthService,
    private router: Router,
    private http: HttpClient,
    private pdfService: PdfService,
    private fb: FormBuilder,
    private renderer: Renderer2,
    private el: ElementRef
  ) {
    // Inicializar formulario de envío
    this.shippingForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      apellidos: ['', [Validators.required, Validators.minLength(3)]],
      direccion: ['', [Validators.required, Validators.minLength(5)]],
      codigoPostal: ['', [Validators.required, Validators.pattern('^[0-9]{5}$')]],
      ciudad: ['', [Validators.required]],
      provincia: ['', [Validators.required]],
      telefono: ['', [Validators.required, Validators.pattern('^[0-9]{9}$')]],
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {
    // Cargar el script de PayPal
    this.loadPayPalScript();
    
    this.authService.getCurrentUserObservable().subscribe((user: User | null) => {
      this.currentUser = user;
      // Recargar el carrito cuando cambia el usuario
      if (user) {
        this.loadCarrito(user.id);
        // Pre-llenar el formulario si el usuario está logueado
        this.shippingForm.patchValue({
          nombre: user.name?.split(' ')[0] || '',
          apellidos: user.name?.split(' ').slice(1).join(' ') || '',
          email: user.email || ''
        });
      } else {
        this.loadCarrito(0);
      }
    });
    
    // Suscribirse a la finalización de compra para invitados
    this.subscriptions.push(
      this.carritoService.guestPurchaseCompleted$.subscribe(() => {
        console.log('Compra de invitado completada, deteniendo actualización automática');
        // Intentar obtener el componente de carrito y detener su actualización
        try {
          const carritoComponents = document.querySelectorAll('app-carrito');
          if (carritoComponents.length > 0) {
            // El componente está en el DOM, podemos intentar acceder a él
            console.log('Componente carrito encontrado, deteniendo actualización');
            // Se manejará cuando el componente reciba la notificación
          }
        } catch (error) {
          console.error('Error al intentar detener la actualización del carrito:', error);
        }
      })
    );
    
    // Precalcular totales para mejorar la velocidad de respuesta
    this.preloadCalculations();
  }

  /**
   * Carga el script de PayPal si no está ya cargado
   */
  loadPayPalScript(): void {
    // Si ya está cargado el script, no hacemos nada
    if ((window as any).paypal) {
      console.log('Script de PayPal ya está cargado');
      return;
    }

    console.log('Cargando script de PayPal');
    // Crear elemento script
    const script = document.createElement('script');
    script.src = 'https://www.paypal.com/sdk/js?client-id=sb&currency=EUR';
    script.async = true;
    script.onload = () => {
      console.log('Script de PayPal cargado correctamente');
    };
    script.onerror = (error) => {
      console.error('Error al cargar el script de PayPal:', error);
    };
    document.body.appendChild(script);
  }

  // Getters para facilitar el acceso a los campos del formulario en la plantilla
  get f() { return this.shippingForm.controls; }

  // Método para verificar si el formulario es válido
  isFormValid(): boolean {
    return this.shippingForm.valid;
  }

  loadCarrito(userId: number): void {
    this.loading = true;
    this.carritoService.getCart(userId).subscribe({
      next: (data) => {
        this.carrito = data;
        
        // Cálculo del subtotal
        this.subtotal = this.carrito.reduce(
          (acc, item) => acc + (item.producto?.precio || 0) * item.cantidad,
          0
        );
        
        // Calcular todos los valores usando el servicio
        const totales = this.carritoService.calcularTotalesPedido(this.subtotal);
        this.subtotal = totales.subtotal;
        this.iva = totales.iva;
        this.envio = totales.envio;
        this.totalConIvaYEnvio = totales.totalConIvaYEnvio;
        
        // Mantener el total para compatibilidad con código existente
        this.total = this.subtotal;
        
        this.loading = false;
        this.checkStock();
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

  /**
   * Actualiza el estado del botón de PayPal según la validez del formulario
   */
  updatePayPalButtonState(): void {
    this.formSubmitted = true;
    
    if (this.isFormValid()) {
      console.log('Formulario válido, renderizando botón PayPal');
      // Pequeño timeout para permitir que Angular actualice la vista
      setTimeout(() => {
        this.renderPayPalButton();
      }, 500); // Aumentamos el tiempo para asegurar que Angular haya actualizado la vista
    } else {
      console.log('Formulario inválido, no se puede continuar');
    }
  }

  /**
   * Renderiza el botón de PayPal si está disponible el script
   */
  renderPayPalButton(): void {
    console.log('Intentando renderizar botón de PayPal');
    
    // Si no está cargado PayPal, cargarlo
    if (!(window as any).paypal) {
      console.log('Script de PayPal no disponible, cargándolo...');
      
      // Crear elemento script
      const script = document.createElement('script');
      script.src = 'https://www.paypal.com/sdk/js?client-id=sb&currency=EUR';
      script.async = true;
      
      script.onload = () => {
        console.log('Script de PayPal cargado correctamente, renderizando botón');
        this.insertPayPalButton();
      };
      
      script.onerror = (error) => {
        console.error('Error al cargar el script de PayPal:', error);
        this.error = 'No se pudo cargar PayPal. Por favor, intenta de nuevo más tarde.';
      };
      
      document.body.appendChild(script);
      return;
    }
    
    // Si ya está cargado, insertar el botón directamente
    this.insertPayPalButton();
  }
  
  /**
   * Inserta el botón de PayPal en el DOM
   */
  insertPayPalButton(): void {
    // Verificar que el contenedor exista
    const container = document.getElementById('paypal-button-container');
    if (!container) {
      console.error('No se encontró el contenedor para el botón de PayPal');
      return;
    }
    
    // Limpiar el contenedor
    container.innerHTML = '';
    
    console.log('Renderizando botón de PayPal en el contenedor');
    
    try {
      (window as any).paypal.Buttons({
        createOrder: (data: any, actions: any): Promise<string> => {
          return actions.order.create({
            purchase_units: [{
              amount: {
                value: this.totalConIvaYEnvio.toFixed(2) // Total a pagar (con IVA y envío)
              }
            }]
          });
        },
        onApprove: (data: any, actions: any): Promise<void> => {
          // Precalcular los valores antes de la finalización para mejorar la velocidad
          const calculoFinal = this.carritoService.calcularTotalesPedido(this.subtotal);
          this.iva = calculoFinal.iva;
          this.envio = calculoFinal.envio;
          this.totalConIvaYEnvio = calculoFinal.totalConIvaYEnvio;
          
          return actions.order.capture().then((details: any) => {
            this.finalizePurchase();
          });
        },
        onError: (err: any): void => {
          console.error('Error en PayPal:', err);
          this.error = 'Error en el proceso de pago. Inténtalo de nuevo.';
        }
      }).render('#paypal-button-container');
      
      console.log('Botón de PayPal renderizado correctamente');
    } catch (error) {
      console.error('Error al renderizar el botón de PayPal:', error);
      this.error = 'Ocurrió un error al mostrar PayPal. Por favor, recarga la página.';
    }
  }

  finalizePurchase(): void {
    // Verificar que tengamos datos válidos de envío
    if (!this.isFormValid()) {
      this.formSubmitted = true;
      this.error = 'Por favor, complete todos los campos de envío obligatorios';
      return;
    }
    
    const userId = this.currentUser ? this.currentUser.id : 0;
    this.loading = true;
    this.error = '';
    this.feedbackMessage = '';
    
    // Pre-calcular los datos del recibo para que estén disponibles inmediatamente
    // después de completar la compra (evita retardos en la visualización)
    const calculoFinal = this.carritoService.calcularTotalesPedido(this.subtotal);
    this.iva = calculoFinal.iva;
    this.envio = calculoFinal.envio;
    this.totalConIvaYEnvio = calculoFinal.totalConIvaYEnvio;
    
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
          
          // Asegurarnos de que cada item del carrito tenga el user_id actualizado antes de enviar al backend
          if (this.currentUser && this.currentUser.id) {
            this.carrito.forEach(item => {
              item.user_id = this.currentUser!.id;
            });
          }

          // Si todo está bien, proceder con la compra - aceleramos el tiempo de muestra del recibo
          this.carritoService.finalizePurchase(this.carrito).subscribe({
            next: (response) => {
              // Reducimos tiempo de procesamiento
              this.loading = false;
              this.feedbackMessage = 'Compra realizada con éxito';
              
              // Generar ID de orden
              this.orderId = `ORD-${new Date().getTime()}`;
              
              // Preparar los datos del recibo incluyendo los datos de envío
              this.orderData = {
                items: this.carrito,
                total: this.subtotal,
                user: this.currentUser,
                iva: this.iva,
                envio: this.envio,
                totalConIvaYEnvio: this.totalConIvaYEnvio,
                date: new Date(), // Añadimos la fecha y hora actual
                // Añadimos los datos de envío
                datosEnvio: {
                  nombre: this.shippingForm.get('nombre')?.value,
                  apellidos: this.shippingForm.get('apellidos')?.value,
                  direccion: this.shippingForm.get('direccion')?.value,
                  codigoPostal: this.shippingForm.get('codigoPostal')?.value,
                  ciudad: this.shippingForm.get('ciudad')?.value,
                  provincia: this.shippingForm.get('provincia')?.value,
                  telefono: this.shippingForm.get('telefono')?.value,
                  email: this.shippingForm.get('email')?.value
                }
              };
              
              // Asegurarnos de que el carrito se limpie correctamente (especialmente importante para invitados)
              const userId = this.currentUser ? this.currentUser.id : 0;
              this.carritoService.clearCart(userId).subscribe({
                next: () => console.log('Carrito limpiado correctamente'),
                error: (err: any) => console.error('Error al limpiar el carrito:', err)
              });
              
              // Mostrar el recibo y no redirigir inmediatamente
              this.orderCompleted = true;
              
              // Opcional: guardar una copia del carrito antes de limpiarlo
              const carritoCompletado = [...this.carrito];
              
              // Limpiar el carrito después de la compra exitosa
              if (!this.currentUser) {
                // Para invitados, limpiamos localStorage definitivamente y evitamos que reaparezca
                this.carritoService.removeLocalCart();
                // Además limpiamos el carrito en memoria
                this.carrito = [];
              }
            },
            error: (err: any) => {
              this.loading = false;
              console.error(err);
              this.error = err.mensaje || 'Error al finalizar la compra. Intente nuevamente.';
            }
          });
        },
        error: (err: any) => {
          this.loading = false;
          console.error(err);
          this.error = 'Ocurrió un error al verificar el stock de los productos. Intente nuevamente.';
        }
      });
  }

  /**
   * Precalcula los totales para mejorar la velocidad de respuesta
   */
  preloadCalculations(): void {
    // Obtener el subtotal actual y calcular los valores asociados
    if (this.subtotal > 0) {
      const calculoFinal = this.carritoService.calcularTotalesPedido(this.subtotal);
      this.iva = calculoFinal.iva;
      this.envio = calculoFinal.envio;
      this.totalConIvaYEnvio = calculoFinal.totalConIvaYEnvio;
    }
  }

  /**
   * Genera el PDF del recibo después de una compra exitosa
   */
  downloadReceipt(): void {
    if (!this.orderData) {
      this.error = 'No hay datos de pedido disponibles para descargar';
      return;
    }
    
    try {
      // Generamos el PDF usando el servicio PDF
      this.pdfService.generateReceiptPdf(
        this.orderData.items,
        this.orderData.total,
        this.orderData.user,
        this.orderId,
        this.orderData.iva,
        this.orderData.envio,
        this.orderData.totalConIvaYEnvio,
        this.orderData.datosEnvio
      );
      this.feedbackMessage = 'Recibo descargado correctamente';
    } catch (error) {
      this.error = 'Error al generar el PDF: ' + error;
      console.error('Error al generar PDF:', error);
    }
  }

  /**
   * Redirige al usuario después de completar el proceso
   */
  goToHome(): void {
    this.router.navigate(['/']);
  }

  /**
   * Redirige al usuario a la página de sus pedidos
   */
  viewUserOrders(): void {
    this.router.navigate(['/perfil/pedidos']);
  }

  ngOnDestroy(): void {
    // Limpiar todas las suscripciones para evitar pérdidas de memoria
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }
}