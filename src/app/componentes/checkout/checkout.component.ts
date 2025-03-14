import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CarritoService } from '../../services/carrito.service';
import { AuthService } from '../../services/auth.service';
import { Carrito } from '../../../models/Carrito';
import { User } from '../../../models/Users';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { combineLatest } from 'rxjs';

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
  feedbackMessage: string = ''; // Mensaje de feedback para el usuario
  currentUser: User | null = null;

  constructor(
    private carritoService: CarritoService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    combineLatest([
      this.authService.getCurrentUserObservable(),
      this.authService.sessionLoadedSubject.asObservable()
    ]).subscribe(([user, sessionLoaded]) => {
      if (sessionLoaded) {
        this.currentUser = user;
        if (this.currentUser) {
          this.loadCarrito();
        } else {
          this.error = 'Debes iniciar sesión para proceder al checkout';
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 3000);
        }
      }
    });
  }

  loadCarrito(): void {
    if (this.currentUser) {
      this.carritoService.getCart(this.currentUser.id).subscribe({
        next: (data) => {
          this.carrito = data;
          this.total = this.carrito.reduce(
            (acc, item) => acc + (item.producto?.precio || 0) * item.cantidad,
            0
          );
          // Renderiza el botón de PayPal si hay elementos en el carrito
          if (this.carrito && this.carrito.length > 0) {
            setTimeout(() => {
              this.renderPayPalButton();
            }, 500);
          }
        },
        error: (err) => {
          console.error(err);
          this.error = 'Ocurrió un error al cargar el carrito';
        }
      });
    }
  }

  renderPayPalButton(): void {
    if ((window as any).paypal) {
      (window as any).paypal.Buttons({
        style: {
          layout: 'vertical', // Deja 'vertical' para no perder el botón de tarjeta
          color: 'gold',      // Puedes cambiarlo a 'blue', 'silver', etc.
          shape: 'pill',      // Bordes redondeados
          label: 'paypal'     // Otras opciones: 'checkout', 'buynow', etc.
        },
        createOrder: (data: any, actions: any): Promise<string> => {
          return actions.order.create({
            purchase_units: [{
              amount: {
                value: this.total.toFixed(2)
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
    this.carritoService.finalizePurchase(this.carrito).subscribe({
      next: () => {
        this.feedbackMessage = 'Compra realizada con éxito. Redirigiendo al inicio...';
        setTimeout(() => {
          this.router.navigate(['/']);
        }, 3000);
      },
      error: (err) => {
        console.error(err);
        this.error = 'Error al finalizar la compra. Redirigiendo al inicio...';
        setTimeout(() => {
          this.router.navigate(['/']);
        }, 3000);
      }
    });
  }
}
