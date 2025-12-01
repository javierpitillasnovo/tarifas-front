import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { UiTransferListComponent, UiButtonComponent } from '@agroseguro/lib-ui-agroseguro';
import { GestionFactoresService } from '../../../../../core/services/gestion-factores.service';
import { ModalService, NotificationService } from '@agroseguro/lib-ui-agroseguro';
import { Subject, takeUntil } from 'rxjs';

@Component({
	selector: 'app-modal-aplicar-coeficientes',
	standalone: true,
	imports: [UiTransferListComponent, UiButtonComponent],
	templateUrl: './modal-aplicar-coeficientes.component.html',
	styleUrl: './modal-aplicar-coeficientes.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalAplicarCoeficientesComponent {
	public idCombinacionTarifaSimple = input.required<string>();
	public idPlanLinea = input.required<string>();

	private destroy$ = new Subject<void>();

	readonly #gestionFactoresService = inject(GestionFactoresService);
	readonly #modalService = inject(ModalService);
	readonly #notif = inject(NotificationService);

	// Objetos completos
	private leftDataObjects = signal<any[]>([]);
	private rightDataObjects = signal<any[]>([]);

	// arrays usados x UI
	leftData = signal<string[]>([]);
	rightData = signal<string[]>([]);

	loading = signal<boolean>(true);

	ngOnInit() {
		this.loadData();
	}

	loadData() {
		this.#gestionFactoresService
			.getCoeficientes(this.idPlanLinea())
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (left) => {
					this.leftDataObjects.set(left);
					this.leftData.set(left.map((o) => o.nombreCoeficiente));
				}
			});

		this.#gestionFactoresService
			.getCoeficientesCombinacion(this.idCombinacionTarifaSimple())
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (right) => {
					this.rightDataObjects.set(right);

					const rightIds = right.map((r) => r.idCoeficienteLinea);

					const filteredLeft = this.leftDataObjects().filter(
						(l) => !rightIds.includes(l.idCoeficiente)
					);

					this.leftDataObjects.set(filteredLeft);

					this.leftData.set(filteredLeft.map((l) => l.nombreCoeficiente));
					this.rightData.set(right.map((r) => r.nombreCoeficiente));
				},
				complete: () => this.loading.set(false)
			});
	}

	onListsChanges(ev: any) {
		const newRightNames = ev.rightData.map((x: any) => x.description);

		this.rightData.set(newRightNames);

		const allObjects = [...this.leftDataObjects(), ...this.rightDataObjects()];

		const newRightObjects = allObjects.filter((o) => newRightNames.includes(o.nombreCoeficiente));

		this.rightDataObjects.set(newRightObjects);

		const filteredLeft = allObjects.filter((o) => !newRightNames.includes(o.nombreCoeficiente));

		this.leftDataObjects.set(filteredLeft);

		this.leftData.set(filteredLeft.map((o) => o.nombreCoeficiente));
	}

	apply() {
		const ids = this.rightDataObjects().map((o) => o.idCoeficienteLinea ?? o.idCoeficiente);

		this.#gestionFactoresService
			.assignCoeficientesToTarifaSimple(this.idCombinacionTarifaSimple(), ids)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: () => {
					this.#notif.showNotification({
						message: signal('Coeficientes aplicados correctamente'),
						hasError: signal(false)
					});

					this.#modalService.close();
				},
				error: () => {
					this.#notif.showNotification({
						message: signal('Error al guardar coeficientes'),
						hasError: signal(true)
					});
				}
			});
	}

	cancel() {
		this.#modalService.close();
	}

	ngOnDestroy() {
		this.destroy$.next();
		this.destroy$.complete();
	}
}
