import { OnDestroy, OnInit, ChangeDetectionStrategy, Component, inject, input, output, signal, ViewContainerRef } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
	ModalService,
	UiInputComponent,
	UiButtonComponent,
	UiTransferListComponent,
	NotificationService,
	TransferList
} from '@agroseguro/lib-ui-agroseguro';
import { Subject, takeUntil } from 'rxjs';
import { GrupoValores, iFactorDeducible, iFactorDeducibleNew, iFactorGlobal, iFactorOrden, InputTransferList } from '../../../../core/interfaces/general.interface';
import { FactoresService } from '../../../../core/services/factores.service';
import { GruposFactoresService } from '../../../../core/services/grupos-factores.service';

@Component({
	selector: 'app-modal-anadir-factor-deducible',
	standalone: true,
	imports: [ReactiveFormsModule, UiTransferListComponent, UiButtonComponent, UiInputComponent],
	templateUrl: './modal-anadir-factor-deducible.component.html',
	styleUrl: './modal-anadir-factor-deducible.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalAnadirFactorDeducibleComponent implements OnInit, OnDestroy {
	public factorDeducible = input.required<iFactorDeducible>();
	public edit = input.required<boolean>();
	public modalOutput = output<TransferList[]>();

	//Subject para manejar la destrucción de suscripciones
	#destroy$ = new Subject<void>();

	readonly #modalService = inject(ModalService);
	readonly #factoresService = inject(FactoresService);
	readonly #gruposFactoresService = inject(GruposFactoresService);
	readonly #notificationsService = inject(NotificationService);
	readonly #vcr = inject(ViewContainerRef);

	listFactoresPreviousStored = signal<
		{
			idFactor: string;
			nombreFactor: string;
			orden?: number;
		}[]
	>([]);
	listFactoresToStoreTransferList = signal<TransferList[]>([]);
	listFactoresToStoreTransferListHasChanged = signal<boolean>(false);
	listAllFactores = signal<iFactorGlobal[]>([]);

	leftListSetted = signal<boolean>(false);
	rightListSetted = signal<boolean>(false);
	leftData = signal<InputTransferList[]>([]);
	rightData = signal<InputTransferList[]>([]);

	onsaveFactoresError = signal<boolean>(false);
	onLoadFactoresError = signal<boolean>(false);
	onLoadFactoresPreviosError = signal<boolean>(false);

	public nameForm!: FormGroup;

	constructor() {
		this.#notificationsService.setViewContainerRef(this.#vcr);
		this.#modalService.setViewContainerRef(this.#vcr);
		this.nameForm = new FormGroup({
			name: new FormControl('', [Validators.required])
		});
	}

	ngOnInit() {
		this.getAllFactores();
	}

	getAllFactores() {
		this.#factoresService
			.getFactores()
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: (factores) => {
					this.listAllFactores.set(factores);
					this.transformListAllFactores();
					if (this.edit() && this.factorDeducible().factores.length > 0) {
						this.nameForm.get('name')?.setValue(this.factorDeducible().nombre);
						this.listFactoresPreviousStored.set(this.factorDeducible().factores);
						this.transformListFactoresPreviousStoredAndRemoveFromAllListFactores();
					}
				},
				error: () => {
					this.onLoadFactoresError.set(true);
				}
			});
	}

	cancel() {
		this.modalOutput.emit([]);
	}

	transformListAllFactores() {
		const left = this.listAllFactores().map((r) => {
			const item: InputTransferList = {
				id: r.idConcepto,
				description: r.nombre
			};
			return item;
		});
		this.leftData.set(left);
		this.leftListSetted.set(true);
	}

	transformListFactoresPreviousStoredAndRemoveFromAllListFactores() {
		const right = this.listFactoresPreviousStored().map((r, index) => {
			const item: InputTransferList = {
				id: r.idFactor,
				description: r.nombreFactor,
				order: r.orden !== undefined ? r.orden : index + 1
			};
			return item;
		});
		this.rightData.set(right);

		// Eliminar los gruposValores que ya están en la lista de gruposValores previos de la lista de todos los gruposValores
		this.leftData.set(
			this.leftData().filter((item1) => !this.rightData().find((item2) => item2.id === item1.id))
		);

		this.rightListSetted.set(true);
	}

	onListChanges(event: { leftData: TransferList[]; rightData: TransferList[] }) {
		this.listFactoresToStoreTransferList.set(event.rightData);
		this.listFactoresToStoreTransferListHasChanged.set(true);
	}

	getIdValorFromDescription(nombre: string): string {
		const factor = this.listAllFactores().find((item) => item.nombre === nombre);
		return factor ? factor.idConcepto : '';
	}

	buttonDisabled(): boolean | undefined {
		return this.edit()
			? this.nameForm.invalid
			: this.leftData().length === 0 ||
					this.nameForm.invalid ||
					this.listFactoresToStoreTransferList().length === 0;
	}

	saveOrUpdateFactorDeducible() {
		if (this.edit()) {
			this.updateFactorDeducible();
		} else {
			this.saveFactorDeducible();
		}
	}

	saveFactorDeducible() {
		const groupName = this.nameForm.get('name')?.value;
		const listValores: iFactorOrden[] = this.listFactoresToStoreTransferList().map((r) => {
			const idFactor = this.getIdValorFromDescription(r.description);
			const factorOrden: iFactorOrden = {
				idFactor: idFactor,
				orden: r.order!
			};
			return factorOrden;
		});

		if (listValores.length < 2) {
			this.#notificationsService.showNotification({
				message: signal('Debe seleccionar al menos dos factores.'),
				hasError: signal(true)
			});
			return;
		}

		const factorDeducible: iFactorDeducibleNew = {
			nombreGrupo: groupName,
			idsFactores: listValores
		};
		this.#gruposFactoresService
			.newGrupoFactores(factorDeducible)
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: () => {
					this.modalOutput.emit(this.listFactoresToStoreTransferList());
				},
				error: () => {
					this.modalOutput.emit([]);
				}
			});
		this.#modalService.close();
	}

	updateFactorDeducible() {
		const groupName = this.nameForm.get('name')?.value;
		let listValores = this.listFactoresToStoreTransferList().map((r) => {
			const idFactor = this.getIdValorFromDescription(r.description);
			const factorOrden: iFactorOrden = {
				idFactor: idFactor,
				orden: r.order!
			};
			return factorOrden;
		});

		if (this.listFactoresToStoreTransferListHasChanged() && listValores.length < 2) {
			this.#notificationsService.showNotification({
				message: signal('Debe seleccionar al menos dos factores.'),
				hasError: signal(true)
			});
			return;
		} else {
			// Si no ha habido cambios en la lista de factores, enviamos los previos almacenados
			listValores =
				listValores.length === 0
					? this.listFactoresPreviousStored().map((r) => {
							const factorOrden: iFactorOrden = {
								idFactor: r.idFactor,
								orden: r.orden!
							};
							return factorOrden;
						})
					: listValores;
		}

		let factorDeducible: iFactorDeducibleNew = {
			nombreGrupo: groupName,
			idsFactores: listValores
		};

		this.#gruposFactoresService
			.updateFactorDeducible(this.factorDeducible().idGrupo, factorDeducible)
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: () => {
					this.modalOutput.emit(this.listFactoresToStoreTransferList());
				},
				error: () => {
					this.modalOutput.emit([]);
				}
			});
		this.#modalService.close();
	}

	//Nos desuscribimos de todas las suscripciones al destruir el componente
	ngOnDestroy() {
		this.#destroy$.next(); // Notifica a los observables que deben cerrarse
		this.#destroy$.complete(); // Cierra el subject
	}
}
