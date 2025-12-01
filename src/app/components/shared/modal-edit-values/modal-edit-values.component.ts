import { ChangeDetectionStrategy, Component, inject, signal, input } from '@angular/core';

import {
	UiInputComponent,
	UiButtonComponent,
	UiRadioComponent,
	NotificationService,
	ModalService
} from '@agroseguro/lib-ui-agroseguro';
import type { Observable } from 'rxjs';

// Interfaz común
export interface UpdateCombinacionesService {
	updateValues(body: {
		operacion: string;
		valor: number;
		combinaciones: string[];
	}): Observable<any>;
}

@Component({
	selector: 'app-modal-edit-values',
	standalone: true,
	imports: [UiInputComponent, UiButtonComponent, UiRadioComponent],
	templateUrl: './modal-edit-values.component.html',
	styleUrl: './modal-edit-values.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalEditValuesComponent {
	public combinaciones = input.required<[{ id: string; value: number }]>();
	public title = input.required<string>();
	public service = input.required<UpdateCombinacionesService>();

	readonly #notificationsService = inject(NotificationService);
	readonly #modalService = inject(ModalService);

	/** Valor del input */
	valor = signal<number>(0);

	operacion = signal<string>('');

	/** Opciones visibles del radio */
	public operacionesOptions = ['Sumar', 'Restar', 'Multiplicar', 'Dividir', 'Asignar valor fijo'];

	private operacionMap: Record<string, string> = {
		Sumar: '+',
		Restar: '-',
		Multiplicar: '*',
		Dividir: '/',
		'Asignar valor fijo': '='
	};

	/** Recibe palabra desde ui-radio */
	onOperacionChange(selected: string) {
		this.operacion.set(selected);
	}

	cerrar() {
		this.#modalService.close();
	}

	onValorChange(v: string | number) {
		this.valor.set(Number(v));
	}

	checkNegativeSubtraction(val: number): boolean {
		const combinacionesNegativas = this.combinaciones().filter((c) => c.value - val < 0);

		if (combinacionesNegativas.length > 0) {
			this.#notificationsService.showNotification({
				message: signal('La resta provocaría valores negativos en algunos valores.'),
				hasError: signal(true)
			});
			return true;
		}
		return false;
	}

	guardar() {
		const val = Number(this.valor());
		const opText = this.operacion();

		if (!opText) {
			this.#notificationsService.showNotification({
				message: signal('Debes seleccionar una operación.'),
				hasError: signal(true)
			});
			return;
		}

		/** Convertir palabra en simbolo */
		const opSymbol = this.operacionMap[opText] ?? '+';

		/** Validaciones del valor */
		if (isNaN(val)) {
			this.#notificationsService.showNotification({
				message: signal('El valor debe ser numérico.'),
				hasError: signal(true)
			});
			return;
		}

		if (val <= 0) {
			this.#notificationsService.showNotification({
				message: signal('El valor debe ser mayor que 0.'),
				hasError: signal(true)
			});
			return;
		}

		if (opSymbol === '-' && this.checkNegativeSubtraction(val)) {
			return;
		}

		const body = {
			operacion: opSymbol,
			valor: val,
			combinaciones: this.combinaciones().map((c) => c.id)
		};

		this.service()
			.updateValues(body)
			.subscribe({
				next: () => {
					this.#modalService.close({
						operacion: opSymbol,
						valor: val
					});
				},
				error: () => {
					this.#notificationsService.showNotification({
						message: signal('Error actualizando'),
						hasError: signal(true)
					});
				}
			});
	}
}
