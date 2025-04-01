import { Routes } from '@angular/router';
import { AddProductComponent } from './componentes/add-product/add-product.component';
import { AddCategoriaComponent } from './componentes/add-categorias/add-categorias.component';
import { MostrarProductsComponent } from './componentes/mostrar-products/mostrar-products.component';
import { ContactoComponent } from './componentes/contacto/contacto.component';
import { AdminPanelComponent } from './componentes/admin-panel/admin-panel.component';
import { MainComponent } from './componentes/main/main.component';
import { DeleteProductComponent } from './componentes/delete-product/delete-product.component';
import { ModificarProductComponent } from './componentes/modificar-product/modificar-product.component';
import { LoginComponent } from './componentes/login/login.component';
import { RegisterComponent } from './componentes/register/register.component';
import { AuthGuard } from './services/auth.guard';
import { CarritoComponent } from './componentes/carrito/carrito.component';
import { DeleteCategoriaComponent } from './componentes/delete-categoria/delete-categoria.component';
import { DetalleProductoComponent } from './componentes/detalle-producto/detalle-producto.component';
import { CheckoutComponent } from './componentes/checkout/checkout.component';
import { PerfilUsuarioComponent } from './componentes/perfil-usuario/perfil-usuario.component';
import { ConocenosComponent } from './pages/footer-pages/conocenos/conocenos.component';
import { NuestrasTiendasComponent } from './pages/footer-pages/nuestras-tiendas/nuestras-tiendas.component';
import { TrabajaConNosotrosComponent } from './pages/footer-pages/trabaja-con-nosotros/trabaja-con-nosotros.component';
import { PreguntasFrecuentesComponent } from './pages/footer-pages/preguntas-frecuentes/preguntas-frecuentes.component';
import { CondicionesCompraComponent } from './pages/footer-pages/condiciones-compra/condiciones-compra.component';
import { PoliticaDevolucionComponent } from './pages/footer-pages/politica-devolucion/politica-devolucion.component';
import { AvisoLegalComponent } from './pages/footer-pages/aviso-legal/aviso-legal.component';
import { PoliticaPrivacidadComponent } from './pages/footer-pages/politica-privacidad/politica-privacidad.component';
import { TerminosServicioComponent } from './pages/footer-pages/terminos-servicio/terminos-servicio.component';
import { PoliticaCookiesComponent } from './pages/footer-pages/politica-cookies/politica-cookies.component';
import { ConsentimientoCookiesComponent } from './pages/footer-pages/consentimiento-cookies/consentimiento-cookies.component';
import { ListaUsuariosComponent } from './componentes/usuarios/lista-usuarios/lista-usuarios.component';
import { CrearUsuarioComponent } from './componentes/usuarios/crear-usuario/crear-usuario.component';
import { EditarUsuarioComponent } from './componentes/usuarios/editar-usuario/editar-usuario.component';
import { EliminarUsuarioComponent } from './componentes/usuarios/eliminar-usuario/eliminar-usuario.component';

export const routes: Routes = [
 {path: 'addProduct', component: AddProductComponent , canActivate: [AuthGuard], data: { role: 'admin' }},
 {path: 'addCategoria', component: AddCategoriaComponent, canActivate: [AuthGuard], data: { role: 'admin' }},
 {path: 'mostrarProductos', component: MostrarProductsComponent},
 { path: 'mostrarProductos/:categoriaID', component: MostrarProductsComponent },
 {path: 'contacto', component: ContactoComponent},
 {path: 'adminPanel', component: AdminPanelComponent, canActivate: [AuthGuard], data: { role: 'admin' }},
 {path: 'main', component: MainComponent},
 {path: 'deleteProduct', component: DeleteProductComponent, canActivate: [AuthGuard], data: { role: 'admin' }},
 {path: 'deleteCategoria', component: DeleteCategoriaComponent, canActivate: [AuthGuard], data: { role: 'admin' }},
 {path: 'modificarProduct', component: ModificarProductComponent, canActivate: [AuthGuard], data: { role: 'admin' }},
 {path: 'checkout', component: CheckoutComponent},
 { path: 'login', component: LoginComponent },
 { path: 'register', component: RegisterComponent },
 {path:'carrito', component: CarritoComponent},
 { path: 'producto/:id', component: DetalleProductoComponent },
 { path: 'perfil', component: PerfilUsuarioComponent, canActivate: [AuthGuard] },
 
 // Rutas para la gestión de usuarios (solo para administradores)
 { path: 'lista-usuarios', component: ListaUsuariosComponent, canActivate: [AuthGuard], data: { role: 'admin' } },
 { path: 'crear-usuario', component: CrearUsuarioComponent, canActivate: [AuthGuard], data: { role: 'admin' } },
 { path: 'editar-usuario/:id', component: EditarUsuarioComponent, canActivate: [AuthGuard], data: { role: 'admin' } },
 { path: 'eliminar-usuario/:id', component: EliminarUsuarioComponent, canActivate: [AuthGuard], data: { role: 'admin' } },
 
 // Rutas para las páginas del footer
 { path: 'conocenos', component: ConocenosComponent },
 { path: 'nuestras-tiendas', component: NuestrasTiendasComponent },
 { path: 'trabaja-con-nosotros', component: TrabajaConNosotrosComponent },
 { path: 'preguntas-frecuentes', component: PreguntasFrecuentesComponent },
 { path: 'condiciones-compra', component: CondicionesCompraComponent },
 { path: 'politica-devolucion', component: PoliticaDevolucionComponent },
 { path: 'aviso-legal', component: AvisoLegalComponent },
 { path: 'politica-privacidad', component: PoliticaPrivacidadComponent },
 { path: 'terminos-servicio', component: TerminosServicioComponent },
 { path: 'politica-cookies', component: PoliticaCookiesComponent },
 { path: 'consentimiento-cookies', component: ConsentimientoCookiesComponent },
 {path: '', redirectTo: 'main', pathMatch: 'full'},
 {path: '**', redirectTo: 'main', pathMatch: 'full'},
];
