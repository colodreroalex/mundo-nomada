import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Producto } from '../../models/Producto';
import { map, Observable } from 'rxjs';

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
      `${this.url}getProductosByCategoria.php?categoriaID=${categoryId}`
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

  // Para el componente DetalleProductoComponent (de momento solo se usa ahi)
  seleccionarPorID(productoID: number): Observable<Producto> {
    return this.http
      .get<Producto[]>(`${this.url}seleccionar.php?ProductoID=${productoID}`)
      .pipe(
        // La respuesta es un array con un solo elemento, así que tomamos [0]
        map((productos: Producto[]) => productos[0])
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

  // Verificar si existe un producto con el mismo nombre, color y talla
  verificarProductoDuplicado(producto: Producto): Observable<boolean> {
    return this.recuperarTodos().pipe(
      map(productos => {
        // Filtramos por productos con el mismo nombre, color y talla
        // Pero ignoramos el producto actual en caso de modificación
        const duplicados = productos.filter(p => 
          p.nombre.toLowerCase() === producto.nombre.toLowerCase() &&
          p.color?.toLowerCase() === producto.color?.toLowerCase() &&
          p.talla?.toLowerCase() === producto.talla?.toLowerCase() &&
          p.ProductoID !== producto.ProductoID // Ignorar el mismo producto en caso de modificación
        );
        
        return duplicados.length > 0;
      })
    );
  }
}
