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
 {path: '', redirectTo: 'main', pathMatch: 'full'},
 {path: '**', redirectTo: 'main', pathMatch: 'full'},
];
