import type { Routes } from '@angular/router';
import { GestionRiesgosComponent } from './views/gestion-riesgos/gestion-riesgos.component';
import { GestionCoeficientesComponent } from './views/gestion-coeficientes/gestion-coeficientes.component';
import { GestionLimitesComponent } from './views/gestion-limites/gestion-limites.component';
import { GestionTarifasComponent } from './views/gestion-tarifas/gestion-tarifas.component';
import { GestionFactoresConfiguracionComponent } from './views/gestion-factores-configuracion/gestion-factores-configuracion.component';
import { GestionFactoresDefinicionComponent } from './views/gestion-factores-definicion/gestion-factores-definicion.component';
import { ConfiguracionFactoresDeduciblesComponent } from './views/configuracion-factores-deducibles/configuracion-factores-deducibles.component';

export const routes: Routes = [
	{ path: '', component: GestionTarifasComponent },
	{ path: 'gestion-riesgos', component: GestionRiesgosComponent },
	{ path: 'gestion-coeficientes', component: GestionCoeficientesComponent },
	{ path: 'gestion-limites', component: GestionLimitesComponent },
	{ path: 'gestion-factores/configuracion', component: GestionFactoresConfiguracionComponent },
	{ path: 'gestion-factores/definicion', component: GestionFactoresDefinicionComponent },
	{ path: 'gestion-factores/configuracion-deducibles', component: ConfiguracionFactoresDeduciblesComponent }
];
