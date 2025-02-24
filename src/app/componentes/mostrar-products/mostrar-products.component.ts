import { Component } from '@angular/core';
import { Producto } from '../../../models/Producto';
import { ProductosService } from '../../services/productos.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-mostrar-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mostrar-products.component.html',
  styleUrls: ['./mostrar-products.component.css']
})
export class MostrarProductsComponent {
  products: Producto[] = [];
  filterName: string = '';
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

  // Getter para devolver los productos filtrados según el nombre
  get filteredProducts(): Producto[] {
    if (!this.filterName) {
      return this.products;
    }
    return this.products.filter(producto =>
      producto.nombre.toLowerCase().includes(this.filterName.toLowerCase())
    );
  }
}
