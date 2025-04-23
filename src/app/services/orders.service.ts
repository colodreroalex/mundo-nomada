import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Pedido } from '../../models/Pedido';
import { OrderItem } from '../../models/OrderItem';

interface ApiResponse<T> {
  resultado: string;
  orders?: T[];
  items?: T[];
  error?: string;
  mensaje?: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrdersService {
  private apiUrl = 'http://localhost/mundonomada/api_php/'; // URL base de tu API PHP

  constructor(private http: HttpClient) { }

  /**
   * Este método no es necesario ya que los pedidos se crean automáticamente
   * al finalizar una compra en finalizePurchase.php, que guarda el registro
   * en las tablas orders y order_items.
   */

  // Obtener todos los pedidos del usuario autenticado
  getOrdersByUser(): Observable<Pedido[]> {
    return this.http.get<ApiResponse<Pedido>>(`${this.apiUrl}orders/getOrdersByUser.php`, { withCredentials: true })
      .pipe(
        map(response => {
          console.log('Respuesta de getOrdersByUser:', response);
          if (response.resultado === 'OK' && response.orders) {
            return response.orders;
          } else if (response.resultado === 'ERROR') {
            console.warn('Error en getOrdersByUser:', response.mensaje || 'Error desconocido');
            return [];
          } else {
            console.warn('Respuesta inesperada en getOrdersByUser:', response);
            return [];
          }
        }),
        catchError(error => {
          console.error('Error en getOrdersByUser:', error);
          return this.handleError(error);
        })
      );
  }

  // Obtener los ítems de un pedido específico
  getOrderItems(orderId: number): Observable<OrderItem[]> {
    return this.http.get<ApiResponse<OrderItem>>(`${this.apiUrl}order_items/getOrderItems.php?order_id=${orderId}`, { withCredentials: true })
      .pipe(
        map(response => {
          console.log('Respuesta de getOrderItems:', response);
          if (response.resultado === 'OK' && response.items) {
            return response.items;
          } else if (response.resultado === 'ERROR') {
            console.warn('Error en getOrderItems:', response.mensaje || 'Error desconocido');
            return [];
          } else {
            console.warn('Respuesta inesperada en getOrderItems:', response);
            return [];
          }
        }),
        catchError(error => {
          console.error('Error en getOrderItems:', error);
          return this.handleError(error);
        })
      );
  }

  // Manejador de errores
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ha ocurrido un error desconocido';
    
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      errorMessage = `Código de error: ${error.status}, Mensaje: ${error.message}`;
      
      // Si hay un mensaje de error específico en la respuesta
      if (error.error) {
        if (error.error.error) {
          errorMessage = error.error.error;
        } else if (error.error.mensaje) {
          errorMessage = error.error.mensaje;
        } else if (typeof error.error === 'string') {
          try {
            const parsed = JSON.parse(error.error);
            errorMessage = parsed.mensaje || parsed.error || errorMessage;
          } catch (e) {
            errorMessage = error.error;
          }
        }
      }
    }
    
    console.error('Error detallado:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}
