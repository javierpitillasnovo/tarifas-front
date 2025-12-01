import { iCombinacionFactorValorTarifa } from "../interfaces/general.interface";

export class CombinacionFactorValorTarifa implements iCombinacionFactorValorTarifa {
  id: string | null = null;
  nombre: string| null = null;
  asignaciones: [
    {
      idFactorTarifa: string,
      nombreFactor?: string,
      idGrupoValores: string,
      nombreGrupo?: string
    }
  ] | null = null;
  primaBase: number | null = null

	constructor(init?: Partial<CombinacionFactorValorTarifa>) {
		Object.assign(this, init);
	}
}