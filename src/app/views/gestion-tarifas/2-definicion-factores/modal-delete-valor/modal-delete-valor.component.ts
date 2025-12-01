import type { OnDestroy } from '@angular/core';
import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ModalService, UiButtonComponent } from '@agroseguro/lib-ui-agroseguro';
import { Subject, takeUntil } from 'rxjs';
import { GrupoValores, PlanLineaRiesgo } from '../../../../../core/interfaces/general.interface';
import { PlanLineaRiesgoService } from '../../../../../core/services/plan-linea-riesgo.service';
import { GestionFactoresService } from '../../../../../core/services/gestion-factores.service';

@Component({
	selector: 'app-modal-delete-valor',
	standalone: true,
	imports: [ReactiveFormsModule, UiButtonComponent],
	templateUrl: './modal-delete-valor.component.html',
	styleUrl: './modal-delete-valor.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalDeleteValorComponent implements OnDestroy {
		readonly #gestionFactoresService = inject(GestionFactoresService);
		readonly #modalService = inject(ModalService);

	//Subject para manejar la destrucción de suscripciones
	#destroy$ = new Subject<void>();

	public valor = input.required<GrupoValores>();
	public modalOutput = output<boolean>();

	constructor() { }

	deleteValor() {
		this.#gestionFactoresService.deleteGrupoValores(this.valor().idGrupo)
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
