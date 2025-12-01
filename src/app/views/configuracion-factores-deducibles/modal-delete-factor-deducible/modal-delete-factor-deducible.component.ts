import type { OnDestroy } from '@angular/core';
import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ModalService, UiButtonComponent } from '@agroseguro/lib-ui-agroseguro';
import { Subject, takeUntil } from 'rxjs';
import { iFactorDeducible } from '../../../../core/interfaces/general.interface';
import { GruposFactoresService } from '../../../../core/services/grupos-factores.service';

@Component({
	selector: 'app-modal-delete-factor-deducible',
	standalone: true,
	imports: [ReactiveFormsModule, UiButtonComponent],
	templateUrl: './modal-delete-factor-deducible.component.html',
	styleUrl: './modal-delete-factor-deducible.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalDeleteFactorDeducibleComponent implements OnDestroy {

	readonly #gruposFactoresService = inject(GruposFactoresService);
	readonly #modalService = inject(ModalService);

	//Subject para manejar la destrucción de suscripciones
	#destroy$ = new Subject<void>();

	public factorDeducible = input.required<iFactorDeducible>();
	public modalOutput = output<boolean>();

	constructor() { }

	deleteValor() {
		this.#gruposFactoresService.deleteFactorDeducible(this.factorDeducible().idGrupo)
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
		this.modalOutput.emit(false);
	}
}
