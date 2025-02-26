import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Producto } from '../../models/Producto';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ProductosService {
  url = 'http://localhost/mundonomada/api_php/Productos/'; // Cambia esto por la URL de tu backend

  constructor(private http: HttpClient) {}

  // Obtener todos los productos
  recuperarTodos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.url}get-all-products.php`);
  }

  // Agregar un producto
  addProduct(producto: Producto) {
    return this.http.post(
      `${this.url}addProduct.php`,
      JSON.stringify(producto)
    );
  }

  // productos.service.ts
  getProductsByCategory(categoryId: number): Observable<Producto[]> {
    return this.http.get<Producto[]>(
      `${this.url}/getProductosByCategoria.php?categoriaId=${categoryId}`
    );
  }

  // Modificar un producto
  modificarProducto(producto: Producto): Observable<any> {
    return this.http.post(
      `${this.url}modificar-productos.php`,
      JSON.stringify(producto)
    );
  }

  // Seleccionar un producto por ID
  // seleccionar(producto: Producto) {
  //   return this.http.get(`${this.url}seleccionar.php?codigo=${producto.ProductoID}`);
  // }

  seleccionar(producto: Producto) {
    return this.http.get(
      `${this.url}seleccionar.php?ProductoID=${producto.ProductoID}`
    );
  }

  // Eliminar un producto por ID
  eliminarProducto(productoID: number): Observable<any> {
    return this.http.post(
      `${this.url}deleteProduct.php`,
      { ProductoID: productoID },
      { headers: { 'Content-Type': 'application/json' } }
    );
  }
}
