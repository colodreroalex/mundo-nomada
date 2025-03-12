import { Component, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ProductosService } from '../../services/productos.service';
import { CategoriasService } from '../../services/categorias.service';
import { Producto } from '../../../models/Producto';
import { Categoria } from '../../../models/Categoria';
import { Router } from '@angular/router';

@Component({
  selector: 'app-add-product',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './add-product.component.html',
  styleUrls: ['./add-product.component.css'],
})
export class AddProductComponent implements OnInit {
  prod: Producto = new Producto(0, '', 0, '', 0, 0, '');
  categorias: Categoria[] = [];
  notification: { message: string; type: string } | null = null;

  constructor(
    private productosService: ProductosService,
    private categoriasService: CategoriasService,
    private router: Router
  ) {}

  ngOnInit() {
    this.cargarCategorias();
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.prod.imagen = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  cargarCategorias() {
    this.categoriasService.getCategorias().subscribe((data: Categoria[]) => {
      this.categorias = data;
    });
  }

  addProduct(form: NgForm) {
    // Verifica si el formulario es válido antes de enviar
    if (form.invalid) {
      this.notification = { message: 'Por favor, corrige los errores en el formulario.', type: 'warning' };
      setTimeout(() => this.notification = null, 2000);
      return;
    }
    
    console.log(this.prod);
    this.productosService.addProduct(this.prod).subscribe(
      (datos: any) => {
        if (datos['resultado'] === 'OK') {
          this.notification = { message: datos['mensaje'], type: 'success' };
          setTimeout(() => {
            this.notification = null;
            this.router.navigate(['/agregarProducto']);
          }, 1000);
        } else {
          this.notification = { message: datos['mensaje'], type: 'warning' };
          setTimeout(() => this.notification = null, 1000);
        }
      },
      (error: any) => {
        console.error(error);
        this.notification = { message: 'Error al agregar el producto. Intenta nuevamente.', type: 'danger' };
        setTimeout(() => this.notification = null, 1000);
      }
    );
  }
}
