import { Component, OnInit } from '@angular/core';
import { CarritoService } from '../../services/carrito.service';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { Carrito } from '../../../models/Carrito';
import { User } from '../../../models/Users';

@Component({
  selector: 'app-carrito',
  imports:[CommonModule],
  templateUrl: './carrito.component.html',
  styleUrls: ['./carrito.component.css'], 
})
export class CarritoComponent implements OnInit {
  carrito: Carrito[] = [];
  currentUser: User | null = null;
  loading: boolean = false;
  error: string = '';
  total: number = 0;

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
        this.error = 'Ocurrió un error al cargar el carrito';
        this.loading = false;
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
        this.error = 'Ocurrió un error al cargar el total';
      },
    });
  }

  // Incrementa la cantidad y llama a updateCart.php
  increment(item: Carrito): void {
    item.cantidad++;
    this.updateItem(item);
  }

  // Decrementa la cantidad (sin bajar de 1) y llama a updateCart.php
  decrement(item: Carrito): void {
    if (item.cantidad > 1) {
      item.cantidad--;
      this.updateItem(item);
    }
  }

  // Actualiza la cantidad en la base de datos mediante updateCart.php
  updateItem(item: Carrito): void {
    this.carritoService.updateCart(item).subscribe({
      next: () => {
        // Una vez actualizado, se recarga el total o se actualiza la vista si es necesario
        if (this.currentUser) {
          this.loadTotal(this.currentUser.id);
        }
      },
      error: (err) => {
        console.error(err);
        alert('Ocurrió un error al actualizar la cantidad');
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
      },
      error: (err) => {
        console.error(err);
        alert('Ocurrió un error al eliminar el producto');
      },
    });
  }

}