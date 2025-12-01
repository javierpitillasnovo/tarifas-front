import type { OnDestroy } from '@angular/core';
import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ModalService, UiButtonComponent } from '@agroseguro/lib-ui-agroseguro';
import { Subject, takeUntil } from 'rxjs';
import { iCombinacionFactorValorTarifa, PlanLineaRiesgo } from '../../../../../core/interfaces/general.interface';
import { PlanLineaRiesgoService } from '../../../../../core/services/plan-linea-riesgo.service';
import { VersionesService } from '../../../../../core/services/versiones.service';

@Component({
	selector: 'app-modal-delete-riesgo-tarificado',
	standalone: true,
	imports: [ReactiveFormsModule, UiButtonComponent],
	templateUrl: './modal-delete-riesgo-tarificado.component.html',
	styleUrl: './modal-delete-riesgo-tarificado.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalDeleteRiesgoTarificadoComponent implements OnDestroy {
		readonly #versionesService = inject(VersionesService);
		readonly #modalService = inject(ModalService);

	//Subject para manejar la destrucción de suscripciones
	#destroy$ = new Subject<void>();

	public combinacionFactor = input.required<iCombinacionFactorValorTarifa>();
	public modalOutput = output<boolean>();

	constructor() { }

	deleteRiesgo() {
		this.#versionesService.deleteCombinacionFactorValorTarifa(this.combinacionFactor().id as string)
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
