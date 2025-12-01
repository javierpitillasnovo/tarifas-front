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
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
	UiSelectComponent,
	UiTableComponent,
	TableDirective,
	ModalService,
	NotificationService,
	getInputValue,
	UiButtonComponent,
	SelectOption,
	UiInputComponent
} from '@agroseguro/lib-ui-agroseguro';

import { Subject, takeUntil } from 'rxjs';
import { GrupoSeguroService } from '../../../../core/services/grupo-seguro.service';
import { PlanLineaService } from '../../../../core/services/plan-linea.service';
import { PlanService } from '../../../../core/services/plan.service';
import {
	GrupoValores,
	iAsignacionFactorValorTarifa,
	iCombinacionFactor,
	iCombinacionFactorCoeficiente,
	iCombinacionFactorValorTarifa,
	iCombinacionFactorValorTarifaEditable,
	iFactorTarifaEditable,
	PlanLinea,
	PlanLineaRiesgo,
	PlanLineaRiesgoVersion
} from '../../../../core/interfaces/general.interface';
import { PlanLineaRiesgoService } from '../../../../core/services/plan-linea-riesgo.service';
import { VersionesService } from '../../../../core/services/versiones.service';
import { GestionFactoresService } from '../../../../core/services/gestion-factores.service';
import { ModalDeleteRiesgoTarificadoComponent } from './modal-delete-riesgo-tarificado/modal-delete-riesgo-tarificado.component';
import { ModalCombinacionFactoresPrecioComponent } from './modal-combinacion-factores-precio/modal-combinacion-factores-precio.component';
import { ModalConsultaValoresTarifasComponent } from './modal-consulta-valores-tarifas/modal-consulta-valores-tarifas.component';

@Component({
	selector: 'app-combinacion-factores-valores',
	standalone: true,
	imports: [
		ReactiveFormsModule,
		TableDirective,
		UiTableComponent,
		UiSelectComponent,
		UiButtonComponent,
		UiInputComponent
	],
	templateUrl: './combinacion-factores-valores.component.html',
	styleUrl: './combinacion-factores-valores.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None,
	host: {
		class: 'combinacion-factores'
	}
})
export class CombinacionFactoresValoresComponent implements OnInit, OnDestroy {
	//Servicios
	readonly #modalService = inject(ModalService);
	readonly #grupoSeguroService = inject(GrupoSeguroService);
	readonly #notificationsService = inject(NotificationService);
	readonly #planLineaService = inject(PlanLineaService);
	readonly #planService = inject(PlanService);
	readonly #planLineaRiesgoService = inject(PlanLineaRiesgoService);
	readonly #versionesService = inject(VersionesService);
	readonly #gestionFactoresService = inject(GestionFactoresService);

	//Subject para manejar la destrucción de suscripciones
	#destroy$ = new Subject<void>();

	public linea = computed(() => this.#grupoSeguroService.linea());
	public plan = computed(() => this.#grupoSeguroService.plan());
	public grupoSeguro = computed(() => this.#grupoSeguroService.grupoSeguro());
	public planLineaRiesgo = computed(() => this.#planLineaRiesgoService.planLineaRiesgo());

	public idPlanLineaRiesgoSetted = signal<string>('');

	public idsValores: string[] = [];
	public idsValoresCopy: string[] = [];

	public idsPrimeraLlamada: string[] = [];
	public extraLlamadaRealizada = false;
	public idsValoresUnicos: string[] = [];

	planLinea = signal<PlanLinea>({
		idPlanLinea: '',
		idLinea: '',
		descripcionLinea: '',
		plan: 0
	});

	listCombinaciones = signal<iCombinacionFactorValorTarifaEditable[]>([]);
	public combinacionesLoaded = signal<boolean>(false);

	listFactoresPrevios = signal<iFactorTarifaEditable[]>([]);
	public factoresPreviosLoaded = signal<boolean>(false);
	countValores = 0;
	public valoreSetted = signal<boolean>(false);

	listCabecerasAsignaciones = signal<iAsignacionFactorValorTarifa[]>([]);
	public cabecerasAsignacionesLoaded = signal<boolean>(false);

	listRiesgos = signal<PlanLineaRiesgo[]>([]);
	riesgosSetted = signal<PlanLineaRiesgo>({
		idPlanLineaRiesgo: '',
		idPlanLinea: '',
		idRiesgo: '',
		descripcionRiesgo: '',
		simulado: false
	});
	public riesgosLoaded = signal<boolean>(false);

	version = signal<PlanLineaRiesgoVersion>({
		idVersionRiesgo: '',
		version: '',
		simulada: false,
		seleccionada: false,
		idPlanLineaRiesgo: '',
		estado: ''
	});

	public onLoadError = signal<boolean>(false);
	public placeholder = computed(() => {
		return this.onLoadError() ? 'Se ha producido un error recuperando los riesgos' : '';
	});

	public simuladaSelectReloading = signal<boolean>(false);

	//Boolean emitido para saber que podemos pasar al siguiente paso
	public isComplete = output<boolean>();

	public riesgoSelectOptions = signal<SelectOption[]>([]); //Grupo seguro select options

	public showAddButton = signal(true);

	public idVersionRiesgo: string = '';

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
					this.getRiesgos(planLinea.idPlanLinea);
				},
				error: (error) => {
					this.onLoadError.set(true);
					console.error('Error al cargar el plan de línea:', error);
				}
			});
	}

	getCombinaciones(idVersion: string) {
		this.#versionesService
			.getCombinacionesFactorValorTarifa(idVersion)
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: (combinaciones: iCombinacionFactorValorTarifa[]) => {
					this.listCombinaciones.set(combinaciones);
					this.#versionesService.setCombinaciones(this.listCombinaciones());
					this.getFactoresPrevios(idVersion);
					this.combinacionesLoaded.set(true);
				},
				error: (error) => {
					this.onLoadError.set(true);
					console.error('Error al cargar las combinaciones:', error);
				}
			});
	}

	getFactoresPrevios(idVersion: string) {
		this.#gestionFactoresService
			.getFactoresTarifaByVersion(idVersion, this.#gestionFactoresService.FACTOR_TIPO_SIMPLE)
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: (factores) => {
					this.listFactoresPrevios.set(factores);

					this.listFactoresPrevios().forEach((factor) => {
						this.getGruposValoresFromService(factor);
					});
				},
				error: () => {
					this.onLoadError.set(true);
				}
			});
	}

	getGruposValoresFromService(factorTarifa: iFactorTarifaEditable) {
		this.#gestionFactoresService
			.getGrupoValoresFactorTarifa(
				factorTarifa.idFactorTarifa,
				this.#gestionFactoresService.FACTOR_TIPO_SIMPLE,
				this.idsValoresUnicos
			)
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: (gruposValores) => {
					this.setGruposValoresEnFactorTarifa(factorTarifa, gruposValores);
				},
				error: (error) => {
					this.onLoadError.set(true);
					console.error('Error al cargar los grupos de valores:', error);
				}
			});
	}

	setGruposValoresEnFactorTarifa(
		factorTarifa: iFactorTarifaEditable,
		gruposValores: GrupoValores[]
	) {
		const factor = this.listFactoresPrevios().find(
			(f) => f.idFactorTarifa === factorTarifa.idFactorTarifa
		);
		if (factor) {
			factor.grupoValores = gruposValores;
			this.countValores++;
			if (this.countValores === this.listFactoresPrevios().length) {
				this.valoreSetted.set(true);
			}
		}
	}

	getValoresOptions(factor: iFactorTarifaEditable): SelectOption[] {
		if (!factor.grupoValores) {
			return [];
		}
		return factor.grupoValores.map((grupo) => ({
			text: grupo.nombre,
			value: grupo.idGrupo
		}));
	}

	getDescripcionPorTipoFactor(factor: iFactorTarifaEditable): string {
		return factor.idDeducible! ? factor.descripcionDeducible! : factor.descripcionFactor;
	}

	getRiesgos(idPlanLinea: string) {
		let count = 0;
		this.#planLineaService
			.getRiesgos(idPlanLinea)
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: (riesgos: PlanLineaRiesgo[]) => {
					riesgos.map((riesgo: PlanLineaRiesgo) => {
						this.#planLineaRiesgoService
							.getRiesgos(riesgo.idPlanLineaRiesgo)
							.pipe(takeUntil(this.#destroy$))
							.subscribe({
								next: (versiones) => {
									riesgo.versionesSimulacion = versiones;
									count++;
									if (count === riesgos.length) {
										this.riesgoSelectOptions.set(this.geRiesgosSelect(riesgos));
										this.setRiesgoIfNavigateFromOneRiesgo();
										this.riesgosLoaded.set(true);
									}
								},
								error: (error) => {
									this.onLoadError.set(true);
									console.error('Error al cargar los riesgos:', error);
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

	setRiesgoIfNavigateFromOneRiesgo() {
		if (this.planLineaRiesgo().idPlanLineaRiesgo != '') {
			this.setRiesgo(null);
		}
	}

	geRiesgosSelect(listaRiesgos: PlanLineaRiesgo[]): { text: string; value: string }[] {
		return listaRiesgos.map((r) => ({
			text: r.descripcionRiesgo,
			value: r.idRiesgo
		}));
	}

	setRiesgo(event: Event | null) {
		const value = event != null ? getInputValue(event) : null;
		let riesgo: PlanLineaRiesgo | undefined;
		if (value) {
			riesgo = this.listRiesgos().find((riesgo) => riesgo.idRiesgo === value);
			if (riesgo) {
				this.riesgosSetted.set(riesgo);
				this.#planLineaRiesgoService.planLineaRiesgo.set(riesgo);
				if (riesgo.simulado) {
					this.version.set(this.getVersionSimulacionSeleccionada(riesgo));
				} else {
					this.version.set(this.getVersionDefinitiva(riesgo));
					this.getIdsCultivoFromRisk(this.version().idVersionRiesgo);
				}
				this.cleanAll();
				this.getCombinaciones(this.version().idVersionRiesgo);
				this.isComplete.emit(true);
			}
		} else {
			riesgo = this.planLineaRiesgo();
			this.idPlanLineaRiesgoSetted.set(riesgo.idRiesgo);
			this.riesgosSetted.set(riesgo);
			if (riesgo.simulado) {
				this.version.set(this.getVersionSimulacionSeleccionada(riesgo));
			} else {
				this.version.set(this.getVersionDefinitiva(riesgo));
				this.getIdsCultivoFromRisk(this.version().idVersionRiesgo);
			}
			this.cleanAll();
			this.getCombinaciones(this.version().idVersionRiesgo);
			this.isComplete.emit(true);
		}
	}
	getIdsCultivoFromRisk(idVersion: string) {
		this.#gestionFactoresService
			.getIdsCultivo(idVersion, this.#gestionFactoresService.FACTOR_TIPO_SIMPLE)
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: (idsCultivo) => {
					this.idsValoresUnicos = idsCultivo;
				},
				error: (error) => {
					this.onLoadError.set(true);
					console.error('Error al cargar idsCultivo en tipo simple:', error);
				}
			});
	}

	cleanAll() {
		this.listCombinaciones.set([]);
		this.combinacionesLoaded.set(false);
		this.listFactoresPrevios.set([]);
		this.factoresPreviosLoaded.set(false);
		this.countValores = 0;
		this.valoreSetted.set(false);
		this.listCabecerasAsignaciones.set([]);
		this.cabecerasAsignacionesLoaded.set(false);
		this.showAddButton.set(true);
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

	getVersionSimulacionSeleccionada(item: PlanLineaRiesgo): PlanLineaRiesgoVersion {
		const version: PlanLineaRiesgoVersion =
			item.versionesSimulacion!.find((version) => version.seleccionada) ||
			item.versionesSimulacion![0];
		return version;
	}

	getVersionesSimuladasSelect(item: PlanLineaRiesgo): { text: string; value: string }[] {
		return item
			.versionesSimulacion!.filter((version) => version.simulada)
			.map((v) => ({
				text: v.version,
				value: v.idVersionRiesgo
			}));
	}

	itemSelected(event: any) {
		this.combinacionesLoaded.set(false);
		let item = this.listCombinaciones().find((item) => item.id === event.id);
		if (item) {
			item.selected = event.selected;
		}
		this.listCombinaciones.update((items) => [...items]);
		this.combinacionesLoaded.set(true);
	}

	itemAdd(event: any) {
		this.showAddButton.set(false);
		const newItem: iCombinacionFactorValorTarifaEditable = {
			id: 0,
			nombre: '',
			selected: true,
			ordenar: false,
			asignaciones: [
				{
					idFactorTarifa: '',
					nombreFactor: '',
					idGrupoValores: '',
					nombreGrupo: ''
				}
			],
			primaBase: 0
		};
		this.combinacionesLoaded.set(false);
		this.listCombinaciones.update((items) => [...items, newItem]);
		this.combinacionesLoaded.set(true);
	}

	showPrimas(item: iCombinacionFactorValorTarifa) {
		this.#modalService
			.open(ModalCombinacionFactoresPrecioComponent, {
				idCombinacionSimple: signal(item.id as string),
				descripcionCombinacionSimple: signal(item.nombre),
				version: signal(this.version()),
				riesgo: signal(this.riesgosSetted()),
				idsValoresUnicos: signal(this.idsValoresUnicos),
				size: 'xl'
			})
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: (response) => {
					// Manejar la respuesta del modal si es necesario
				}
			});
	}

	saveCombinacion(item: iCombinacionFactorValorTarifa) {
		if (!item.nombre || item.nombre.trim() === '') {
			this.#notificationsService.showNotification({
				message: signal('El nombre de la combinación no puede estar vacío.'),
				hasError: signal(true)
			});
			return;
		}
		if (
			this.listFactoresPrevios().length > 0 &&
			(!item.asignaciones ||
				item.asignaciones.length === 0 ||
				item.asignaciones.length !== this.listFactoresPrevios().length ||
				item.asignaciones.some((a) => !a.idGrupoValores || a.idGrupoValores.trim() === ''))
		) {
			this.#notificationsService.showNotification({
				message: signal('Todas las asignaciones deben tener un valor seleccionado.'),
				hasError: signal(true)
			});
			return;
		}
		this.combinacionesLoaded.set(false);

		let asignaciones =
			this.listFactoresPrevios().length > 0 && item.asignaciones
				? item.asignaciones.map((asignacion) => ({
						idFactorTarifa: asignacion.idFactorTarifa,
						idGrupoValores: asignacion.idGrupoValores
					}))
				: [];

		let itemToSave: iCombinacionFactor = {
			idVersionRiesgo: this.version().idVersionRiesgo,
			nombre: item.nombre ? item.nombre : '',
			asignaciones: asignaciones
		};

		if (item.id === 0) {
			this.#versionesService
				.newCombinacionFactorValorTarifa(itemToSave)
				.pipe(takeUntil(this.#destroy$))
				.subscribe({
					next: (combinacion: iCombinacionFactorValorTarifaEditable) => {
						this.listCombinaciones.set(
							this.listCombinaciones()!.filter((combinacion) => combinacion.id !== 0)
						);
						combinacion.selected = false;
						combinacion.ordenar = false;
						this.listCombinaciones().push(combinacion);
						this.listCombinaciones.update((items) => [...items]);
						this.combinacionesLoaded.set(true);
						this.showAddButton.set(true);
					},
					error: (error) => {
						this.onLoadError.set(true);
						console.error('Error al cargar las combinaciones:', error);
					}
				});
		} else {
			this.#versionesService
				.updateCombinacionFactorValorTarifa(item.id as string, itemToSave)
				.pipe(takeUntil(this.#destroy$))
				.subscribe({
					next: (combinacion: iCombinacionFactorValorTarifaEditable) => {
						let combinacionUpdated = this.listCombinaciones().find((c) => c.id === combinacion.id);
						if (combinacionUpdated) {
							combinacionUpdated.nombre = combinacion.nombre;
							combinacionUpdated.asignaciones = combinacion.asignaciones;
							combinacionUpdated.selected = false;
							combinacionUpdated.ordenar = false;
						}
						this.listCombinaciones.update((items) => [...items]);
						this.combinacionesLoaded.set(true);
						this.showAddButton.set(true);
					},
					error: (error) => {
						this.onLoadError.set(true);
						console.error('Error al actualizar la combinacion:', error);
					}
				});
		}
	}

	deleteCombinacion(combinacion: iCombinacionFactorValorTarifaEditable) {
		if (combinacion.id === 0) {
			this.listCombinaciones.set(
				this.listCombinaciones()!.filter((combinacion) => combinacion.id !== 0)
			);
			this.showAddButton.set(true);
		} else {
			this.#modalService
				.open(ModalDeleteRiesgoTarificadoComponent, {
					combinacionFactor: signal(combinacion),
					size: 'l'
				})
				.pipe(takeUntil(this.#destroy$))
				.subscribe({
					next: (response) => {
						if (response) {
							this.#notificationsService.showNotification({
								message: signal('Riesgo tarificado eliminado correctamente'),
								hasError: signal(false)
							});
							this.listCombinaciones.set(
								this.listCombinaciones()!.filter((comb) => comb.id !== combinacion.id)
							);
						}
					}
				});
		}
	}

	getValorValue(combinacion: iCombinacionFactorValorTarifaEditable, factor: iFactorTarifaEditable) {
		return (
			combinacion.asignaciones?.find((a) => a.idFactorTarifa === factor.idFactorTarifa)
				?.idGrupoValores || -1
		);
	}

	getNombreValue(
		combinacion: iCombinacionFactorValorTarifaEditable,
		factor: iFactorTarifaEditable
	) {
		return (
			combinacion.asignaciones?.find((a) => a.idFactorTarifa === factor.idFactorTarifa)
				?.nombreGrupo || ''
		);
	}

	setValorEnFactor(
		$event: Event,
		combinacion: iCombinacionFactorValorTarifaEditable,
		factor: iFactorTarifaEditable
	) {
		const idGrupoValor = getInputValue($event);
		if (idGrupoValor) {
			const factorSeleccionado = this.listFactoresPrevios().find(
				(f) => f.idFactorTarifa === factor.idFactorTarifa
			);
			if (factorSeleccionado) {
				const grupo = factorSeleccionado.grupoValores?.find((g) => g.idGrupo === idGrupoValor);
				if (grupo) {
					factor.grupoValoresSelected = grupo;
					this.listFactoresPrevios.update((items) => [...items]);
				}
			}
			let combinacionEditable = this.listCombinaciones().find((c) => c.id === combinacion.id);
			if (combinacionEditable) {
				const asignacion = combinacionEditable.asignaciones?.find(
					(a) => a.idFactorTarifa === factor.idFactorTarifa
				);
				if (asignacion) {
					asignacion.idGrupoValores = idGrupoValor;
				} else {
					combinacionEditable.asignaciones?.push({
						idFactorTarifa: factor.idFactorTarifa,
						nombreFactor: factor.descripcionFactor,
						idGrupoValores: idGrupoValor,
						nombreGrupo: factor.grupoValoresSelected ? factor.grupoValoresSelected.nombre : ''
					});
					combinacionEditable.asignaciones =
						combinacionEditable.asignaciones?.filter((a) => a.idFactorTarifa !== '') ?? null;
					combinacionEditable.nombre = combinacion.nombre ? combinacion.nombre : '';
				}
				this.listCombinaciones.update((items) => [...items]);
			}
		}
	}
	openConsultaGrupos() {
		this.#modalService
			.open(ModalConsultaValoresTarifasComponent, {
				riesgo: signal(this.riesgosSetted()),
				factores: signal(this.listFactoresPrevios()),
				idsValoresUnicos: signal(this.idsValoresUnicos),
				size: 'l'
			})
			.pipe(takeUntil(this.#destroy$))
			.subscribe();
	}
	public isConsultaDisabled = computed(() => {
		const riesgo = this.riesgosSetted();
		return !riesgo || !riesgo.idPlanLineaRiesgo;
	});

	//Nos desuscribimos de todas las suscripciones al destruir el componente
	ngOnDestroy() {
		this.#destroy$.next(); // Notifica a los observables que deben cerrarse
		this.#destroy$.complete(); // Cierra el subject
	}
}
