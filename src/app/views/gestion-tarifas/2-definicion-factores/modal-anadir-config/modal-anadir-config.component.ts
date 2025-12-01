import type { OnDestroy } from '@angular/core';
import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UiButtonComponent, UiInputComponent } from '@agroseguro/lib-ui-agroseguro';
import { takeUntil, Subject } from 'rxjs';
import { VersionesService } from '../../../../../core/services/versiones.service';
import { PlanLineaRiesgoVersion } from '../../../../../core/interfaces/general.interface';

@Component({
	selector: 'app-modal-anadir-config',
	standalone: true,
	imports: [ReactiveFormsModule, UiInputComponent, UiButtonComponent],
	templateUrl: './modal-anadir-config.component.html',
	styleUrl: './modal-anadir-config.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalAnadirConfigComponent implements OnDestroy {
	readonly #versionesService = inject(VersionesService);

	//Subject para manejar la destrucción de suscripciones
	#destroy$ = new Subject<void>();

	public idPlanLineaRiesgo = input.required<number>();
	public modalOutput = output<PlanLineaRiesgoVersion>();
	public versionForm!: FormGroup;

	constructor() {
		this.versionForm = new FormGroup({
			version: new FormControl('', [Validators.required])
		});
	}

	addVersion() {
		const description = this.versionForm.get('version')?.value;
		this.#versionesService
			.newVersion(description, this.idPlanLineaRiesgo())
			.pipe(takeUntil(this.#destroy$))
			.subscribe((res) => this.modalOutput.emit(res));
	}

	//Nos desuscribimos de todas las suscripciones al destruir el componente
	ngOnDestroy() {
		this.#destroy$.next(); // Notifica a los observables que deben cerrarse
		this.#destroy$.complete(); // Cierra el subject
	}
}
