export interface iGrupoSeguro {
	id: string;
	descripcion: string;
}

export interface iLinea {
	id: string;
	descripcion: string;
}

export interface iFactorLinea {
	id: string;
	idLinea: string;
	idFactor: string;
	idDeducible?: string;
	descripcionFactor: string;
	simple: boolean;
	precio: boolean;
}

export interface FactorTarifa {
	idFactorTarifa: string;
	idFactorLinea: string;
	idFactor: string;
	idDeducible?: string;
	simple: boolean;
	precio: boolean;
	descripcionFactor: string;
	descripcionDeducible?: string;
	idVersionRiesgo: string;
	grupoValores?: GrupoValores[];
}

export interface iFactorTarifaEditable extends FactorTarifa {
	grupoValoresSelected?: GrupoValores;
}

export interface FactorLineaVersion {
	idVersionRiesgo?: string;
	idsFactorLinea?: string[];
}

export interface FactorTarifaValores {
	idFactorTarifa: string;
	nombreGrupo: string;
	idsValores: Valor[];
	precio: boolean;
	simple: boolean;
}

export interface GrupoValores {
	idGrupo: string;
	nombre: string;
	idFactorTarifa: string;
	idFactor: number;
	valores: Valor[];
	precio: boolean;
	simple: boolean;
}
export interface iFactorCoeficienteUI extends iFactorCoeficiente {
	grupoValores?: GrupoValoresCoeficientes[];
}
export interface GrupoValoresCoeficientes {
	idGrupo: string;
	nombre: string;
	idFactorCoeficiente: string;
	descripcionFactor: string;
	valores: {
		idValor: string;
		descripcion: string;
		idParent: string;
	}[];
	precio?: boolean;
	simple?: boolean;
}
export interface CoeficienteAsignadoUI {
  idCoeficienteLinea: string;
  nombreCoeficiente: string;
}

export interface CoeficienteCombinacion{
	id: string;
	idCombinacionTarifaSimple: string;
	idCoeficienteLinea: string;
	nombreCoeficiente: string; 
}

export interface Valor {
	idValor?: string;
	descripcion?: string;
	idValorParent?: string | null;
	idFactorParent?: string | null;
}

export interface ValorFactor {
	idValor: string;
	descripcionValor: string;
	idCultivo?: string;
	denominacionCultivo?: string;
}

export interface ValorFactorCoeficiente {
	idGrupo: string;
	nombre: string;
	idFactorCoeficiente: string;
	descripcionFactor: string;
	valores: {
		idValor: string;
		descripcion: string;
		idParent: string | null;
	}[];
}

export interface iFactor {
	id: string;
	nombre: string;
	simple: boolean;
	precio: boolean;
}

export interface ConfiguracionFactores {
	linea: number;
	factores: iFactor[];
}

export interface PlanLinea {
	idPlanLinea: string;
	idLinea: string;
	descripcionLinea: string;
	plan: number;
}

export interface PlanLineaRiesgo {
	idPlanLineaRiesgo: string;
	idPlanLinea: string;
	idRiesgo: string;
	descripcionRiesgo: string;
	simulado: boolean;
	versionesSimulacion?: PlanLineaRiesgoVersion[];
	versionesSimulacionSelect?: {
		text: string;
		value: number;
	}[];
	idVersionRiesgoSelected?: string;
}

export interface iFactorCoeficiente {
	idFactorCoeficiente: string;
	idFactorLinea: string;
	idFactor?: number;
	idDeducible?: string;
	descripcionFactor: string;
	descripcionDeducible: string;
	idPlanLinea: string;
}

export interface PlanLineaRiesgoVersion {
	idVersionRiesgo: string;
	version: string;
	idPlanLineaRiesgo: string;
	simulada: boolean;
	seleccionada: boolean;
	estado: string;
}

export interface iCombinacionFactorTarifaPrecio {
	idCombinacionSimple: string | null;
	nombre: string | null;
	asignaciones: iAsignacionFactorValorTarifa[] | null;
	primaBase?: number | null;
}

export interface iCombinacionFactorValorTarifa {
	id: string | number | null;
	nombre: string | null;
	asignaciones: iAsignacionFactorValorTarifa[] | null;
	primaBase?: number | null;
}
export interface iCombinacionFactorCoeficientes {
	idCombinacion: string;
	coeficiente: number;
	asignaciones: {
		idFactorCoeficiente: string;
		nombreFactor: string;
		idGrupoValores: string;
		nombreGrupoValores: string;
	}[];

	// Campos internos para la tabla (opcionales y NO del backend)
	id?: any;
	selected?: boolean;
	edited?: boolean;
}

export interface AsignacionFactorCoeficiente {
	idFactorCoeficiente: string; // UUID del factor
	idGrupoValores: string; // UUID del grupo seleccionado
	nombreFactor?: string; // SOLO usado por el front
	nombreGrupoValores?: string; // SOLO usado por el front
}

export interface iAsignacionFactorValorTarifa {
	idFactorTarifa: string;
	nombreFactor?: string;
	idGrupoValores: string;
	nombreGrupo?: string;
}

export interface iCombinacionFactorCoeficiente {
	nombre: string;
	asignaciones: asignacionCombinacionFactorCoeficiente[];
}

export interface asignacionCombinacionFactorCoeficiente {
	idFactorCoeficiente: string;
	idGrupoValores: string;
}

export interface iCombinacionFactor {
	idVersionRiesgo: string;
	nombre: string;
	asignaciones: asignacionCombinacionFactor[];
}

export interface asignacionCombinacionFactor {
	idFactorTarifa: string;
	idGrupoValores: string;
}

export interface iCombinacionFactorValorTarifaEditable extends iCombinacionFactorValorTarifa {
	selected?: boolean;
	edited?: boolean;
	ordenar?: boolean;
}

export interface iRiesgoEditable extends iRiesgo, iRiesgoEdicion {}

export interface iRiesgo {
	codigoSeguro: string;
	codigoRiesgo: string;
	descripcion: string;
}

export interface iRiesgoEdicion {
	selected?: boolean;
	edit?: boolean;
	disabled?: boolean;
}

export interface iPaginacion {
	pageNumber: number;
	pageSize: number;
	totalElements: number;
	totalPages: number;
	last: boolean;
}

export interface iRiesgoEditableResponse {
	content: iRiesgoEditable[];
	pageNumber: number;
	pageSize: number;
	totalElements: number;
	totalPages: number;
	last: boolean;
}

export interface iFactorGrupoSeguroContent extends iPaginacion {
	content: iFactorGrupoSeguro[];
}

export interface iFactorGrupoSeguro {
	id?: string;
	idFactor?: string;
	idDeducible?: string;
	descripcionFactor: string;
	agricola: boolean;
	ganado: boolean;
	relacionado: boolean;
	desactivado: boolean;
}

export interface iCambioFactorGrupoSeguro {
	id?: string;
	idFactor?: string;
	idDeducible?: string;
	agricola: boolean;
	ganado: boolean;
	desactivado: boolean;
}

export interface iFactorRelacionado {
	idFactor: string;
	descripcionFactor: string;
	parentesco: 'padre' | 'hijo';
}

export interface iFactorRelacionadoContent extends iPaginacion {
	content: iFactorRelacionado[];
}

export interface iFactorGlobal {
	idConcepto: string;
	nombre: string;
}

export interface iFactorDeducible {
	idGrupo: string;
	nombre: string;
	factores: [
		{
			idFactor: string;
			nombreFactor: string;
			orden?: number;
		}
	];
}

export interface iProvincia {
	codigo: string;
	nombre: string;
}

export interface iComarca {
	zona: number;
	provincia: number;
	comarca: number;
	nombre: string;
}

export interface iTermino {
	zona: number;
	provincia: number;
	comarca: number;
	termino: number;
	nombre: string;
}

export interface iSubtermino {
	zona: number;
	provincia: number;
	comarca: number;
	termino: number;
	subtermino: string;
	nombre: string;
}

export interface iFactorOrden {
	idFactor: string;
	orden: number;
}

export interface iFactorDeducibleNew {
	nombreGrupo: string;
	idsFactores: iFactorOrden[];
}

export interface InputTransferList {
	id?: string;
	description: string;
	order?: number;
}
