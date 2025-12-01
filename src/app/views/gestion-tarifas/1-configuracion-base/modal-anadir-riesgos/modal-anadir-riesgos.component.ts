import type { OnDestroy } from '@angular/core';
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	inject,
	output,
	signal
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import {
	ModalService,
	TransferList,
	UiButtonComponent,
	UiTransferListComponent
} from '@agroseguro/lib-ui-agroseguro';
import { Subject, takeUntil } from 'rxjs';
import { PlanLineaService } from '../../../../../core/services/plan-linea.service';
import { PlanService } from '../../../../../core/services/plan.service';
import type {
	iRiesgo,
	PlanLinea,
	PlanLineaRiesgo
} from '../../../../../core/interfaces/general.interface';
import { GrupoSeguroService } from '../../../../../core/services/grupo-seguro.service';

@Component({
	selector: 'app-modal-anadir-riesgos',
	standalone: true,
	imports: [ReactiveFormsModule, UiTransferListComponent, UiButtonComponent],
	templateUrl: './modal-anadir-riesgos.component.html',
	styleUrl: './modal-anadir-riesgos.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalAnadirEliminarRiesgosComponent implements OnDestroy {
	title = 'Añade o elimina los Riesgos que deseas configurar';

	public modalOutput = output<TransferList[]>();

	//Subject para manejar la destrucción de suscripciones
	#destroy$ = new Subject<void>();

	readonly #planLineaService = inject(PlanLineaService);
	readonly #planService = inject(PlanService);
	readonly #modalService = inject(ModalService);
	readonly #grupoSeguroService = inject(GrupoSeguroService);

	public grupoSeguro = computed(() => this.#grupoSeguroService.grupoSeguro());
	public linea = computed(() => this.#grupoSeguroService.linea());
	public plan = computed(() => this.#grupoSeguroService.plan());
	planLinea = signal<PlanLinea>({
		idPlanLinea: '',
		idLinea: '',
		descripcionLinea: '',
		plan: 0
	});

	//idRiesgo + descripcionRiesgo
	listRiesgosPreviousStored = signal<PlanLineaRiesgo[]>([]);
	private snapshotPrevios = signal<PlanLineaRiesgo[]>([]);
	listRiesgosToStoreTransferList = signal<TransferList[]>([]);
	//codRiesgo + descripcion
	listAllRiesgos = signal<iRiesgo[]>([]);

	leftListSetted = signal<boolean>(false);
	rightListSetted = signal<boolean>(false);
	leftData = signal<string[]>([]);
	rightData = signal<string[]>([]);

	onLoadRiesgosError = signal<boolean>(false);
	onLoadRiesgosPreviosError = signal<boolean>(false);

	constructor() {
		this.getAllRiesgos(this.grupoSeguro().id);
	}

	cancel() {
		this.#modalService.close();
	}

	transformListAllRiesgos() {
		const left = this.listAllRiesgos().map((r) => `${r.codigoRiesgo} - ${r.descripcion}`);
		this.leftData.set(left);
		this.leftListSetted.set(true);
	}

	transformListRiesgosPreviousStoredAndRemoveFromAllListRiesgos() {
		const right = this.listRiesgosPreviousStored().map(
			(r) => `${r.idRiesgo} - ${r.descripcionRiesgo}`
		);
		this.rightData.set(right);

		// Eliminar los riesgos que ya están en la lista de riesgos previos de la lista de todos los riesgos
		this.leftData.set(this.leftData().filter((item1) => !this.rightData().includes(item1)));

		this.rightListSetted.set(true);
	}

	onListChanges(event: { leftData: TransferList[]; rightData: TransferList[] }) {
		this.listRiesgosToStoreTransferList.set(event.rightData);
	}

	updateRiesgos() {
		const idPlanLinea = this.planLinea().idPlanLinea;
		const listRiesgos = this.listRiesgosToStoreTransferList().map(
			(r) => `${r.description}`.split(' - ')[0]
		);

		this.#planLineaService
			.updateRiesgos(idPlanLinea, listRiesgos)
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: () => {
					this.modalOutput.emit(this.listRiesgosToStoreTransferList());
				},
				error: () => {
					this.modalOutput.emit([]);
				}
			});
	}

	getPlanLinea(idPlan: string, idLinea: string) {
		this.#planService
			.getPlanLinea(idPlan, idLinea)
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: (planLinea) => {
					this.planLinea.set(planLinea);
					this.getRiesgosPrevios(planLinea.idPlanLinea);
				},
				error: (error) => {
					if (error.status === 404) {
						this.createPlanLinea(idPlan, idLinea);
					}
				}
			});
	}

	createPlanLinea(idPlan: string, idLinea: string) {
		this.#planService
			.postPlanLinea(idPlan, idLinea)
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: (planLinea) => {
					this.planLinea.set(planLinea);
					this.getRiesgosPrevios(planLinea.idPlanLinea);
				}
			});
	}

	getRiesgosPrevios(idPlanLinea: string) {
		this.#planLineaService
			.getRiesgos(idPlanLinea)
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: (riesgos) => {
					this.listRiesgosPreviousStored.set(riesgos);
					this.snapshotPrevios.set(riesgos);
					this.transformListRiesgosPreviousStoredAndRemoveFromAllListRiesgos();
				},
				error: () => {
					this.onLoadRiesgosPreviosError.set(true);
				}
			});
	}

	getAllRiesgos(idGrupoSeguro: string) {
		let queryString = '?page=0&size=101';
		this.#grupoSeguroService
			.getRiesgosPorGrupo(idGrupoSeguro, queryString)
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: (riesgos) => {
					this.listAllRiesgos.set(riesgos.content);
					this.transformListAllRiesgos();
					this.getPlanLinea(this.plan(), this.linea().id);
				},
				error: () => {
					this.onLoadRiesgosError.set(true);
				}
			});
	}

	//Nos desuscribimos de todas las suscripciones al destruir el componente
	ngOnDestroy() {
		this.#destroy$.next(); // Notifica a los observables que deben cerrarse
		this.#destroy$.complete(); // Cierra el subject
	}
}
