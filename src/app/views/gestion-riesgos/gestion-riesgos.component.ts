import {
	ChangeDetectionStrategy,
	Component,
	ViewContainerRef,
	ViewEncapsulation,
	inject,
	signal
} from '@angular/core';
import type { OnInit, OnDestroy } from '@angular/core';
import {
	UiDataGridComponent,
	UiSelectComponent,
	NotificationService,
	ModalService
} from '@agroseguro/lib-ui-agroseguro';
import type { fieldsToShow, SelectOption } from '@agroseguro/lib-ui-agroseguro';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { GestionRiesgosService } from '../../../core/services/gestion-riesgos.service';
import type { iPaginacion, iRiesgoEditable } from '../../../core/interfaces/general.interface';
import { GrupoSeguroService } from '../../../core/services/grupo-seguro.service';

@Component({
	selector: 'app-gestion-riesgos',
	standalone: true,
	imports: [ReactiveFormsModule, UiDataGridComponent, UiSelectComponent],
	templateUrl: './gestion-riesgos.component.html',
	styleUrl: './gestion-riesgos.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None
})
export class GestionRiesgosComponent implements OnInit, OnDestroy {
	readonly #vcr = inject(ViewContainerRef);
	readonly #modalService = inject(ModalService);
	readonly #notificationService = inject(NotificationService);
	readonly #gestionRiesgosSvc = inject(GestionRiesgosService);
	readonly #grupoSeguroService = inject(GrupoSeguroService);
	readonly #destroy$ = new Subject<void>();

	public paginacion = signal<iPaginacion>({
		pageNumber: 0,
		pageSize: 10,
		totalElements: 0,
		totalPages: 0,
		last: true
	});

	public currentPage = signal(0);

	public form = new FormGroup({
		grupoSeguro: new FormControl<string | null>(null, Validators.required)
	});

	public showAddButton = signal(true);
	// Lista de opciones para el selector de grupo seguro
	public grupoSeguroOptions = signal<SelectOption[]>([]);
	public riesgos = signal<iRiesgoEditable[]>([]);
	public riesgosFieldsToShow = signal<fieldsToShow[]>([
		{
			name: 'codigoRiesgo',
			options: [],
			selectedOption: 'codigoRiesgo',
			readonly: true
		},
		{
			name: 'descripcion'
		}
	]);

	public get nuevoRiesgo(): iRiesgoEditable {
		const grupoSeguro = this.form.get('grupoSeguro')?.value || '';
		const riesgo: iRiesgoEditable = {
			codigoRiesgo: '',
			codigoSeguro: grupoSeguro,
			descripcion: '',
			edit: true,
			selected: true,
			disabled: false
		};
		return riesgo;
	}

	constructor() {
		this.#modalService.setViewContainerRef(this.#vcr);
		this.#notificationService.setViewContainerRef(this.#vcr);
	}

	ngOnInit(): void {
		this.showAddButton.set(false);
		this.#gestionRiesgosSvc
			.getGruposSeguros()
			.pipe(takeUntil(this.#destroy$))
			.subscribe((grupos) => {
				console.log('[GET] Grupos seguros:', grupos);
				this.grupoSeguroOptions.set(grupos);
				if (grupos.length) this.form.get('grupoSeguro')?.enable();
			});

		this.form
			.get('grupoSeguro')
			?.valueChanges.pipe(takeUntil(this.#destroy$))
			.subscribe((grupoId) => {
				if (!grupoId) return;
				this.currentPage.set(0);
				this.resetPaginacion();
				this.#grupoSeguroService.getRiesgosPorGrupo(grupoId).subscribe((riesgos) => {
					this.riesgos.set(riesgos.content);
					this.setPaginacion(riesgos);

					this.riesgosFieldsToShow.update((fs) =>
						fs.map((f) =>
							f.name === 'codigoRiesgo'
								? { ...f, readonly: true } // SELECT bloqueado al editar
								: f
						)
					);
				});
			});
	}

	ngOnDestroy(): void {
		this.#destroy$.next();
		this.#destroy$.complete();
	}

	public hayFilaEditable(): boolean {
		return this.riesgos().some((r) => r.edit === true);
	}

	/** Restablece los campos a “solo lectura” para el código */
	private resetFieldsToShow(): void {
		this.riesgosFieldsToShow.set([
			{
				name: 'codigoRiesgo',
				options: [],
				selectedOption: 'codigoRiesgo',
				readonly: true
			},
			{
				name: 'descripcion'
			}
		]);
	}

	public onRowEditing(row: iRiesgoEditable) {
		// 1. Restablezco fieldsToShow a “solo input readonly”
		this.resetFieldsToShow();

		// 2. Fuerzo al datagrid a recrear su formArray: reseteando la misma lista de riesgos hace que UiDataGrid vuelva a leer fieldsToShow()
		this.riesgos.set([...this.riesgos()]);

		// 3. desactivo el botón “+” mientras edito
		this.showAddButton.set(false);
	}	  

	onAddRiesgo(): void {
		const grupoId = this.form.get('grupoSeguro')?.value;
		if (!grupoId) return;
	  
		if (this.hayFilaEditable()) {
		  this.#notificationService.showNotification({
			message: signal('Ya tienes un riesgo en edición'),
			hasError: signal(true),
			autoClear: true
		  });
		  return;
		}
	  
		this.#gestionRiesgosSvc.getCodigosLibres(grupoId).subscribe((codigosLibres) => {
		  if (!codigosLibres.length) {
			this.#notificationService.showNotification({
			  message: signal('No hay más códigos disponibles'),
			  hasError: signal(true),
			  autoClear: true
			});
			return;
		  }

	  	  // Mapeamos para el select del datagrid
		  const opciones = codigosLibres.map((codigo) => ({ 
			text: `${codigo}`,
			 value: codigo
			 }));

		  // Actualizamos las options del campo 'codigoRiesgo'	  
		  this.riesgosFieldsToShow.update((fs) =>
			fs.map((f) =>
			  f.name === 'codigoRiesgo' ? { ...f, readonly: false, options: opciones } : f
			)
		  );
	  
		  // El grid añadirá la fila usando `nuevoRiesgo` automáticamente
		  this.showAddButton.set(false);
		});
	  }
	  
	  onSaveRiesgo(riesgo: iRiesgoEditable): void {
		const grupoId = this.form.get('grupoSeguro')?.value;
		if (!grupoId || !riesgo.codigoRiesgo || !riesgo.descripcion.trim()) return;
	  
		const riesgoData = {
		  codigoRiesgo: riesgo.codigoRiesgo,
		  descripcion: riesgo.descripcion.trim(),
		  codigoSeguro: grupoId
		};
		const esNuevo = riesgo.edit && riesgo.disabled === false;
	  
		const save$ = esNuevo
		  ? this.#gestionRiesgosSvc.addRiesgo(grupoId, riesgoData)
		  : this.#gestionRiesgosSvc.updateRiesgo(grupoId, riesgo.codigoRiesgo, riesgoData);
	  
		save$.subscribe({
		  next: () => {
			this.#notificationService.showNotification({
			  message: signal('Riesgo guardado correctamente'),
			  hasError: signal(false),
			  autoClear: true
			});
	  
			this.resetFieldsToShow();
			this.showAddButton.set(true);
	  
			// recarga usando la paginación actual
			this.recargarDatos(grupoId);
		  },
		  error: () => {
			this.#notificationService.showNotification({
			  message: signal('Error al guardar el riesgo'),
			  hasError: signal(true),
			  autoClear: true
			});
		  }
		});
	}
	private recargar(id: string) {
		this.recargarDatos(id);
		this.resetFieldsToShow();
		this.riesgos.set([...this.riesgos()]);
		this.showAddButton.set(true);
	}

	private recargarDatos(grupoId: string): void {
		this.#grupoSeguroService
		  .getRiesgosPorGrupo(grupoId)
		  .pipe(takeUntil(this.#destroy$))
		  .subscribe((rs) => this.riesgos.set(rs.content));
	}

	onDeleteRiesgo(riesgo: iRiesgoEditable): void {
		const grupoId = this.form.get('grupoSeguro')?.value;
		if (!grupoId || !riesgo.codigoRiesgo) return;
	  
		this.#gestionRiesgosSvc
		  .deleteRiesgo(grupoId, riesgo.codigoRiesgo)
		  .pipe(takeUntil(this.#destroy$))
		  .subscribe(() => {
			this.recargar(grupoId);
			// Resetear paginación solo si la acción se completa
			this.currentPage.set(0);
		  });
	}

	getRiesgosPorGrupo(event?: string): void {
		const grupoId = this.form.get('grupoSeguro')?.value;
		if (!grupoId) return;
		this.#grupoSeguroService
			.getRiesgosPorGrupo(grupoId, event)
			.pipe(takeUntil(this.#destroy$))
			.subscribe((response) => {
				this.riesgos.set(response.content);
				this.setPaginacion(response);
			});
	}

	private setPaginacion(data: iPaginacion): void {
		this.paginacion.set({
			pageNumber: data.pageNumber,
			pageSize: data.pageSize,
			totalElements: data.totalElements,
			totalPages: data.totalPages,
			last: data.last
		});
	}
	public resetPaginacion(): void {
		this.paginacion.set({
			pageNumber: 0,
			pageSize: 10,
			totalElements: 0,
			totalPages: 0,
			last: true
		});
	}
}
