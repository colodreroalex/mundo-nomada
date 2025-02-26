import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Carrito } from '../../models/Carrito';
import { map, Observable } from 'rxjs';
import { Producto } from '../../models/Producto';

@Injectable({
  providedIn: 'root'
})
export class CarritoService {

  url = 'http://localhost/mundonomada/api_php/Carrito/';

  constructor(private http: HttpClient) {}

  /**
   * Añade un producto al carrito.
   * @param carrito Objeto de tipo Carrito con la info del producto a añadir
   */
  addToCart(carrito: Carrito): Observable<any> {
    return this.http.post<any>(`${this.url}addToCart.php`, carrito);
  }

  getCart(userId: number): Observable<Carrito[]> {
    return this.http.get<any>(`${this.url}getCarrito.php?user_id=${userId}`).pipe(
      map(response => response.datos),
      map((items: any[]) => {
        return items.map(item => {
          // Crear una instancia de Producto con los datos recibidos
          const producto: Producto = new Producto(
            item.ProductoID,
            item.nombre,
            item.precio,
            item.descripcion,
            item.stock,
            item.categoriaID,
            item.imagen
          );
          // Retornar una nueva instancia de Carrito, usando el userId pasado por parámetro
          return new Carrito(
            item.cart_id,     // ID del carrito obtenido desde la base de datos
            userId,           // user_id (puedes usar el parámetro, ya que la respuesta podría no incluirlo)
            item.ProductoID,  // producto_id
            item.cantidad,
            producto          // Objeto Producto completo
          );
        });
      })
    );
  }

  // Actualiza la cantidad de un producto existente en el carrito (updateCart.php)
  updateCart(item: Carrito): Observable<any> {
    // Se envía un objeto con "id" y "cantidad" para que coincida con el endpoint
    return this.http.post<any>(`${this.url}updateCartItem.php`, {
      id: item.id,
      cantidad: item.cantidad
    });
  }

  // Elimina un producto del carrito (removeItem.php)
  removeItem(cartId: number): Observable<any> {
    return this.http.post<any>(`${this.url}removeItemFromCart.php`, { id: cartId });
  }

  // (Opcional) Método para obtener el total del carrito
  getTotal(userId: number): Observable<number> {
    return this.http.get<any>(`${this.url}getTotalPrecioCarrito.php?user_id=${userId}`).pipe(
      map(response => response.total)
    );
  }

}