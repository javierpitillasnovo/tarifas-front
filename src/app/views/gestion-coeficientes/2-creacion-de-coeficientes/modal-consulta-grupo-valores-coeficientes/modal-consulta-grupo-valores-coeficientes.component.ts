import { ChangeDetectionStrategy, Component, inject, input, output, signal, OnDestroy } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import {
	getInputValue,
	ModalService,
	UiButtonComponent,
	UiSelectComponent
} from '@agroseguro/lib-ui-agroseguro';
import { Subject, takeUntil } from 'rxjs';
import { GrupoValoresCoeficientes, iFactorCoeficienteUI } from '../../../../../core/interfaces/general.interface';
import { GestionFactoresService } from '../../../../../core/services/gestion-factores.service';

@Component({
  selector: 'app-modal-consulta-grupo-valores-coeficientes',
  standalone: true,
  imports: [ReactiveFormsModule, UiButtonComponent, UiSelectComponent],
  templateUrl: './modal-consulta-grupo-valores-coeficientes.component.html',
  styleUrl: './modal-consulta-grupo-valores-coeficientes.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalConsultaGrupoValoresCoeficientesComponent implements OnDestroy {

  readonly #gestionFactoresService = inject(GestionFactoresService);
  readonly #modalService = inject(ModalService);

  #destroy$ = new Subject<void>();

  public factorCoeficiente = input.required<iFactorCoeficienteUI>();
  public idsValoresCultivo = input<(string | number)[]>([]);
  public modalOutput = output<boolean>();

  listAllGruposValores = signal<GrupoValoresCoeficientes[]>([]);
  listAllGruposValoresSelect = signal<{ text: string; value: string }[]>([]);
  onLoadGruposValoresError = signal<boolean>(false);
  valores = signal<string>("");

  ngOnInit() {
    this.getAllGruposValores(this.factorCoeficiente().idFactorCoeficiente);
  }

  /**
   * Recupera todos los grupos de valores para un factor de coeficiente
   */
  getAllGruposValores(idFactorCoeficiente: string) {
    const ids = this.idsValoresCultivo() ?? [];
    this.#gestionFactoresService
      .getGruposValoresFactorCoeficiente(idFactorCoeficiente, ids)
      .pipe(takeUntil(this.#destroy$))
      .subscribe({
        next: (gruposValores) => {
          const grupos = gruposValores.filter((grupo) => grupo.valores.length > 1);

          this.listAllGruposValores.set(grupos);
          this.listAllGruposValoresSelect.set(
            grupos.map((grupo) => ({
              text: grupo.nombre,
              value: grupo.idGrupo
            }))
          );
        },
        error: () => {
          this.onLoadGruposValoresError.set(true);
        }
      });
  }

  /**
   * Muestra las descripciones de los valores del grupo seleccionado
   */
  getValores(event: Event) {
    const idGrupoValores = getInputValue(event);
    const grupoValores = this.listAllGruposValores().find(grupo => grupo.idGrupo === idGrupoValores);
    this.valores.set(grupoValores?.valores.map(valor => valor.descripcion).join(', ') || '');
  }

  cancel() {
    this.#modalService.close();
  }

  ngOnDestroy() {
    this.#destroy$.next();
    this.#destroy$.complete();
  }
}
