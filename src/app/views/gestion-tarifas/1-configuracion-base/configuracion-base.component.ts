import type { OnDestroy, OnInit } from '@angular/core';
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	inject,
	output,
	signal,
	ViewEncapsulation
} from '@angular/core';
import {
	ReactiveFormsModule} from '@angular/forms';
import {
	ModalService,
	UiSelectComponent,
	getInputValue,
	NotificationService,
	SelectOption,
	UiButtonComponent,
	TransferList
} from '@agroseguro/lib-ui-agroseguro';

import { ModalAnadirEliminarRiesgosComponent } from './modal-anadir-riesgos/modal-anadir-riesgos.component';
import { Subject, takeUntil } from 'rxjs';
import { GrupoSeguroService } from '../../../../core/services/grupo-seguro.service';
import { PlanService } from '../../../../core/services/plan.service';
import { PlanLineaService } from '../../../../core/services/plan-linea.service';

@Component({
	selector: 'app-configuracion-base',
	standalone: true,
	imports: [ReactiveFormsModule, UiSelectComponent, UiButtonComponent],
	templateUrl: './configuracion-base.component.html',
	styleUrl: './configuracion-base.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None,
	host: {
		class: 'configuracion-base'
	}
})
export class ConfiguracionBaseComponent implements OnInit, OnDestroy {
	//Servicios
	readonly #modalService = inject(ModalService);
	readonly #notificationsService = inject(NotificationService);
	readonly #grupoSeguroService = inject(GrupoSeguroService);
	readonly #planService = inject(PlanService);
	readonly #planLineaService = inject(PlanLineaService);

	//Subject para manejar la destrucción de suscripciones
	#destroy$ = new Subject<void>();

	/*Control de errores de los grupos de seguro*/
	public onLoadGrupoSeguroError = signal<boolean>(false);
	public onLoadPlanError = signal<boolean>(false);
	public onLoadLineasError = signal<boolean>(false);
	public grupoSeguroSetted = signal<boolean>(false);
	public planSetted = signal<boolean>(false);
	public lineaSetted = signal<boolean>(false);

	/*Control de errores*/
	public onLoadError = signal<boolean>(false);
	public placeholder = computed(() => {
		return this.onLoadError()
			? 'Se ha producido un error recuperando los datos'
			: 'Cargando Datos...';
	});

	public grupoSeguroSelectOptions = signal<SelectOption[]>([]); //Grupo seguro select options
	public planSelectOptions = signal<SelectOption[]>([]); //Plan select options
	public lineaSelectOptions = signal<SelectOption[]>([]); //Linea select options

	public linea = computed(() => this.#grupoSeguroService.linea());
	public plan = computed(() => this.#grupoSeguroService.plan());
	public grupoSeguro = computed(() => this.#grupoSeguroService.grupoSeguro());

	//Boolean emitido para saber que podemos pasar al siguiente paso
	public isComplete = output<boolean>();

	ngOnInit() {
		//Obtener las opciones del select de grupo seguro
		this.#grupoSeguroService
			.getGruposSeguros()
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: (opts) => {
					this.grupoSeguroSelectOptions.set(opts);
					if (this.isAllPreviousSetted()) {
						this.getLineas();
					}
				},
				error: () => {
					this.onLoadGrupoSeguroError.set(true);
				}
			});

		//Obtener las opciones del select de planes
		this.#planService
			.getPlanes()
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: (opts) => {
					this.planSelectOptions.set(opts);
				},
				error: () => {
					this.onLoadPlanError.set(true);
				}
			});
	}

	isAllPreviousSetted(): boolean {
		return this.grupoSeguro()?.id != '' && this.plan() != '' && this.linea()?.id != '';
	}

	cleanLineaSetted() {
		this.#grupoSeguroService.linea.set({
			id: '',
			descripcion: ''
		});
		this.lineaSetted.set(false);
		this.isComplete.emit(false);
		this.validateForm();
	}

	getLineas() {
		this.#grupoSeguroService
			.getLineas(this.grupoSeguro()?.id || '')
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: (opts) => {
					this.lineaSelectOptions.set(opts);
					if (this.isAllPreviousSetted()) {
						this.validateForm();
					}
				},
				error: () => {
					this.onLoadLineasError.set(true);
				}
			});
	}

	setGrupoSeguro(event: Event) {
		const value = getInputValue(event);
		if (value) {
			this.grupoSeguroSelectOptions().forEach((grupoSeguroOption) => {
				if (grupoSeguroOption.value === value) {
					this.#grupoSeguroService.grupoSeguro.set({
						id: grupoSeguroOption.value,
						descripcion: grupoSeguroOption.text
					});
					this.grupoSeguroSetted.set(true);
				}
			});
			this.cleanLineaSetted();
			this.getLineas();
		}
	}

	setPlan(event: Event) {
		const value = getInputValue(event);
		if (value) {
			this.planSelectOptions().forEach((planOption) => {
				if (planOption.value === Number(value)) {
					this.#grupoSeguroService.plan.set(planOption.value);
					this.planSetted.set(true);
					this.validateForm();
				}
			});
		}
	}

	setLinea(event: Event) {
		const value = getInputValue(event);
		if (value) {
			this.lineaSelectOptions().forEach((lineaOption) => {
				if (lineaOption.value === Number(value)) {
					this.#grupoSeguroService.linea.set({
						id: lineaOption.value,
						descripcion: lineaOption.text
					});
					this.lineaSetted.set(true);
					this.validateForm();
				}
			});
		}
	}

	//Nos desuscribimos de todas las suscripciones al destruir el componente
	ngOnDestroy() {
		this.#destroy$.next(); // Notifica a los observables que deben cerrarse
		this.#destroy$.complete(); // Cierra el subject
	}

	anadirEliminarRiesgosModal() {
		this.#modalService
			.open(ModalAnadirEliminarRiesgosComponent, { size: 'l' })
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: (lista: TransferList[]) => {
					if (lista.length > 0) {
						this.validateForm();
					}
					this.#notificationsService.showNotification({
						message: signal('Riesgos actualizados correctamente'),
						hasError: signal(false)
					});
				},
				error: () => {
					// Si falla la actualización, limpiamos y deshabilitamos Next
					//this.selectedRisks.set([]);
					//this.updateComplete();
					this.#notificationsService.showNotification({
						message: signal('Error al actualizar los riesgos'),
						hasError: signal(true)
					});
				}
			});
	}

	validateForm() {
		if (this.#grupoSeguroService.plan() != '' && this.#grupoSeguroService.linea().id != '') {
			this.getPlanLinea(this.#grupoSeguroService.plan(), this.#grupoSeguroService.linea().id);
		}
	}

	getPlanLinea(idPlan: string, idLinea: string) {
		this.#planService
			.getPlanLinea(idPlan, idLinea)
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: (planLinea) => {
					this.tieneRiesgos(planLinea.idPlanLinea);
				},
				error: (error) => {
					if (error.status === 404) {
						this.isComplete.emit(false);
					}
				}
			});
	}

	tieneRiesgos(idPlanLinea: string) {
		this.#planLineaService
			.tieneRiesgos(idPlanLinea)
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: (tieneRiesgos) => {
					if (tieneRiesgos) {
						this.isComplete.emit(true);
					}
				},
				error: () => {
					this.isComplete.emit(false);
				}
			});
	}
}
