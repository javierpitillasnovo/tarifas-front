import type { OnDestroy, OnInit } from '@angular/core';
import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import {
	ModalService,
	TransferList,
	UiButtonComponent,
	UiTransferListComponent
} from '@agroseguro/lib-ui-agroseguro';
import { Subject, takeUntil } from 'rxjs';
import type {
	FactorLineaVersion,
	FactorTarifa,
	iFactorLinea
} from '../../../../../core/interfaces/general.interface';
import { GestionFactoresService } from '../../../../../core/services/gestion-factores.service';

@Component({
	selector: 'app-modal-anadir-factores',
	standalone: true,
	imports: [ReactiveFormsModule, UiTransferListComponent, UiButtonComponent],
	templateUrl: './modal-anadir-factores.component.html',
	styleUrl: './modal-anadir-factores.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalAnadirEliminarFactoresComponent implements OnInit, OnDestroy {
	title = 'Añade o elimina los Factores que deseas configurar';
	public idLinea = input.required<string>();
	public idVersionRiesgo = input.required<string>();
	public simple = input.required<boolean>();
	public precio = input.required<boolean>();
	public modalOutput = output<TransferList[]>();

	//Subject para manejar la destrucción de suscripciones
	#destroy$ = new Subject<void>();

	readonly #modalService = inject(ModalService);
	readonly #gestionFactoresService = inject(GestionFactoresService);

	listFactoresPreviousStored = signal<FactorTarifa[]>([]);
	private snapshotPrevios = signal<FactorTarifa[]>([]);
	listFactoresToStoreTransferList = signal<TransferList[]>([]);
	listAllFactores = signal<iFactorLinea[]>([]);

	leftListSetted = signal<boolean>(false);
	rightListSetted = signal<boolean>(false);
	leftData = signal<string[]>([]);
	rightData = signal<string[]>([]);
	hasAnychange = signal<boolean>(false);

	onLoadFactoresError = signal<boolean>(false);
	onLoadFactoresPreviosError = signal<boolean>(false);

	ngOnInit() {
		this.getAllFactores(this.idLinea());
	}

	cancel() {
		this.#modalService.close();
	}

	transformListAllFactores() {
		let left: string[] = [];
		if (this.simple()) {
			left = this.listAllFactores()
				.filter((item) => item.simple === this.simple())
				.map((r) => `${r.descripcionFactor}`);
		}
		if (this.precio()) {
			left = this.listAllFactores()
				.filter((item) => item.precio === this.precio())
				.map((r) => `${r.descripcionFactor}`);
		}
		this.leftData.set(left);
		this.leftListSetted.set(true);
	}

	transformListFactoresPreviousStoredAndRemoveFromAllListFactores() {
		let right: string[] = [];
		if (this.simple()) {
			right = this.listFactoresPreviousStored()
				.filter((item) => item.simple === this.simple())
				.map((r) => r.idFactor ? `${r.descripcionFactor}` :  `${r.descripcionDeducible}`);
		}
		if (this.precio()) {
			right = this.listFactoresPreviousStored()
				.filter((item) => item.precio === this.precio())
				.map((r) => r.idFactor ? `${r.descripcionFactor}` :  `${r.descripcionDeducible}`);
		}

		this.rightData.set(right);

		// Eliminar los factores que ya están en la lista de factores previos de la lista de todos los factores
		this.leftData.set(this.leftData().filter((item1) => !this.rightData().includes(item1)));

		this.rightListSetted.set(true);
	}

	onListChanges(event: { leftData: TransferList[]; rightData: TransferList[] }) {
		this.hasAnychange.set(true);
		this.listFactoresToStoreTransferList.set(event.rightData);
	}

	getIdFactorLineaFromDescription(description: string): string {
		const factorLinea = this.listAllFactores().find(
			(item) => item.descripcionFactor === description
		);
		return factorLinea ? factorLinea.id : '';
	}

	buttonDisabled(): boolean | undefined {
		return !this.hasAnychange();
	}

	updateFactores() {
		let listFactores: FactorLineaVersion;

		// Si no hay factores seleccionados, se crea un factor con idFactorLinea null
		// para que se elimine el factor de la versión de riesgo
		if (this.listFactoresToStoreTransferList().length === 0) {
			listFactores = { idVersionRiesgo: this.idVersionRiesgo() };
		} else {
			const idFactorLinea = this.listFactoresToStoreTransferList().map((r) => {
				return this.getIdFactorLineaFromDescription(r.description);
			});
			listFactores = { idVersionRiesgo: this.idVersionRiesgo(), idsFactorLinea: idFactorLinea };
		}

		this.#gestionFactoresService
			.updateFactoresTarifa(
				listFactores,
				this.simple()
					? this.#gestionFactoresService.FACTOR_TIPO_SIMPLE
					: this.#gestionFactoresService.FACTOR_TIPO_PRECIO
			)
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: () => {
					this.modalOutput.emit(this.listFactoresToStoreTransferList());
				},
				error: () => {
					this.modalOutput.emit([]);
				}
			});
	}

	getFactoresPrevios(idVersion: string) {
		this.#gestionFactoresService
			.getFactoresTarifaByVersion(
				idVersion,
				this.simple()
					? this.#gestionFactoresService.FACTOR_TIPO_SIMPLE
					: this.#gestionFactoresService.FACTOR_TIPO_PRECIO
			)
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: (factores) => {
					this.listFactoresPreviousStored.set(factores);
					this.snapshotPrevios.set(factores);
					this.transformListFactoresPreviousStoredAndRemoveFromAllListFactores();
				},
				error: () => {
					this.onLoadFactoresPreviosError.set(true);
				}
			});
	}

	getAllFactores(idLinea: string) {
		this.#gestionFactoresService
			.getFactoresLinea(idLinea)
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: (factores) => {
					this.listAllFactores.set(factores);
					this.transformListAllFactores();
					this.getFactoresPrevios(this.idVersionRiesgo());
				},
				error: () => {
					this.onLoadFactoresError.set(true);
				}
			});
	}

	//Nos desuscribimos de todas las suscripciones al destruir el componente
	ngOnDestroy() {
		this.#destroy$.next(); // Notifica a los observables que deben cerrarse
		this.#destroy$.complete(); // Cierra el subject
	}
}
