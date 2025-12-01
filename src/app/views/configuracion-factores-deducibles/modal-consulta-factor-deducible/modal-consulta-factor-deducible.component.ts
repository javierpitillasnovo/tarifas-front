import type { OnDestroy } from '@angular/core';
import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import {
	getInputValue,
	ModalService,
	UiButtonComponent,
	UiSelectComponent
} from '@agroseguro/lib-ui-agroseguro';
import { Subject } from 'rxjs';
import { iFactorDeducible } from '../../../../core/interfaces/general.interface';


@Component({
	selector: 'app-modal-consulta-factor-deducible',
	standalone: true,
	imports: [UiButtonComponent, UiSelectComponent],
	templateUrl: './modal-consulta-factor-deducible.component.html',
	styleUrl: './modal-consulta-factor-deducible.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalConsultaFactorDeducibleComponent implements OnDestroy {
	readonly #modalService = inject(ModalService);

	//Subject para manejar la destrucción de suscripciones
	#destroy$ = new Subject<void>();

	public listAllFactoresDeducibles = input.required<iFactorDeducible[]>();
	public idFactorDeducible = input.required<string>();
	public modalOutput = output<boolean>();

	listAllFactoresDeduciblesSelectLoaded = signal<boolean>(false);
	listAllFactoresDeduciblesSelect = signal<{ text: string; value: string }[]>([]);
	onLoadFactoresDeduciblesError = signal<boolean>(false);
	valores = signal<string>('');

	constructor() {}

	ngOnInit() {
		this.listAllFactoresDeduciblesSelect.set(
			this.listAllFactoresDeducibles()
				.filter((grupo) => grupo.factores.length > 1)
				.map((grupo) => ({
					text: grupo.nombre,
					value: grupo.idGrupo
				}))
		);
		this.setValores(this.idFactorDeducible());
		this.listAllFactoresDeduciblesSelectLoaded.set(true);
	}

	getValores(event: Event) {
		const idFactorDeducible = getInputValue(event);
		this.setValores(idFactorDeducible);
	}

	setValores(idFactorDeducible: string) {
		const factorDeducible = this.listAllFactoresDeducibles().find(
			(factor) => factor.idGrupo === idFactorDeducible
		);
		this.valores.set(factorDeducible?.factores.map((valor) => valor.nombreFactor).join(', ') || '');
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
