import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ProductosService } from '../../services/productos.service';
import { CategoriasService } from '../../services/categorias.service';
import { Producto } from '../../../models/Producto';
import { Categoria } from '../../../models/Categoria';

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

  constructor(
    private productosService: ProductosService,
    private categoriasService: CategoriasService
  ) {}

  ngOnInit() {
    this.cargarCategorias();
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        // reader.result convierte la imagen a base64 , pero se debe hacer un cast a string para que no de error
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

  addProduct() {
    console.log(this.prod);
    this.productosService.addProduct(this.prod).subscribe((datos: any) => {
      if (datos['resultado'] == 'OK') {
        alert(datos['mensaje']);
        window.location.href = '/agregarProducto';
      }
    });
  }
}