import type { OnDestroy, OnInit } from '@angular/core';
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
import { GestionFactoresService } from '../../../../../core/services/gestion-factores.service';


@Component({
	selector: 'app-modal-consulta-valores-tarifas',
	standalone: true,
	imports: [ReactiveFormsModule, UiButtonComponent, UiSelectComponent],
	templateUrl: './modal-consulta-valores-tarifas.component.html',
	styleUrl: './modal-consulta-valores-tarifas.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalConsultaValoresTarifasComponent implements OnInit, OnDestroy {
	readonly #gestionFactoresService = inject(GestionFactoresService);
	readonly #modalService = inject(ModalService);
	readonly #destroy$ = new Subject<void>();

	// Inputs
	public riesgo = input.required<PlanLineaRiesgo>();
	public factores = input.required<FactorTarifa[]>(); // lista de factores disponibles
	public idsValoresUnicos = input.required<string[]>();
	public modalOutput = output<boolean>();

	// Signals
	selectedFactor = signal<FactorTarifa | null>(null);
	listAllGruposValores = signal<GrupoValores[]>([]);
	listAllGruposValoresSelect = signal<{ text: string; value: string }[]>([]);
	valores = signal<string>('');

	ngOnInit(): void {}

    // Mapeo el contenido de factores para el select
    get factoresSelectOptions() {
        return this.factores().map((f) => ({
					text: f.idDeducible ? f.descripcionDeducible ?? '' : f.descripcionFactor ?? '',
					value: f.idFactorTarifa
				}));
    }


	// Evento al seleccionar un factor
    onSelectFactor(event: Event): void {
        const idFactor = getInputValue(event);
        const factor = this.factores().find(f => f.idFactorTarifa === idFactor);

        if (factor) {
            this.selectedFactor.set(factor);
            this.valores.set(''); // Limpiamos los valores anteriores al cambiar factor
            this.listAllGruposValores.set([]);
            this.listAllGruposValoresSelect.set([]);
            this.getAllGruposValores(factor.idFactorTarifa);
        } else {
            this.selectedFactor.set(null);
            this.listAllGruposValores.set([]);
            this.listAllGruposValoresSelect.set([]);
            this.valores.set('');
        }
    }

	// Carga los grupos de valores del factor seleccionado
	getAllGruposValores(idFactorTarifa: string): void {
		this.#gestionFactoresService
			.getGrupoValoresFactorTarifa(idFactorTarifa, this.#gestionFactoresService.FACTOR_TIPO_SIMPLE, this.idsValoresUnicos())
			.pipe(takeUntil(this.#destroy$))
			.subscribe({
				next: (gruposValores) => {
					const gruposFiltrados = gruposValores.filter((grupo) => grupo.valores && grupo.valores.length > 0);
					this.listAllGruposValores.set(gruposFiltrados);
					this.listAllGruposValoresSelect.set(
						gruposFiltrados.map((grupo) => ({
							text: grupo.nombre,
							value: grupo.idGrupo
						}))
					);
				},
				error: () => {
                    // Prodria agregarse una señal para manejar el error en la UI
					console.error('Error al cargar grupos de valores');
				}
			});
	}

	// Al seleccionar un grupo, mostrar sus valores
    getValores(event: Event): void {
        const idGrupoValores = getInputValue(event);
        const grupoValores = this.listAllGruposValores().find((grupo) => grupo.idGrupo === idGrupoValores);
        this.valores.set(grupoValores?.valores.map((valor) => valor.descripcion).join(', ') || '');
    }
	cancel(): void {
		this.#modalService.close();
	}

	ngOnDestroy(): void {
		this.#destroy$.next();
		this.#destroy$.complete();
	}
}
