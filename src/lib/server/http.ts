export async function body<T>(request: Request): Promise<T> {
    try {
        return await request.json() as T;
    } catch {
        throw new Error('REQUISICAO_INVALIDA');
    }
}

export function json(data: unknown, status = 200): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'content-type': 'application/json; charset=utf-8' },
    });
}

export function errorResponse(error: unknown): Response {
    const code = error instanceof Error ? error.message : 'ERRO_INTERNO';
    const known: Record<string, [number, string]> = {
        LOGIN_INVALIDO: [401, 'LOGIN_INVALIDO'],
        GOOGLE_INVALIDO: [401, 'GOOGLE_INVALIDO'],
        REQUISICAO_INVALIDA: [400, 'REQUISICAO_INVALIDA'],
        NAO_AUTENTICADO: [401, 'NAO_AUTENTICADO'],
        USUARIO_INVALIDO: [400, 'USUARIO_INVALIDO'],
        EMAIL_INVALIDO: [400, 'EMAIL_INVALIDO'],
        SENHA_INVALIDA: [400, 'SENHA_INVALIDA'],
        SENHAS_DIFERENTES: [400, 'SENHAS_DIFERENTES'],
        CONTA_EXISTENTE: [409, 'CONTA_EXISTENTE'],
    };
    const [status, message] = known[code] || [500, 'ERRO_INTERNO'];
    return json({ ok: false, error: message }, status);
}
