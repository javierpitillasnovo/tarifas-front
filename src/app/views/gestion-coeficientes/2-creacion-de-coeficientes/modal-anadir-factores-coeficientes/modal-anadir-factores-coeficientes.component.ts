import { ChangeDetectionStrategy, Component, inject, input, output, signal, OnInit, OnDestroy } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import {
	ModalService,
	TransferList,
	UiButtonComponent,
	UiTransferListComponent
} from '@agroseguro/lib-ui-agroseguro';
import { Subject, takeUntil } from 'rxjs';
import type { iFactorCoeficiente, iFactorLinea } from '../../../../../core/interfaces/general.interface';
import { GestionFactoresService } from '../../../../../core/services/gestion-factores.service';

@Component({
	selector: 'app-modal-anadir-factores-coeficientes',
	standalone: true,
	imports: [ReactiveFormsModule, UiTransferListComponent, UiButtonComponent],
	templateUrl: './modal-anadir-factores-coeficientes.component.html',
	styleUrl: './modal-anadir-factores-coeficientes.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalAnadirFactoresCoeficientesComponent implements OnInit, OnDestroy {
	title = 'Selecciona los Factores de Coeficiente que deseas asociar';

	public idLinea = input.required<string>();
	public idPlanLinea = input.required<string>();
	public modalOutput = output<TransferList[]>();

	// Subject de control
	#destroy$ = new Subject<void>();

	// Inyección de servicios
	readonly #modalService = inject(ModalService);
	readonly #gestionFactoresService = inject(GestionFactoresService);

	// Signals
	listFactoresDisponibles = signal<iFactorLinea[]>([]);
	listFactoresSeleccionados = signal<iFactorCoeficiente[]>([]);
	listFactoresToStoreTransferList = signal<TransferList[]>([]);
	leftListSetted = signal<boolean>(false);
	rightListSetted = signal<boolean>(false);
	leftData = signal<string[]>([]);
	rightData = signal<string[]>([]);
	hasAnyChange = signal<boolean>(false);

	onLoadFactoresError = signal<boolean>(false);
	onLoadFactoresPreviosError = signal<boolean>(false);

	ngOnInit() {
		this.loadFactores();
	}

	private loadFactores() {
		this.#gestionFactoresService
			.getFactoresLinea(this.idLinea())
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: (factores) => {
					const filtrados = factores.filter(f => f.simple || f.precio);

					this.listFactoresDisponibles.set(filtrados);
					this.loadFactoresPrevios();
				},
				error: () => this.onLoadFactoresError.set(true)
			});
	}

	private loadFactoresPrevios() {
		this.#gestionFactoresService
			.getFactoresCoeficiente(this.idPlanLinea())
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: (factoresPrevios) => {
					this.listFactoresSeleccionados.set(factoresPrevios);
					this.mapToTransferLists();
				},
				error: () => this.onLoadFactoresPreviosError.set(true)
			});
	}

	private mapToTransferLists() {
		// Mapeo de la lista de seleccionados (derecha)
		const right = this.listFactoresSeleccionados().map((f) => {
			const hasDescripcionFactor = f.descripcionFactor && f.descripcionFactor.trim() !== '';
			return hasDescripcionFactor ? f.descripcionFactor : f.descripcionDeducible || '';
		});

		// Mapeo de la lista de disponibles (izquierda)
		const left = this.listFactoresDisponibles()
			.map(f => f.descripcionFactor)
			.filter(f => !right.includes(f));

		this.leftData.set(left);
		this.rightData.set(right);
		this.leftListSetted.set(true);
		this.rightListSetted.set(true);
	}


	onListChanges(event: { leftData: TransferList[]; rightData: TransferList[] }) {
		this.hasAnyChange.set(true);
		this.listFactoresToStoreTransferList.set(event.rightData);
	}

	buttonDisabled(): boolean {
		return !this.hasAnyChange();
	}

	cancel() {
		this.#modalService.close();
	}

	updateFactores() {
		let body: { idsFactorLinea: string[] | null; idPlanLinea: string };

		if (this.listFactoresToStoreTransferList().length === 0) {
			// Si no hay factores seleccionados, enviamos una petición que vacíe las asignaciones
			body = { idsFactorLinea: null, idPlanLinea: this.idPlanLinea() };
		} else {
			// Caso normal: mapeamos las descripciones a los IDs reales
			const lineas = this.listFactoresToStoreTransferList().map((f) => {
				return this.listFactoresDisponibles().find(
					(item) => item.descripcionFactor === f.description
				)?.id ?? null;
			});
			body = {
				idsFactorLinea: lineas as string[],
				idPlanLinea: this.idPlanLinea()
			}
		}

		this.#gestionFactoresService
			.updateFactoresCoeficiente(body)
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: () => {
					// Emitimos SIEMPRE (aunque no haya factores) para que el padre recargue
					this.modalOutput.emit(this.listFactoresToStoreTransferList());
					this.#modalService.close();
				},
				error: () => {
					this.modalOutput.emit([]);
					this.#modalService.close();
				}
			});
	}

	ngOnDestroy() {
		this.#destroy$.next();
		this.#destroy$.complete();
	}
}
