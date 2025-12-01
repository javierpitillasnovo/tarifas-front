import type { OnInit, OnDestroy } from '@angular/core';
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	inject,
	output,
	signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import type { SelectOption } from '@agroseguro/lib-ui-agroseguro';
import {
	NotificationService,
	UiButtonComponent,
	UiTableComponent,
	TableDirective,
	UiSelectComponent,
	UiInputComponent,
	getInputValue,
	ModalService
} from '@agroseguro/lib-ui-agroseguro';

import { GrupoSeguroService } from '../../../../core/services/grupo-seguro.service';
import { VersionesService } from '../../../../core/services/versiones.service';
import { PlanService } from '../../../../core/services/plan.service';
import { GestionFactoresService } from '../../../../core/services/gestion-factores.service';

import { Subject, takeUntil } from 'rxjs';
import type {
	GrupoValoresCoeficientes,
	iCombinacionFactorCoeficientes,
	iFactorCoeficiente
} from '../../../../core/interfaces/general.interface';
import { ModalEditValuesComponent } from '../../../components/shared/modal-edit-values/modal-edit-values.component';
import { ModalDeleteCombinacionCoeficienteComponent } from './modal-delete-combinacion-coeficiente/modal-delete-combinacion-coeficiente.component';
import { ModalConsultaCombinacionValoresCoeficienteComponent } from './modal-consulta-combinacion-valores-coeficiente/modal-consulta-combinacion-valores-coeficiente.component';
import { aplicarOperacion } from '../../../../core/utils/utils';
import { ModalImportFileComponent } from '../../../components/shared/modal-import-file/modal-import-file.component';

@Component({
	selector: 'app-tabla-factores-coeficientes',
	standalone: true,
	imports: [
		CommonModule,
		UiButtonComponent,
		UiTableComponent,
		TableDirective,
		UiSelectComponent,
		UiInputComponent
	],
	templateUrl: './tabla-factores-coeficientes.component.html',
	styleUrl: './tabla-factores-coeficientes.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class TablaFactoresCoeficientesComponent implements OnInit, OnDestroy {
	public onBack = output<void>();

	// Servicios
	readonly #grupoSeguroService = inject(GrupoSeguroService);
	readonly #versionesService = inject(VersionesService);
	readonly #planService = inject(PlanService);
	readonly #gestionFactoresService = inject(GestionFactoresService);
	readonly #notificationsService = inject(NotificationService);
	readonly #destroy$ = new Subject<void>();
	readonly #modalService = inject(ModalService);

	// Breadcrumb
	public grupoSeguro = computed(() => this.#grupoSeguroService.grupoSeguro());
	public plan = computed(() => this.#grupoSeguroService.plan());
	public linea = computed(() => this.#grupoSeguroService.linea());

	public idPlanLinea = signal<string>('');

	public listFactoresCoeficiente = signal<
		(iFactorCoeficiente & {
			gruposValores?: GrupoValoresCoeficientes[];
			grupoValoresSelected?: GrupoValoresCoeficientes;
			_ordenOriginal?: number;
		})[]
	>([]);

	public listCombinaciones = signal<iCombinacionFactorCoeficientes[]>([]);

	public hasSelected = computed(() => this.listCombinaciones().some((c) => c.selected === true));
	public nombreCoeficiente = computed(() => this.#grupoSeguroService.nombreCoeficienteSeleccionado());


	public factoresLoaded = signal<boolean>(false);
	public combinacionesLoaded = signal<boolean>(false);
	public showAddButton = signal<boolean>(true);

	public idsValoresCultivo = signal<(string | number)[]>([]);

	ngOnInit(): void {
		this.loadPlanLineaAndData();
	}

	private loadPlanLineaAndData(): void {
		const idCoef = this.#grupoSeguroService.idCoeficienteSeleccionado();

		if (!idCoef) {
			this.#notificationsService.showNotification({
				message: signal('No se ha seleccionado coeficiente'),
				hasError: signal(true)
			});
			return;
		}

		const idPlan = this.plan();
		const idLinea = this.linea().id;

		if (!idPlan || !idLinea) {
			this.#notificationsService.showNotification({
				message: signal('Debe seleccionar plan y línea válidos'),
				hasError: signal(true)
			});
			return;
		}

		this.#planService
			.getPlanLinea(idPlan, idLinea)
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: (planLinea) => {
					this.idPlanLinea.set(planLinea.idPlanLinea);
					this.#gestionFactoresService
						.getIdsCultivoPorPlanLinea(planLinea.idPlanLinea)
						.pipe(takeUntil(this.#destroy$))
						.subscribe({
							next: (ids) => {
								this.idsValoresCultivo.set(ids);
								this.loadFactoresConGrupos(planLinea.idPlanLinea);
								this.loadCombinacionesFactoresCoeficientes(idCoef);
							},
							error: () => {
								this.idsValoresCultivo.set([]);
								this.loadFactoresConGrupos(planLinea.idPlanLinea);
								this.loadCombinacionesFactoresCoeficientes(idCoef);
							}
						});
				},
				error: (error) => {
					console.error('Error al obtener plan-línea', error);
					this.#notificationsService.showNotification({
						message: signal('Error al recuperar el plan-línea'),
						hasError: signal(true)
					});
				}
			});
	}

	private loadFactoresConGrupos(idPlanLinea: string): void {
		const idsCultivo = this.idsValoresCultivo();

		this.#gestionFactoresService
			.getFactoresCoeficiente(idPlanLinea, true)
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: (factores) => {
					if (!factores?.length) {
						this.listFactoresCoeficiente.set([]);
						this.factoresLoaded.set(true);
						return;
					}

					const factoresConOrden = factores.map((f, index) => ({
						...f,
						_ordenOriginal: index
					}));

					const acumulador: (iFactorCoeficiente & {
						gruposValores: GrupoValoresCoeficientes[];
						grupoValoresSelected?: GrupoValoresCoeficientes;
						_ordenOriginal: number;
					})[] = [];

					let pendientes = factoresConOrden.length;

					factoresConOrden.forEach((factor) => {
						this.#gestionFactoresService
							.getGruposValoresFactorCoeficiente(factor.idFactorCoeficiente, idsCultivo)
							.pipe(takeUntil(this.#destroy$))
							.subscribe({
								next: (grupos) => {
									acumulador.push({
										...factor,
										gruposValores: grupos,
										_ordenOriginal: factor._ordenOriginal!
									});

									pendientes--;
									if (pendientes === 0) {
										acumulador.sort((a, b) => a._ordenOriginal! - b._ordenOriginal!);
										this.listFactoresCoeficiente.set(acumulador);
										this.factoresLoaded.set(true);
									}
								},
								error: () => {
									pendientes--;
									if (pendientes === 0) {
										acumulador.sort((a, b) => a._ordenOriginal! - b._ordenOriginal!);
										this.listFactoresCoeficiente.set(acumulador);
										this.factoresLoaded.set(true);
									}
								}
							});
					});
				},
				error: (err) => {
					console.error('Error al cargar factores de coeficiente', err);
					this.#notificationsService.showNotification({
						message: signal('Error al cargar factores de coeficiente'),
						hasError: signal(true)
					});
					this.listFactoresCoeficiente.set([]);
					this.factoresLoaded.set(true);
				}
			});
	}

	private loadCombinacionesFactoresCoeficientes(idCoeficiente: string): void {
		this.#versionesService
			.getCombinacionesFactoresCoeficiente(idCoeficiente)
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: (combinaciones: iCombinacionFactorCoeficientes[]) => {
					const mapeadas = (combinaciones ?? []).map((c) => ({
						...c,
						id: c.idCombinacion,
						selected: false
					}));

					this.listCombinaciones.set(mapeadas);
					this.combinacionesLoaded.set(true);
				},
				error: (err) => {
					console.error('Error al cargar combinaciones de factores de coeficiente', err);
					this.#notificationsService.showNotification({
						message: signal('Error al cargar combinaciones de factores de coeficiente'),
						hasError: signal(true)
					});
					this.listCombinaciones.set([]);
					this.combinacionesLoaded.set(true);
				}
			});
	}

	getValoresOptions(
		factor: iFactorCoeficiente & { gruposValores?: GrupoValoresCoeficientes[] }
	): SelectOption[] {
		if (!factor.gruposValores) return [];

		return factor.gruposValores.map((grupo) => ({
			text: grupo.nombre,
			value: grupo.idGrupo
		}));
	}

	getValorValue(combinacion: iCombinacionFactorCoeficientes, factor: iFactorCoeficiente): string {
		const asignacion = combinacion.asignaciones?.find(
			(a) => a.idFactorCoeficiente === factor.idFactorCoeficiente
		);
		return asignacion?.idGrupoValores || '';
	}

	getNombreValue(combinacion: iCombinacionFactorCoeficientes, factor: iFactorCoeficiente): string {
		const asignacion = combinacion.asignaciones?.find(
			(a) => a.idFactorCoeficiente === factor.idFactorCoeficiente
		);
		return asignacion?.nombreGrupoValores || '';
	}

	/** Valor para el input cuando NO hay grupos de valores */
	getValorLibre(combinacion: iCombinacionFactorCoeficientes, factor: iFactorCoeficiente): string {
		const asignacion = combinacion.asignaciones?.find(
			(a) => a.idFactorCoeficiente === factor.idFactorCoeficiente
		);
		return (asignacion?.idGrupoValores as string) ?? '';
	}

	setValorEnFactor(
		$event: Event,
		combinacion: iCombinacionFactorCoeficientes,
		factor: iFactorCoeficiente
	) {
		const idGrupoValor = getInputValue($event);
		if (!idGrupoValor) return;

		const factores = this.listFactoresCoeficiente();
		const factorSeleccionado = factores.find(
			(f) => f.idFactorCoeficiente === factor.idFactorCoeficiente
		);
		if (factorSeleccionado && factorSeleccionado.gruposValores) {
			const grupo = factorSeleccionado.gruposValores.find((g) => g.idGrupo === idGrupoValor);
			if (grupo) {
				factorSeleccionado.grupoValoresSelected = grupo;
				this.listFactoresCoeficiente.update((items) => [...items]);
			}
		}

		// const combinaciones = this.listCombinaciones();
		// const combinacionEditable = combinaciones.find((c) => c.id === combinacion.id);

		const asignacion = combinacion.asignaciones.find(
			(a) => a.idFactorCoeficiente === factor.idFactorCoeficiente
		);

		if (asignacion) {
			asignacion.idGrupoValores = idGrupoValor;
			asignacion.nombreGrupoValores =
				factorSeleccionado?.grupoValoresSelected?.nombre || asignacion.nombreGrupoValores;
		} else {
			combinacion.asignaciones.push({
				idFactorCoeficiente: factor.idFactorCoeficiente,
				nombreFactor: factor.descripcionFactor || factor.descripcionDeducible,
				idGrupoValores: idGrupoValor,
				nombreGrupoValores: factorSeleccionado?.grupoValoresSelected
					? factorSeleccionado.grupoValoresSelected.nombre
					: ''
			});
		}
	}

	itemSelected(event: { id: number; selected: boolean }) {
		const { id, selected } = event;
		const lista = this.listCombinaciones().map((c) =>
			c.id === id ? { ...c, selected } : { ...c }
		);
		this.listCombinaciones.set(lista);
	}

	itemAdd() {
		const factores = this.listFactoresCoeficiente();

		const nueva: iCombinacionFactorCoeficientes = {
			idCombinacion: '0', // Valor temporal para marcar nueva fila
			coeficiente: 0,
			asignaciones: factores.map((f) => ({
				idFactorCoeficiente: f.idFactorCoeficiente,
				nombreFactor: f.descripcionFactor || f.descripcionDeducible,
				idGrupoValores: '',
				nombreGrupoValores: ''
			})),
			id: 0,
			selected: false,
			edited: true
		};

		this.showAddButton.set(false);

		this.listCombinaciones.update((lista) => [...lista, nueva]);
	}

	saveCombinacion(item: iCombinacionFactorCoeficientes) {
		const idCoef = this.#grupoSeguroService.idCoeficienteSeleccionado();

		if (!idCoef) {
			this.#notificationsService.showNotification({
				message: signal('No se ha seleccionado coeficiente'),
				hasError: signal(true)
			});
			return;
		}

		const asignacionesFiltradas = (item.asignaciones || [])
			.filter((a) => a.idGrupoValores && a.idGrupoValores.trim() !== '')
			.map((a) => ({
				idFactorCoeficiente: a.idFactorCoeficiente,
				idGrupoValores: a.idGrupoValores!
			}));

		const body = {
			idCoeficiente: idCoef,
			coeficiente: Number(item.coeficiente) || 0,
			asignaciones: asignacionesFiltradas
		};

		this.#versionesService
			.createCombinacionFactorCoeficiente(body)
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: () => {
					this.#notificationsService.showNotification({
						message: signal('Combinación guardada correctamente'),
						hasError: signal(false)
					});

					this.loadCombinacionesFactoresCoeficientes(idCoef);
					this.showAddButton.set(true);
				},
				error: () => {
					this.#notificationsService.showNotification({
						message: signal('Error al guardar combinación'),
						hasError: signal(true)
					});
				}
			});
	}

	updateCombinacion(item: iCombinacionFactorCoeficientes) {
		const idCoef = this.#grupoSeguroService.idCoeficienteSeleccionado();

		if (!idCoef) {
			this.#notificationsService.showNotification({
				message: signal('No se ha seleccionado coeficiente'),
				hasError: signal(true)
			});
			return;
		}
		const asignacionesFiltradas = (item.asignaciones || [])
			.filter((a) => a.idGrupoValores && a.idGrupoValores.trim() !== '')
			.map((a) => ({
				idFactorCoeficiente: a.idFactorCoeficiente,
				idGrupoValores: a.idGrupoValores!
			}));

		const body = {
			coeficiente: Number(item.coeficiente) || 0,
			asignaciones: asignacionesFiltradas
		};

		this.#versionesService
			.updateCombinacionFactorCoeficiente(item.idCombinacion, body)
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: () => {
					this.#notificationsService.showNotification({
						message: signal('Combinación modificada correctamente'),
						hasError: signal(false)
					});

					const lista = this.listCombinaciones().map((c) =>
						c.idCombinacion === item.idCombinacion ? { ...c, selected: false } : c
					);

					this.listCombinaciones.set(lista);
					this.loadCombinacionesFactoresCoeficientes(idCoef);
					this.showAddButton.set(true);
				},
				error: () => {
					this.#notificationsService.showNotification({
						message: signal('Error al modificar combinación'),
						hasError: signal(true)
					});
				}
			});
	}

	getSelectOptionsConVacio(factor: any) {
		const opciones = this.getValoresOptions(factor);
		return [{ text: '', value: '' }, ...opciones];
	}

	editCombinacion(item: iCombinacionFactorCoeficientes) {
		const lista = this.listCombinaciones().map((c) =>
			c.id === item.id ? { ...c, edited: true } : { ...c, edited: false }
		);
		this.listCombinaciones.set(lista);
	}

	undoChanges(item: iCombinacionFactorCoeficientes) {
		const lista = this.listCombinaciones().map((c) =>
			c.id === item.id ? { ...c, edited: false } : { ...c }
		);
		this.listCombinaciones.set(lista);
	}

	deleteCombinacion(item: iCombinacionFactorCoeficientes) {
		if (item.id === 0) {
			this.listCombinaciones.update((l) => l.filter((c) => c.id !== 0));
			this.showAddButton.set(true);
			return;
		}

		const modalRef = this.#modalService.open(ModalDeleteCombinacionCoeficienteComponent, {
			combinacion: signal({ id: item.idCombinacion }),
			size: 's'
		});

		modalRef.subscribe((confirmado) => {
			if (!confirmado) return;

			this.#versionesService
				.deleteCombinacionFactorCoeficiente(item.idCombinacion)
				.pipe(takeUntil(this.#destroy$))
				.subscribe({
					next: () => {
						this.listCombinaciones.update((l) =>
							l.filter((c) => c.idCombinacion !== item.idCombinacion)
						);

						this.#notificationsService.showNotification({
							message: signal('Combinación eliminada correctamente'),
							hasError: signal(false)
						});
					},
					error: () => {
						this.#notificationsService.showNotification({
							message: signal('Error eliminando la combinación'),
							hasError: signal(true)
						});
					}
				});
		});
	}

	importar() {
		console.log('Importar coeficientes');
	}

	consultarGrupos() {
		const seleccionados = this.listCombinaciones().filter((c) => c.selected);

		if (seleccionados.length !== 1) {
			this.#notificationsService.showNotification({
				message: signal('Debe seleccionar exactamente 1 línea para consultar.'),
				hasError: signal(true)
			});
			return;
		}

		const combinacion = seleccionados[0];

		this.#modalService.open(ModalConsultaCombinacionValoresCoeficienteComponent, {
			combinacion: signal(combinacion),
			factores: signal(this.listFactoresCoeficiente()),
			idsCultivo: signal(this.idsValoresCultivo()),
			size: 'm'
		});
	}

	modificarCoeficiente() {
		const seleccionados = this.listCombinaciones()
			.filter((c) => c.selected)
			.map((c) => ({ id: c.idCombinacion, value: c.coeficiente }));

		if (seleccionados.length === 0) {
			this.#notificationsService.showNotification({
				message: signal('Debe seleccionar al menos 1 línea para modificar.'),
				hasError: signal(true)
			});
			return;
		}

		this.#modalService
			.open(ModalEditValuesComponent, {
				combinaciones: signal(seleccionados),
				service: signal(this.#versionesService),
				title: signal('Modificación de Coeficientes'),
				size: 'm'
			})
			.subscribe({
				next: (result) => {
					if (!result) return;

					const listaActualizada = this.listCombinaciones().map((c) => {
						if (c.selected) {
							c.coeficiente = aplicarOperacion(c.coeficiente, result.operacion, result.valor);
						}
						return {
							...c,
							selected: false
						};
					});

					this.listCombinaciones.set(listaActualizada);
				}
			});
	}

	openImportModal() {
		this.#modalService
			.open(ModalImportFileComponent, {
				title: signal('Importar combinaciones de coeficientes'),
				//subtitle: signal(`Se importarán los datos para el coeficiente ${this.#grupoSeguroService.idCoeficienteSeleccionado()}`),
				subtitle: signal(`Se importarán los datos para el coeficiente`),
				extensionesValidas: signal(['.csv']),
				size: 'l'
			})
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: (ficheroImportado: File) => {
					this.importarCombinacion(
						this.#grupoSeguroService.idCoeficienteSeleccionado()!,
						ficheroImportado
					);
				},
				error: () => {
					this.#notificationsService.showNotification({
						message: signal('Error al cargar el fichero de importación'),
						hasError: signal(true)
					});
				}
			});
	}

	importarCombinacion(idCoeficiente: string, ficheroImportado: File) {
		this.#notificationsService.showNotification({
			message: signal('Cargando los valores de la combinación...'),
			hasError: signal(false)
		});

		this.#versionesService.importCombinacion(idCoeficiente!, ficheroImportado!).subscribe({
			next: () => {
				this.#notificationsService.showNotification({
					message: signal('Valores de la combinación guardados correctamente'),
					hasError: signal(false)
				});
			},
			error: (error) => {
				this.#notificationsService.showNotification({
					message: signal('Error al guardar los valores de la combinación: ' + (error.error || '')),
					hasError: signal(true)
				});
			}
		});
	}

	exportar() {
		console.log('Exportar coeficientes');
	}

	goPrev() {
		this.onBack.emit();
	}

	ngOnDestroy(): void {
		this.#destroy$.next();
		this.#destroy$.complete();
	}
}
