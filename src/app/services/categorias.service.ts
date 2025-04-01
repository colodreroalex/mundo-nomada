import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Categoria } from '../../models/Categoria';

@Injectable({
  providedIn: 'root'
})
export class CategoriasService {
  url = 'http://localhost/mundonomada/api_php/Categorias/';

  constructor(private http: HttpClient) {}

  getCategorias(): Observable<Categoria[]> {
    return this.http.get<any>(`${this.url}getCategorias.php`, { withCredentials: true })
      .pipe(
        map(response => {
          if (response && response.result === 'OK') {
            return response.categorias;
          } else {
            throw new Error(response?.mensaje || 'Error al obtener categorías');
          }
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Error en getCategorias:', error);
          return throwError(() => error);
        })
      );
  }

  addCategoria(categoria: Categoria): Observable<any> {
    return this.http.post<any>(
      `${this.url}addCategoria.php`, 
      categoria, 
      { withCredentials: true }
    ).pipe(
      map(response => {
        if (response && response.resultado === 'OK') {
          return response;
        } else {
          throw new Error(response?.mensaje || 'Error al agregar categoría');
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error en addCategoria:', error);
        return throwError(() => error);
      })
    );
  }

  eliminarCategoria(categoriaID: number): Observable<any> {
    return this.http.post<any>(
      `${this.url}deleteCategoria.php`, 
      { CategoriaID: categoriaID },
      { withCredentials: true }
    ).pipe(
      map(response => {
        if (response && response.resultado === 'OK') {
          return response;
        } else {
          throw new Error(response?.mensaje || 'Error al eliminar categoría');
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error en eliminarCategoria:', error);
        return throwError(() => error);
      })
    );
  }
}
