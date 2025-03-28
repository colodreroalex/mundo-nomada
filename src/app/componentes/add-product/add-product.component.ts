import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { Producto } from '../../../models/Producto';
import { ProductosService } from '../../services/productos.service';
import { Categoria } from '../../../models/Categoria';
import { CategoriasService } from '../../services/categorias.service';

@Component({
  selector: 'app-add-product',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-product.component.html',
  styleUrls: ['./add-product.component.css'],
})
export class AddProductComponent implements OnInit {
  prod: Producto = new Producto(0, '', 0, '', 0, 0, '', '', null);
  categorias: Categoria[] = [];
  notification: { message: string; type: string } | null = null;
  imagenBase64: string = '';

  // Opciones disponibles para tallas
  tallasDisponibles: string[] = ['Unica', 'S', 'M', 'L', 'XL'];

  constructor(
    private productosService: ProductosService,
    private categoriasService: CategoriasService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarCategorias();
  }

  onFileChange(event: any) {
    const reader = new FileReader();

    if (event.target.files && event.target.files.length) {
      const [file] = event.target.files;
      reader.readAsDataURL(file);

      reader.onload = () => {
        this.imagenBase64 = reader.result as string;
      };
    }
  }

  cargarCategorias() {
    this.categoriasService.getCategorias().subscribe(
      (res: Categoria[]) => {
        this.categorias = res;
      },
      (error) => {
        console.error('Error al cargar categorías:', error);
        this.notification = {
          message: 'Error al cargar las categorías',
          type: 'danger',
        };
      }
    );
  }

  addProduct(form: NgForm) {
    if (form.invalid) {
      this.notification = { message: 'Por favor, corrige los errores en el formulario.', type: 'warning' };
      return;
    }
    
    const producto: Producto = {
      ProductoID: 0, 
      nombre: form.value.nombre,
      precio: form.value.precio,
      descripcion: form.value.descripcion,
      stock: form.value.stock,
      categoriaID: form.value.categoriaID,
      imagen: this.imagenBase64,
      color: form.value.color || null,  
      talla: form.value.talla || null   
    };
    
    // Verificar si ya existe un producto con la misma combinación de nombre, color y talla
    this.productosService.verificarProductoDuplicado(producto).subscribe(existeDuplicado => {
      if (existeDuplicado) {
        this.notification = { 
          message: 'Ya existe un producto con el mismo nombre, color y talla. Por favor, modifique alguno de estos valores para crear un producto distinto.', 
          type: 'danger' 
        };
        return;
      }
      
      // Si no hay duplicados, procedemos a guardar el producto
      this.productosService.addProduct(producto).subscribe({
        next: (response: any) => {
          if (response.resultado === 'OK') {
            this.notification = { message: 'Producto agregado con éxito', type: 'success' };
            // Redirigir a otra página después de un tiempo
            setTimeout(() => {
              this.router.navigate(['/dashboard']);
            }, 2000);
          } else {
            this.notification = { message: 'Error al agregar el producto', type: 'danger' };
          }
        },
        error: (error) => {
          console.error('Error al agregar producto:', error);
          this.notification = { message: 'Error al agregar el producto', type: 'danger' };
        }
      });
    });
  }
}
