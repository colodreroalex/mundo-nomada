import { Component } from '@angular/core';
import { Producto } from '../../../models/Producto';
import { ProductosService } from '../../services/productos.service';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';

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
  // Propiedad para notificaciones: type puede ser 'success', 'warning', 'danger', etc.
  notification: { message: string; type: string } | null = null;

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
        this.notification = { message: 'Producto no encontrado', type: 'warning' };
        setTimeout(() => this.notification = null, 2000);
      }
    });
  }

  // Envía los cambios al backend para modificar el producto. Solo se procesa si el formulario es válido.
  modificarProducto(form: NgForm) {
    // Si el formulario es inválido, se notifica al usuario y no se envían los cambios.
    if (form.invalid) {
      this.notification = { message: 'Todos los campos son obligatorios y no pueden quedar vacíos.', type: 'warning' };
      setTimeout(() => this.notification = null, 2000);
      return;
    }

    if (this.productoSeleccionado) {
      this.productosService.modificarProducto(this.productoSeleccionado).subscribe((response: any) => {
        if (response && response.resultado === 'OK') {
          this.notification = { message: response.mensaje, type: 'success' };
          setTimeout(() => this.notification = null, 2000);
          this.recuperarTodos();
          // Opcional: limpiar el formulario, manteniendo la selección o restaurando valores originales.
          this.productoSeleccionado = null;
        } else {
          this.notification = { message: 'Error al modificar el producto', type: 'danger' };
          setTimeout(() => this.notification = null, 2000);
        }
      });
    }
  }
}
