// filepath: /c:/Users/garci/Desktop/Angular/mundo-nomada/src/app/componentes/add-categorias/add-categorias.component.ts
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CategoriasService } from '../../services/categorias.service';
import { Categoria } from '../../../models/Categoria';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-add-categoria',
  templateUrl: './add-categorias.component.html',
  styleUrls: ['./add-categorias.component.css'], 
  imports: [FormsModule, CommonModule],
})
export class AddCategoriaComponent {
  categoria: Categoria = new Categoria(0, '', '');

  constructor(private categoriasService: CategoriasService) {}

  addCategoria() {
    // Verificamos que los campos no estén vacíos
    if (!this.categoria.Nombre || !this.categoria.Descripcion) {
      alert('Por favor, completa todos los campos.');
      return;
    }

    // Llamamos al servicio para agregar la categoría
    this.categoriasService.addCategoria(this.categoria).subscribe({
      next: (res) => {
        // Si la respuesta es correcta, mostramos un mensaje
        if (res.resultado === 'OK') {
          alert(res.mensaje);
          // Limpiamos el formulario después de agregar la categoría
          this.categoria = new Categoria(0, '', '');
        } else {
          alert(res.mensaje); // En caso de error
        }
      },
      error: (error) => {
        alert('Error al agregar la categoría. Intenta nuevamente.');
        console.error(error);
      }
    });
  }
}