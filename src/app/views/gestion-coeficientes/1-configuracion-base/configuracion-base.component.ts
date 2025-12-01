import {
	ChangeDetectionStrategy,
	Component,
	computed,
	inject,
	output,
	signal,
	ViewEncapsulation,
	OnInit,
	OnDestroy
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import {
	ModalService,
	UiSelectComponent,
	getInputValue,
	NotificationService,
	SelectOption,
	UiButtonComponent
} from '@agroseguro/lib-ui-agroseguro';
import { Subject, takeUntil } from 'rxjs';
import { GrupoSeguroService } from '../../../../core/services/grupo-seguro.service';
import { PlanService } from '../../../../core/services/plan.service';
import { PlanLineaService } from '../../../../core/services/plan-linea.service';
import { ModalCopiarCoeficientesOtroPlanComponent } from './modal-copiar-coeficientes-otro-plan/modal-copiar-coeficientes-otro-plan.component';
// En algún componente de tarifas-front
@Component({
	selector: 'app-configuracion-base',
	standalone: true,
	imports: [ReactiveFormsModule, UiSelectComponent, UiButtonComponent],
	templateUrl: './configuracion-base.component.html',
	styleUrl: './configuracion-base.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None,
	host: { class: 'configuracion-base' }
})
export class ConfiguracionBaseComponent implements OnInit, OnDestroy {
	// Servicios
	readonly #modalService = inject(ModalService);
	readonly #notificationsService = inject(NotificationService);
	readonly #grupoSeguroService = inject(GrupoSeguroService);
	readonly #planService = inject(PlanService);
	readonly #planLineaService = inject(PlanLineaService);

	#destroy$ = new Subject<void>();

	// Estados y señales
	public onLoadGrupoSeguroError = signal<boolean>(false);
	public onLoadPlanError = signal<boolean>(false);
	public onLoadLineasError = signal<boolean>(false);
	public grupoSeguroSetted = signal<boolean>(false);
	public planSetted = signal<boolean>(false);
	public lineaSetted = signal<boolean>(false);

	public grupoSeguroSelectOptions = signal<SelectOption[]>([]);
	public planSelectOptions = signal<SelectOption[]>([]);
	public lineaSelectOptions = signal<SelectOption[]>([]);
	
	public grupoSeguro = computed(() => this.#grupoSeguroService.grupoSeguro());
	public plan = computed(() => this.#grupoSeguroService.plan());
	public linea = computed(() => this.#grupoSeguroService.linea());

	// Evento que emite cuando se puede pasar a creación de coeficientes
	public onCreate = output<void>();
	public isStepValid = output<boolean>();

	ngOnInit() {
		// Cargar grupos de seguro
		this.#grupoSeguroService
			.getGruposSeguros()
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: (opts) => {
					this.grupoSeguroSelectOptions.set(opts);
					if (this.isAllPreviousSetted()) this.getLineas();
				},
				error: () => this.onLoadGrupoSeguroError.set(true)
			});

		// Cargar planes
		this.#planService
			.getPlanes()
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: (opts) => this.planSelectOptions.set(opts),
				error: () => this.onLoadPlanError.set(true)
			});
	}

	isAllPreviousSetted(): boolean {
		return (
			!!this.grupoSeguro()?.id &&
			!!this.plan() &&
			!!this.linea()?.id
		);
	}

	cleanLineaSetted() {
		this.#grupoSeguroService.linea.set({ id: '', descripcion: '' });
		this.lineaSetted.set(false);
	}

	getLineas() {
		this.#grupoSeguroService
			.getLineas(this.grupoSeguro()?.id || '')
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: (opts) => this.lineaSelectOptions.set(opts),
				error: () => this.onLoadLineasError.set(true)
			});
	}

	setGrupoSeguro(event: Event) {
		const value = String(getInputValue(event));
		if (value) {
			const grupo = this.grupoSeguroSelectOptions().find(
				(opt) => opt.value === value
			);
			if (grupo) {
				this.#grupoSeguroService.grupoSeguro.set({
					id: String(grupo.value),
					descripcion: grupo.text
				});
				this.grupoSeguroSetted.set(true);
				this.cleanLineaSetted();
				this.getLineas();

				this.isStepValid.emit(this.isAllPreviousSetted());
			}
		}
	}

	setPlan(event: Event) {
		const value = getInputValue(event);
		if (value) {
			this.planSelectOptions().forEach((planOption) => {
				if (String(planOption.value) === String(value)) {
					this.#grupoSeguroService.plan.set(planOption.value);
					this.planSetted.set(true);

					this.isStepValid.emit(this.isAllPreviousSetted());
				}
			});
		}
	}

	setLinea(event: Event) {
		const value = String(getInputValue(event));
		if (value) {
			const linea = this.lineaSelectOptions().find(
				(opt) => String(opt.value) === value
			);
			if (linea) {
				this.#grupoSeguroService.linea.set({
					id: String(linea.value),
					descripcion: linea.text
				});
				this.lineaSetted.set(true);
				this.isStepValid.emit(this.isAllPreviousSetted());
			}
		}
	}
    copiarCoeficientesModal() {
	this.#modalService
		.open(ModalCopiarCoeficientesOtroPlanComponent, { size: 'm' })
		.subscribe({
			next: (planSeleccionado: string) => {
				if (planSeleccionado) {
					console.log('Copiando coeficientes del plan:', planSeleccionado);
					// Aquí va la lógica real de copia de coeficientes
				}
			},
			error: () => console.error('Error al abrir el modal')
		});
    }

	ngOnDestroy() {
		this.#destroy$.next();
		this.#destroy$.complete();
	}
}
