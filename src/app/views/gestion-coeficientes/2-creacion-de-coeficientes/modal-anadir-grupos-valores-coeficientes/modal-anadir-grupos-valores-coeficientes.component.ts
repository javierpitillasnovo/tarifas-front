import { ChangeDetectionStrategy, Component, inject, input, output, signal, OnInit, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
	ModalService,
	UiInputComponent,
	UiButtonComponent,
	UiTransferListComponent,
	TransferList
} from '@agroseguro/lib-ui-agroseguro';
import { Subject, takeUntil } from 'rxjs';
import type { iFactorCoeficiente, ValorFactor } from '../../../../../core/interfaces/general.interface';
import { GestionFactoresService } from '../../../../../core/services/gestion-factores.service';

@Component({
  selector: 'app-modal-anadir-grupos-valores-coeficientes',
  standalone: true,
  imports: [ReactiveFormsModule, UiTransferListComponent, UiButtonComponent, UiInputComponent],
  templateUrl: './modal-anadir-grupos-valores-coeficientes.component.html',
  styleUrl: './modal-anadir-grupos-valores-coeficientes.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalAnadirGruposValoresCoeficientesComponent implements OnInit, OnDestroy {

  public factorCoeficiente = input.required<iFactorCoeficiente>();
  public modalOutput = output<TransferList[]>();
  public editMode = input<boolean>(false);
  public grupoValoresEdit = input<any>();
  public idsValoresCultivo = input<(string | number)[]>([]);



  // Subject para limpiar suscripciones
  #destroy$ = new Subject<void>();

  // Inyecciones
  readonly #modalService = inject(ModalService);
  readonly #gestionFactoresService = inject(GestionFactoresService);

  // Signals
  listValoresDisponibles = signal<ValorFactor[]>([]);
  listTransferList = signal<TransferList[]>([]);
  leftListSetted = signal<boolean>(false);
  leftData = signal<string[]>([]);
  rightData = signal<string[]>([]);
  onLoadValoresError = signal<boolean>(false);

  // Formulario
  public nameForm!: FormGroup;
  characterToSplitName = '-';

  constructor() {
    this.nameForm = new FormGroup({
      name: new FormControl('', [Validators.required])
    });
  }

  ngOnInit() {
    this.loadValoresDelFactor();
    if (this.editMode() && this.grupoValoresEdit()) {
      this.nameForm.get('name')?.setValue(this.grupoValoresEdit().nombre);

      const rightList = this.grupoValoresEdit().valores.map(
        (v: any) => `${v.idValor}-${v.descripcion}`
      );
      this.rightData.set(rightList);
      this.listTransferList.set(rightList.map((d: any) => ({ description: d })));
    }
  }

  /**
   * Carga los valores disponibles para este factor de coeficiente
   */
  private loadValoresDelFactor() {
    this.#gestionFactoresService
      .getValoresFactorCoeficiente(this.factorCoeficiente().idFactorCoeficiente, this.idsValoresCultivo())
      .pipe(takeUntil(this.#destroy$))
      .subscribe({
        next: (valores: ValorFactor[]) => {
          this.listValoresDisponibles.set(valores);
          this.transformListValores();
        },
        error: () => this.onLoadValoresError.set(true),
      });
  }

  cancel() {
    this.#modalService.close();
  }

  /**
   * Transforma la lista de valores a texto para el transfer list
   */
  private transformListValores() {
    const left = this.listValoresDisponibles().map(v => {
      const cultivo = v.denominacionCultivo ? `${v.denominacionCultivo} ` : '';
      return `${cultivo}${v.idValor}${this.characterToSplitName}${v.descripcionValor}`;
    });

    this.leftData.set(left);
    this.leftListSetted.set(true);
  }

  private getTextAfterFirstDash(description: string): string {
    const parts = description.split(this.characterToSplitName);
    if (parts.length < 2) return '';
    return parts.slice(1).join(this.characterToSplitName).trim();
  }

  /**
   * Maneja los cambios en las listas del transfer list
   */
  onListChanges(event: { leftData: TransferList[]; rightData: TransferList[] }) {
    this.listTransferList.set(event.rightData);

    if (event.rightData.length === 1) {
      if (event.rightData.length === 1) {
        const name = this.getTextAfterFirstDash(event.rightData[0].description);
        this.nameForm.get('name')?.setValue(name);
      } else {
        this.nameForm.get('name')?.reset();
      }
    } else {
      this.nameForm.get('name')?.reset();
    }
  }

  /**
   * Obtiene el idValor a partir del texto mostrado en el transfer list
   */
  /*
  private getIdValorFromDescription(description: string): string {
    const desc = description.split(this.characterToSplitName)[1];
    const valor = this.listValoresDisponibles().find(v => v.descripcionValor === desc);
    return valor ? valor.idValor : '';
  }
    */

  private getValorFromDescription(description: string): ValorFactor | undefined {
    const desc = this.getTextAfterFirstDash(description);
    return this.listValoresDisponibles().find(
      (item) => item.descripcionValor.trim() === desc
    );
  }


  /**
   * Controla si el botón de "Crear Grupo" debe estar deshabilitado
   */
  buttonDisabled(): boolean {
    return (
      this.leftData().length === 0 ||
      this.nameForm.invalid ||
      this.listTransferList().length === 0
    );
  }

  /**
   * Envía el grupo de valores creado al backend (POST)
   */
  createGruposValores() {
    const nombreGrupo = this.nameForm.get('name')?.value;

    const idsValores = this.listTransferList().map(
      (r) =>{
        const valor = this.getValorFromDescription(r.description);
				let valorSelected;
				if(this.factorCoeficiente().idFactor!.toString() === '71') {
					valorSelected = {
						idValor: valor?.idValor,
						idValorParent: valor?.idCultivo,
						idFactorParent:  '70'
					}
				} else {
					valorSelected = {
						idValor: valor?.idValor
					};
				}
				return valorSelected;

      }
    );

    const body = {
      idFactorCoeficiente: this.factorCoeficiente().idFactorCoeficiente,
      nombreGrupo,
      idsValores,
    };

    this.#gestionFactoresService
      .createGrupoValoresCoeficiente(body)
      .pipe(takeUntil(this.#destroy$))
      .subscribe({
        next: () => {
          this.modalOutput.emit(this.listTransferList());
        },
        error: () => {
          this.modalOutput.emit([]);
        }
      });
  }

  updateGrupoValoresExistente() {
    const nombreGrupo = this.nameForm.get('name')?.value;
    const idsValores = this.listTransferList().map(
      (r) => {
        const valor = this.getValorFromDescription(r.description);
				let valorSelected;
				if(this.factorCoeficiente().idFactor!.toString() === '71') {
					valorSelected = {
						idValor: valor?.idValor,
						idValorParent: valor?.idCultivo,
						idFactorParent:  '70'
					}
				} else {
					valorSelected = {
						idValor: valor?.idValor
					};
				}
				return valorSelected;

      }
    );

    const body = {
      idFactorCoeficiente: this.factorCoeficiente().idFactorCoeficiente,
      nombreGrupo,
      idsValores,
    };

    this.#gestionFactoresService
      .updateGrupoValoresCoeficiente(this.grupoValoresEdit().idGrupo, body)
      .pipe(takeUntil(this.#destroy$))
      .subscribe({
        next: () => {
          this.modalOutput.emit(this.listTransferList());
        },
        error: () => {
          this.modalOutput.emit([]);
        }
      });
    }


  ngOnDestroy() {
    this.#destroy$.next();
    this.#destroy$.complete();
  }
}
