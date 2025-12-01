import type { OnDestroy } from '@angular/core';
import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import {
	getInputValue,
	ModalService,
	UiButtonComponent,
	UiSelectComponent
} from '@agroseguro/lib-ui-agroseguro';
import { Subject, takeUntil } from 'rxjs';
import { FactorTarifa, GrupoValores, PlanLineaRiesgo } from '../../../../../core/interfaces/general.interface';
import { PlanLineaRiesgoService } from '../../../../../core/services/plan-linea-riesgo.service';
import { GestionFactoresService } from '../../../../../core/services/gestion-factores.service';

@Component({
	selector: 'app-modal-consulta-grupo-valores',
	standalone: true,
	imports: [ReactiveFormsModule, UiButtonComponent, UiSelectComponent],
	templateUrl: './modal-consulta-grupo-valores.component.html',
	styleUrl: './modal-consulta-grupo-valores.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalConsultaGrupoValoresComponent implements OnDestroy {
		readonly #gestionFactoresService = inject(GestionFactoresService);
		readonly #modalService = inject(ModalService);

	//Subject para manejar la destrucción de suscripciones
	#destroy$ = new Subject<void>();

	public factorTarifa = input.required<FactorTarifa>();
	public riesgo = input.required<PlanLineaRiesgo>();
	public tipoFactor = input.required<string>();
	public idsValoresUnicos = input.required<string[]>();
	public modalOutput = output<boolean>();

	listAllGruposValores = signal<GrupoValores[]>([]);
	listAllGruposValoresSelect = signal<{ text: string; value: string }[]>([]);
	onLoadGruposValoresError = signal<boolean>(false);
	valores = signal<string>("");

	constructor() { }

	ngOnInit() {
		this.getAllGruposValores(this.factorTarifa().idFactorTarifa);
	}

	getAllGruposValores(idFactorTarifa: string) {
		this.#gestionFactoresService
			.getGrupoValoresFactorTarifa(idFactorTarifa, this.tipoFactor(), this.idsValoresUnicos())
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: (gruposValores) => {
					this.listAllGruposValores.set(gruposValores
						.filter((grupo) => grupo.valores.length > 1));
					this.listAllGruposValoresSelect.set(gruposValores
						.filter((grupo) => grupo.valores.length > 1)
						.map((grupo) => ({
							text: grupo.nombre,
							value: grupo.idGrupo
						})));
				},
				error: () => {
					this.onLoadGruposValoresError.set(true);
				}
			});
	}

	getValores(event: Event) {
		const idGrupoValores = (getInputValue(event));
		const grupoValores = this.listAllGruposValores().find(grupo => grupo.idGrupo === idGrupoValores);
		this.valores.set(grupoValores?.valores.map(valor => valor.descripcion).join(", ") || "");
		console.log(this.valores());
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
