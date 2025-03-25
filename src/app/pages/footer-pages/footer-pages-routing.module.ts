import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ConocenosComponent } from './conocenos/conocenos.component';
import { NuestrasTiendasComponent } from './nuestras-tiendas/nuestras-tiendas.component';
import { TrabajaConNosotrosComponent } from './trabaja-con-nosotros/trabaja-con-nosotros.component';
import { PreguntasFrecuentesComponent } from './preguntas-frecuentes/preguntas-frecuentes.component';
import { CondicionesCompraComponent } from './condiciones-compra/condiciones-compra.component';
import { PoliticaDevolucionComponent } from './politica-devolucion/politica-devolucion.component';
import { AvisoLegalComponent } from './aviso-legal/aviso-legal.component';
import { PoliticaPrivacidadComponent } from './politica-privacidad/politica-privacidad.component';
import { TerminosServicioComponent } from './terminos-servicio/terminos-servicio.component';
import { PoliticaCookiesComponent } from './politica-cookies/politica-cookies.component';
import { ConsentimientoCookiesComponent } from './consentimiento-cookies/consentimiento-cookies.component';

const routes: Routes = [
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
  { path: 'consentimiento-cookies', component: ConsentimientoCookiesComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FooterPagesRoutingModule { }
