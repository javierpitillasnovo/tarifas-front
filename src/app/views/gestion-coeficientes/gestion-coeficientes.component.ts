import { SessionService } from '@agroseguro/agro-lib-arch-front-security';
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	inject,
	signal,
	ViewContainerRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import {
	NotificationService,
	ModalService,
	UiStepperComponent,
	StepTemplateDirective
} from '@agroseguro/lib-ui-agroseguro';
import { GrupoSeguroService } from '../../../core/services/grupo-seguro.service';
import { PlanLineaRiesgoService } from '../../../core/services/plan-linea-riesgo.service';
import { ViewChild } from '@angular/core';

import { ConfiguracionBaseComponent } from './1-configuracion-base/configuracion-base.component';
import { CreacionDeCoeficientesComponent } from './2-creacion-de-coeficientes/creacion-de-coeficientes.component';
import { TablaFactoresCoeficientesComponent } from './4-tabla-factores-coeficientes/tabla-factores-coeficientes.component';
import { AsignacionCoeficientesComponent } from './3-asignacion-coeficientes/asignacion-coeficientes.component';

@Component({
	selector: 'app-gestion-coeficientes',
	standalone: true,
	imports: [
		CommonModule,
		ConfiguracionBaseComponent,
		CreacionDeCoeficientesComponent,
		AsignacionCoeficientesComponent,
		TablaFactoresCoeficientesComponent,
		UiStepperComponent,
		StepTemplateDirective
	],
	templateUrl: './gestion-coeficientes.component.html',
	styleUrl: './gestion-coeficientes.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class GestionCoeficientesComponent {
	readonly #notificationsService = inject(NotificationService);
	readonly #modalService = inject(ModalService);
	readonly #vcr = inject(ViewContainerRef);
	readonly #sessionService = inject(SessionService);
	readonly #grupoSeguroService = inject(GrupoSeguroService);
	readonly #planLineaRiesgoService = inject(PlanLineaRiesgoService);
	readonly #router = inject(Router);

	public grupoSeguro = computed(() => this.#grupoSeguroService.grupoSeguro());
	public linea = computed(() => this.#grupoSeguroService.linea());
	public plan = computed(() => this.#grupoSeguroService.plan());

	public steps = [
		{ number: 1, title: 'Configuración base' },
		{ number: 2, title: 'Selección de factores' },
		{ number: 3, title: 'Asignación coeficientes' }
	];

	stepperButtonsDisabled = signal<boolean>(true);

	@ViewChild('stepper') stepper!: UiStepperComponent;

	public currentStep = signal<0 | 1 | 2 | 3>(0);
	public isStepValid = signal<boolean>(false);

	constructor() {
		this.#sessionService.set('AGRO_APP_NAME', 'Coeficientes');
		this.#modalService.setViewContainerRef(this.#vcr);
		this.#notificationsService.setViewContainerRef(this.#vcr);
		this.#grupoSeguroService.reset();
	}

	goToStep(step: 0 | 1 | 2) {
		this.currentStep.set(step);
		this.stepper.activeStep.set(step + 1);
	}

	navigateToTablaFactores(): void {
		this.currentStep.set(3);
	}
	navigateToStep3() {
		// 1) Volver a mostrar el stepper (paso 2 del flujo)
		this.currentStep.set(2);

		// 2) Esperar a que Angular reconstruya el stepper COMPLETAMENTE
		setTimeout(() => {
			if (this.stepper) {
				this.stepper.activeStep.set(3); // ir al último paso del stepper
			}
		});
	}
}
