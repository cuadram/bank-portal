package com.experis.sofia.bankportal.twofa.api;

import org.springframework.http.HttpHeaders;

/**
 * Cabeceras de deprecación RFC 8594 para DELETE /api/v1/2fa/deactivate.
 * DEBT-005 / ACT-12 — Sprint 4.
 *
 * @author SOFIA Developer Agent — Sprint 4
 */
public final class DeprecationHeaders {

    private DeprecationHeaders() {}

    /**
     * Construye las cabeceras HTTP de deprecación.
     * Debe añadirse a la response del endpoint DELETE /api/v1/2fa/deactivate.
     *
     * <p>Criterio de aceptación (ACT-12):
     * <pre>
     * Escenario: Header Deprecation presente en response
     *   Dado que el endpoint está marcado como deprecated
     *   Cuando un cliente hace DELETE /api/v1/2fa/deactivate
     *   Entonces la response incluye:
     *     Deprecation: true
     *     Sunset: Sat, 01 Jan 2027 00:00:00 GMT
     *     Link: </api/v1/2fa/deactivate>; rel="successor-version"
     * </pre>
     */
    public static HttpHeaders forDeprecatedDeactivate() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Deprecation", "true");
        headers.set("Sunset",      "Sat, 01 Jan 2027 00:00:00 GMT");
        headers.set("Link",        "</api/v1/2fa/deactivate>; rel=\"successor-version\"");
        return headers;
    }
}
