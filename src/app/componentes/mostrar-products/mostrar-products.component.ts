import { Component } from '@angular/core';
import { Producto } from '../../../models/Producto';
import { ProductosService } from '../../services/productos.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-mostrar-products',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mostrar-products.component.html',
  styleUrl: './mostrar-products.component.css'
})
export class MostrarProductsComponent {
  products: Producto[] = [];
  loading: boolean = false;
  error: string = '';

  constructor(private productosService: ProductosService) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading = true;
    this.productosService.recuperarTodos().subscribe({
      next: (data) => {
        this.products = data;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'Ocurrió un error al cargar los productos';
        this.loading = false;
      }
    });
  }
}
