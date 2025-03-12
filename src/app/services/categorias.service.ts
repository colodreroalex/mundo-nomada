import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Categoria } from '../../models/Categoria';

@Injectable({
  providedIn: 'root'
})
export class CategoriasService {
  url = 'http://localhost/mundonomada/api_php/Categorias/';

  constructor(private http: HttpClient) {}

  getCategorias(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${this.url}getCategorias.php/list`);
  }

  addCategoria(categoria: Categoria): Observable<any> {
    return this.http.post(`${this.url}addCategoria.php`, categoria);
  }

  eliminarCategoria(categoriaID: number): Observable<any> {
    return this.http.post(
      `${this.url}deleteCategoria.php`, { CategoriaID: categoriaID }
    );
  }

  

}
