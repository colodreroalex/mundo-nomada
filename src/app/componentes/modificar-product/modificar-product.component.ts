import { Component } from '@angular/core';
import { Producto } from '../../../models/Producto';
import { ProductosService } from '../../services/productos.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-modificar-product',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modificar-product.component.html',
  styleUrls: ['./modificar-product.component.css']
})
export class ModificarProductComponent {
  productos: Producto[] = [];
  productoSeleccionado: Producto | null = null;

  constructor(private productosService: ProductosService) {
    this.recuperarTodos();
  }

  // Recupera todos los productos desde la BBDD
  recuperarTodos() {
    this.productosService.recuperarTodos().subscribe((productos: Producto[]) => {
      this.productos = productos;
    });
  }

  // Selecciona un producto y lo carga en el formulario
  seleccionarProducto(producto: Producto) {
    // El backend espera el parámetro "ProductoID"
    this.productosService.seleccionar(producto).subscribe((result: any) => {
      if (result && result.length > 0) {
        this.productoSeleccionado = result[0];
      } else {
        alert("Producto no encontrado");
      }
    });
  }

  // Envía los cambios al backend para modificar el producto
  modificarProducto() {
    if (this.productoSeleccionado) {
      this.productosService.modificarProducto(this.productoSeleccionado).subscribe((response: any) => {
        if (response && response.resultado === 'OK') {
          alert(response.mensaje);
          this.recuperarTodos();
          // Limpiamos el formulario (opcional)
          this.productoSeleccionado = null;
        } else {
          alert('Error al modificar el producto');
        }
      });
    }
  }
}
