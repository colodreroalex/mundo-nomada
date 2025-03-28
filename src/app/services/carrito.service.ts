import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Carrito } from '../../models/Carrito';
import { map, Observable, switchMap, throwError, interval } from 'rxjs';
import { Producto } from '../../models/Producto';
import { tap } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CarritoService {
  url = 'http://localhost/mundonomada/api_php/Carrito/';
  private LOCAL_CART_KEY = 'guestCart';

  constructor(private http: HttpClient) {}

  /* Métodos para gestionar el carrito en localStorage (para usuarios invitados) */
  private getLocalCart(): Carrito[] {
    const cartStr = localStorage.getItem(this.LOCAL_CART_KEY);
    return cartStr ? JSON.parse(cartStr) : [];
  }

  public saveLocalCart(cart: Carrito[]): void {
    localStorage.setItem(this.LOCAL_CART_KEY, JSON.stringify(cart));
  }

  /**
   * Verifica el stock actualizado para un producto específico.
   * Esta función obtiene la información más reciente del servidor.
   */
  verificarStockActualizado(productoID: number): Observable<Producto> {
    return this.http.post<any>(`${this.url}getUpdatedProducts.php`, { ids: [productoID] })
      .pipe(
        map(response => {
          if (response && response.products && response.products.length > 0) {
            const p = response.products[0];
            return new Producto(
              p.ProductoID,
              p.nombre,
              p.precio,
              p.descripcion,
              p.stock,
              p.categoriaID,
              p.imagen
            );
          } else {
            // Si el producto ya no existe o no está disponible, lanzamos un error
            console.error('Producto no disponible en servidor:', productoID);
            throw new Error('Producto no disponible. Puede haber sido eliminado.');
          }
        })
      );
  }

  /**
   * Añade un producto al carrito.
   * Si el user_id es 0 o nulo, se guarda en localStorage.
   */
  addToCart(carrito: Carrito): Observable<any> {
    // Para usuarios invitados, primero verificar stock actualizado
    if (!carrito.user_id || carrito.user_id === 0) {
      return this.verificarStockActualizado(carrito.producto_id).pipe(
        switchMap(productoActualizado => {
          // Actualizar el objeto producto con información reciente
          carrito.producto = productoActualizado;
          
          // Verificar si hay stock suficiente
          if (productoActualizado.stock < carrito.cantidad) {
            return throwError(() => ({
              mensaje: 'No quedan suficientes unidades disponibles para este producto.',
              stock: productoActualizado.stock
            }));
          }
          
          // Continuar con el proceso normal para invitados
          const guestCart = this.getLocalCart();
          const index = guestCart.findIndex(
            (item) => item.producto_id === carrito.producto_id
          );
          
          if (index >= 0) {
            // Verificar que la suma no exceda el stock actualizado
            if (guestCart[index].cantidad + carrito.cantidad > productoActualizado.stock) {
              return throwError(() => ({
                mensaje: 'No quedan suficientes unidades disponibles para este producto.',
                stock: productoActualizado.stock
              }));
            } else {
              guestCart[index].cantidad += carrito.cantidad;
              // Actualizar el producto con la información de stock más reciente
              guestCart[index].producto = productoActualizado;
            }
          } else {
            // Generamos un ID ficticio
            carrito.id = new Date().getTime();
            guestCart.push(carrito);
          }
          
          this.saveLocalCart(guestCart);
          return of({ resultado: 'OK', mensaje: 'Añadido al carrito local' });
        })
      );
    } else {
      // Usuario autenticado: usar backend
      return this.http.post<any>(`${this.url}addToCart.php`, carrito);
    }
  }

  /**
   * Obtiene el carrito.
   * Si userId es 0, lo obtiene de localStorage.
   */
  getCart(userId: number): Observable<Carrito[]> {
    if (!userId || userId === 0) {
      let guestCart = this.getLocalCart();
      // Extraer los IDs de los productos en el carrito
      const ids = guestCart.map((item) => item.producto_id);

      if (ids.length === 0) {
        return new Observable((observer) => {
          observer.next([]);
          observer.complete();
        });
      }

      // Llamar al endpoint para obtener datos actualizados de los productos
      return this.http
        .post<any>(`${this.url}getUpdatedProducts.php`, { ids })
        .pipe(
          map((response) => {
            console.log('Respuesta de getUpdatedProducts:', response);
            
            // Si no hay productos o el array está vacío, limpiar el carrito del invitado
            if (!response || !response.products || response.products.length === 0) {
              console.warn('No se encontraron productos en el servidor. Limpiando carrito local.');
              this.saveLocalCart([]);
              return [];
            }
            
            const productsMap = new Map<number, Producto>();
            response.products.forEach((p: any) => {
              const prod = new Producto(
                p.ProductoID,
                p.nombre,
                p.precio,
                p.descripcion,
                p.stock,
                p.categoriaID,
                p.imagen
              );
              productsMap.set(p.ProductoID, prod);
            });

            // Actualizar cada item del carrito con la información actualizada
            // Y filtrar los que ya no existen en el servidor
            const updatedCart = guestCart.filter(item => {
              // Si el producto existe en la respuesta del servidor
              if (productsMap.has(item.producto_id)) {
                // Actualizar el producto con la información más reciente
                item.producto = productsMap.get(item.producto_id);
                // Mantener solo productos con stock
                return item.producto && item.producto.stock > 0;
              } 
              // Si el producto no existe en el servidor, eliminarlo del carrito
              return false;
            });

            // Actualizar el carrito en localStorage
            if (JSON.stringify(updatedCart) !== JSON.stringify(guestCart)) {
              console.log('Carrito de invitado actualizado por cambios en stock:', updatedCart);
              this.saveLocalCart(updatedCart);
            }

            return updatedCart;
          })
        );
    } else {
      // Usuario autenticado: obtener carrito del backend
      return this.http
        .get<any>(`${this.url}getCarrito.php?user_id=${userId}`)
        .pipe(
          map((response) => response.datos),
          map((items: any[]) => {
            return items
              .map((item) => {
                const producto: Producto = new Producto(
                  item.ProductoID,
                  item.nombre,
                  item.precio,
                  item.descripcion,
                  item.stock,
                  item.categoriaID,
                  item.imagen
                );
                return new Carrito(
                  item.cart_id,
                  userId,
                  item.ProductoID,
                  item.cantidad,
                  producto
                );
              })
              .filter((item) => item.producto && item.producto.stock > 0);
          })
        );
    }
  }

  /**
   * Actualiza la cantidad de un producto en el carrito.
   * Si user_id es 0, se actualiza en localStorage.
   */
  updateCart(item: Carrito): Observable<any> {
    if (!item.user_id || item.user_id === 0) {
      let guestCart = this.getLocalCart();
      const index = guestCart.findIndex((cartItem) => cartItem.id === item.id);
      if (index >= 0) {
        // Verificar que la cantidad solicitada no supere el stock
        if (
          guestCart[index].producto &&
          item.cantidad > guestCart[index].producto.stock
        ) {
          return new Observable((observer) => {
            observer.error({
              mensaje: 'La cantidad solicitada supera el stock disponible.',
            });
            observer.complete();
          });
        }
        guestCart[index].cantidad = item.cantidad;
        this.saveLocalCart(guestCart);
        return new Observable((observer) => {
          observer.next({
            resultado: 'OK',
            mensaje: 'Actualizado en carrito local',
          });
          observer.complete();
        });
      } else {
        return new Observable((observer) => {
          observer.error({ mensaje: 'Item no encontrado en carrito local' });
        });
      }
    } else {
      return this.http.post<any>(`${this.url}updateCartItem.php`, {
        id: item.id,
        cantidad: item.cantidad,
      });
    }
  }

  /**
   * Elimina un producto del carrito.
   * Para usuarios invitados se usa localStorage.
   * @param cartId ID del carrito o identificador del item.
   * @param userId (opcional) ID del usuario.
   */
  removeItem(cartId: number, userId?: number): Observable<any> {
    if (!userId || userId === 0) {
      let guestCart = this.getLocalCart();
      guestCart = guestCart.filter((item) => item.id !== cartId);
      this.saveLocalCart(guestCart);
      return new Observable((observer) => {
        observer.next({
          resultado: 'OK',
          mensaje: 'Eliminado del carrito local',
        });
        observer.complete();
      });
    } else {
      return this.http.post<any>(`${this.url}removeItemFromCart.php`, {
        id: cartId,
      });
    }
  }

  /**
   * Obtiene el total del carrito.
   * Para invitados se calcula a partir del carrito almacenado localmente.
   */
  getTotal(userId: number): Observable<number> {
    if (!userId || userId === 0) {
      const guestCart = this.getLocalCart();
      const total = guestCart.reduce((acc, item) => {
        const price = item.producto?.precio || 0;
        return acc + price * item.cantidad;
      }, 0);
      return new Observable((observer) => {
        observer.next(total);
        observer.complete();
      });
    } else {
      return this.http
        .get<any>(`${this.url}getTotalPrecioCarrito.php?user_id=${userId}`)
        .pipe(map((response) => response.total));
    }
  }

  /**
   * Finaliza la compra.
   * Se envía el carrito completo para procesar la compra.
   * Nota: Puedes ajustar el endpoint según si es invitado o usuario.
   */
  finalizePurchase(cart: Carrito[]): Observable<any> {
    // Obtener los IDs de los productos en el carrito
    const productIds = cart.map((item) => item.producto_id);

    // Primero verificar el stock actualizado directamente desde el servidor para todos los productos
    return this.http
      .post<any>(`${this.url}getUpdatedProducts.php`, { ids: productIds })
      .pipe(
        switchMap((response) => {
          const updatedProducts = new Map<number, Producto>();
          response.products.forEach((p: any) => {
            const prod = new Producto(
              p.ProductoID,
              p.nombre,
              p.precio,
              p.descripcion,
              p.stock,
              p.categoriaID,
              p.imagen
            );
            updatedProducts.set(p.ProductoID, prod);
          });

          // Actualizar los productos en el carrito con la información actualizada
          const updatedCart = cart.map((item) => {
            const updatedProduct = updatedProducts.get(item.producto_id);
            if (updatedProduct) {
              item.producto = updatedProduct;
            }
            return item;
          });

          // Separamos los productos con stock suficiente y los que no lo tienen
          const availableItems = updatedCart.filter(
            (item) => item.producto && item.producto.stock >= item.cantidad
          );
          const removedItems = updatedCart.filter(
            (item) => !item.producto || item.producto.stock < item.cantidad
          );

          if (removedItems.length > 0) {
            const removedProductNames = removedItems
              .map((item) => item.producto?.nombre)
              .join(', ');
            return throwError(() => ({
              mensaje: `Algunos productos en su carrito ya no están disponibles o han sido adquiridos por otro usuario. Por favor, elimine los siguientes productos: ${removedProductNames}`,
              removedItems: removedItems,
            }));
          }

          // Si todos los productos están disponibles, continuar con la compra
          return this.http
            .post<any>(`${this.url}finalizePurchase.php`, {
              cart: availableItems,
            })
            .pipe(
              tap((response: any) => {
                // Si se trata de un usuario invitado, limpiar el carrito en localStorage
                if (cart.length > 0 && (!cart[0].user_id || cart[0].user_id === 0)) {
                  this.saveLocalCart([]);
                }
              })
            );
        })
      );
  }

  migrateGuestCart(userId: number): Observable<any> {
    const guestCart = this.getLocalCart();
    if (guestCart.length === 0) {
      return of({ resultado: 'OK', mensaje: 'No hay items para migrar.' });
    }

    // Para cada ítem del carrito, actualizamos el user_id y lo agregamos al backend
    const migrationObservables = guestCart.map((item) => {
      item.user_id = userId;
      return this.http.post<any>(`${this.url}addToCart.php`, item);
    });

    return forkJoin(migrationObservables).pipe(
      tap(() => {
        // Una vez migrados, limpiamos el carrito local
        this.saveLocalCart([]);
      })
    );
  }
}
