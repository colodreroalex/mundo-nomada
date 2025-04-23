import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { OrdersService } from '../../services/orders.service';
import { User } from '../../../models/Users';
import { Pedido } from '../../../models/Pedido';
import { OrderItem } from '../../../models/OrderItem';

@Component({
  selector: 'app-perfil-usuario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './perfil-usuario.component.html',
  styleUrls: ['./perfil-usuario.component.css'],
})
export class PerfilUsuarioComponent implements OnInit {
  currentUser: User | null = null;
  profileForm!: FormGroup;
  passwordForm!: FormGroup;

  // Historial de pedidos
  orders: Pedido[] = [];
  orderItems: OrderItem[] = [];
  selectedOrder: Pedido | null = null;
  loadingOrders = false;
  loadingOrderItems = false;
  orderError = '';

  // Control de secciones activas
  activeSection: 'profile' | 'security' | 'activity' | 'orders' = 'profile';

  // Mensajes para el usuario
  profileUpdateSuccess = false;
  profileUpdateError = '';
  passwordUpdateSuccess = false;
  passwordUpdateError = '';

  // Control de visibilidad de contraseñas
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  // Datos de actividad reciente
  lastLogin: Date = new Date();
  lastPasswordUpdateDate: Date | null = null;

  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    private ordersService: OrdersService
  ) {
    // Inicializar datos simulados para actividad
    this.lastLogin = new Date();
  }

  ngOnInit(): void {
    // Obtener el usuario actual
    this.currentUser = this.authService.getCurrentUser();

    // Si el usuario tiene fecha de actualización de contraseña, la usamos
    if (this.currentUser && this.currentUser.password_updated_at) {
      this.lastPasswordUpdateDate = new Date(
        this.currentUser.password_updated_at
      );
    }

    // Inicializar formulario de perfil
    this.profileForm = this.fb.group({
      name: [
        this.currentUser?.name || '',
        [Validators.required, Validators.minLength(3)],
      ],
      email: [
        this.currentUser?.email || '',
        [Validators.required, Validators.email],
      ],
    });

    // Inicializar formulario de cambio de contraseña
    this.passwordForm = this.fb.group(
      {
        currentPassword: ['', [Validators.required]],
        newPassword: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validator: this.passwordMatchValidator }
    );

    // Observar cambios en el usuario actual
    this.authService.getCurrentUserObservable().subscribe((user) => {
      this.currentUser = user;
      if (user) {
        this.profileForm.patchValue({
          name: user.name,
          email: user.email,
        });
      }
    });

    // Cargar el historial de pedidos
    this.loadOrders();
  }

  // Método para cambiar entre secciones
  setActiveSection(
    section: 'profile' | 'security' | 'activity' | 'orders'
  ): void {
    this.activeSection = section;
  }

  // Validador de coincidencia de contraseñas
  passwordMatchValidator(g: FormGroup) {
    const newPassword = g.get('newPassword')?.value;
    const confirmPassword = g.get('confirmPassword')?.value;

    return newPassword === confirmPassword ? null : { notMatching: true };
  }

  // Actualizar perfil
  updateProfile() {
    if (this.profileForm.valid && this.currentUser) {
      const userData = this.profileForm.value;

      this.authService
        .updateUserProfile(this.currentUser.id, userData.name, userData.email)
        .subscribe({
          next: (response) => {
            this.profileUpdateSuccess = true;

            // El AuthService ya se encargó de actualizar el objeto currentUser
            // No es necesario actualizarlo manualmente aquí
          },
          error: (error) => {
            this.profileUpdateError =
              error.message || 'Error al actualizar el perfil';
          },
        });
    } else {
      this.profileUpdateError =
        'El formulario contiene errores. Por favor, revísalo.';
    }
  }

  // Cambiar contraseña
  changePassword() {
    if (this.passwordForm.valid && this.currentUser) {
      const passwordData = this.passwordForm.value;

      this.authService
        .changePassword(
          this.currentUser.id,
          passwordData.currentPassword,
          passwordData.newPassword
        )
        .subscribe({
          next: (response) => {
            this.passwordUpdateSuccess = true;
            this.passwordForm.reset();

            // La fecha de actualización se maneja ahora en el AuthService y se actualiza
            // en el objeto currentUser, así que solo necesitamos obtenerla
            if (this.currentUser && this.currentUser.password_updated_at) {
              this.lastPasswordUpdateDate = new Date(
                this.currentUser.password_updated_at
              );
            }
          },
          error: (error) => {
            this.passwordUpdateError =
              error.message || 'Error al cambiar la contraseña';
          },
        });
    } else {
      this.passwordUpdateError =
        'El formulario contiene errores. Por favor, revísalo.';
    }
  }

  // Obtener inicial del usuario para el avatar
  getUserInitial(): string {
    if (this.currentUser && this.currentUser.name) {
      return this.currentUser.name.charAt(0).toUpperCase();
    }
    return 'U';
  }

  // Formateo de fechas seguras para el template
  formatDate(
    date: string | Date | null | undefined,
    includeTime: boolean = false
  ): string {
    if (!date) return 'No disponible';

    const dateObj = typeof date === 'string' ? new Date(date) : (date as Date);

    if (includeTime) {
      return dateObj.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } else {
      return dateObj.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    }
  }

  // Información de actividad
  getLastLoginDate(): string {
    return this.formatDate(this.lastLogin);
  }

  getLastProfileUpdate(): string {
    // Usar la fecha del objeto currentUser si está disponible,
    // de lo contrario devolver 'No disponible'
    if (this.currentUser && this.currentUser.updated_at) {
      return this.formatDate(this.currentUser.updated_at, true);
    }
    return 'No disponible';
  }

  getLastPasswordUpdate(): string {
    if (!this.lastPasswordUpdateDate) {
      return 'Nunca';
    }
    return this.formatDate(this.lastPasswordUpdateDate);
  }

  getCurrentDevice(): string {
    // En un caso real, esto se obtendría del servicio de autenticación
    // o de algún servicio específico de detección de dispositivos
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
    return isMobile ? 'Dispositivo Móvil' : 'Ordenador';
  }

  getSecurityLevel(): string {
    // Evaluar la fuerza de la contraseña
    let securityScore = 0;

    // 1. Evaluación basada en el tiempo transcurrido desde el último cambio de contraseña
    if (this.lastPasswordUpdateDate) {
      const daysSinceUpdate = Math.floor(
        (new Date().getTime() - this.lastPasswordUpdateDate.getTime()) /
          (1000 * 3600 * 24)
      );

      if (daysSinceUpdate < 30) {
        securityScore += 2; // Reciente: buen puntaje
      } else if (daysSinceUpdate < 90) {
        securityScore += 1; // Hace algún tiempo: puntaje medio
      } // Más de 90 días: no suma puntos
    }

    // 2. Si podemos acceder a la contraseña actual (lo cual normalmente no es posible)
    // analizamos su complejidad - esto es principalmente para demostración
    const password = this.passwordForm.get('newPassword')?.value || '';

    // Evaluar la complejidad de la contraseña
    const hasLowerCase = /[a-z]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isLongEnough = password.length >= 8;

    // Sumar puntos por cada criterio que cumpla
    if (hasLowerCase) securityScore += 1;
    if (hasUpperCase) securityScore += 1;
    if (hasNumbers) securityScore += 1;
    if (hasSpecialChars) securityScore += 2;
    if (isLongEnough) securityScore += 1;

    // Comprobar si se usan contraseñas comunes/débiles
    const commonPasswords = [
      '123456',
      'password',
      'qwerty',
      'admin',
      '12345678',
      'welcome',
    ];
    if (commonPasswords.includes(password.toLowerCase())) {
      securityScore = 0; // Contraseña muy débil
    }

    // Determinar nivel basado en la puntuación
    if (securityScore >= 5) {
      return 'Alto';
    } else if (securityScore >= 3) {
      return 'Medio';
    } else {
      return 'Bajo';
    }
  }

  // Evaluar la fortaleza de la contraseña (de 0 a 100)
  evaluatePasswordStrength(password: string): number {
    if (!password) return 0;

    let strength = 0;
    const lengthScore = Math.min(password.length * 2, 40); // Máximo 40 puntos por longitud
    strength += lengthScore;

    // Verificar caracteres especiales (20 puntos)
    const patterns = [
      /[A-Z]/, // Mayúsculas
      /[a-z]/, // Minúsculas
      /[0-9]/, // Números
      /[^A-Za-z0-9]/, // Símbolos
    ];

    patterns.forEach((pattern) => {
      if (pattern.test(password)) {
        strength += 15;
      }
    });

    // Limitar a 100 puntos como máximo
    return Math.min(strength, 100);
  }

  // Obtener la etiqueta de fortaleza de la contraseña
  getPasswordStrengthLabel(password: string): string {
    const strength = this.evaluatePasswordStrength(password);

    if (strength < 30) return 'Muy débil';
    if (strength < 50) return 'Débil';
    if (strength < 75) return 'Media';
    if (strength < 90) return 'Fuerte';
    return 'Muy fuerte';
  }

  // Obtener la clase CSS para la barra de fortaleza
  getPasswordStrengthClass(password: string): string {
    const strength = this.evaluatePasswordStrength(password);

    if (strength < 30) return 'strength-very-weak';
    if (strength < 50) return 'strength-weak';
    if (strength < 75) return 'strength-medium';
    if (strength < 90) return 'strength-strong';
    return 'strength-very-strong';
  }

  // Calcular el porcentaje de fortaleza para la barra de progreso
  getPasswordStrengthPercentage(password: string): number {
    return this.evaluatePasswordStrength(password);
  }

  // Métodos auxiliares para validación de contraseña
  hasMinLength(password: string): boolean {
    return password ? password.length >= 8 : false;
  }

  hasMixedCase(password: string): boolean {
    return password ? /[A-Z]/.test(password) && /[a-z]/.test(password) : false;
  }

  hasNumbers(password: string): boolean {
    return password ? /[0-9]/.test(password) : false;
  }

  hasSymbols(password: string): boolean {
    return password ? /[^A-Za-z0-9]/.test(password) : false;
  }

  // Cargar pedidos
  loadOrders(): void {
    this.loadingOrders = true;
    this.orderError = '';
    this.ordersService.getOrdersByUser().subscribe({
      next: (orders) => {
        this.orders = orders;
        this.loadingOrders = false;
        // Guardar en localStorage para poder mostrar el historial offline
        localStorage.setItem('userOrders', JSON.stringify(orders));
      },
      error: (err) => {
        console.error('Error al cargar pedidos:', err);
        // Intentar recuperar del localStorage si hay un error
        const cachedOrders = localStorage.getItem('userOrders');
        if (cachedOrders) {
          try {
            this.orders = JSON.parse(cachedOrders);
          } catch (e) {
            this.orders = [];
            localStorage.removeItem('userOrders');
          }
        } else {
          this.orders = [];
        }
        this.orderError = 'No se pudieron cargar los pedidos del servidor. Mostrando datos guardados localmente.';
        this.loadingOrders = false;
      },
    });
  }

  // Acción para ver detalle de pedido
  verDetallePedido(order: Pedido): void {
    this.selectedOrder = order;
    this.loadingOrderItems = true;
    this.orderItems = []; // Limpiar items anteriores
    
    // Buscar en localStorage primero si tenemos los items guardados
    const cacheKey = `orderItems_${order.id}`;
    const cachedItems = localStorage.getItem(cacheKey);
    
    if (cachedItems) {
      try {
        this.orderItems = JSON.parse(cachedItems);
        this.loadingOrderItems = false;
      } catch (e) {
        // Error al parsear, eliminamos cache inválido
        localStorage.removeItem(cacheKey);
        this.loadItemsFromServer(order.id, cacheKey);
      }
    } else {
      this.loadItemsFromServer(order.id, cacheKey);
    }
  }
  
  // Método para cargar items desde el servidor
  private loadItemsFromServer(orderId: number, cacheKey: string): void {
    this.ordersService.getOrderItems(orderId).subscribe({
      next: (items) => {
        this.orderItems = items;
        // Guardar en localStorage para acceso offline
        localStorage.setItem(cacheKey, JSON.stringify(items));
        this.loadingOrderItems = false;
      },
      error: (err) => {
        console.error('Error al cargar detalles del pedido:', err);
        this.orderItems = [];
        this.loadingOrderItems = false;
      },
    });
  }
}
