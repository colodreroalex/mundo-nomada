import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '../../../models/Users';

@Component({
  selector: 'app-perfil-usuario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './perfil-usuario.component.html',
  styleUrls: ['./perfil-usuario.component.css']
})
export class PerfilUsuarioComponent implements OnInit {
  currentUser: User | null = null;
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  
  // Control de secciones activas
  activeSection: 'profile' | 'security' | 'activity' = 'profile';
  
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
  lastProfileUpdateDate: Date = new Date();
  lastPasswordUpdateDate: Date | null = null;

  constructor(
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    // Inicializar datos simulados para actividad
    this.lastLogin = new Date();
    this.lastProfileUpdateDate = new Date();
  }

  ngOnInit(): void {
    // Obtener el usuario actual
    this.currentUser = this.authService.getCurrentUser();
    
    // Si el usuario tiene fecha de actualización de contraseña, la usamos
    if (this.currentUser && this.currentUser.password_updated_at) {
      this.lastPasswordUpdateDate = new Date(this.currentUser.password_updated_at);
    }
    
    // Inicializar formulario de perfil
    this.profileForm = this.fb.group({
      name: [this.currentUser?.name || '', [Validators.required, Validators.minLength(3)]],
      email: [this.currentUser?.email || '', [Validators.required, Validators.email]]
    });
    
    // Inicializar formulario de cambio de contraseña
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validator: this.passwordMatchValidator });

    // Observar cambios en el usuario actual
    this.authService.getCurrentUserObservable().subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.profileForm.patchValue({
          name: user.name,
          email: user.email
        });
      }
    });
  }
  
  // Método para cambiar entre secciones
  setActiveSection(section: 'profile' | 'security' | 'activity'): void {
    this.activeSection = section;
  }
  
  // Validador de coincidencia de contraseñas
  passwordMatchValidator(g: FormGroup) {
    const newPassword = g.get('newPassword')?.value;
    const confirmPassword = g.get('confirmPassword')?.value;
    
    return newPassword === confirmPassword ? null : { 'notMatching': true };
  }
  
  // Actualizar perfil
  updateProfile() {
    if (this.profileForm.valid && this.currentUser) {
      const userData = this.profileForm.value;
      
      this.authService.updateUserProfile(this.currentUser.id, userData.name, userData.email).subscribe({
        next: (response) => {
          this.profileUpdateSuccess = true;
          this.lastProfileUpdateDate = new Date();
          
          // Actualizamos la información del usuario en la sesión local
          if (this.currentUser) {
            this.currentUser.name = userData.name;
            this.currentUser.email = userData.email;
          }
        },
        error: (error) => {
          this.profileUpdateError = error.message || 'Error al actualizar el perfil';
        }
      });
    } else {
      this.profileUpdateError = 'El formulario contiene errores. Por favor, revísalo.';
    }
  }
  
  // Cambiar contraseña
  changePassword() {
    if (this.passwordForm.valid && this.currentUser) {
      const passwordData = this.passwordForm.value;
      
      this.authService.changePassword(
        this.currentUser.id,
        passwordData.currentPassword,
        passwordData.newPassword
      ).subscribe({
        next: (response) => {
          this.passwordUpdateSuccess = true;
          this.passwordForm.reset();
          
          // La fecha de actualización se maneja ahora en el AuthService y se actualiza
          // en el objeto currentUser, así que solo necesitamos obtenerla
          if (this.currentUser && this.currentUser.password_updated_at) {
            this.lastPasswordUpdateDate = new Date(this.currentUser.password_updated_at);
          }
        },
        error: (error) => {
          this.passwordUpdateError = error.message || 'Error al cambiar la contraseña';
        }
      });
    } else {
      this.passwordUpdateError = 'El formulario contiene errores. Por favor, revísalo.';
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
  formatDate(date: string | Date | null | undefined): string {
    if (!date) return 'No disponible';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date as Date;
    return dateObj.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  // Información de actividad
  getLastLoginDate(): string {
    return this.formatDate(this.lastLogin);
  }

  getLastProfileUpdate(): string {
    return this.formatDate(this.lastProfileUpdateDate);
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
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    return isMobile ? 'Dispositivo Móvil' : 'Ordenador';
  }

  getSecurityLevel(): string {
    // Evaluar la fuerza de la contraseña
    let securityScore = 0;
    
    // 1. Evaluación basada en el tiempo transcurrido desde el último cambio de contraseña
    if (this.lastPasswordUpdateDate) {
      const daysSinceUpdate = Math.floor((new Date().getTime() - this.lastPasswordUpdateDate.getTime()) / (1000 * 3600 * 24));
      
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
    const commonPasswords = ['123456', 'password', 'qwerty', 'admin', '12345678', 'welcome'];
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
}
