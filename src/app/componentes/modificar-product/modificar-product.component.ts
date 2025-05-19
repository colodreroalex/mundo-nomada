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
  
  // Opciones disponibles para tallas
  tallasDisponibles: string[] = ['Unica', 'S', 'M', 'L', 'XL'];

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

  // Método para modificar el producto seleccionado
  modificarProducto(form: NgForm) {
    if (!this.productoSeleccionado) {
      this.notification = { message: 'No hay ningún producto seleccionado.', type: 'warning' };
      return;
    }

    if (form.invalid) {
      this.notification = { message: 'Todos los campos son obligatorios y no pueden quedar vacíos.', type: 'warning' };
      return;
    }

    // Validación adicional para el precio
    if (this.productoSeleccionado.precio <= 0) {
      this.notification = { message: 'El precio debe ser mayor que 0.', type: 'warning' };
      return;
    }

    // Validación adicional para el stock
    if (this.productoSeleccionado.stock < 0) {
      this.notification = { message: 'El stock no puede ser menor que 0.', type: 'warning' };
      return;
    }

    // Asegurar que los campos opcionales tengan un valor adecuado
    const productoModificado: Producto = {
      ...this.productoSeleccionado,
      color: this.productoSeleccionado.color || null,
      talla: this.productoSeleccionado.talla || null
    };

    // Procedemos directamente a modificar el producto sin verificar duplicados
    // ya que estamos editando un producto existente, no creando uno nuevo
    this.productosService.modificarProducto(productoModificado).subscribe({
      next: (response: any) => {
        if (response.resultado === 'OK') {
          this.notification = { message: 'Producto modificado correctamente', type: 'success' };
          this.recuperarTodos(); // Actualizamos la lista de productos
          this.productoSeleccionado = null; // Limpiar la selección después de modificar
        } else {
          console.error('Error al modificar:', response);
          this.notification = { message: 'Error al modificar el producto: ' + (response.mensaje || 'Error desconocido'), type: 'danger' };
        }
      },
      error: (error) => {
        console.error('Error en la comunicación:', error);
        // Intentar extraer el mensaje de error específico
        let errorMessage = 'Error en la comunicación con el servidor';
        
        if (error instanceof Error) {
          // Si es un error de JavaScript normal, usamos su mensaje
          errorMessage = error.message;
        } else if (error.error && error.error.mensaje) {
          // Si es un HttpErrorResponse con un mensaje específico
          errorMessage = error.error.mensaje;
        } else if (typeof error === 'string') {
          // Si el error es directamente un string
          errorMessage = error;
        }
        
        this.notification = { message: errorMessage, type: 'danger' };
      }
    });
  }
}

