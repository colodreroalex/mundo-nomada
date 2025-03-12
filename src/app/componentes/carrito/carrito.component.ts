import { Component, OnInit } from '@angular/core';
import { CarritoService } from '../../services/carrito.service';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { Carrito } from '../../../models/Carrito';
import { User } from '../../../models/Users';
import { RouterLink } from '@angular/router';

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

  // Propiedad para notificaciones: type puede ser 'success', 'warning', 'danger', etc.
  notification: { message: string; type: string } | null = null;

  constructor(private carritoService: CarritoService, private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.getCurrentUserObservable().subscribe((user) => {
      if (user) {
        this.currentUser = user;
        this.loadCarrito(user.id);
        this.loadTotal(user.id);
      }
    });
  }
  
  loadCarrito(userId: number): void {
    this.loading = true;
    this.carritoService.getCart(userId).subscribe({
      next: (data) => {
        this.carrito = data;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.notification = { message: 'Ocurrió un error al cargar el carrito.', type: 'danger' };
        this.loading = false;
        // Se oculta la notificación después de 2 segundos
        setTimeout(() => this.notification = null, 2000);
      }
    });
  }

  loadTotal(userId: number): void {
    this.carritoService.getTotal(userId).subscribe({
      next: (data) => {
        this.total = data;
      },
      error: (err) => {
        console.error(err);
        this.notification = { message: 'Ocurrió un error al cargar el total.', type: 'danger' };
        setTimeout(() => this.notification = null, 2000);
      },
    });
  }

  // Incrementa la cantidad y actualiza el carrito
  increment(item: Carrito): void {
    // Verifica que se pueda aumentar sin exceder el stock
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
  

  // Decrementa la cantidad (sin bajar de 1) y actualiza el carrito
  decrement(item: Carrito): void {
    if (item.cantidad > 1) {
      item.cantidad--;
      this.updateItem(item);
    }
  }

  // Actualiza la cantidad en la base de datos
  updateItem(item: Carrito): void {
    this.carritoService.updateCart(item).subscribe({
      next: () => {
        // Se actualiza el total tras la actualización
        if (this.currentUser) {
          this.loadTotal(this.currentUser.id);
        }
        // Notificación de actualización exitosa (opcional)
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
    this.carritoService.removeItem(item.id).subscribe({
      next: () => {
        this.carrito = this.carrito.filter((c) => c.id !== item.id);
        if (this.currentUser) {
          this.loadTotal(this.currentUser.id);
        }
        // Notificación de eliminación exitosa
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
