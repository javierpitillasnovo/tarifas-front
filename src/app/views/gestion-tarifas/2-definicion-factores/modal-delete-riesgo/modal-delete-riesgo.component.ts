import type { OnDestroy } from '@angular/core';
import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ModalService, UiButtonComponent } from '@agroseguro/lib-ui-agroseguro';
import { Subject, takeUntil } from 'rxjs';
import { PlanLineaRiesgo } from '../../../../../core/interfaces/general.interface';
import { PlanLineaRiesgoService } from '../../../../../core/services/plan-linea-riesgo.service';

@Component({
	selector: 'app-modal-delete-riesgo',
	standalone: true,
	imports: [ReactiveFormsModule, UiButtonComponent],
	templateUrl: './modal-delete-riesgo.component.html',
	styleUrl: './modal-delete-riesgo.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalDeleteRiesgoComponent implements OnDestroy {
		readonly #planLineaRiesgoService = inject(PlanLineaRiesgoService);
		readonly #modalService = inject(ModalService);

	//Subject para manejar la destrucción de suscripciones
	#destroy$ = new Subject<void>();

	public riesgo = input.required<PlanLineaRiesgo>();
	public modalOutput = output<boolean>();

	constructor() { }

	deleteRiesgo() {
		this.#planLineaRiesgoService.deleteRiesgo(this.riesgo().idPlanLineaRiesgo)
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: () => {
					this.modalOutput.emit(true);
				},
				error: () => {
					this.modalOutput.emit(false);
				}
			});
	}

	//Nos desuscribimos de todas las suscripciones al destruir el componente
	ngOnDestroy() {
		this.#destroy$.next(); // Notifica a los observables que deben cerrarse
		this.#destroy$.complete(); // Cierra el subject
	}

	cancel() {
		this.#modalService.close();
	}
}
