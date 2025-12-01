import { HttpHandlerFn, HttpRequest } from "@angular/common/http";
import { inject } from "@angular/core";
import { finalize } from "rxjs";
import { LoaderService } from "../services/loader.service";

export function loaderInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
    const loader = inject(LoaderService);
    loader.showLoader();
    return next(req).pipe(
      finalize(() => loader.hideLoader())
    );
  }