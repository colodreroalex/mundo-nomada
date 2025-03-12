import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CarritoService } from '../../services/carrito.service';
import { AuthService } from '../../services/auth.service';
import { Carrito } from '../../../models/Carrito';
import { User } from '../../../models/Users';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  imports: [FormsModule, CommonModule],
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {
  carrito: Carrito[] = [];
  total: number = 0;
  loading: boolean = false;
  error: string = '';
  currentUser: User | null = null;

  constructor(
    private carritoService: CarritoService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Obtener el usuario actual
    this.currentUser = this.authService.getCurrentUser();

    if (this.currentUser) {
      // Cargar el carrito y el total
      this.carritoService.getCart(this.currentUser.id).subscribe({
        next: (data) => {
          this.carrito = data;
          this.total = this.carrito.reduce(
            (acc, item) => acc + (item.producto?.precio || 0) * item.cantidad,
            0
          );
          // Si hay elementos en el carrito, renderiza el botón de PayPal
          if (this.carrito && this.carrito.length > 0) {
            // Se espera un corto tiempo para que Angular actualice el DOM
            setTimeout(() => {
              this.renderPayPalButton();
            }, 500); // Puedes ajustar el tiempo según tus necesidades
          }
        },
        error: (err) => {
          console.error(err);
          this.error = 'Ocurrió un error al cargar el carrito';
        }
      });
    } else {
      this.error = 'Debes iniciar sesión para proceder al checkout';
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 3000);
    }
  }

  renderPayPalButton(): void {
    if ((window as any).paypal) {
      (window as any).paypal.Buttons({
        createOrder: (data: any, actions: any): Promise<string> => {
          return actions.order.create({
            purchase_units: [{
              amount: {
                value: this.total.toFixed(2) // total a pagar
              }
            }]
          });
        },
        onApprove: (data: any, actions: any): Promise<void> => {
          return actions.order.capture().then((details: any) => {
            // Una vez aprobado el pago, finalizamos la compra
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
    // Se llama al backend para confirmar la compra, reducir el stock y limpiar el carrito
    this.carritoService.finalizePurchase(this.carrito).subscribe({
      next: () => {
        // Opcional: notificar al usuario y redirigir a una página de confirmación
        this.router.navigate(['/confirmation']);
      },
      error: (err) => {
        console.error(err);
        this.error = 'Error al finalizar la compra';
      }
    });
  }
}
