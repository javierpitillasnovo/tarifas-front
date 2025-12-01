import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import {
	ModalService,
	UiButtonComponent,
	UiSelectComponent,
	getInputValue
} from '@agroseguro/lib-ui-agroseguro';
import { Subject, takeUntil } from 'rxjs';
import { PlanService } from '../../../../../core/services/plan.service';
import { SelectOption } from '@agroseguro/lib-ui-agroseguro';

@Component({
	selector: 'app-modal-copiar-coeficientes',
	standalone: true,
	imports: [ReactiveFormsModule, UiButtonComponent, UiSelectComponent],
	templateUrl: './modal-copiar-coeficientes-otro-plan.component.html',
	styleUrl: './modal-copiar-coeficientes-otro-plan.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalCopiarCoeficientesOtroPlanComponent implements OnInit, OnDestroy {
	readonly #planService = inject(PlanService);
	readonly #modalService = inject(ModalService);
	readonly #destroy$ = new Subject<void>();

	public planSelectOptions = signal<SelectOption[]>([]);
	public selectedPlan = signal<string>('');

	ngOnInit(): void {
		this.#planService
			.getPlanes()
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: (opts) => this.planSelectOptions.set(opts),
				error: () => console.error('Error al cargar los planes')
			});
	}

	onSelectPlan(event: Event): void {
		const value = getInputValue(event);
		this.selectedPlan.set(value);
	}

	cancel(): void {
		this.#modalService.close();
	}

	accept(): void {
		// Emitir el plan seleccionado o realizar la acción deseada
		this.#modalService.close(this.selectedPlan());
	}

	ngOnDestroy(): void {
		this.#destroy$.next();
		this.#destroy$.complete();
	}
}
