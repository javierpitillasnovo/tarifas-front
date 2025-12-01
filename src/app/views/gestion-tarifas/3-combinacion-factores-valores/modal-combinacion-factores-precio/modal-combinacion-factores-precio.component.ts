import type { OnDestroy, OnInit } from '@angular/core';
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	inject,
	input,
	output,
	signal,
	ViewEncapsulation
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import type { SelectOption } from '@agroseguro/lib-ui-agroseguro';
import {
	getInputValue,
	ModalService,
	NotificationService,
	TableDirective,
	UiButtonComponent,
	UiInputComponent,
	UiSelectComponent,
	UiTableComponent
} from '@agroseguro/lib-ui-agroseguro';

import { Subject, takeUntil } from 'rxjs';
import type {
	GrupoValores,
	iAsignacionFactorValorTarifa,
	iComarca,
	iCombinacionFactorTarifaPrecio,
	iCombinacionFactorValorTarifa,
	iCombinacionFactorValorTarifaEditable,
	iFactorTarifaEditable,
	iProvincia,
	iSubtermino,
	iTermino,
	PlanLinea,
	PlanLineaRiesgo,
	PlanLineaRiesgoVersion
} from '../../../../../core/interfaces/general.interface';
import { CombinacionesFactoresTarifaService } from '../../../../../core/services/combinaciones-factores-tarifa.service';
import { GestionFactoresService } from '../../../../../core/services/gestion-factores.service';
import { GrupoSeguroService } from '../../../../../core/services/grupo-seguro.service';
import { UbicacionesService } from '../../../../../core/services/ubicaciones.service';
import { VersionesService } from '../../../../../core/services/versiones.service';
import { ModalDeleteCombinacionFactorPrecioComponent } from '../modal-delete-combinacion-factor-precio/modal-delete-combinacion-factor-precio.component';
import { aplicarOperacion } from '../../../../../core/utils/utils';
import { ModalEditValuesComponent } from '../../../../components/shared/modal-edit-values/modal-edit-values.component';
import { ModalImportFileComponent } from '../../../../components/shared/modal-import-file/modal-import-file.component';

@Component({
	selector: 'app-modal-combinacion-factores-precio',
	standalone: true,
	imports: [
		ReactiveFormsModule,
		TableDirective,
		UiTableComponent,
		UiSelectComponent,
		UiButtonComponent,
		UiInputComponent
	],
	templateUrl: './modal-combinacion-factores-precio.component.html',
	styleUrl: './modal-combinacion-factores-precio.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None,
	host: {
		class: 'combinacion-factores-precio'
	}
})
export class ModalCombinacionFactoresPrecioComponent implements OnInit, OnDestroy {
	public idCombinacionSimple = input.required<string>();
	public descripcionCombinacionSimple = input.required<string>();
	public version = input.required<PlanLineaRiesgoVersion>();
	public riesgo = input.required<PlanLineaRiesgo>();
	public idsValoresUnicos = input.required<string[]>();
	public modalOutput = output<boolean>();

	//Servicios
	readonly #modalService = inject(ModalService);
	readonly #grupoSeguroService = inject(GrupoSeguroService);
	readonly #notificationsService = inject(NotificationService);
	readonly #versionesService = inject(VersionesService);
	readonly #gestionFactoresService = inject(GestionFactoresService);
	readonly #combinacionesFactoresTarifaService = inject(CombinacionesFactoresTarifaService);
	readonly #ubicacionesService = inject(UbicacionesService);

	public provinciasData = signal<iProvincia[]>([]);
	public provinciasSelectOptions = signal<SelectOption[]>([]);
	public provinciaIsSetted = signal<boolean>(false);
	public provinciaSetted = signal<iProvincia>({
		codigo: '',
		nombre: ''
	});
	onLoadProvinciasError = signal<boolean>(false);

	public comarcasData = signal<iComarca[]>([]);
	public comarcasSelectOptions = signal<SelectOption[]>([]);
	public comarcaIsSetted = signal<boolean>(false);
	public comarcaSetted = signal<iComarca>({
		zona: 0,
		provincia: 0,
		comarca: 0,
		nombre: ''
	});
	onLoadComarcasError = signal<boolean>(false);

	public terminosData = signal<iTermino[]>([]);
	public terminosSelectOptions = signal<SelectOption[]>([]);
	public terminoIsSetted = signal<boolean>(false);
	public terminoSetted = signal<iTermino>({
		zona: 0,
		provincia: 0,
		comarca: 0,
		termino: 0,
		nombre: ''
	});
	onLoadTerminosError = signal<boolean>(false);

	public subterminosData = signal<iSubtermino[]>([]);
	public subterminosSelectOptions = signal<SelectOption[]>([]);
	public subterminoIsSetted = signal<boolean>(false);
	public subterminoSetted = signal<iSubtermino>({
		zona: 0,
		provincia: 0,
		comarca: 0,
		termino: 0,
		subtermino: '',
		nombre: ''
	});
	onLoadSubterminosError = signal<boolean>(false);

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

	listCombinaciones = signal<iCombinacionFactorValorTarifaEditable[]>([]);
	public combinacionesLoaded = signal<boolean>(false);
	public hasSelected = computed(() => this.listCombinaciones().some((c) => c.selected === true));

	listFactoresPrevios = signal<iFactorTarifaEditable[]>([]);
	public factoresPreviosLoaded = signal<boolean>(false);
	countValores = 0;
	public valoreSetted = signal<boolean>(false);

	listCabecerasAsignaciones = signal<iAsignacionFactorValorTarifa[]>([]);
	public cabecerasAsignacionesLoaded = signal<boolean>(false);

	public onLoadError = signal<boolean>(false);
	public placeholder = computed(() => {
		return this.onLoadError() ? 'Se ha producido un error recuperando las combinaciones' : '';
	});

	public simuladaSelectReloading = signal<boolean>(false);

	//Boolean emitido para saber que podemos pasar al siguiente paso
	public isComplete = output<boolean>();

	//Formulario
	public form = new FormGroup({
		riesgo: new FormControl('', [Validators.required])
	});

	public riesgoSelectOptions = signal<SelectOption[]>([]); //Grupo seguro select options

	public showAddButton = signal(true);

	ngOnInit() {
		this.getCombinacionesPrecio(this.idCombinacionSimple());
		if (this.isAmbitoSelected()) {
			this.getProvincias();
		}
		this.isComplete.emit(false);
	}

	getCombinacionesPrecio(idCombinacionSimple: string) {
		this.#versionesService
			.getCombinacionesPrecio(idCombinacionSimple)
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: (combinaciones: iCombinacionFactorValorTarifa[]) => {
					this.listCombinaciones.set(combinaciones);
					this.getFactoresPrevios(this.version().idVersionRiesgo);
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
			.getFactoresTarifaByVersion(idVersion, this.#gestionFactoresService.FACTOR_TIPO_PRECIO, true)
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
				this.#gestionFactoresService.FACTOR_TIPO_PRECIO,
				this.idsValoresUnicos()
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

	getValoresOptions(factor: iFactorTarifaEditable, includeEmpty: boolean = false): SelectOption[] {
		if (!factor.grupoValores) {
			return includeEmpty ? [{ text: '', value: '' }] : [];
		}
		const options = factor.grupoValores.map((grupo) => ({
			text: grupo.nombre,
			value: grupo.idGrupo
		}));
		return includeEmpty ? [{ text: '', value: '' }, ...options] : options;
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

	getVersionesSimuladasSelect(item: PlanLineaRiesgo): { text: string; value: string }[] {
		return item
			.versionesSimulacion!.filter((version) => version.simulada)
			.map((v) => ({
				text: v.version,
				value: v.idVersionRiesgo
			}));
	}

	itemSelected(event: { id: number; selected: boolean }) {
		this.combinacionesLoaded.set(false);
		const { id, selected } = event;
		const lista = this.listCombinaciones().map((c) =>
			c.id === id ? { ...c, selected } : { ...c }
		);
		this.listCombinaciones.set(lista);
		this.combinacionesLoaded.set(true);
	}

	itemAdd() {
		this.showAddButton.set(false);
		const newItem: iCombinacionFactorValorTarifaEditable = {
			id: 0,
			nombre: '',
			edited: true,
			selected: false,
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

	saveCombinacion(item: iCombinacionFactorValorTarifa) {
		this.combinacionesLoaded.set(false);

		const asignaciones =
			this.listFactoresPrevios().length > 0 && item.asignaciones
				? item.asignaciones
						.filter((a) => a.idGrupoValores && a.idGrupoValores.trim() !== '')
						.map((asignacion) => ({
							idFactorTarifa: asignacion.idFactorTarifa,
							idGrupoValores: asignacion.idGrupoValores
						}))
				: [];

		const itemToSave: iCombinacionFactorTarifaPrecio = {
			idCombinacionSimple: this.idCombinacionSimple(),
			nombre: item.nombre ? item.nombre : '',
			asignaciones: asignaciones,
			primaBase: item.primaBase ? item.primaBase : 0
		};

		if (item.id === 0) {
			this.#combinacionesFactoresTarifaService
				.newCombinacionFactorPrecio(itemToSave)
				.pipe(takeUntil(this.#destroy$))
				.subscribe({
					next: (combinacion: iCombinacionFactorValorTarifaEditable) => {
						this.listCombinaciones.set(
							this.listCombinaciones()!.filter((combinacion) => combinacion.id !== 0)
						);
						combinacion.selected = false;
						combinacion.edited = false;
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
			this.#combinacionesFactoresTarifaService
				.updateCombinacionFactorPrecio(item.id as string, itemToSave)
				.pipe(takeUntil(this.#destroy$))
				.subscribe({
					next: (combinacion: iCombinacionFactorValorTarifaEditable) => {
						const combinacionUpdated = this.listCombinaciones().find(
							(c) => c.id === combinacion.id
						);
						if (combinacionUpdated) {
							combinacionUpdated.nombre = combinacion.nombre;
							combinacionUpdated.asignaciones = combinacion.asignaciones;
							combinacionUpdated.primaBase = combinacion.primaBase;
							combinacionUpdated.selected = false;
							combinacionUpdated.edited = false;
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

	editCombinacion(item: iCombinacionFactorValorTarifaEditable) {
		const lista = this.listCombinaciones().map((c) =>
			c.id === item.id ? { ...c, edited: true } : { ...c, edited: false }
		);
		this.listCombinaciones.set(lista);
	}

	undoChanges(item: iCombinacionFactorValorTarifaEditable) {
		const lista = this.listCombinaciones().map((c) =>
			c.id === item.id ? { ...c, edited: false } : { ...c }
		);
		this.listCombinaciones.set(lista);
	}

	deleteCombinacion(combinacion: iCombinacionFactorValorTarifaEditable) {
		if (combinacion.id === 0) {
			this.listCombinaciones.set(
				this.listCombinaciones()!.filter((combinacion) => combinacion.id !== 0)
			);
			this.showAddButton.set(true);
		} else {
			this.#modalService
				.open(ModalDeleteCombinacionFactorPrecioComponent, {
					combinacionFactor: signal(combinacion),
					size: 'l'
				})
				.pipe(takeUntil(this.#destroy$))
				.subscribe({
					next: (response) => {
						if (response) {
							this.#notificationsService.showNotification({
								message: signal('Combinación eliminada correctamente'),
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
			const combinacionEditable = this.listCombinaciones().find((c) => c.id === combinacion.id);
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

	modificarPrimaBase() {
		const seleccionados = this.listCombinaciones()
			.filter((c) => c.selected)
			.map((c) => ({ id: c.id, value: c.primaBase }));

		if (seleccionados.length === 0) {
			this.#notificationsService.showNotification({
				message: signal('Debe seleccionar al menos 1 tarifa para modificar.'),
				hasError: signal(true)
			});
			return;
		}

		this.#modalService
			.open(ModalEditValuesComponent, {
				combinaciones: signal(seleccionados),
				service: signal(this.#combinacionesFactoresTarifaService),
				title: signal('Modificación de primas Bases'),
				size: 'm'
			})
			.subscribe({
				next: (result) => {
					if (!result) return;

					const listaActualizada = this.listCombinaciones().map((c) => {
						if (c.selected) {
							c.primaBase = aplicarOperacion(c.primaBase as number, result.operacion, result.valor);
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

	getProvincias() {
		this.#ubicacionesService
			.getProvincias()
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: (provincias) => {
					this.provinciasData.set(provincias);
					const options = provincias.map((provincia) => ({
						text: provincia.nombre,
						value: provincia.codigo
					}));
					this.provinciasSelectOptions.set(options);
				},
				error: (error) => {
					console.error('Error al cargar las provincias:', error);
				}
			});
	}

	getComarcas(provinciaId: string) {
		this.#ubicacionesService
			.getComarcas(provinciaId)
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: (comarcas) => {
					this.comarcasData.set(comarcas);
					const options = comarcas.map((comarca) => ({
						text: comarca.nombre,
						value: comarca.comarca
					}));
					this.comarcasSelectOptions.set(options);
				},
				error: (error) => {
					console.error('Error al cargar las comarcas:', error);
				}
			});
	}

	getTerminos(provinciaId: string, comarcaId: number) {
		this.#ubicacionesService
			.getTerminos(provinciaId, comarcaId)
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: (terminos) => {
					this.terminosData.set(terminos);
					const options = terminos.map((termino) => ({
						text: termino.nombre,
						value: termino.termino
					}));
					this.terminosSelectOptions.set(options);
				},
				error: (error) => {
					console.error('Error al cargar los terminos:', error);
				}
			});
	}

	getSubterminos(provinciaId: string, comarcaId: number, terminoId: number) {
		this.#ubicacionesService
			.getSubterminos(provinciaId, comarcaId, terminoId)
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: (subterminos) => {
					this.subterminosData.set(subterminos);
					const options = subterminos.map((subtermino) => ({
						text: subtermino.nombre,
						value: subtermino.termino
					}));
					this.subterminosSelectOptions.set(options);
				},
				error: (error) => {
					console.error('Error al cargar los subterminos:', error);
				}
			});
	}

	setProvincia(event: Event) {
		const value = getInputValue(event);
		if (value) {
			this.provinciasData().forEach((provinciaData) => {
				if (provinciaData.codigo.toString() === value) {
					this.provinciaSetted.set(provinciaData);
					this.provinciaIsSetted.set(true);
				}
			});
			this.cleanComarcaSetted();
			this.getComarcas(this.provinciaSetted().codigo);
		}
	}

	setComarca(event: Event) {
		const value = getInputValue(event);
		if (value) {
			this.comarcasData().forEach((comarcaData) => {
				if (comarcaData.comarca.toString() === value) {
					this.comarcaSetted.set(comarcaData);
					this.comarcaIsSetted.set(true);
				}
			});
			this.cleanTerminoSetted();
			this.getTerminos(this.provinciaSetted().codigo, this.comarcaSetted().comarca);
		}
	}

	setTermino(event: Event) {
		const value = getInputValue(event);
		if (value) {
			this.terminosData().forEach((terminoData) => {
				if (terminoData.termino.toString() === value) {
					this.terminoSetted.set(terminoData);
					this.terminoIsSetted.set(true);
				}
			});
			this.cleanSubterminoSetted();
			this.getSubterminos(
				this.provinciaSetted().codigo,
				this.comarcaSetted().comarca,
				this.terminoSetted().termino
			);
		}
	}

	setSubtermino(event: Event) {
		const value = getInputValue(event);
		if (value) {
			this.subterminosData().forEach((subterminoData) => {
				if (subterminoData.subtermino.toString() === value) {
					this.subterminoSetted.set(subterminoData);
					this.subterminoIsSetted.set(true);
				}
			});
		}
	}

	cleanComarcaSetted() {
		this.comarcaSetted.set({
			zona: 0,
			provincia: 0,
			comarca: 0,
			nombre: ''
		});
		this.comarcaIsSetted.set(false);
	}

	cleanTerminoSetted() {
		this.terminoSetted.set({
			zona: 0,
			provincia: 0,
			comarca: 0,
			termino: 0,
			nombre: ''
		});
		this.terminoIsSetted.set(false);
	}

	cleanSubterminoSetted() {
		this.subterminoSetted.set({
			zona: 0,
			provincia: 0,
			comarca: 0,
			termino: 0,
			subtermino: '',
			nombre: ''
		});
		this.subterminoIsSetted.set(false);
	}

	isAmbitoSelected(): boolean {
		return true;
	}

	openImportModal() {
		this.#modalService
			.open(ModalImportFileComponent, {
				title: signal('Importar tarifa'),
				subtitle: signal(
					`Se importarán los datos para la tarifa base ${this.descripcionCombinacionSimple()}`
				),
				extensionesValidas: signal(['.csv']),
				size: 'l'
			})
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: (ficheroImportado: File) => {
					this.importarCombinacion(this.idCombinacionSimple(), ficheroImportado);
				},
				error: () => {
					this.#notificationsService.showNotification({
						message: signal('Error al cargar el fichero de importación'),
						hasError: signal(true)
					});
				}
			});
	}

	importarCombinacion(idCombinacionSimple: string, ficheroImportado: File) {
		this.#notificationsService.showNotification({
			message: signal('Cargando los valores de la tarifa...'),
			hasError: signal(false)
		});

		this.#combinacionesFactoresTarifaService
			.importCombinacion(idCombinacionSimple!, ficheroImportado!)
			.subscribe({
				next: () => {
					this.#notificationsService.showNotification({
						message: signal('Valores de la tarifa guardados correctamente'),
						hasError: signal(false)
					});
				},
				error: (error) => {
					this.#notificationsService.showNotification({
						message: signal('Error al guardar los valores de la tarifa: ' + (error.error || '')),
						hasError: signal(true)
					});
				}
			});
	}

	//Nos desuscribimos de todas las suscripciones al destruir el componente
	ngOnDestroy() {
		this.#destroy$.next(); // Notifica a los observables que deben cerrarse
		this.#destroy$.complete(); // Cierra el subject
	}
}
