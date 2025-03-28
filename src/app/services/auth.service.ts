import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError, map, mergeMap } from 'rxjs/operators';
import { CarritoService } from './carrito.service'; // Import the CarritoService
import { User } from '../../models/Users'; // Asegúrate de importar la clase User correctamente

@Injectable({
  providedIn: 'root'
})

export class AuthService {
  private apiUrl = 'http://localhost/mundonomada/api_php/auth/';
  private currentUserSubject: BehaviorSubject<User | null> = new BehaviorSubject<User | null>(null);

  // Indicador de que la sesión ya se comprobó
  public sessionLoadedSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  
  constructor(private http: HttpClient, private carritoService: CarritoService) {
    this.checkSession(); // Al iniciar la aplicación se verifica la sesión
  }

  login(email: string, password: string, rememberMe: boolean): Observable<User> {
    return this.http
      .post<User>(`${this.apiUrl}login.php`, { email, password, rememberMe }, { withCredentials: true })
      .pipe(
        tap(response => {
          this.currentUserSubject.next(response);
          // Migrar el carrito local al usuario autenticado, si existiera
          this.carritoService.migrateGuestCart(response.id).subscribe({
            next: () => {
              console.log('Carrito de invitado migrado exitosamente.');
            },
            error: (err: any) => {
              console.error('Error al migrar el carrito de invitado:', err);
            }
          });
        })
      );
  }
  

  register(name: string, email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}register.php`, { name, email, password }, { withCredentials: true });
  }

  logout(): Observable<any> {
    return this.http.get(`${this.apiUrl}logout.php`, { withCredentials: true })
      .pipe(
        tap(() => {
          this.currentUserSubject.next(null);
        })
      );
  }

  checkSession(): void {
    this.http.get<User>(`${this.apiUrl}getSession.php`, { withCredentials: true })
      .subscribe({
        next: (user) => {
          this.currentUserSubject.next(user);
          // Indica que la sesión ya se comprobó
          this.sessionLoadedSubject.next(true);
        },
        error: () => {
          this.currentUserSubject.next(null);
          this.sessionLoadedSubject.next(true);
        }
      });
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getCurrentUserObservable(): Observable<User | null> {
    return this.currentUserSubject.asObservable();
  }

  getRole(): string | null {
    const user = this.getCurrentUser();
    return user ? user.role : null;
  }

  isAdmin(): boolean {
    return this.getRole() === 'admin';
  }

  // Método para actualizar el perfil del usuario
  updateUserProfile(userId: number, name: string, email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}updateProfile.php`, {
      userId,
      name,
      email
    }, {
      withCredentials: true
    }).pipe(
      tap((response: any) => {
        // Si hay un usuario actual y la operación fue exitosa, actualizamos su información
        if (this.currentUserSubject.value && response.success) {
          const currentUser = this.currentUserSubject.value;
          // Actualizamos los datos básicos
          currentUser.name = name;
          currentUser.email = email;
          
          // Actualizamos la fecha de actualización del perfil si viene en la respuesta
          if (response.updated_at) {
            currentUser.updated_at = new Date(response.updated_at);
          }
          
          // Actualizamos el BehaviorSubject con el usuario modificado
          this.currentUserSubject.next(currentUser);
        }
      })
    );
  }

  // Método para verificar si la sesión está activa
  checkSessionActive(): Observable<any> {
    console.log('AuthService: Verificando si hay sesión activa');
    return this.http.get(`${this.apiUrl}check_session.php`, {
      withCredentials: true
    }).pipe(
      catchError(error => {
        console.error('AuthService: Error verificando sesión:', error);
        return throwError(() => new Error('Error verificando sesión'));
      })
    );
  }

  // Método para cambiar la contraseña
  changePassword(userId: number, currentPassword: string, newPassword: string): Observable<any> {
    // Verificar la longitud de la contraseña antes de enviar al servidor
    if (newPassword.length < 6) {
      return throwError(() => new Error('La nueva contraseña debe tener al menos 6 caracteres.'));
    }
    
    // Definir una interfaz para la respuesta
    interface PasswordChangeResponse {
      success: boolean;
      message: string;
      password_updated_at?: string;
    }
    
    return this.http.post<PasswordChangeResponse>(`${this.apiUrl}changePassword.php`, { 
      userId, 
      oldPassword: currentPassword,
      newPassword 
    }, { 
      withCredentials: true
    }).pipe(
      tap((response: PasswordChangeResponse) => {
        // Si hay un usuario actual y la operación fue exitosa, actualizamos su información
        if (this.currentUserSubject.value && response.success) {
          const currentUser = this.currentUserSubject.value;
          if (response.password_updated_at) {
            // Actualizamos la fecha de actualización de contraseña
            currentUser.password_updated_at = new Date(response.password_updated_at);
            // Actualizamos el BehaviorSubject con el usuario modificado
            this.currentUserSubject.next(currentUser);
          }
        }
      })
    );
  }
}
