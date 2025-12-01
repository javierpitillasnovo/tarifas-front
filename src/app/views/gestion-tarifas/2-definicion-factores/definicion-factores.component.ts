import { OnDestroy, OnInit } from '@angular/core';
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	inject,
	output,
	signal,
	ViewEncapsulation
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
	UiSelectComponent,
	UiTableComponent,
	TableDirective,
	ModalService,
	NotificationService,
	UiSwitchButtonComponent,
	UiTagComponent,
	getInputValue
} from '@agroseguro/lib-ui-agroseguro';

import { Subject, takeUntil } from 'rxjs';
import { GrupoSeguroService } from '../../../../core/services/grupo-seguro.service';
import { PlanLineaService } from '../../../../core/services/plan-linea.service';
import { PlanService } from '../../../../core/services/plan.service';
import {
	PlanLinea,
	PlanLineaRiesgo,
	PlanLineaRiesgoVersion
} from '../../../../core/interfaces/general.interface';
import { PlanLineaRiesgoService } from '../../../../core/services/plan-linea-riesgo.service';
import { VersionesService } from '../../../../core/services/versiones.service';
import { ModalAnadirConfigComponent } from './modal-anadir-config/modal-anadir-config.component';
import { ModalDeleteRiesgoComponent } from './modal-delete-riesgo/modal-delete-riesgo.component';
import { ModalEditFactoresComponent } from './modal-edit-factores/modal-edit-factores.component';

@Component({
	selector: 'app-definicion-factores',
	standalone: true,
	imports: [
		FormsModule,
		TableDirective,
		UiTableComponent,
		UiTagComponent,
		UiSwitchButtonComponent,
		UiSelectComponent
	],
	templateUrl: './definicion-factores.component.html',
	styleUrl: './definicion-factores.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None,
	host: {
		class: 'definicion-factores'
	}
})
export class DefinicionFactoresComponent implements OnInit, OnDestroy {
	//Servicios
	readonly #modalService = inject(ModalService);
	readonly #grupoSeguroService = inject(GrupoSeguroService);
	readonly #notificationsService = inject(NotificationService);
	readonly #planLineaService = inject(PlanLineaService);
	readonly #planService = inject(PlanService);
	readonly #planLineaRiesgoService = inject(PlanLineaRiesgoService);
	readonly #versionesService = inject(VersionesService);

	//Subject para manejar la destrucción de suscripciones
	#destroy$ = new Subject<void>();

	public linea = computed(() => this.#grupoSeguroService.linea());
	public plan = computed(() => this.#grupoSeguroService.plan());
	public grupoSeguro = computed(() => this.#grupoSeguroService.grupoSeguro());

	planLinea = signal<PlanLinea>({
		idPlanLinea: '',
		idLinea: '',
		descripcionLinea: '',
		plan: 0
	});
	//idRiesgo + descripcionRiesgo
	listRiesgos = signal<PlanLineaRiesgo[]>([]);
	public riesgosLoaded = signal<boolean>(false);

	public onLoadError = signal<boolean>(false);
	public placeholder = computed(() => {
		return this.onLoadError()
			? 'Se ha producido un error recuperando los riesgos'
			: 'Cargando riesgos...';
	});

	public simuladaSelectReloading = signal<boolean>(false);

	//Boolean emitido para saber que podemos pasar al siguiente paso
	public isComplete = output<boolean>();
	//Boolean emitido para pasar automaticamente al siguiente paso
	public nextStep = output<PlanLineaRiesgo>();

	ngOnInit() {
		this.getAllRiesgos();
		this.isComplete.emit(false);
	}

	getAllRiesgos() {
		this.getPlanLinea(this.plan(), this.linea().id);
	}

	getPlanLinea(idPlan: string, idLinea: string) {
		this.#planService
			.getPlanLinea(idPlan, idLinea)
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: (planLinea) => {
					this.planLinea.set(planLinea);
					this.#planService.idPlanLinea.set(planLinea.idPlanLinea);
					this.getRiesgos(planLinea.idPlanLinea);
				},
				error: (error) => {
					this.onLoadError.set(true);
					console.error('Error al cargar el plan de línea:', error);
				}
			});
	}

	getRiesgos(idPlanLinea: string) {
		let count = 0;
		this.#planLineaService
			.getRiesgos(idPlanLinea)
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: (riesgos: PlanLineaRiesgo[]) => {
					riesgos.map((riesgo: PlanLineaRiesgo) => {
						this.#planLineaRiesgoService.idPlanLineaRiesgo.set(riesgo.idPlanLineaRiesgo);
						this.#planLineaRiesgoService
							.getRiesgos(riesgo.idPlanLineaRiesgo)
							.pipe(takeUntil(this.#destroy$))
							.subscribe({
								next: (versiones) => {
									riesgo.versionesSimulacion = versiones;
									count++;
									if (count === riesgos.length) {
										this.riesgosLoaded.set(true);
									}
								},
								error: (error) => {
									this.onLoadError.set(true);
									console.error('Error al cargar las versiones:', error);
								}
							});

						return riesgo;
					});
					this.listRiesgos.set(riesgos);
				},
				error: () => {
					this.onLoadError.set(true);
				}
			});
	}

	getVersionDefinitiva(item: PlanLineaRiesgo): PlanLineaRiesgoVersion {
		const version: PlanLineaRiesgoVersion =
			item.versionesSimulacion!.find((version) => !version.simulada) ||
			item.versionesSimulacion![0];
		return version;
	}

	getIdVersionSimulacionSeleccionada(item: PlanLineaRiesgo): string {
		const version: PlanLineaRiesgoVersion =
			item.versionesSimulacion!.find((version) => version.seleccionada) ||
			item.versionesSimulacion![0];
		return version.idVersionRiesgo;
	}

	getVersionesSimuladasSelect(item: PlanLineaRiesgo): { text: string; value: string }[] {
		return item
			.versionesSimulacion!.filter((version) => version.simulada)
			.map((v) => ({
				text: v.version,
				value: v.idVersionRiesgo
			}));
	}

	//Nos desuscribimos de todas las suscripciones al destruir el componente
	ngOnDestroy() {
		this.#destroy$.next(); // Notifica a los observables que deben cerrarse
		this.#destroy$.complete(); // Cierra el subject
	}

	//Función a la que llama el icono de añadir
	addVersion(item: PlanLineaRiesgo) {
		this.#modalService
			.open(ModalAnadirConfigComponent, {
				idPlanLineaRiesgo: signal(item.idPlanLineaRiesgo),
				size: 'l'
			})
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: (response) => {
					if (response) {
						this.#notificationsService.showNotification({
							message: signal('Versión añadida correctamente'),
							hasError: signal(false)
						});
						this.simuladaSelectReloading.set(true);
						this.#versionesService
							.updateSelectVersion(response.idVersionRiesgo)
							.pipe(takeUntil(this.#destroy$))
							.subscribe(() => {
								this.getAndSetRiesgosToPlanLineaRiesgo(item);
							});
					}
				}
			});
	}

	//Función a la que llama el icono de editar
	editFactores(item: PlanLineaRiesgo) {
		let idVersionRiesgo: string = '';
		if (item.simulado && item.versionesSimulacion && item.versionesSimulacion.length >= 1) {
			idVersionRiesgo = this.getIdVersionSimulacionSeleccionada(item);
		} else {
			idVersionRiesgo = this.getVersionDefinitiva(item).idVersionRiesgo;
		}
		this.#modalService
			.open(ModalEditFactoresComponent, {
				riesgo: signal(item),
				grupoSeguro: signal(this.grupoSeguro()),
				linea: signal(this.linea()),
				plan: signal(this.plan()),
				idVersion: signal(idVersionRiesgo),
				size: 'xl'
			})
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: (response) => {
					console.log('Response from modal:', response);
				}
			});
	}

	//TODO: Implementar la función de copiar
	copyPlanLineaRiesgo(item: PlanLineaRiesgo) {}

	//Función a la que llama el icono de eliminar
	deletePlanLineaRiesgo(item: PlanLineaRiesgo) {
		this.#modalService
			.open(ModalDeleteRiesgoComponent, {
				riesgo: signal(item),
				size: 'l'
			})
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: (response) => {
					if (response) {
						this.#notificationsService.showNotification({
							message: signal('Riesgo eliminado correctamente'),
							hasError: signal(false)
						});
						this.listRiesgos.set(
							this.listRiesgos()!.filter(
								(riesgo) => riesgo.idPlanLineaRiesgo !== item.idPlanLineaRiesgo
							)
						);
					}
				}
			});
	}

	//Funcion a la que llama el select de los riesgos simuladas
	changeSimulacion(planLineaRiesgo: PlanLineaRiesgo, simulado: boolean) {
		this.#planLineaRiesgoService
			.setRiesgoSimulado(planLineaRiesgo.idPlanLineaRiesgo, simulado)
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: (res) => {
					planLineaRiesgo = res;
				},
				error: (error) => {
					this.onLoadError.set(true);
					console.error('Error al actualizar la simulacion:', error);
				}
			});
	}

	setVersionSimuladaSelect(event: Event, item: PlanLineaRiesgo) {
		this.#versionesService
			.updateSelectVersion(Number(getInputValue(event)))
			.pipe(takeUntil(this.#destroy$))
			.subscribe(() => {
				this.getAndSetRiesgosToPlanLineaRiesgo(item);
			});
	}

	getAndSetRiesgosToPlanLineaRiesgo(item: PlanLineaRiesgo) {
		this.#planLineaRiesgoService
			.getRiesgos(item.idPlanLineaRiesgo)
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: (versiones) => {
					item.versionesSimulacion = versiones;
					this.simuladaSelectReloading.set(false);
				},
				error: (error) => {
					this.onLoadError.set(true);
					console.error('Error al cargar las versiones:', error);
				}
			});
	}

	getEstado(item: PlanLineaRiesgo): number {
		const versionDefinitiva: PlanLineaRiesgoVersion =
			item.versionesSimulacion!.find((version) => !version.simulada) ||
			item.versionesSimulacion![0];
		//TODO cambiar la version simulada seleccionada
		const versionSimulacionSeleccionada: PlanLineaRiesgoVersion =
			item.versionesSimulacion!.find((version) => !version.simulada) ||
			item.versionesSimulacion![0];

		const estado = item.simulado
			? versionSimulacionSeleccionada?.estado
			: versionDefinitiva?.estado;

		switch (estado) {
			case 'Realizado':
				return 0;
			case 'En Curso':
				return 1;
			case 'Pendiente':
				return 2;
			default:
				return 0;
		}
	}

	getDescripcion(item: PlanLineaRiesgo): string {
		const versionDefinitiva: PlanLineaRiesgoVersion =
			item.versionesSimulacion!.find((version) => !version.simulada) ||
			item.versionesSimulacion![0];
		const versionSimulacionSeleccionada: PlanLineaRiesgoVersion =
			item.versionesSimulacion!.find((version) => !version.simulada) ||
			item.versionesSimulacion![0];

		const estado = item.simulado
			? versionSimulacionSeleccionada?.estado
			: versionDefinitiva?.estado;

		return estado;
	}

	goToStep3(item: PlanLineaRiesgo) {
		this.#planLineaRiesgoService.planLineaRiesgo.set(item);
		this.nextStep.emit(item);
	}
}
