import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';
import { User } from '../../models/Users';

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {
  private apiUrl = 'http://localhost/mundonomada/api_php/usuarios/';

  constructor(private http: HttpClient) { }

  // Obtener todos los usuarios
  getAllUsers(): Observable<User[]> {
    return this.http.get<any>(`${this.apiUrl}get-all-users.php`, { 
      responseType: 'json',
      withCredentials: true // Añadir esta opción para enviar cookies con la petición
    })
      .pipe(
        map(response => {
          console.log('Respuesta del servidor:', response);
          if (response && response.success) {
            return response.usuarios;
          } else if (response && response.result === 'OK' && response.users) {
            return response.users; // Ajustando para la respuesta actual del servidor
          } else {
            throw new Error(response?.mensaje || 'Error al obtener usuarios');
          }
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Error en getAllUsers:', error);
          
          // Intentar parsear la respuesta si es un string JSON
          if (typeof error.error === 'string') {
            try {
              const parsedError = JSON.parse(error.error);
              return throwError(() => new Error(parsedError.mensaje || 'Error desconocido'));
            } catch (e) {
              // No es un JSON válido
            }
          }
          
          return throwError(() => error);
        })
      );
  }

  // Obtener un usuario por su ID
  getUserById(id: number): Observable<User> {
    return this.http.get<any>(`${this.apiUrl}get-user-by-id.php?id=${id}`, { 
      responseType: 'json',
      withCredentials: true
    })
      .pipe(
        map(response => {
          console.log('Respuesta del servidor (getUserById):', response);
          if (response && response.success) {
            return response.usuario;
          } else if (response && response.result === 'OK' && response.user) {
            return response.user;
          } else {
            throw new Error(response?.mensaje || 'Error al obtener el usuario');
          }
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Error en getUserById:', error);
          
          if (typeof error.error === 'string') {
            try {
              const parsedError = JSON.parse(error.error);
              return throwError(() => new Error(parsedError.mensaje || 'Error desconocido'));
            } catch (e) {
              // No es un JSON válido
            }
          }
          
          return throwError(() => error);
        })
      );
  }

  // Crear un nuevo usuario
  createUser(user: User): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}add-user.php`, user, { 
      responseType: 'json',
      withCredentials: true
    })
      .pipe(
        map(response => {
          console.log('Respuesta del servidor (createUser):', response);
          return response;
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Error en createUser:', error);
          
          if (typeof error.error === 'string') {
            try {
              const parsedError = JSON.parse(error.error);
              return throwError(() => new Error(parsedError.mensaje || 'Error desconocido'));
            } catch (e) {
              // No es un JSON válido
            }
          }
          
          return throwError(() => error);
        })
      );
  }

  // Actualizar un usuario existente
  updateUser(user: User): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}update-user.php`, user, { 
      responseType: 'json',
      withCredentials: true
    })
      .pipe(
        map(response => {
          console.log('Respuesta del servidor (updateUser):', response);
          return response;
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Error en updateUser:', error);
          
          if (typeof error.error === 'string') {
            try {
              const parsedError = JSON.parse(error.error);
              return throwError(() => new Error(parsedError.mensaje || 'Error desconocido'));
            } catch (e) {
              // No es un JSON válido
            }
          }
          
          return throwError(() => error);
        })
      );
  }

  // Eliminar un usuario
  deleteUser(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}delete-user.php?id=${id}`, { 
      responseType: 'json',
      withCredentials: true
    })
      .pipe(
        map(response => {
          console.log('Respuesta del servidor (deleteUser):', response);
          return response;
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Error en deleteUser:', error);
          
          if (typeof error.error === 'string') {
            try {
              const parsedError = JSON.parse(error.error);
              return throwError(() => new Error(parsedError.mensaje || 'Error desconocido'));
            } catch (e) {
              // No es un JSON válido
            }
          }
          
          return throwError(() => error);
        })
      );
  }
}
