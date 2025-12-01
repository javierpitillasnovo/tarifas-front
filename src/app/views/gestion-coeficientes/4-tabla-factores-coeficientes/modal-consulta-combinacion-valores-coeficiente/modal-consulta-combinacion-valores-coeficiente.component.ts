import { ChangeDetectionStrategy, Component, inject, input, OnDestroy, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import {
	ModalService,
	UiButtonComponent,
	UiSelectComponent,
	getInputValue
} from '@agroseguro/lib-ui-agroseguro';
import { Subject, takeUntil } from 'rxjs';
import { GestionFactoresService } from '../../../../../core/services/gestion-factores.service';

import {
  GrupoValoresCoeficientes,
  iFactorCoeficiente,
  iCombinacionFactorCoeficientes
} from '../../../../../core/interfaces/general.interface';

@Component({
  selector: 'app-modal-consulta-combinacion-valores-coeficiente',
  standalone: true,
  imports: [ReactiveFormsModule, UiButtonComponent, UiSelectComponent],
  templateUrl: './modal-consulta-combinacion-valores-coeficiente.component.html',
  styleUrl: './modal-consulta-combinacion-valores-coeficiente.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalConsultaCombinacionValoresCoeficienteComponent implements OnInit, OnDestroy {

  readonly #modalService = inject(ModalService);
  readonly #gestionFactoresService = inject(GestionFactoresService);
  readonly #destroy$ = new Subject<void>();

  // Inputs desde el componente padre
  public combinacion = input.required<iCombinacionFactorCoeficientes>();
  public factores = input.required<iFactorCoeficiente[]>();
  public idsCultivo = input<(string | number)[]>([]);


  // Signals UI
  selectedFactor = signal<iFactorCoeficiente | null>(null);
  listGruposValores = signal<GrupoValoresCoeficientes[]>([]);
  listGruposValoresSelect = signal<{ text: string; value: string }[]>([]);
  valores = signal<string>('');

  ngOnInit(): void { }

  get factoresSelectOptions() {
    return this.factores().map(f => ({
      text: f.descripcionFactor || f.descripcionDeducible,
      value: f.idFactorCoeficiente
    }));
  }

  onSelectFactor(event: Event) {
    const idFactor = getInputValue(event);
    const factorEncontrado = this.factores().find(f => f.idFactorCoeficiente === idFactor);

    if (!factorEncontrado) {
      this.selectedFactor.set(null);
      this.listGruposValores.set([]);
      this.listGruposValoresSelect.set([]);
      this.valores.set('');
      return;
    }

    this.selectedFactor.set(factorEncontrado);
    this.cargarGrupos(factorEncontrado.idFactorCoeficiente);
  }

  cargarGrupos(idFactorCoeficiente: string) {
    const ids = this.idsCultivo() ?? [];
    this.#gestionFactoresService
      .getGruposValoresFactorCoeficiente(idFactorCoeficiente, ids)
      .pipe(takeUntil(this.#destroy$))
      .subscribe({
        next: (grupos) => {
          this.listGruposValores.set(grupos);
          this.listGruposValoresSelect.set(
            grupos.map(g => ({ text: g.nombre, value: g.idGrupo }))
          );
        },
        error: () => console.error('Error al cargar los grupos de valores')
      });
  }

  mostrarValores(event: Event) {
    const idGrupo = getInputValue(event);
    const grupo = this.listGruposValores().find(g => g.idGrupo === idGrupo);
    this.valores.set(
      grupo?.valores?.map(v => v.descripcion).join(', ') ?? ''
    );
  }

  cerrar() {
    this.#modalService.close();
  }

  ngOnDestroy() {
    this.#destroy$.next();
    this.#destroy$.complete();
  }
}
