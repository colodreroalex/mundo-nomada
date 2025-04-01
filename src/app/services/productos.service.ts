import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Producto } from '../../models/Producto';
import { Observable, throwError, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class ProductosService {
  url = 'http://localhost/mundonomada/api_php/Productos/'; // Cambia esto por la URL de tu backend

  constructor(private http: HttpClient) {}

  // Obtener todos los productos
  recuperarTodos(): Observable<Producto[]> {
    return this.http.get<any>(`${this.url}get-all-products.php`, { withCredentials: true })
      .pipe(
        map(response => {
          if (response && response.resultado === 'OK') {
            return response.productos;
          } else {
            throw new Error(response?.mensaje || 'Error al recuperar productos');
          }
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Error en recuperarTodos:', error);
          return throwError(() => error);
        })
      );
  }

  // Agregar un producto
  addProduct(producto: Producto): Observable<any> {
    return this.http.post<any>(
      `${this.url}addProduct.php`,
      JSON.stringify(producto),
      { withCredentials: true }
    ).pipe(
      map(response => {
        if (response && response.resultado === 'OK') {
          return response;
        } else {
          throw new Error(response?.mensaje || 'Error al agregar producto');
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error en addProduct:', error);
        return throwError(() => error);
      })
    );
  }

  // productos.service.ts
  getProductsByCategory(categoryId: number): Observable<Producto[]> {
    return this.http.get<any>(
      `${this.url}getProductosByCategoria.php?categoriaID=${categoryId}`,
      { withCredentials: true }
    ).pipe(
      map(response => {
        if (response && response.resultado === 'OK') {
          return response.productos;
        } else {
          throw new Error(response?.mensaje || 'Error al obtener productos por categoría');
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error en getProductsByCategory:', error);
        return throwError(() => error);
      })
    );
  }

  // Modificar un producto
  modificarProducto(producto: Producto): Observable<any> {
    // Configuramos los headers correctos
    const headers = new HttpHeaders()
      .set('Content-Type', 'application/json');
    
    // Creamos un objeto con la transformación necesaria para el backend
    // El backend espera 'id' pero nuestro modelo usa 'ProductoID'
    const productoData = {
      id: producto.ProductoID,
      nombre: producto.nombre,
      precio: producto.precio,
      descripcion: producto.descripcion,
      stock: producto.stock,
      categoriaID: producto.categoriaID,
      imagen: producto.imagen,
      color: producto.color,
      talla: producto.talla
    };
    
    return this.http.post<any>(
      `${this.url}modificar-productos.php`,
      JSON.stringify(productoData),
      { 
        withCredentials: true,
        headers: headers,
        responseType: 'json'
      }
    ).pipe(
      map(response => {
        if (response && response.resultado === 'OK') {
          return response;
        } else {
          throw new Error(response?.mensaje || 'Error al modificar producto');
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error en modificarProducto:', error);
        return throwError(() => error);
      })
    );
  }

  // Seleccionar un producto por ID
  seleccionar(producto: Producto): Observable<any> {
    return this.http.get<any>(
      `${this.url}seleccionar.php?ProductoID=${producto.ProductoID}`,
      { withCredentials: true }
    ).pipe(
      map(response => {
        if (response && response.resultado === 'OK') {
          return response.producto;
        } else {
          throw new Error(response?.mensaje || 'Error al seleccionar producto');
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error en seleccionar:', error);
        return throwError(() => error);
      })
    );
  }

  // Para el componente DetalleProductoComponent (de momento solo se usa ahi)
  seleccionarPorID(productoID: number): Observable<Producto> {
    return this.http.get<any>(
      `${this.url}seleccionar.php?ProductoID=${productoID}`,
      { withCredentials: true }
    ).pipe(
      map(response => {
        if (response && response.resultado === 'OK') {
          // La respuesta ahora contiene el array de productos en la propiedad 'producto'
          return response.producto[0];
        } else {
          throw new Error(response?.mensaje || 'Error al seleccionar producto');
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error en seleccionarPorID:', error);
        return throwError(() => error);
      })
    );
  }

  // Eliminar un producto por ID
  eliminarProducto(id: number): Observable<any> {
    console.log('Intentando eliminar el producto con ID:', id);
    
    // Crear un objeto con el ID para enviarlo como body
    const body = { id: id };
    
    // Configuramos los headers correctos
    const headers = new HttpHeaders()
      .set('Content-Type', 'application/json');
    
    // Usamos POST con un body JSON como parecen esperar otros endpoints
    return this.http.post<any>(
      `${this.url}deleteProduct.php`,
      body,
      { 
        withCredentials: true,
        headers: headers,
        responseType: 'json'
      }
    ).pipe(
      map(response => {
        console.log('Respuesta completa del servidor:', response);
        if (response && (response.resultado === 'OK' || response.success === true)) {
          return response;
        }
        throw new Error(response?.mensaje || 'Error desconocido al eliminar producto');
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error en eliminarProducto:', error);
        console.log('Estado HTTP:', error.status);
        console.log('Mensaje del error:', error.message);
        
        // Verificamos si hay algún error específico del backend
        if (error.error && typeof error.error === 'object') {
          console.log('Error del backend:', error.error);
          if (error.error.mensaje) {
            return throwError(() => new Error(error.error.mensaje));
          }
        }
        
        return throwError(() => new Error('Error al eliminar producto. Verifica que estés autenticado como administrador.'));
      })
    );
  }

  // Verificar si existe un producto con el mismo nombre, color y talla
  verificarProductoDuplicado(producto: Producto): Observable<boolean> {
    // Si estamos modificando un producto existente, no deberíamos validar
    // contra el mismo producto. Por eso verificamos si tiene ProductoID.
    // En caso de ser un producto nuevo, no tendría ProductoID.
    const esProductoExistente = !!producto.ProductoID;
    
    return this.recuperarTodos().pipe(
      map(productos => {
        // Filtramos por productos con el mismo nombre, color y talla
        const duplicados = productos.filter(p => 
          p.nombre.toLowerCase() === producto.nombre.toLowerCase() &&
          p.color?.toLowerCase() === producto.color?.toLowerCase() &&
          p.talla?.toLowerCase() === producto.talla?.toLowerCase() &&
          // Si es un producto existente, excluimos el mismo producto de la validación
          // Si es un producto nuevo, cualquier coincidencia es un duplicado
          (esProductoExistente ? p.ProductoID !== producto.ProductoID : true)
        );
        
        return duplicados.length > 0;
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error en verificarProductoDuplicado:', error);
        return throwError(() => error);
      })
    );
  }
}
