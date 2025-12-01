import type { OnDestroy, OnInit } from '@angular/core';
import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import {
	ModalService,
	TableDirective,
	TabTemplateDirective,
	UiButtonComponent,
	UiTabsComponent,
	UiAccordionComponent,
	UiTableComponent,
	NotificationService,
	type TransferList
} from '@agroseguro/lib-ui-agroseguro';
import { Subject, takeUntil } from 'rxjs';
import type {
	FactorTarifa,
	GrupoValores,
	iFactorDeducible,
	iGrupoSeguro,
	iLinea,
	PlanLineaRiesgo
} from '../../../../../core/interfaces/general.interface';
import { GestionFactoresService } from '../../../../../core/services/gestion-factores.service';
import { ModalAnadirEliminarFactoresComponent } from '../modal-anadir-factores/modal-anadir-factores.component';
import { ModalAnadirGrupoValoresComponent } from '../modal-anadir-grupo-valores/modal-anadir-grupo-valores.component';
import { ModalDeleteValorComponent } from '../modal-delete-valor/modal-delete-valor.component';
import { ModalConsultaGrupoValoresComponent } from '../modal-consulta-grupo-valores/modal-consulta-grupo-valores.component';
import * as XLSX from 'xlsx';
import saveAs from 'file-saver';
import { GruposFactoresService } from '../../../../../core/services/grupos-factores.service';
import { ModalImportFileComponent } from '../../../../components/shared/modal-import-file/modal-import-file.component';
import { AMBITO } from '../../../../../core/constants/factores';

@Component({
	selector: 'app-modal-edit-factores',
	standalone: true,
	imports: [
		ReactiveFormsModule,
		UiButtonComponent,
		TabTemplateDirective,
		UiTabsComponent,
		UiAccordionComponent,
		TableDirective,
		UiTableComponent
	],
	templateUrl: './modal-edit-factores.component.html',
	styleUrl: './modal-edit-factores.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalEditFactoresComponent implements OnInit, OnDestroy {
	readonly #gestionFactoresService = inject(GestionFactoresService);
	readonly #modalService = inject(ModalService);
	readonly #notificationsService = inject(NotificationService);
	readonly #gruposFactoresService = inject(GruposFactoresService);
	readonly FACTOR_AMBITO = AMBITO;

	//Subject para manejar la destrucción de suscripciones
	#destroy$ = new Subject<void>();

	public riesgo = input.required<PlanLineaRiesgo>();
	public grupoSeguro = input.required<iGrupoSeguro>();
	public linea = input.required<iLinea>();
	public plan = input.required<string>();
	public idVersion = input.required<string>();

	public modalOutput = output<boolean>();

	listFactoresSimples = signal<FactorTarifa[]>([]);
	listFactoresPrecio = signal<FactorTarifa[]>([]);

	public tabData = ['FACTORES PARA TARIFICADO', 'FACTORES PARA PRECIO'];

	miVariableBooleana: any;

	public onLoadError = signal<boolean>(false);

	countValoresPrecio = 0;
	countValoresSimple = 0;
	public idsValoresUnicos: string[] = [];

	public valoresSimplesSetted = signal<boolean>(false);
	public valoresPrecioSetted = signal<boolean>(false);
	public factoresSimplesSetted = signal<boolean>(false);
	public factoresPrecioSetted = signal<boolean>(false);

	ngOnInit() {
		this.getIdsCultivoSimple();
		this.getFactoresSimples(this.idVersion());
		this.getFactoresPrecio(this.idVersion());
	}

	ngOnDestroy() {
		this.#destroy$.next(); // Notifica a los observables que deben cerrarse
		this.#destroy$.complete(); // Cierra el subject
	}

	getFactoresSimples(idVersion: string) {
		this.#gestionFactoresService
			.getFactoresTarifaByVersion(idVersion, this.#gestionFactoresService.FACTOR_TIPO_SIMPLE)
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: (factores) => {
					this.factoresSimplesSetted.set(false);
					this.listFactoresSimples.set(JSON.parse(JSON.stringify(factores)));
					if (factores && factores.length > 0) {
						this.valoresSimplesSetted.set(true);
					}
					this.factoresSimplesSetted.set(true);

					this.listFactoresSimples().forEach((factor) => {
						this.getGruposValoresSimpleFromService(factor, true);
					});
					this.onLoadError.set(false);
				},
				error: (error) => {
					this.onLoadError.set(true);
					console.error('Error al cargar los factores simples:', error);
				}
			});
	}

	getFactoresPrecio(idVersion: string) {
		this.#gestionFactoresService
			.getFactoresTarifaByVersion(idVersion, this.#gestionFactoresService.FACTOR_TIPO_PRECIO)
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: (factores) => {
					this.factoresPrecioSetted.set(false);
					this.listFactoresPrecio.set(JSON.parse(JSON.stringify(factores)));
					this.factoresPrecioSetted.set(true);

					this.listFactoresPrecio().forEach((factor) => {
						this.getGruposValoresPrecioFromService(factor, true);
					});
					this.onLoadError.set(false);
				},
				error: (error) => {
					this.onLoadError.set(true);
					console.error('Error al cargar los factores por precio:', error);
				}
			});
	}

	getGruposValoresPrecioFromService(factorTarifa: FactorTarifa, initialLoad: boolean) {
		this.#gestionFactoresService
			.getGrupoValoresFactorTarifa(
				factorTarifa.idFactorTarifa,
				this.#gestionFactoresService.FACTOR_TIPO_PRECIO,
				this.idsValoresUnicos
			)
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: (gruposValores) => {
					this.setGruposValoresPrecioEnFactorTarifa(factorTarifa, gruposValores, initialLoad);
				},
				error: (error) => {
					this.onLoadError.set(true);
					console.error('Error al cargar los grupos de valores:', error);
				}
			});
	}

	getGruposValoresSimpleFromService(factorTarifa: FactorTarifa, initialLoad: boolean) {
		this.#gestionFactoresService
			.getGrupoValoresFactorTarifa(
				factorTarifa.idFactorTarifa,
				this.#gestionFactoresService.FACTOR_TIPO_SIMPLE,
				this.idsValoresUnicos
			)
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: (gruposValores) => {
					this.setGruposValoresSimplesEnFactorTarifa(factorTarifa, gruposValores, initialLoad);
				},
				error: (error) => {
					this.onLoadError.set(true);
					console.error('Error al cargar los grupos de valores simples:', error);
				}
			});
	}

	getNombreFactor(factor: FactorTarifa): string {
		return factor.idFactor
			? `${factor.idFactor}-${factor.descripcionFactor}`
			: `${factor.descripcionDeducible}`;
	}

	//Recuperamos ids cultivo para tipos simples
	getIdsCultivoSimple() {
		this.#gestionFactoresService
			.getIdsCultivo(this.idVersion(), this.#gestionFactoresService.FACTOR_TIPO_SIMPLE)
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

	setGruposValoresPrecioEnFactorTarifa(
		factorTarifa: FactorTarifa,
		gruposValores: GrupoValores[],
		initialLoad: boolean
	) {
		const factor = this.listFactoresPrecio().find(
			(f) => f.idFactorTarifa === factorTarifa.idFactorTarifa
		);
		if (factor) {
			factor.grupoValores = gruposValores;
			this.countValoresPrecio++;
			if (!initialLoad) {
				this.valoresPrecioSetted.set(true);
			}
			if (this.countValoresPrecio === this.listFactoresPrecio().length) {
				this.valoresPrecioSetted.set(true);
			}
		}
	}

	setGruposValoresSimplesEnFactorTarifa(
		factorTarifa: FactorTarifa,
		gruposValores: GrupoValores[],
		initialLoad: boolean
	) {
		const factor = this.listFactoresSimples().find(
			(f) => f.idFactorTarifa === factorTarifa.idFactorTarifa
		);
		if (factor) {
			factor.grupoValores = gruposValores;
			this.countValoresSimple++;
			if (!initialLoad) {
				this.valoresSimplesSetted.set(true);
			}
			if (this.countValoresSimple === this.listFactoresSimples().length) {
				this.valoresSimplesSetted.set(true);
			}
		}
	}

	getGruposValoresSimples(gruposValores: GrupoValores[]): any[] {
		return gruposValores.filter((valor) => valor.simple === true);
	}

	getGruposValoresPrecio(gruposValores: GrupoValores[]): any[] {
		return gruposValores.filter((valor) => valor.precio === true);
	}

	anadirEliminarFactoresModal(simple: boolean, precio: boolean) {
		this.#modalService
			.open(ModalAnadirEliminarFactoresComponent, {
				idLinea: signal(this.linea().id),
				idVersionRiesgo: signal(this.idVersion()),
				simple: signal(simple),
				precio: signal(precio),
				size: 'l'
			})
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: (lista: TransferList[]) => {
					this.#notificationsService.showNotification({
						message: signal('Factores actualizados correctamente'),
						hasError: signal(false)
					});
					//this.getFactores(this.idVersion());
					this.getFactoresPrecio(this.idVersion());
					this.getFactoresSimples(this.idVersion());
				},
				error: () => {
					this.#notificationsService.showNotification({
						message: signal('Error al actualizar los factores'),
						hasError: signal(true)
					});
				}
			});
	}

	openImportModal(factorTarifa: FactorTarifa) {
		this.#modalService
			.open(ModalImportFileComponent, {
				title: signal('Importar deducible'),
				subtitle: signal(
					` Se importarán los datos para el deducible ${factorTarifa.descripcionDeducible} `
				),
				extensionesValidas: signal(['.csv']),
				size: 'l'
			})
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: (ficheroImportado: File) => {
					this.importarDeducible(factorTarifa, ficheroImportado);
				},
				error: () => {
					this.#notificationsService.showNotification({
						message: signal('Error al cargar el fichero de importación'),
						hasError: signal(true)
					});
				}
			});
	}

	importarDeducible(factorTarifa: FactorTarifa, ficheroImportado: File) {
		this.#notificationsService.showNotification({
			message: signal('Cargando los valores del deducible...'),
			hasError: signal(false)
		});

		this.#gestionFactoresService
			.importDeducible(factorTarifa.idFactorTarifa!, ficheroImportado!)
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

	getDataAndDownloadTemplate(factorTarifa: FactorTarifa) {
		this.getFactoresDeducibles(factorTarifa.idDeducible!);
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

	anadirEditarGruposValoresFactoresModal(
		factorTarifa: FactorTarifa,
		simple: boolean,
		precio: boolean,
		editGrupo: boolean,
		grupoValoresEdit?: GrupoValores
	) {
		this.#modalService
			.open(ModalAnadirGrupoValoresComponent, {
				factorTarifa: signal(factorTarifa),
				precio: signal(precio),
				simple: signal(simple),
				idVersion: signal(this.idVersion()),
				editGrupo: signal(editGrupo),
				grupoValoresEdit: signal(grupoValoresEdit),
				size: 'l'
			})
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: () => {
					this.#notificationsService.showNotification({
						message: signal('Valores actualizados correctamente'),
						hasError: signal(false)
					});
					this.getIdsCultivoSimple();
					if (simple) {
						this.valoresSimplesSetted.set(false);
						this.getGruposValoresSimpleFromService(factorTarifa, false);
					}
					if (precio) {
						this.valoresPrecioSetted.set(false);
						this.getGruposValoresPrecioFromService(factorTarifa, false);
					}
				},
				error: () => {
					this.#notificationsService.showNotification({
						message: signal('Error al actualizar los valores'),
						hasError: signal(true)
					});
				}
			});
	}

	consultarGruposValoresModal(factorTarifa: FactorTarifa, simple: boolean, precio: boolean) {
		this.getIdsCultivoSimple();
		this.#modalService
			.open(ModalConsultaGrupoValoresComponent, {
				factorTarifa: signal(factorTarifa),
				riesgo: signal(this.riesgo()),
				tipoFactor: signal(
					simple
						? this.#gestionFactoresService.FACTOR_TIPO_SIMPLE
						: this.#gestionFactoresService.FACTOR_TIPO_PRECIO
				),
				idsValoresUnicos: signal(this.idsValoresUnicos),
				size: 'l'
			})
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: () => {},
				error: () => {}
			});
	}

	deleteValorFactor(factor: FactorTarifa, valor: GrupoValores, simple: boolean, precio: boolean) {
		this.#modalService
			.open(ModalDeleteValorComponent, {
				valor: signal(valor),
				size: 'l'
			})
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: (response) => {
					if (response) {
						this.#notificationsService.showNotification({
							message: signal('Valor eliminado correctamente'),
							hasError: signal(false)
						});
						if (simple) {
							this.valoresSimplesSetted.set(false);
							this.getGruposValoresSimpleFromService(factor, false);
						}
						if (precio) {
							this.valoresPrecioSetted.set(false);
							this.getGruposValoresPrecioFromService(factor, false);
						}
					}
				}
			});
	}

	save() {
		this.#modalService.close();
	}

	cancel() {
		this.#modalService.close('Mensaje de cierre');
	}

	see(_t31: any) {
		throw new Error('Method not implemented.');
	}

	deleteFactor(_t34: any) {
		throw new Error('Method not implemented.');
	}
}
