import {
	ChangeDetectionStrategy,
	Component,
	Input,
	ViewContainerRef,
	ViewEncapsulation,
	inject,
	model,
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
import type {
	iFactorRelacionadoContent,
	iPaginacion,
	iRiesgoEditable
} from '../../../../core/interfaces/general.interface';
import { GestionFactoresService } from '../../../../core/services/gestion-factores.service';

@Component({
	selector: 'app-gestion-riesgos',
	standalone: true,
	imports: [ReactiveFormsModule, UiDataGridComponent, UiSelectComponent],
	templateUrl: './modal-definicion-factores.component.html',
	styleUrls: ['./modal-definicion-factores.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None
})
export class ModalDefinicionFactoresComponent implements OnInit, OnDestroy {
	readonly #vcr = inject(ViewContainerRef);
	readonly #modalService = inject(ModalService);
	readonly #notificationService = inject(NotificationService);
	readonly #svc = inject(GestionFactoresService);
	readonly #destroy$ = new Subject<void>();

	// Se recibe el factor elegido en el padre
	@Input() idFactor!: string;
	@Input() descripcionFactor!: string;
	@Input() desactivadoFactor!: boolean;

	public paginacion = signal<iPaginacion>({
		pageNumber: 0,
		pageSize: 10,
		totalElements: 0,
		totalPages: 0,
		last: true
	});

	public currentPage = signal(0);

	public form = new FormGroup({
		factor: new FormControl<string | null>(null, Validators.required)
	});

	public showAddButton = model<boolean>(true);
	// Lista de opciones para el selector de grupo seguro
	public grupoSeguroOptions = signal<SelectOption[]>([]);
	public riesgos = signal<iRiesgoEditable[]>([]);
	public factoresFieldsToShow = signal<fieldsToShow[]>([
		{ name: 'idFactor', readonly: true },
		{ name: 'descripcionFactor', readonly: true },
		{
			name: 'parentesco',
			selectedOption: 'parentesco',
			options: [
				{ value: 'padre', text: 'PADRE' },
				{ value: 'hijo', text: 'HIJO' }
			],
			readonly: false
		}
	]);

	/**
	 * factorOptions siempre debe tener como primer elemento el id y descripción que llegan del padre.
	 * Cuando se carguen datos del endpoint, se pueden añadir o reemplazar, pero el valor por defecto siempre está presente al abrir el modal.
	 */
	public factorOptions = signal<SelectOption[]>([]);
	public factores = signal<iFactorRelacionadoContent>({
		content: [],
		pageNumber: 0,
		pageSize: 10,
		totalElements: 0,
		totalPages: 0,
		last: true
	});

	constructor() {
		this.#modalService.setViewContainerRef(this.#vcr);
		this.#notificationService.setViewContainerRef(this.#vcr);
	}

	ngOnInit(): void {
		this.factorOptions = signal<SelectOption[]>([
			{
				value: this.idFactor,
				text: this.descripcionFactor ? this.descripcionFactor : ''
			}
		]);
		// Establece el valor inicial del select
		this.form.get('factor')?.setValue(this.idFactor);

		this.getFactoresRelacionadosConUnIdFactor(this.idFactor);
	}

	getFactoresRelacionadosConUnIdFactor(event?: string): void {
		this.#svc
			.getFactoresRelacionadosConUnIdFactor(this.idFactor, event)
			.pipe(takeUntil(this.#destroy$))
			.subscribe((response: iFactorRelacionadoContent) => {
				this.factores.set(response);
			});
	}

	public hayFilaEditable(): boolean {
		return this.riesgos().some((r) => r.edit === true);
	}

	/** Restablece los campos a “solo lectura” para el código */
	private resetFieldsToShow(): void {
		this.factoresFieldsToShow.set([
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

	onAddFactor(): void {
		// Poner todos los campos en editable antes de añadir
		this.setFieldsToShowAdd();
	}

	public nuevoFactor(): void {}

	onSaveFactor(factor: any): void {}

	onDeleteFactor(factor: any): void {}

	/** Pone todos los campos en editable para modo añadir */
	private setFieldsToShowAdd(): void {
		this.factoresFieldsToShow.set([
			{ name: 'idFactor', readonly: false },
			{ name: 'descripcionFactor', readonly: false },
			{
				name: 'parentesco',
				selectedOption: 'parentesco',
				options: [
					{ value: 'padre', text: 'PADRE' },
					{ value: 'hijo', text: 'HIJO' }
				],
				readonly: false
			}
		]);
	}

	/** Solo parentesco editable para modo edición */
	private setFieldsToShowEdit(): void {
		this.factoresFieldsToShow.set([
			{ name: 'idFactor', readonly: true },
			{ name: 'descripcionFactor', readonly: true },
			{
				name: 'parentesco',
				selectedOption: 'parentesco',
				options: [
					{ value: 'padre', text: 'PADRE' },
					{ value: 'hijo', text: 'HIJO' }
				],
				readonly: false
			}
		]);
	}

	/** Handler para interceptar la edición de una fila (selección) y poner los campos en modo edición */
	public onEditFactor(row: any): void {
		this.setFieldsToShowEdit();
	}

	ngOnDestroy(): void {
		this.#destroy$.next();
		this.#destroy$.complete();
	}
}
