import { inject, Injectable } from '@angular/core';
import type { iGrupoSeguro, iRiesgo } from '../interfaces/general.interface';
import { CallApiService, RequestMethod } from '@agroseguro/agro-lib-arch-front-security';
import type { RequestApiParams } from '@agroseguro/agro-lib-arch-front-security';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
	providedIn: 'root'
})
export class GestionRiesgosService {
	readonly #callApiService = inject(CallApiService);
	constructor() {}

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
					text: `${g.id} - ${g.descripcion}`,
					value: g.id
				}))
			)
		);
	}


	/**
	 * POST /v1/grupos_seguro/{idGrupoSeguro}/riesgos
	 * Añade un nuevo riesgo
	 */
	addRiesgo(idGrupoSeguro: string, body: iRiesgo): Observable<void> {
		const params: RequestApiParams = {
			method: RequestMethod.post,
			url: `${environment.API_URL}/v1/grupos_seguro/${idGrupoSeguro}/riesgos`,
			body
		};
		return this.#callApiService.callApi<void>(params);
	}

	/**
	 * PUT /v1/grupos_seguro/{idGrupoSeguro}/riesgos/{codigoRiesgo}
	 * Actualiza la descripción de un riesgo
	 */
	updateRiesgo(idGrupoSeguro: string, codigoRiesgo: string, body: iRiesgo): Observable<void> {
		const params: RequestApiParams = {
			method: RequestMethod.put,
			url: `${environment.API_URL}/v1/grupos_seguro/${idGrupoSeguro}/riesgos/${codigoRiesgo}`,
			body
		};
		return this.#callApiService.callApi<void>(params);
	}

	/**
	 * DELETE /v1/grupos_seguro/{idGrupoSeguro}/riesgos/{codigoRiesgo}
	 * Elimina un riesgo del grupo
	 */
	deleteRiesgo(idGrupoSeguro: string, codigoRiesgo: string): Observable<void> {
		const params: RequestApiParams = {
			method: RequestMethod.delete,
			url: `${environment.API_URL}/v1/grupos_seguro/${idGrupoSeguro}/riesgos/${codigoRiesgo}`
		};
		return this.#callApiService.callApi<void>(params);
	}

	/**
	 * GET /v1/grupos_seguro/{idGrupoSeguro}/codigos_libres
	 */
	getCodigosLibres(grupoId: string): Observable<string[]> {
		const params: RequestApiParams = {
			method: RequestMethod.get,
			url: `${environment.API_URL}/v1/grupos_seguro/${grupoId}/codigos_libres`
		};
		return this.#callApiService.callApi<string[]>(params);
	}
}
