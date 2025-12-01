import {
	ChangeDetectionStrategy,
	Component,
	inject,
	signal,
	ViewContainerRef,
	ChangeDetectorRef
} from '@angular/core';
import type { OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
	UiButtonComponent,
	UiCheckboxComponent,
	UiTableComponent,
	NotificationService,
	TableDirective,
	ModalService,
	UiTagComponent
} from '@agroseguro/lib-ui-agroseguro';
import { ReactiveFormsModule } from '@angular/forms';
import { GestionFactoresService } from '../../../core/services/gestion-factores.service';
import type {
	iFactorGrupoSeguro,
	iFactorGrupoSeguroContent,
	iCambioFactorGrupoSeguro
} from '../../../../src/core/interfaces/general.interface';
import { Subject, takeUntil } from 'rxjs';
import { ModalDefinicionFactoresComponent } from './modal-definicion-factores/modal-definicion-factores.component';

@Component({
	selector: 'app-gestion-factores-definicion',
	standalone: true,
	imports: [
		CommonModule,
		ReactiveFormsModule,
		UiButtonComponent,
		UiCheckboxComponent,
		UiTableComponent,
		TableDirective,
		UiTagComponent
	],
	templateUrl: './gestion-factores-definicion.component.html',
	styleUrl: './gestion-factores-definicion.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class GestionFactoresDefinicionComponent implements OnInit, OnDestroy {
	readonly #svc = inject(GestionFactoresService);
	readonly #destroy$ = new Subject<void>();
	readonly #vcr = inject(ViewContainerRef);
	readonly #modalService = inject(ModalService);
	readonly #viewContainerRef = inject(ViewContainerRef);
	readonly #notificationService = inject(NotificationService);

	private factoresOriginales: iFactorGrupoSeguroContent = {
		content: [],
		pageNumber: 0,
		pageSize: 0,
		totalElements: 0,
		totalPages: 0,
		last: true
	};
	private cdr = inject(ChangeDetectorRef);

	factoresAsignados = signal<iFactorGrupoSeguro[]>([]);
	cambiosFactores: iCambioFactorGrupoSeguro[] = [];

	public currentPage = signal<number>(0);
	public pageSize = signal<number>(10);
	public lineaSeleccionada: string | null = null;
	public totalItems = signal<number>(0);
	public guardarHabilitado = signal<boolean>(false);

	public STATUS_TAG_DEDUCIBLE = 1;
	public STATUS_TAG_AGRO = 0;
	public TEXT_TAG_DEDUCIBLE = 'Deducible';
	public TEXT_TAG_AGRO = 'Agro';

	constructor() {
		this.#notificationService.setViewContainerRef(this.#viewContainerRef);
		this.#modalService.setViewContainerRef(this.#vcr);
	}

	ngOnInit(): void {
		this.obtenerFactores();
	}

	obtenerFactores(event?: string): void {
		this.#svc
			.getTodosFactoresConSusGruposSeguro(event)
			.pipe(takeUntil(this.#destroy$))
			.subscribe((response: iFactorGrupoSeguroContent) => {
				// Guardar copia original SOLO del array de factores
				this.factoresOriginales = JSON.parse(JSON.stringify(response));
				this.factoresAsignados.set(response.content ?? []);
				this.totalItems.set(response.totalElements ?? 0);
				this.cambiosFactores = [];
				this.guardarHabilitado.set(false);
				this.cdr.markForCheck();
			});
	}

	/** Detecta y almacena cambios en agrícola/ganado */
	onCheckboxChange(
		item: iFactorGrupoSeguro,
		prop: 'agricola' | 'ganado' | 'desactivado',
		checked: boolean
	): void {
		const arr = JSON.parse(JSON.stringify(this.factoresAsignados())) as iFactorGrupoSeguro[];
		const idx = arr.findIndex((f) => {
			return item.idFactor ? f.idFactor === item.idFactor : f.idDeducible === item.idDeducible
		});
		if (idx === -1) return;
		arr[idx] = { ...arr[idx], [prop]: checked };
		// Actualiza la señal reactiva
		this.factoresAsignados.set(arr);
		const cambios: iCambioFactorGrupoSeguro[] = arr
			.filter((f) => {
				const orig = this.factoresOriginales.content.find((o) => f.idFactor ? o.idFactor === f.idFactor : o.idDeducible === f.idDeducible);
				return (
					orig &&
					(f.agricola !== orig.agricola ||
						f.ganado !== orig.ganado ||
						f.desactivado !== orig.desactivado)
				);
			})
			.map((f) => ({
				id: f.id,
				idFactor: f.idFactor,
				idDeducible: f.idDeducible,
				agricola: f.agricola,
				ganado: f.ganado,
				desactivado: f.desactivado
			}));
		this.cambiosFactores = cambios;
		this.guardarHabilitado.set(cambios.length > 0);
		this.cdr.markForCheck();
	}

	/** Extrae el valor `checked` de un evento de checkbox */
	getCheckedValueFromEvent(event: Event): boolean {
		const input = event.target as HTMLInputElement | null;
		return !!input?.checked;
	}

	guardarCambiosGruposSeguro(): void {
	this.#svc
		.updateGruposSeguroAsignadosAFactores(this.cambiosFactores, true)
		.pipe(takeUntil(this.#destroy$))
		.subscribe({
			next: () => {
				this.obtenerFactores();
				this.#notificationService.showNotification({
					message: signal('Cambios guardados correctamente'),
					hasError: signal(false),
					autoClear: true
				});
			},
			error: () => {
				this.#notificationService.showNotification({
					message: signal('Error al guardar los cambios'),
					hasError: signal(true),
					autoClear: true
				});
			},
			complete: () => {
				this.cambiosFactores = [];
				this.guardarHabilitado.set(false);
			}
		});
	}

	abrirModalFactores(item: iFactorGrupoSeguro): void {
		this.#modalService.setViewContainerRef(this.#vcr);
		this.#modalService.open(ModalDefinicionFactoresComponent, {
			size: 'l',
			idFactor: item.idFactor,
			descripcionFactor: item.descripcionFactor,
			desactivado: item.desactivado
		});
	}

	ngOnDestroy(): void {
		this.#destroy$.next();
		this.#destroy$.complete();
	}
}
