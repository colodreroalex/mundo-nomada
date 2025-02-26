import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { User } from '../../models/Users'; // Asegúrate de importar la clase User correctamente

@Injectable({
  providedIn: 'root'
})

export class AuthService {
  private apiUrl = 'http://localhost/mundonomada/api_php/auth/';
  private currentUserSubject: BehaviorSubject<User | null> = new BehaviorSubject<User | null>(null);

  constructor(private http: HttpClient) {
    this.checkSession(); // Al iniciar la aplicación se verifica la sesión
  }

  login(email: string, password: string, rememberMe: boolean): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}login.php`, { email, password, rememberMe }, { withCredentials: true })
      .pipe(
        tap(response => {
          this.currentUserSubject.next(response);
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
    // Llama al endpoint para verificar la sesión activa
    this.http.get<User>(`${this.apiUrl}getSession.php`, { withCredentials: true })
      .subscribe({
        next: (user) => this.currentUserSubject.next(user),
        error: () => this.currentUserSubject.next(null)
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
}

