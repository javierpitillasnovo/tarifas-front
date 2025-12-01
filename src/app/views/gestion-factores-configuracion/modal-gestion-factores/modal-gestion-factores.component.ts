import {
	ChangeDetectionStrategy,
	Component,
	Input,
	ViewEncapsulation,
	Output,
	EventEmitter,
	inject,
	signal,
	computed,
	ViewContainerRef
} from '@angular/core';
import type { OnInit, OnDestroy } from '@angular/core';
import { CommonModule, NgTemplateOutlet } from '@angular/common';
import {
	UiButtonComponent,
	UiSelectComponent,
	UiCheckboxComponent,
	UiTableComponent,
	UiPaginationComponent,
	NotificationService,
	TableDirective
} from '@agroseguro/lib-ui-agroseguro';
import type { SelectOption } from '@agroseguro/lib-ui-agroseguro';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { GestionFactoresService } from '../../../../core/services/gestion-factores.service';
import type {
	ConfiguracionFactores,
	iFactorLinea
} from '../../../../core/interfaces/general.interface';
import { Subject, takeUntil } from 'rxjs';

/**
 * Modal para la configuración de factores por línea en un grupo seguro.
 * Permite al usuario seleccionar factores aplicables y clasificarlos como simples o de precio.
 */
@Component({
	selector: 'app-modal-gestion-factores',
	standalone: true,
	imports: [
		CommonModule,
		ReactiveFormsModule,
		UiButtonComponent,
		UiSelectComponent,
		UiCheckboxComponent,
		UiTableComponent,
		UiPaginationComponent,
		TableDirective,
		UiPaginationComponent
	],
	templateUrl: './modal-gestion-factores.component.html',
	styleUrl: './modal-gestion-factores.component.scss',
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalGestionFactoresComponent implements OnInit, OnDestroy {
	readonly #svc = inject(GestionFactoresService);
	readonly #destroy$ = new Subject<void>();

	readonly #viewContainerRef = inject(ViewContainerRef);
	readonly #notificationService = inject(NotificationService);

	public currentPage = signal<number>(0);
	public pageSize = signal<number>(10);
	private factoresPorLinea = new Map<string, iFactorLinea[]>();
	public lineaSeleccionada: string | null = null;

	/** Recibimos el grupo de seguro desde el padre */
	grupoSeguro!: string;
	/** Emitimos la configuración al cerrar */
	@Output() saved = new EventEmitter<ConfiguracionFactores>();

	/** Formulario con selector de línea */
	form = new FormGroup({
		linea: new FormControl(null, Validators.required)
	});

	/** Opciones del select Línea */
	lineasOptions = signal<SelectOption[]>([]);

	/** Factores cargados para la línea */
	factoresAsignados = signal<iFactorLinea[]>([]);

	constructor() {
		this.#notificationService.setViewContainerRef(this.#viewContainerRef);
	}

	public paginatedFactoresAsignados = computed(() => {
		const start = this.currentPage() * this.pageSize();
		const end = start + this.pageSize();
		return this.factoresAsignados().slice(start, end);
	});

	actualizarPagina(query: string): void {
		const params = new URLSearchParams(query);
		this.currentPage.set(Number(params.get('page')));
		this.pageSize.set(Number(params.get('size')));
	}

	ngOnInit(): void {
		//console.log('grupoSeguro recibido :', this.grupoSeguro);

		if (this.grupoSeguro) {
			this.#svc
				.getLineas(this.grupoSeguro)
				.pipe(takeUntil(this.#destroy$))
				.subscribe((opts) => {
					//console.log('Líneas cargadas:', opts);
					this.lineasOptions.set(opts);
				});
		} else {
			//console.warn('grupoSeguro está vacío o no recibido');
		}

		this.form
			.get('linea')!
			.valueChanges.pipe(takeUntil(this.#destroy$))
			.subscribe((nuevaLinea: string | null) => {
				const lineaAnterior = this.lineaSeleccionada;
				const factoresPrevios = lineaAnterior !== null ? this.factoresAsignados() : [];
				const guardadosPrevios = this.factoresPorLinea.get(lineaAnterior ?? '') ?? [];

				const arraysIguales = this.arraysSonIguales(factoresPrevios, guardadosPrevios);

				// console.log('🟨 lineaAnterior:', lineaAnterior);
				// console.log('🟨 guardadosPrevios:', guardadosPrevios);
				// console.log('🟨 factoresPrevios:', factoresPrevios);
				// console.log('🟨 arraysSonIguales:', arraysIguales);

				// Solo avisamos si había algo cargado antes y ha sido modificado
				if (lineaAnterior !== null && guardadosPrevios.length > 0 && !arraysIguales) {
					this.#notificationService.showNotification({
						message: signal(
							'Los cambios no se han guardado porque no has pulsado el botón Guardar.'
						),
						hasError: signal(true)
					});
				}

				// Reset de página
				this.currentPage.set(0);

				// Nueva línea seleccionada
				this.lineaSeleccionada = nuevaLinea;

				if (nuevaLinea === null || nuevaLinea === undefined) {
					this.factoresAsignados.set([]);
					return;
				}

				const cached = this.factoresPorLinea.get(nuevaLinea);
				if (cached) {
					this.factoresAsignados.set([...cached]);
				} else {
					this.cargarFactores(nuevaLinea);
				}
			});
	}

	private arraysSonIguales(a: iFactorLinea[], b: iFactorLinea[]): boolean {
		if (a.length !== b.length) return false;
		return a.every((f1, i) => {
			const f2 = b[i];
			return (
				f1.idFactor === f2.idFactor &&
				f1.descripcionFactor === f2.descripcionFactor &&
				f1.simple === f2.simple &&
				f1.precio === f2.precio
			);
		});
	}

	private cargarFactores(linea: string): void {
		this.#svc
			.getFactoresLinea(linea)
			.pipe(takeUntil(this.#destroy$))
			.subscribe((dict) => {
				const copia = JSON.parse(JSON.stringify(dict));
				this.factoresPorLinea.set(linea, copia);
				this.factoresAsignados.set(copia);
			});
	}

	/** Extrae el valor `checked` de un evento de checkbox */
	getCheckedValueFromEvent(event: Event): boolean {
		const input = event.target as HTMLInputElement | null;
		return !!input?.checked;
	}

	/** Actualiza el flag `simple` o `precio` de un factor */
	onCheckboxChange(item: iFactorLinea, prop: 'simple' | 'precio', checked: boolean): void {
		const lineaId = this.form.get('linea')?.value;
		if (!lineaId) return;

		// 🔁 Siempre trabajamos con copia del array actual en memoria reactiva
		const arr = JSON.parse(JSON.stringify(this.factoresAsignados())) as iFactorLinea[];

		const idx = arr.findIndex((f) => {
		return item.idFactor
			? f.idFactor === item.idFactor
			: f.idDeducible === item.idDeducible;
		});

		if (idx === -1) return;

		arr[idx] = { ...arr[idx], [prop]: checked };

		// Solo refrescamos la señal reactiva
		this.factoresAsignados.set(arr);
	}

	guardarConfiguracion(): void {
		if (this.form.invalid) {
			//console.warn('Formulario inválido');
			return;
		}

		const lineaControl = this.form.get('linea');
		if (!lineaControl) return;

		const lineaId = lineaControl.value;
		if (!lineaId || isNaN(Number(lineaId))) {
			//console.warn('lineaId es inválido:', lineaId);
			return;
		}

		const factores: iFactorLinea[] = this.factoresAsignados().map((f) => ({
			id: f.id ?? null, // ← Nuevo: opcional si aún no está en BD
			idLinea: lineaId, // ← lo recuperamos del select
			idFactor: f.idFactor, // ← este es el identificador real
			idDeducible: f.idDeducible ?? undefined,
			descripcionFactor: f.descripcionFactor, // ← fallback si usa iFactor
			simple: f.simple,
			precio: f.precio
		}));

		//console.log('Factores a guardar:', factores);

		this.#svc
			.updateFactoresLinea(factores)
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: (res) => {
					//console.log(' Factores actualizados OK', res);
					this.factoresPorLinea.set(lineaId, JSON.parse(JSON.stringify(factores)));
					this.#notificationService.showNotification({
						message: signal('Cambios guardados correctamente.'),
						hasError: signal(false),
						autoClear: true
					});
				},
				error: (err) => {
					//console.error('Error al guardar factores:', err);
					this.#notificationService.showNotification({
						message: signal('Los cambios no se han guardado'),
						hasError: signal(true),
						autoClear: true
					});
				}
			});
	}

	ngOnDestroy(): void {
		this.#destroy$.next();
		this.#destroy$.complete();
	}
}
