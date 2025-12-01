import { ChangeDetectionStrategy, Component, OnInit, OnDestroy, inject, signal, computed, output } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import {
	UiButtonComponent,
	UiAccordionComponent,
	UiTableComponent,
	TableDirective,
	NotificationService,
	ModalService
} from '@agroseguro/lib-ui-agroseguro';
import { Subject, takeUntil } from 'rxjs';
import { GestionFactoresService } from '../../../../core/services/gestion-factores.service';
import { GrupoSeguroService } from '../../../../core/services/grupo-seguro.service';
import { PlanService } from '../../../../core/services/plan.service';
import { GrupoValores, iFactorCoeficienteUI, iFactorDeducible } from '../../../../core/interfaces/general.interface';
import { ModalAnadirFactoresCoeficientesComponent } from './modal-anadir-factores-coeficientes/modal-anadir-factores-coeficientes.component';
import { ModalAnadirGruposValoresCoeficientesComponent } from './modal-anadir-grupos-valores-coeficientes/modal-anadir-grupos-valores-coeficientes.component';
import { ModalDeleteValorCoeficientesComponent } from './modal-delete-valor-coeficientes/modal-delete-valor-coeficientes.component';
import { ModalConsultaGrupoValoresCoeficientesComponent } from './modal-consulta-grupo-valores-coeficientes/modal-consulta-grupo-valores-coeficientes.component';
import { ModalImportFileComponent } from '../../../components/shared/modal-import-file/modal-import-file.component';
import * as XLSX from 'xlsx';
import saveAs from 'file-saver';
import { GruposFactoresService } from '../../../../core/services/grupos-factores.service';
import { AMBITO } from '../../../../core/constants/factores';

@Component({
	selector: 'app-creacion-de-coeficientes',
	standalone: true,
	imports: [
		ReactiveFormsModule,
		UiButtonComponent,
		UiAccordionComponent,
		TableDirective,
		UiTableComponent
	],
	templateUrl: './creacion-de-coeficientes.component.html',
	styleUrl: './creacion-de-coeficientes.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreacionDeCoeficientesComponent implements OnInit, OnDestroy {
	readonly #gestionFactoresService = inject(GestionFactoresService);
	readonly #gruposFactoresService = inject(GruposFactoresService);
	readonly #grupoSeguroService = inject(GrupoSeguroService);
	readonly #planService = inject(PlanService);
	readonly #modalService = inject(ModalService);
	readonly #notificationsService = inject(NotificationService);
	readonly #destroy$ = new Subject<void>();
	readonly FACTOR_AMBITO = AMBITO as unknown as number;

	public grupoSeguro = computed(() => this.#grupoSeguroService.grupoSeguro());
	public plan = computed(() => this.#grupoSeguroService.plan());
	public linea = computed(() => this.#grupoSeguroService.linea());

	public listFactores = signal<iFactorCoeficienteUI[]>([]);
	public valoresSetted = signal<boolean>(false);
	public idPlanLinea = signal<string>('');

	public onBack = output<void>();
	public onNext = output<void>();
	public isStepValid = output<boolean>();

	public idsValoresCultivo: (string | number)[] = [];

	public onLoadError = signal<boolean>(false);

	ngOnInit(): void {
		this.loadPlanLineaAndFactores();
	}

	private cargarIdsCultivo() {
		this.#gestionFactoresService
			.getIdsCultivoPorPlanLinea(this.idPlanLinea())
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: (ids) => {
					this.idsValoresCultivo = ids;
				},
				error: (error) => {
					console.error('Error obteniendo idsCultivo:', error);
					this.#notificationsService.showNotification({
						message: signal('Error al cargar valores de cultivo'),
						hasError: signal(true)
					});
				}
			});
	}

	private loadPlanLineaAndFactores(): void {
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
					this.cargarIdsCultivo();
					this.getFactores(planLinea.idPlanLinea);
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

	private getFactores(idPlanLinea: string) {
		this.#gestionFactoresService
			.getFactoresCoeficiente(idPlanLinea)
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: (factores) => {
					const nuevosFactores = factores.map((f) => ({
						...f,
						grupoValores: []
					}));

					this.listFactores.set([]);
					queueMicrotask(() => {
						this.listFactores.set(nuevosFactores);
						this.valoresSetted.set(true);

						this.listFactores().forEach((factor) => {
							this.getGruposValoresFromService(factor);
						});
						this.isStepValid.emit(true);
					});
				},
				error: () => {
					this.#notificationsService.showNotification({
						message: signal('Error al cargar factores de coeficiente'),
						hasError: signal(true)
					});
					this.isStepValid.emit(false);
				}
			});
	}

	private getGruposValoresFromService(factor: iFactorCoeficienteUI) {
		this.#gestionFactoresService
			.getGruposValoresFactorCoeficiente(factor.idFactorCoeficiente, this.idsValoresCultivo)
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: (gruposValores) => {
					this.listFactores.update((factores) =>
						factores.map((f) =>
							f.idFactorCoeficiente === factor.idFactorCoeficiente
								? { ...f, grupoValores: gruposValores }
								: f
						)
					);
				},
				error: (error) => {
					console.error('Error al cargar grupos de valores:', error);
					this.#notificationsService.showNotification({
						message: signal('Error al cargar grupos de valores'),
						hasError: signal(true)
					});
				}
			});
	}

	anadirEditarGruposValoresFactoresModal(
		factor: iFactorCoeficienteUI,
		grupoValoresEdit?: GrupoValores
	) {
		this.#modalService
			.open(ModalAnadirGruposValoresCoeficientesComponent, {
				factorCoeficiente: signal(factor),
				idsValoresCultivo: signal(this.idsValoresCultivo),
				editGrupo: signal(!!grupoValoresEdit),
				grupoValoresEdit: signal(grupoValoresEdit),
				size: 'l'
			})
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: () => {
					this.#notificationsService.showNotification({
						message: signal('Grupo de valores actualizado correctamente'),
						hasError: signal(false)
					});
					this.loadPlanLineaAndFactores();
				},
				error: () => {
					this.#notificationsService.showNotification({
						message: signal('Error al actualizar grupo de valores'),
						hasError: signal(true)
					});
				}
			});
	}

	consultarGruposValoresModal(factor: iFactorCoeficienteUI) {
		this.#modalService
			.open(ModalConsultaGrupoValoresCoeficientesComponent, {
				factorCoeficiente: signal(factor),
				idsValoresCultivo: signal(this.idsValoresCultivo),
				size: 'l'
			})
			.pipe(takeUntil(this.#destroy$))
			.subscribe();
	}

	abrirModalSeleccionarFactores() {
		this.#modalService
			.open(ModalAnadirFactoresCoeficientesComponent, {
				idLinea: signal(this.linea().id),
				idPlanLinea: signal(this.idPlanLinea()),
				size: 'l'
			})
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: () => {
					this.loadPlanLineaAndFactores();
					this.#notificationsService.showNotification({
						message: signal('Factores de coeficiente actualizados correctamente'),
						hasError: signal(false)
					});
				},
				error: () => {
					this.#notificationsService.showNotification({
						message: signal('Error al seleccionar factores'),
						hasError: signal(true)
					});
				}
			});
	}

	editarGrupoValoresModal(factor: iFactorCoeficienteUI, grupo: GrupoValores) {
		this.#modalService
			.open(ModalAnadirGruposValoresCoeficientesComponent, {
				factorCoeficiente: signal(factor),
				idsValoresCultivo: signal(this.idsValoresCultivo),
				editMode: signal(true),
				grupoValoresEdit: signal(grupo),
				size: 'l'
			})
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: () => {
					this.#notificationsService.showNotification({
						message: signal('Grupo de valores actualizado correctamente'),
						hasError: signal(false)
					});
					this.loadPlanLineaAndFactores();
				},
				error: () => {
					this.#notificationsService.showNotification({
						message: signal('Error al actualizar grupo de valores'),
						hasError: signal(true)
					});
				}
			});
	}

	deleteValorFactor(factor: iFactorCoeficienteUI, valor: GrupoValores) {
		this.#modalService
			.open(ModalDeleteValorCoeficientesComponent, {
				valor: signal(valor),
				size: 'l'
			})
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: (response) => {
					if (response) {
						this.#gestionFactoresService
							.deleteGrupoValoresCoeficiente(valor.idGrupo)
							.pipe(takeUntil(this.#destroy$))
							.subscribe({
								next: () => {
									this.#notificationsService.showNotification({
										message: signal('Grupo de valores eliminado correctamente'),
										hasError: signal(false)
									});
									this.loadPlanLineaAndFactores();
								},
								error: () => {
									this.#notificationsService.showNotification({
										message: signal('Error al eliminar grupo de valores'),
										hasError: signal(true)
									});
								}
							});
					}
				}
			});
	}

	getFactorTitle(factor: iFactorCoeficienteUI): string {
		const hasDescripcionFactor = factor.descripcionFactor && factor.descripcionFactor.trim() !== '';

		if (hasDescripcionFactor) {
			return `${factor.idFactor} - ${factor.descripcionFactor}`;
		}

		return `${factor.descripcionDeducible || ''}`;
	}

	openImportModal(factor: iFactorCoeficienteUI) {
		this.#modalService
			.open(ModalImportFileComponent, {
				title: signal('Importar deducible'),
				subtitle: signal(
					` Se importarán los datos para el deducible ${factor.descripcionDeducible} `
				),
				extensionesValidas: signal(['.csv']),
				size: 'l'
			})
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: (ficheroImportado: File) => {
					this.importarDeducible(factor, ficheroImportado);
				},
				error: () => {
					this.#notificationsService.showNotification({
						message: signal('Error al cargar el fichero de importación'),
						hasError: signal(true)
					});
				}
			});
	}

	importarDeducible(factor: iFactorCoeficienteUI, ficheroImportado: File) {
		this.#notificationsService.showNotification({
			message: signal('Cargando los valores del deducible...'),
			hasError: signal(false)
		});

		this.#gestionFactoresService
			.importDeducibleCoeficiente(factor.idFactorCoeficiente!, ficheroImportado!)
			.subscribe({
				next: () => {
					this.#notificationsService.showNotification({
						message: signal('Valores del deducible guardados correctamente'),
						hasError: signal(false)
					});
				},
				error: (error) => {
					this.#notificationsService.showNotification({
						message: signal('Error al guardar los valores del deducible: ' + (error.error || '')),
						hasError: signal(true)
					});
				}
			});
	}

	getDataAndDownloadTemplate(factor: iFactorCoeficienteUI) {
		this.getFactoresDeducibles(factor.idDeducible!);
	}

	getFactoresDeducibles(idGrupoFactores: string) {
		this.#gruposFactoresService
			.getFactorDeducible(idGrupoFactores)
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: (factor) => {
					this.downloadTemplate(factor);
					this.onLoadError.set(false);
				},
				error: (error) => {
					this.onLoadError.set(true);
					console.error('Error al cargar el factor deducible:', error);
				}
			});
	}

	downloadTemplate(factorDeducible: iFactorDeducible) {
		let datos: any[] = [];
		let data: { [key: string]: string } = {};
		factorDeducible.factores.map((factor) => {
			data[factor.idFactor] = factor.nombreFactor;
		});

		data[factorDeducible.nombre] = 'VALOR';

		datos.push(data);

		const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(datos);
		const workbook: XLSX.WorkBook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
		const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

		const blob = new Blob([excelBuffer], {
			type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
		});
		saveAs(blob, `${factorDeducible.nombre}.xlsx`);
	}


	ngOnDestroy(): void {
		this.#destroy$.next();
		this.#destroy$.complete();
	}
}
