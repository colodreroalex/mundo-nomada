import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Carrito } from '../../models/Carrito';
import { map, Observable, switchMap, throwError, of, forkJoin, Subject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Producto } from '../../models/Producto';

@Injectable({
  providedIn: 'root',
})
export class CarritoService {
  url = 'http://localhost/mundonomada/api_php/Carrito/';
  private LOCAL_CART_KEY = 'guestCart';
  
  // Constantes para cálculos
  public readonly IVA_PORCENTAJE: number = 21;
  public readonly ENVIO_GRATIS_MINIMO: number = 60;
  public readonly COSTO_ENVIO_NORMAL: number = 3.5;

  // Subject para notificar cuando se completa una compra para usuario invitado
  private guestPurchaseCompleted = new Subject<void>();
  
  // Observable para suscribirse a la finalización de compra de invitado
  public guestPurchaseCompleted$ = this.guestPurchaseCompleted.asObservable();

  // Registro de productos comprados por usuarios invitados para evitar que reaparezcan
  private readonly GUEST_PURCHASED_KEY = 'guestPurchasedProducts';

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
   * Elimina completamente el carrito de localStorage
   * Este método es más definitivo que saveLocalCart([])
   */
  public removeLocalCart(): void {
    localStorage.removeItem(this.LOCAL_CART_KEY);
  }

  /**
   * Verifica el stock actualizado para un producto específico.
   * Esta función obtiene la información más reciente del servidor.
   */
  verificarStockActualizado(productoID: number): Observable<Producto> {
    return this.http.post<any>(`${this.url}getUpdatedProducts.php`, { ids: [productoID] }, { withCredentials: true })
      .pipe(
        map(response => {
          if (response && response.resultado === 'OK' && response.products && response.products.length > 0) {
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
            throw new Error(response?.mensaje || 'Producto no disponible. Puede haber sido eliminado.');
          }
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Error en verificarStockActualizado:', error);
          return throwError(() => error);
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
      return this.http.post<any>(`${this.url}addToCart.php`, carrito, { withCredentials: true })
        .pipe(
          map(response => {
            if (response && response.resultado === 'OK') {
              return response;
            } else {
              throw new Error(response?.mensaje || 'Error al añadir al carrito');
            }
          }),
          catchError((error: HttpErrorResponse) => {
            console.error('Error en addToCart:', error);
            return throwError(() => error);
          })
        );
    }
  }

  /**
   * Obtiene el carrito.
   * Si userId es 0, lo obtiene de localStorage.
   */
  getCart(userId: number): Observable<Carrito[]> {
    if (!userId || userId === 0) {
      const guestCart = this.getLocalCart();
      // Ya no filtramos productos previamente comprados para permitir recompras
      
      return new Observable((observer) => {
        observer.next(guestCart);
        observer.complete();
      });
    } else {
      // Usuario autenticado: obtener carrito del backend
      return this.http
        .get<any>(`${this.url}getCarrito.php?user_id=${userId}`, { withCredentials: true })
        .pipe(
          map((response) => {
            if (response && response.resultado === 'OK') {
              return response.datos;
            } else {
              throw new Error(response?.mensaje || 'Error al obtener el carrito');
            }
          }),
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
          }),
          catchError((error: HttpErrorResponse) => {
            console.error('Error en getCart:', error);
            return throwError(() => error);
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
      }, { withCredentials: true })
        .pipe(
          map(response => {
            if (response && response.resultado === 'OK') {
              return response;
            } else {
              throw new Error(response?.mensaje || 'Error al actualizar el carrito');
            }
          }),
          catchError((error: HttpErrorResponse) => {
            console.error('Error en updateCart:', error);
            return throwError(() => error);
          })
        );
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
      }, { withCredentials: true })
        .pipe(
          map(response => {
            if (response && response.resultado === 'OK') {
              return response;
            } else {
              throw new Error(response?.mensaje || 'Error al eliminar item del carrito');
            }
          }),
          catchError((error: HttpErrorResponse) => {
            console.error('Error en removeItem:', error);
            return throwError(() => error);
          })
        );
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
        .get<any>(`${this.url}getTotalPrecioCarrito.php?user_id=${userId}`, { withCredentials: true })
        .pipe(
          map((response) => {
            if (response && response.resultado === 'OK') {
              return response.total;
            } else {
              throw new Error(response?.mensaje || 'Error al obtener el total del carrito');
            }
          }),
          catchError((error: HttpErrorResponse) => {
            console.error('Error en getTotal:', error);
            return throwError(() => error);
          })
        );
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
      .post<any>(`${this.url}getUpdatedProducts.php`, { ids: productIds }, { withCredentials: true })
      .pipe(
        switchMap((response) => {
          if (!response || response.resultado !== 'OK') {
            return throwError(() => new Error(response?.mensaje || 'Error al verificar stock'));
          }

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
            }, { withCredentials: true })
            .pipe(
              map(response => {
                if (response && response.resultado === 'OK') {
                  // Si se trata de un usuario invitado, limpiar el carrito en localStorage
                  if (cart.length > 0 && (!cart[0].user_id || cart[0].user_id === 0)) {
                    // Ya no guardamos los productos como comprados para permitir recompras
                    // Limpiar el carrito
                    this.saveLocalCart([]);
                    this.guestPurchaseCompleted.next();
                  }
                  return response;
                } else {
                  throw new Error(response?.mensaje || 'Error al finalizar la compra');
                }
              }),
              catchError((error: HttpErrorResponse) => {
                console.error('Error en finalizePurchase:', error);
                return throwError(() => error);
              })
            );
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Error en verificación de stock:', error);
          return throwError(() => error);
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
      return this.http.post<any>(`${this.url}addToCart.php`, item, { withCredentials: true });
    });

    return forkJoin(migrationObservables).pipe(
      tap(() => {
        // Limpieza completa de datos de invitado
        this.removeLocalCart(); // Usar removeLocalCart en lugar de saveLocalCart para eliminar completamente
        this.clearGuestPurchasedProducts(); // Limpiar registro de productos comprados
        localStorage.removeItem('lastCartSync'); // Eliminar cualquier timestamp de sincronización
        
        // Limpiar cualquier otro dato de localStorage relacionado con el carrito
        // que pueda estar causando problemas
        try {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.includes('cart') || key.includes('Cart') || key.includes('producto'))) {
              localStorage.removeItem(key);
            }
          }
        } catch (e) {
          console.error('Error al limpiar datos adicionales de localStorage:', e);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error en migrateGuestCart:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Limpia el carrito completamente (sin necesidad de un nuevo endpoint)
   * @param userId ID del usuario (si es 0, limpia el carrito local)
   * @returns Observable con el resultado de la operación
   */
  clearCart(userId: number = 0): Observable<any> {
    if (userId === 0) {
      // Para invitados, limpiar localStorage
      this.removeLocalCart();
      this.guestPurchaseCompleted.next(); // Notificar que se ha limpiado el carrito
      return of({ resultado: 'OK', mensaje: 'Carrito limpiado correctamente.' });
    } else {
      // Para usuarios registrados, usamos el API existente eliminando cada ítem
      return this.getCart(userId).pipe(
        switchMap(items => {
          if (items.length === 0) {
            return of({ resultado: 'OK', mensaje: 'Carrito ya está vacío.' });
          }
          
          // Crear observables para eliminar cada ítem del carrito
          const deleteObservables = items.map(item => 
            this.removeItem(item.id, userId)
          );
          
          // Ejecutar todas las eliminaciones en paralelo
          return forkJoin(deleteObservables).pipe(
            map(() => ({ resultado: 'OK', mensaje: 'Carrito limpiado correctamente.' })),
            catchError((error: HttpErrorResponse) => {
              console.error('Error al limpiar el carrito:', error);
              return throwError(() => error);
            })
          );
        })
      );
    }
  }

  /**
   * Calcula el IVA sobre un importe dado
   * @param importe Importe sobre el que calcular el IVA
   * @returns El importe del IVA calculado
   */
  calcularIVA(importe: number): number {
    return importe * (this.IVA_PORCENTAJE / 100);
  }

  /**
   * Calcula el coste de envío según el subtotal
   * @param subtotal Subtotal del pedido
   * @returns Coste de envío (0 si supera el mínimo para envío gratis)
   */
  calcularEnvio(subtotal: number): number {
    return subtotal >= this.ENVIO_GRATIS_MINIMO ? 0 : this.COSTO_ENVIO_NORMAL;
  }

  /**
   * Calcula todos los valores del pedido (subtotal, IVA, envío y total)
   * @param subtotal Subtotal del pedido (suma de productos sin IVA ni envío)
   * @returns Objeto con todos los importes calculados
   */
  calcularTotalesPedido(subtotal: number): { 
    subtotal: number; 
    iva: number; 
    envio: number; 
    totalConIvaYEnvio: number; 
  } {
    const iva = this.calcularIVA(subtotal);
    const envio = this.calcularEnvio(subtotal);
    const totalConIvaYEnvio = subtotal + iva + envio;
    
    return {
      subtotal,
      iva,
      envio,
      totalConIvaYEnvio
    };
  }

  /**
   * Obtiene el listado de productos que ya han sido comprados por el usuario invitado
   * @returns Array de IDs de productos comprados
   */
  getGuestPurchasedProducts(): number[] {
    const purchasedProductsStr = localStorage.getItem(this.GUEST_PURCHASED_KEY);
    return purchasedProductsStr ? JSON.parse(purchasedProductsStr) : [];
  }

  /**
   * Guarda productos en el registro de comprados para evitar que reaparezcan en el carrito
   * @param productIds Array de IDs de productos a marcar como comprados
   */
  saveGuestPurchasedProducts(productIds: number[]): void {
    if (!productIds || productIds.length === 0) return;
    
    // Obtener los productos ya registrados y añadir los nuevos
    const currentPurchased = this.getGuestPurchasedProducts();
    const updatedPurchased = [...new Set([...currentPurchased, ...productIds])];
    
    // Guardar el listado actualizado en localStorage
    localStorage.setItem(this.GUEST_PURCHASED_KEY, JSON.stringify(updatedPurchased));
    console.log('Productos marcados como comprados:', updatedPurchased);
  }

  /**
   * Limpia el registro de productos comprados
   * Útil cuando un usuario invitado se registra o inicia sesión
   */
  clearGuestPurchasedProducts(): void {
    localStorage.removeItem(this.GUEST_PURCHASED_KEY);
  }
}
