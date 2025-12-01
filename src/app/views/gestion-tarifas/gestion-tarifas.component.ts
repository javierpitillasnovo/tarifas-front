import { SessionService } from '@agroseguro/agro-lib-arch-front-security';
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	inject,
	signal,
	ViewChild,
	ViewContainerRef
} from '@angular/core';
import type { Steps } from '@agroseguro/lib-ui-agroseguro';
import {
	StepTemplateDirective,
	UiStepperComponent,
	NotificationService,
	ModalService
} from '@agroseguro/lib-ui-agroseguro';
import { ConfiguracionBaseComponent } from './1-configuracion-base/configuracion-base.component';
import { GrupoSeguroService } from '../../../core/services/grupo-seguro.service';
import { DefinicionFactoresComponent } from './2-definicion-factores/definicion-factores.component';
import { CommonModule } from '@angular/common';
import { CombinacionFactoresValoresComponent } from './3-combinacion-factores-valores/combinacion-factores-valores.component';
import { PlanLineaRiesgo } from '../../../core/interfaces/general.interface';
import { PlanLineaRiesgoService } from '../../../core/services/plan-linea-riesgo.service';
import { ConsultaRiesgoTarificadoComponent } from './4-consulta-riesgo-tarificado/consulta-riesgo-tarificado.component';

@Component({
	selector: 'app-gestion-tarifas',
	standalone: true,
	imports: [
		StepTemplateDirective,
		UiStepperComponent,
		DefinicionFactoresComponent,
		CommonModule,
		ConfiguracionBaseComponent,
		CombinacionFactoresValoresComponent,
		ConsultaRiesgoTarificadoComponent
	],
	templateUrl: './gestion-tarifas.component.html',
	styleUrl: './gestion-tarifas.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class GestionTarifasComponent {
	readonly #notificationsService = inject(NotificationService);
	readonly #modalService = inject(ModalService);
	readonly #vcr = inject(ViewContainerRef);
	readonly #sessionService = inject(SessionService);
	readonly #grupoSeguroService = inject(GrupoSeguroService);
	readonly #planLineaRiesgoService = inject(PlanLineaRiesgoService);

	public grupoSeguro = computed(() => this.#grupoSeguroService.grupoSeguro());
	public linea = computed(() => this.#grupoSeguroService.linea());
	public plan = computed(() => this.#grupoSeguroService.plan());

	public isStep2 = signal<boolean>(false);

	@ViewChild(UiStepperComponent) stepper!: UiStepperComponent;

	#menu = [
		{
			label: 'Gestión de Riesgos',
			link: '/gestion-riesgos'
		},
		{
			label: 'Gestión de Factores',
			children: [
				{
					label: 'Definición',
					link: '/gestion-factores/definicion'
				},
				{
					label: 'Configuración',
					link: '/gestion-factores/configuracion'
				},
				{
					label: 'Configuracion Factores deducibles',
					link: '/gestion-factores/configuracion-deducibles'
				}
			]
		},
		{
			label: 'Gestión de Coeficientes',
			link: '/gestion-coeficientes'
		},
		{
			label: 'Gestión de Límites',
			link: '/gestion-limites'
		},
		{
			label: 'Gestión de Tarifas',
			link: '/'
		}
	];

	public steps: Steps[] = [
		{ number: 1, title: 'Configuración base' },
		{ number: 2, title: 'Definición de factores' },
		{ number: 3, title: 'Configuración de Tarifas' },
		{ number: 4, title: 'Consulta Riesgos Tarificados' }
	];
	public buttonsdisabled = signal<boolean>(true);

	constructor() {
		this.#sessionService.set('AGRO_APP_MENU', JSON.stringify(this.#menu));
		this.#sessionService.set('AGRO_APP_NAME', 'Tarifas');
		this.#modalService.setViewContainerRef(this.#vcr);
		this.#notificationsService.setViewContainerRef(this.#vcr);
	}

	loadedStep2(event: Event | boolean) {
		let value: boolean;
		if (typeof event === 'boolean') {
			value = event;
		} else {
			value = false;
		}
		this.isStep2.set(value);
	}

	goToNextStep(event: Event | PlanLineaRiesgo) {
		this.stepper.next();
	}
}
