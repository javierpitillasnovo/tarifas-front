import { CallApiService, RequestMethod } from '@agroseguro/agro-lib-arch-front-security';
import { inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';
import type { RequestApiParams } from '@agroseguro/agro-lib-arch-front-security';
import type {
	FactorLineaVersion,
	FactorTarifa,
	FactorTarifaValores,
	GrupoValores,
	GrupoValoresCoeficientes,
	iCambioFactorGrupoSeguro,
	iCombinacionFactorCoeficientes,
	iFactorCoeficiente,
	iFactorGrupoSeguro,
	iFactorGrupoSeguroContent,
	iFactorLinea,
	iFactorRelacionadoContent,
	iGrupoSeguro,
	iLinea,
	ValorFactor,
	ValorFactorCoeficiente,
	CoeficienteCombinacion,
	Valor
} from '../interfaces/general.interface';
import { environment } from '../../environments/environment';
import { API_VERSION, GRUPOS_SEGURO, FACTORES_GRUPO_SEGURO } from '../constants/api-paths';
import { HttpClient } from '@angular/common/http';
import type { SelectOption } from '@agroseguro/lib-ui-agroseguro';

@Injectable({
	providedIn: 'root'
})
export class GestionFactoresService {
	readonly #callApiService = inject(CallApiService);
	public FACTOR_TIPO_SIMPLE = 'SIMPLE';
	public FACTOR_TIPO_PRECIO = 'PRECIO';

	constructor(private http: HttpClient) {}

	/**
	 * GET /v1/grupos_seguro
	 * Devuelve [{ id: string; descripcion: string }]
	 * Lo mapeamos a { text, value } para el <ui-select>
	 */
	getGruposSeguros(): Observable<{ text: string; value: string }[]> {
		const params: RequestApiParams = {
			method: RequestMethod.get,
			url: `${environment.API_URL}/v1/grupos_seguro`
		};

		return this.#callApiService.callApi<iGrupoSeguro[]>(params).pipe(
			map((grupos) =>
				grupos.map((g) => ({
					text: g.descripcion,
					value: g.id
				}))
			)
		);
	}

	/**
	 * GET /v1/grupos_seguro/{idGrupoSeguro}/lineas
	 * Devuelve [{ id: number; descripcion: string }]
	 * Lo mapeamos a { text, value } para el <ui-select>
	 */
	getLineas(grupoCodigo: string): Observable<{ text: string; value: string }[]> {
		const params: RequestApiParams = {
			method: RequestMethod.get,
			url: `${environment.API_URL}/v1/grupos_seguro/${grupoCodigo}/lineas`
		};
		return this.#callApiService.callApi<iLinea[]>(params).pipe(
			map((lineas) =>
				lineas.map((l) => ({
					text: l.id + ' - ' + l.descripcion,
					value: l.id
				}))
			)
		);
	}

	/**
	 * GET/v1/lineas/{idLinea}/factores_lineas
	 * Servicio que devuelve todos los factores linea disponibles por linea.
	 * Devuelve tambien si es por precio o tarificado
	 */

	getFactoresLinea(lineaId: string): Observable<iFactorLinea[]> {
		const params: RequestApiParams = {
			method: RequestMethod.get,
			url: `${environment.API_URL}/v1/lineas/${lineaId}/factores_lineas`
		};

		return this.#callApiService.callApi<iFactorLinea[]>(params);
	}

	getTodosFactoresConSusGruposSeguro(queryString?: string): Observable<iFactorGrupoSeguroContent> {
		const url = `${environment.API_URL}/v1/factores_gruposeguro${queryString ?? ''}`;
		const params: RequestApiParams = {
			method: RequestMethod.get,
			url: url
		};
		return this.#callApiService.callApi<iFactorGrupoSeguroContent>(params);
	}

	updateGruposSeguroAsignadosAFactores(
		factores: iCambioFactorGrupoSeguro[],
		mantenerPrevios: boolean
	): Observable<iFactorGrupoSeguroContent> {
		const mantenerPreviosParam = mantenerPrevios
			? `mantenerPrevios=${mantenerPrevios}`
			: 'mantenerPrevios=false';
		const params: RequestApiParams = {
			method: RequestMethod.put,
			url: `${environment.API_URL}/v1/factores_gruposeguro?${mantenerPreviosParam}`,
			body: factores
		};
		return this.#callApiService.callApi<iFactorGrupoSeguroContent>(params);
	}

	/*TODO pte. tener un endpoint real */
	getFactoresRelacionadosConUnIdFactor(
		idFactor: string,
		queryString?: string
	): Observable<iFactorRelacionadoContent> {
		const params: RequestApiParams = {
			method: RequestMethod.get,
			url: `${environment.API_URL}${API_VERSION}${FACTORES_GRUPO_SEGURO}${idFactor}${queryString ? `?${queryString}` : ''}`
		};
		/* return this.#callApiService.callApi<iFactorRelacionadoContent>(params); */
		return this.#callApiService.callApi<iFactorRelacionadoContent>(params);
	}

	/*FIXME: usar mientras se necesiten datos mock */
	/* 	getFactoresRelacionadosConUnIdFactor(
		idFactor: string,
		queryString?: string
	): Observable<iFactorRelacionadoContent> {
		const params: RequestApiParams = {
			method: RequestMethod.get,
			url: `${environment.API_URL}${API_VERSION}${FACTORES_GRUPO_SEGURO}${idFactor}${queryString ? `?${queryString}` : ''}`
		};
		return this.http.get<iFactorRelacionadoContent>('http://localhost:3000/factoresRelacionados');
	} */

	/**
	 * Busca factores por texto y devuelve opciones para el select
	 */
	buscarFactores(texto: string): Observable<SelectOption[]> {
		/*TODO*/
		// Mock: ejemplo de opciones filtradas
		const mockFactores: SelectOption[] = [
			{ value: 1, text: 'Factor de Riego' },
			{ value: 2, text: 'Factor de Coeficiente' }
		];
		const resultados = mockFactores.filter((opt) =>
			opt.text.toLowerCase().includes(texto.toLowerCase())
		);
		return of(resultados);
	}

	updateFactoresLinea(factores: iFactorLinea[]): Observable<iFactorLinea[]> {
		const params: RequestApiParams = {
			method: RequestMethod.put,
			url: `${environment.API_URL}/v1/factores_linea`,
			body: factores
		};

		return this.#callApiService.callApi<iFactorLinea[]>(params);
	}

	updateFactoresGrupoSeguro(factores: iFactorGrupoSeguro[]): Observable<iFactorGrupoSeguro[]> {
		const params: RequestApiParams = {
			method: RequestMethod.put,
			url: `${environment.API_URL}/v1/factores_grupo_seguro`,
			body: factores
		};

		return this.#callApiService.callApi<iFactorGrupoSeguro[]>(params);
	}

	/**
	 * GET /v1/versiones/{idVersion}/factores_tarifa
	 * Servicio que devuelve los factores asignados a una versión
	 * @param idVersion
	 * @returns
	 */
	getFactoresTarifaByVersion(
		idVersion: string,
		tipo: string,
		sinFactorAmbito = false
	): Observable<FactorTarifa[]> {
		const params: RequestApiParams = {
			method: RequestMethod.get,
			url: `${environment.API_URL}/v1/versiones/${idVersion}/factores_tarifa?tipo=${tipo}&sinFactorAmbito=${sinFactorAmbito}`
		};

		return this.#callApiService.callApi<FactorTarifa[]>(params);
	}
	/**
	 * GET /v1/versiones/{idVersion}/factores_tarifa/cultivo/valores
	 * Servicio que devuelve los factores asignados a una versión
	 * @param idVersion
	 * @returns
	 */
	getIdsCultivo(idVersion: string, tipo: string): Observable<string[]> {
		const params: RequestApiParams = {
			method: RequestMethod.get,
			url: `${environment.API_URL}/v1/versiones/${idVersion}/factores_tarifa/cultivo/valores?tipo=${tipo}`
		};

		return this.#callApiService.callApi<string[]>(params);
	}

	/**
	 * GET /v1/factores_coeficiente/{idPlanLinea}/cultivo/valores
	 * Devuelve los ids de valores asignados al cultivo para este plan-línea.
	 */
	getIdsCultivoPorPlanLinea(idPlanLinea: string): Observable<(string | number)[]> {
		const params: RequestApiParams = {
			method: RequestMethod.get,
			url: `${environment.API_URL}/v1/factores_coeficiente/${idPlanLinea}/cultivo/valores`
		};

		return this.#callApiService.callApi<(string | number)[]>(params);
	}

	getGrupoValoresFactorTarifa(
		idFactorTarifa: string,
		tipo: string,
		idsValores?: (string | number)[]
	): Observable<GrupoValores[]> {
		const idsQuery = idsValores && idsValores.length ? `&idsCultivo=${idsValores.join(',')}` : '';
		const params: RequestApiParams = {
			method: RequestMethod.get,
			url: `${environment.API_URL}/v1/factores_tarifa/${idFactorTarifa}/grupos?tipo=${tipo}${idsQuery}`
		};

		return this.#callApiService.callApi<GrupoValores[]>(params);
	}

	/**
	 * PUT /v1/factores_tarifa
	 * Servicio que actualiza un listado de factores linea asociados a un P-L-R-V
	 * @param factores
	 * @returns
	 */
	updateFactoresTarifa(factores: FactorLineaVersion, tipo: string): Observable<FactorTarifa[]> {
		const params: RequestApiParams = {
			method: RequestMethod.put,
			url: `${environment.API_URL}/v1/factores_tarifa?tipo=${tipo}`,
			body: factores
		};

		return this.#callApiService.callApi<FactorTarifa[]>(params);
	}

	/**
	 * GET /v1/factores_tarifa/{idFactorTarifa}/valores
	 * Servicio que devuelve los valores de un factor
	 * @param idFactorTarifa
	 * @returns
	 */
	getValoresFactorTarifa(
		idFactorTarifa: string,
		idsValores?: (string | number)[]
	): Observable<ValorFactor[]> {
		// Si idsValores existe, lo convertimos en string separado por comas
		const idsQuery = idsValores && idsValores.length ? `?idsCultivo=${idsValores.join(',')}` : '';
		const params: RequestApiParams = {
			method: RequestMethod.get,
			url: `${environment.API_URL}/v1/factores_tarifa/${idFactorTarifa}/valores${idsQuery}`
		};

		return this.#callApiService.callApi<ValorFactor[]>(params);
	}

	/**
	 * POST /v1/grupos_valores
	 * Servicio que crea un grupo de valores para un factor
	 * @param factor
	 * @returns
	 */
	createFactorTarifaGrupoValores(factor: FactorTarifaValores): Observable<GrupoValores> {
		const params: RequestApiParams = {
			method: RequestMethod.post,
			url: `${environment.API_URL}/v1/grupos_valores`,
			body: factor
		};

		return this.#callApiService.callApi<GrupoValores>(params);
	}

	/**
	 * PUT /v1/grupos_valores
	 * Servicio que actualiza un grupo de valores para un factor
	 */
	updateGrupoValores(factor: FactorTarifaValores, idGrupo: string): Observable<GrupoValores> {
		const params: RequestApiParams = {
			method: RequestMethod.put,
			url: `${environment.API_URL}/v1/grupos_valores?idGrupo=${idGrupo}`,
			body: factor
		};
		return this.#callApiService.callApi<GrupoValores>(params);
	}

	/**
	 * DELETE /v1/grupos_valores/{idGrupoValores}
	 * Elimina un grupo de valores
	 */
	deleteGrupoValores(idGrupoValores: string): Observable<void> {
		const params: RequestApiParams = {
			method: RequestMethod.delete,
			url: `${environment.API_URL}/v1/grupos_valores/${idGrupoValores}`
		};
		return this.#callApiService.callApi<void>(params);
	}

	/**
	 * GET v1/planes_lineas/${idPlanLinea}/factores_coeficiente
	 * TODO: Devuelve [iFactorCoeficiente]
	 */
	getFactoresCoeficiente(
		idPlanLinea: string,
		sinFactorAmbito = false
	): Observable<iFactorCoeficiente[]> {
		const params: RequestApiParams = {
			method: RequestMethod.get,
			url: `${environment.API_URL}/v1/planes_lineas/${idPlanLinea}/factores_coeficiente?sinFactorAmbito=${sinFactorAmbito}`
		};

		return this.#callApiService.callApi<iFactorCoeficiente[]>(params);
	}

	/**
	 * PUT /v1/factores_coeficiente
	 * Servicio que asigna factores a un coeficiente (Plan-Línea)
	 * @param factoresCoeficiente Array de objetos con idFactorLinea e idPlanLinea
	 * @returns Observable<iFactorCoeficiente>
	 */
	updateFactoresCoeficiente(factoresCoeficiente: {
		idsFactorLinea: string[] | null;
		idPlanLinea: string;
	}): Observable<iFactorCoeficiente> {
		const params: RequestApiParams = {
			method: RequestMethod.put,
			url: `${environment.API_URL}/v1/factores_coeficiente`,
			body: factoresCoeficiente
		};

		return this.#callApiService.callApi<iFactorCoeficiente>(params);
	}

	/**
	 * GET /v1/planes_lineas/{idPlanLinea}/grupos_valores_coeficiente
	 * Devuelve los grupos de valores de coeficiente asociados a un plan-línea.
	 * @param idPlanLinea UUID del plan-línea
	 */
	getGruposValoresCoeficiente(idPlanLinea: string) {
		const params: RequestApiParams = {
			method: RequestMethod.get,
			url: `${environment.API_URL}/v1/planes_lineas/${idPlanLinea}/grupos_valores_coeficiente`
		};

		return this.#callApiService.callApi<ValorFactorCoeficiente[]>(params);
	}

	getGruposValoresFactorCoeficiente(
		idFactorCoeficiente: string,
		idsValores?: (string | number)[]
	): Observable<GrupoValoresCoeficientes[]> {
		// Si idsValores existe y no está vacío → construir ?idsCultivo=1,2,3
		const idsQuery = idsValores && idsValores.length ? `?idsCultivo=${idsValores.join(',')}` : '';

		const params: RequestApiParams = {
			method: RequestMethod.get,
			url: `${environment.API_URL}/v1/factores_coeficiente/${idFactorCoeficiente}/grupos${idsQuery}`
		};

		return this.#callApiService.callApi<GrupoValoresCoeficientes[]>(params);
	}

	/**
	 * GET /v1/factores_coeficiente/{idFactorCoeficiente}/valores
	 * Devuelve los valores disponibles para un factor de coeficiente
	 */
	getValoresFactorCoeficiente(
		idFactorCoeficiente: string,
		idsValores?: (string | number)[]
	): Observable<ValorFactor[]> {
		const idsQuery = idsValores && idsValores.length ? `?idsCultivo=${idsValores.join(',')}` : '';
		const params: RequestApiParams = {
			method: RequestMethod.get,
			url: `${environment.API_URL}/v1/factores_coeficiente/${idFactorCoeficiente}/valores${idsQuery}`
		};

		return this.#callApiService.callApi<ValorFactor[]>(params);
	}

	/**
	 * POST /v1/grupos_valores_coeficiente
	 * Crea un nuevo grupo de valores para un factor de coeficiente
	 */
	createGrupoValoresCoeficiente(body: {
		idFactorCoeficiente: string;
		nombreGrupo: string;
		idsValores: Valor[];
	}): Observable<GrupoValoresCoeficientes> {
		const params: RequestApiParams = {
			method: RequestMethod.post,
			url: `${environment.API_URL}/v1/grupos_valores_coeficientes`,
			body
		};

		return this.#callApiService.callApi<GrupoValoresCoeficientes>(params);
	}

	/**
	 * PUT /v1/grupos_valores_coeficientes/{idGrupoValores}
	 * Actualiza un grupo de valores para un factor de coeficiente
	 */
	updateGrupoValoresCoeficiente(
		idGrupoValores: string,
		body: {
			idFactorCoeficiente: string;
			nombreGrupo: string;
			idsValores: Valor[];
		}
	): Observable<GrupoValoresCoeficientes> {
		const params: RequestApiParams = {
			method: RequestMethod.put,
			url: `${environment.API_URL}/v1/grupos_valores_coeficientes/${idGrupoValores}`,
			body
		};

		return this.#callApiService.callApi<GrupoValoresCoeficientes>(params);
	}

	/**
	 * DELETE /v1/grupos_valores_coeficientes/{idGrupoValores}
	 * Elimina un grupo de valores para un factor de coeficiente
	 */
	deleteGrupoValoresCoeficiente(idGrupoValores: string): Observable<void> {
		const params: RequestApiParams = {
			method: RequestMethod.delete,
			url: `${environment.API_URL}/v1/grupos_valores_coeficientes/${idGrupoValores}`
		};

		return this.#callApiService.callApi<void>(params);
	}

	/**
	 * GET /v1/planes_lineas/{idPlanLinea}/coeficientes
	 */
	getCoeficientes(
		idPlanLinea: string
	): Observable<{ idCoeficiente: string; nombreCoeficiente: string }[]> {
		const params: RequestApiParams = {
			method: RequestMethod.get,
			url: `${environment.API_URL}/v1/planes_lineas/${idPlanLinea}/coeficientes`
		};

		return this.#callApiService.callApi(params);
	}

	/**
	 * POST /v1/coeficientes
	 * Crea un coeficiente y YA queda asociado internamente al plan-línea.
	 */
	createCoeficiente(
		idPlanLinea: string,
		nombreCoeficiente: string
	): Observable<{ idCoeficiente: string; nombreCoeficiente: string }> {
		const params: RequestApiParams = {
			method: RequestMethod.post,
			url: `${environment.API_URL}/v1/planes_lineas/${idPlanLinea}/coeficientes`,
			body: { nombreCoeficiente }
		};

		return this.#callApiService.callApi<{ idCoeficiente: string; nombreCoeficiente: string }>(
			params
		);
	}

	/**
	 * DELETE /v1/coeficientes/{idCoeficiente}
	 * Elimina un coeficiente.
	 * Devuelve 204 No Content.
	 */
	deleteCoeficiente(idCoeficiente: string): Observable<void> {
		const params: RequestApiParams = {
			method: RequestMethod.delete,
			url: `${environment.API_URL}/v1/coeficientes/${idCoeficiente}`
		};

		return this.#callApiService.callApi<void>(params);
	}

	/**
	 * PUT /v1/coeficientes/{idCoeficiente}
	 * Actualiza un coeficiente
	 */
	updateCoeficiente(idCoeficiente: string, nombreCoeficiente: string): Observable<void> {
		const params: RequestApiParams = {
			method: RequestMethod.put,
			url: `${environment.API_URL}/v1/coeficientes/${idCoeficiente}`,
			body: { nombreCoeficiente }
		};

		return this.#callApiService.callApi<void>(params);
	}

	/**
	 * GET /v1/tarifasimple/{idCombinacionTarifaSimple}/coeficientes
	 * Recupera los coeficientes asignados a una combinación simple
	 */
	getCoeficientesCombinacion(idCombinacionTarifaSimple: string) {
		const params: RequestApiParams = {
			method: RequestMethod.get,
			url: `${environment.API_URL}/v1/tarifasimple/${idCombinacionTarifaSimple}/coeficientes`
		};

		return this.#callApiService.callApi<CoeficienteCombinacion[]>(params);
	}

	assignCoeficientesToTarifaSimple(idCombinacionTarifaSimple: string, idsCoeficientes: string[]) {
		const params: RequestApiParams = {
			method: RequestMethod.post,
			url: `${environment.API_URL}/v1/tarifasimple/${idCombinacionTarifaSimple}/coeficientes`,
			body: {
				idCombinacionTarifaSimple,
				idsCoeficientes
			}
		};

		return this.#callApiService.callApi(params);
	}

	/*
	 * POST /v1/factores_tarifa/{idFactorTarifa}/importarDeducibles
	 * Importa combinaciones de factores deducibles
	 * @param idFactorTarifa
	 * @param file
	 * @return Observable<void>
	 */
	importDeducible(idFactorTarifa: string, file: File): Observable<void> {
		const formData = new FormData();
		formData.append('fichero', file);
		const params: RequestApiParams = {
			method: RequestMethod.post,
			url: `${environment.API_URL}/v1/factores_tarifa/${idFactorTarifa}/importarDeducibles`,
			body: formData
		};

		return this.#callApiService.callApi<void>(params);
	}

	/*
	 * POST /v1/factores_coeficiente/{idFactorCoeficiente}/importarDeducibles
	 * Importa combinaciones de factores deducibles
	 */
	importDeducibleCoeficiente(idFactorCoeficiente: string, file: File): Observable<void> {
		const formData = new FormData();
		formData.append('fichero', file);
		const params: RequestApiParams = {
			method: RequestMethod.post,
			url: `${environment.API_URL}/v1/factores_coeficiente/${idFactorCoeficiente}/importarDeducibles`,
			body: formData
		};

		return this.#callApiService.callApi<void>(params);
	}
}
