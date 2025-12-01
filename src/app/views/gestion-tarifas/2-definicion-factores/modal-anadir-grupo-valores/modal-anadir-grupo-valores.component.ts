import type { OnDestroy, OnInit } from '@angular/core';
import {
	ChangeDetectionStrategy,
	Component,
	inject,
	input,
	output,
	signal,
	ViewContainerRef
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
	ModalService,
	UiInputComponent,
	UiButtonComponent,
	UiTransferListComponent,
	TransferList,
	NotificationService
} from '@agroseguro/lib-ui-agroseguro';
import { Subject, takeUntil } from 'rxjs';
import type { FactorTarifa, GrupoValores, Valor, ValorFactor } from '../../../../../core/interfaces/general.interface';
import { GestionFactoresService } from '../../../../../core/services/gestion-factores.service';

@Component({
	selector: 'app-modal-anadir-grupo-valores',
	standalone: true,
	imports: [ReactiveFormsModule, UiTransferListComponent, UiButtonComponent, UiInputComponent],
	templateUrl: './modal-anadir-grupo-valores.component.html',
	styleUrl: './modal-anadir-grupo-valores.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalAnadirGrupoValoresComponent implements OnInit, OnDestroy {
	public factorTarifa = input.required<FactorTarifa>();
	public precio = input.required<boolean>();
	public simple = input.required<boolean>();
	public idVersion = input.required<string>();
	public editGrupo = input.required<boolean>();
	public grupoValoresEdit = input.required<GrupoValores>();
	public modalOutput = output<TransferList[]>();

	//Subject para manejar la destrucción de suscripciones
	#destroy$ = new Subject<void>();

	readonly #modalService = inject(ModalService);
	readonly #gestionFactoresService = inject(GestionFactoresService);
	readonly #notificationsService = inject(NotificationService);
	readonly #vcr = inject(ViewContainerRef);

	listValoresPreviousStored = signal<Valor[]>([]);
	listValoresToStoreTransferList = signal<TransferList[]>([]);
	listAllValores = signal<ValorFactor[]>([]);

	public idsValoresUnicos: string[] = [];

	leftListSetted = signal<boolean>(false);
	rightListSetted = signal<boolean>(false);
	leftData = signal<string[]>([]);
	rightData = signal<string[]>([]);

	onLoadGruposValoresError = signal<boolean>(false);
	onLoadGruposValoresPreviosError = signal<boolean>(false);

	lisValoresToStoreTransferListHasChanged = signal<boolean>(false);

	characterToSplitName = '-';

	public nameForm!: FormGroup;

	constructor() {
		this.#notificationsService.setViewContainerRef(this.#vcr);
		this.nameForm = new FormGroup({
			name: new FormControl('', [Validators.required])
		});
	}

	ngOnInit() {
		this.getIdsCultivoSimpleAndAllGruposValores();
	}

	//Recuperamos ids cultivo para tipos simples
	getIdsCultivoSimpleAndAllGruposValores() {
		this.#gestionFactoresService
			.getIdsCultivo(this.idVersion(), this.#gestionFactoresService.FACTOR_TIPO_SIMPLE)
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: (idsCultivo) => {
					this.idsValoresUnicos = idsCultivo;
					this.getAllValores(this.factorTarifa().idFactorTarifa);
				},
				error: () => {
					this.onLoadGruposValoresError.set(true);
				}
			});
	}

	cancel() {
		this.#modalService.close();
	}

	transformListAllValores() {
		const left = this.listAllValores().map((r) => {
			const cultivo = r.idCultivo && r.denominacionCultivo ? `${r.denominacionCultivo} ` : '';
			return `${cultivo}${r.idValor}${this.characterToSplitName}${r.descripcionValor}`;
		});
		this.leftData.set(left);
		this.leftListSetted.set(true);
	}

	transformListValoresPreviousStoredAndRemoveFromAllListGruposValores() {
		const right = this.listValoresPreviousStored().map((r) => {
			const parent = r.idValorParent
				? `${this.getValorFromDescriptionWhenParent(r.descripcion!)?.denominacionCultivo} `
				: '';
			return `${parent}${r.idValor}${this.characterToSplitName}${r.descripcion}`;
		});
		this.rightData.set(right);

		// Eliminar los gruposValores que ya están en la lista de gruposValores previos de la lista de todos los gruposValores
		this.leftData.set(this.leftData().filter((item1) => !this.rightData().includes(item1)));

		this.rightListSetted.set(true);
	}

	onListChanges(event: { leftData: TransferList[]; rightData: TransferList[] }) {
		this.listValoresToStoreTransferList.set(event.rightData);
		if (!this.editGrupo()) {
			if (event.rightData.length === 1) {
				const name = this.getTextAfterFirstDash(event.rightData[0].description);
				this.nameForm.get('name')?.setValue(name);
			} else {
				this.nameForm.get('name')?.reset();
			}
		}
		this.lisValoresToStoreTransferListHasChanged.set(true);
	}

	getValorFromDescriptionWhenParent(description: string): ValorFactor | undefined {
		return this.listAllValores().find((item) => item.descripcionValor === description);
	}

	private getTextAfterFirstDash(description: string): string {
		const parts = description.split(this.characterToSplitName);
		if (parts.length < 2) return '';
		return parts.slice(1).join(this.characterToSplitName).trim();
	}


	getValorFromDescription(description: string): ValorFactor | undefined {
		// Extrae todo lo que está después del primer guion "-"
		const parts = description.split(this.characterToSplitName);
		if (parts.length < 2) return undefined;

		// Todo lo que hay después del primer guion (incluyendo más guiones si existen)
		const desc = parts.slice(1).join(this.characterToSplitName).trim();

		// Busca el ValorFactor cuyo descripcionValor coincida
		return this.listAllValores().find(
			(item) => item.descripcionValor.trim() === desc
		);
	}

	buttonDisabled(): boolean | undefined {
		return this.editGrupo()
			? this.nameForm.invalid
			: this.leftData().length === 0 ||
					this.nameForm.invalid ||
					this.listValoresToStoreTransferList().length === 0;
	}

	saveOrUpdateGruposValores() {
		if (this.editGrupo()) {
			this.updateGruposValores();
		} else {
			this.saveGruposValores();
		}
	}

	updateGruposValores() {
		const groupName = this.nameForm.get('name')?.value;

		let listValores = this.listValoresToStoreTransferList().map((r) => {
			const valor = this.getValorFromDescription(r.description);
			let valorSelected;
			if (this.factorTarifa().idFactor!.toString() === '71') {
				valorSelected = {
					idValor: valor?.idValor,
					idValorParent: valor?.idCultivo,
					idFactorParent: '70'
				};
			} else {
				valorSelected = {
					idValor: valor?.idValor
				};
			}

			return valorSelected;
		});

		if (this.lisValoresToStoreTransferListHasChanged() && listValores.length === 0) {
			this.#notificationsService.showNotification({
				message: signal('Debe seleccionar al menos un valor.'),
				hasError: signal(true)
			});
			return;
		} else {
			// Si no ha habido cambios en la lista de factores, enviamos los previos almacenados
			listValores =
				listValores.length === 0
					? this.listValoresPreviousStored().map((r) => {
							return {
								idValor: r.idValor,
								idValorParent: r.idValorParent!,
								idFactorParent: r.idFactorParent!
							};
						})
					: listValores;
		}

		let factorTarifaValores = {
			idFactorTarifa: this.factorTarifa().idFactorTarifa,
			nombreGrupo: groupName,
			idsValores: listValores,
			precio: this.precio(),
			simple: this.simple()
		};

		this.#gestionFactoresService
			.updateGrupoValores(factorTarifaValores, this.grupoValoresEdit().idGrupo)
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: () => {
					this.modalOutput.emit(this.listValoresToStoreTransferList());
				},
				error: () => {
					this.modalOutput.emit([]);
				}
			});
	}

	saveGruposValores() {
		const groupName = this.nameForm.get('name')?.value;

		const listValores = this.listValoresToStoreTransferList().map((r) => {
			const valor = this.getValorFromDescription(r.description);
			let valorSelected;
			if (this.factorTarifa().idFactor!.toString() === '71') {
				valorSelected = {
					idValor: valor?.idValor,
					idValorParent: valor?.idCultivo,
					idFactorParent: '70'
				};
			} else {
				valorSelected = {
					idValor: valor?.idValor
				};
			}
			return valorSelected;
		});

		let factorTarifaValores = {
			idFactorTarifa: this.factorTarifa().idFactorTarifa,
			nombreGrupo: groupName,
			idsValores: listValores,
			precio: this.precio(),
			simple: this.simple()
		};

		this.#gestionFactoresService
			.createFactorTarifaGrupoValores(factorTarifaValores)
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: () => {
					this.modalOutput.emit(this.listValoresToStoreTransferList());
				},
				error: () => {
					this.modalOutput.emit([]);
				}
			});
	}

	getAllValores(idFactorTarifa: string) {
		this.#gestionFactoresService
			.getValoresFactorTarifa(idFactorTarifa, this.idsValoresUnicos)
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: (valores) => {
					this.listAllValores.set(valores);
					this.transformListAllValores();
					if (this.editGrupo() && this.factorTarifa().grupoValores!.length > 0) {
						this.nameForm.get('name')?.setValue(this.grupoValoresEdit().nombre);
						this.listValoresPreviousStored.set(this.grupoValoresEdit().valores);
						this.transformListValoresPreviousStoredAndRemoveFromAllListGruposValores();
					}
				},
				error: () => {
					this.onLoadGruposValoresError.set(true);
				}
			});
	}

	//Nos desuscribimos de todas las suscripciones al destruir el componente
	ngOnDestroy() {
		this.#destroy$.next(); // Notifica a los observables que deben cerrarse
		this.#destroy$.complete(); // Cierra el subject
	}
}
