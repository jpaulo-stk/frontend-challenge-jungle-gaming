import { isAxiosError, isCancel } from "axios";
import { z } from "zod";

/** Error envelope returned by every endpoint of the API. */
export const apiErrorBodySchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    fields: z.record(z.string(), z.string()).optional(),
  }),
});

/**
 * Single source of user-facing error copy. Keys are either client-side codes
 * (network, timeout, contract) or codes sent by the API in `error.code`.
 */
const errorMessages: Readonly<Record<string, string>> = {
  // Client-side
  NETWORK_ERROR: "Sem conexão com o servidor. Verifique sua internet e tente novamente.",
  TIMEOUT: "O servidor demorou para responder. Tente novamente.",
  CANCELED: "A requisição foi cancelada.",
  CONTRACT_MISMATCH: "Recebemos uma resposta inesperada do servidor.",
  SERVER_ERROR: "O servidor encontrou um problema. Tente novamente em instantes.",
  UNKNOWN: "Algo deu errado. Tente novamente.",
  // Generic HTTP
  UNAUTHORIZED: "Você precisa entrar para continuar.",
  FORBIDDEN: "Você não tem permissão para esta ação.",
  NOT_FOUND: "Não encontramos o que você procurava.",
  CONFLICT: "Esta ação conflita com o estado atual. Atualize e tente novamente.",
  VALIDATION_ERROR: "Alguns campos precisam de correção.",
  // Domain
  SESSION_EXPIRED: "Sua sessão expirou. Entre novamente para continuar.",
  INVALID_CREDENTIALS: "E-mail ou senha incorretos.",
  EMAIL_TAKEN: "Este e-mail já está cadastrado.",
  USERNAME_TAKEN: "Este nome de usuário já está em uso.",
  WRONG_PASSWORD: "A senha atual está incorreta.",
  NFT_NOT_FOUND: "Este NFT não existe ou foi removido.",
  COUPON_INVALID: "Cupom inválido.",
  COUPON_EXPIRED: "Este cupom expirou.",
  PRICE_CHANGED: "O preço de um item mudou.",
  EDITION_SOLD_OUT: "Esta edição esgotou.",
  QUOTE_STALE:
    "A cotação deste pedido não vale mais: ela expirou ou os valores mudaram. Revise e confirme novamente.",
  IDEMPOTENCY_CONFLICT: "Este pedido já foi enviado com outro conteúdo.",
  IDEMPOTENCY_KEY_REQUIRED: "Não foi possível identificar a tentativa de compra. Tente novamente.",
  QUOTE_HAS_ISSUES: "Há itens indisponíveis no carrinho. Ajuste-os para continuar.",
  INSUFFICIENT_AVAILABILITY: "Não há unidades suficientes desta edição.",
  CART_EMPTY: "Seu carrinho está vazio.",
  CART_ITEM_NOT_FOUND: "Este item não está mais no carrinho.",
  ORDER_NOT_FOUND: "Pedido não encontrado.",
  WALLET_NOT_FOUND: "Carteira não encontrada.",
  WALLET_EXISTS: "Esta carteira já está cadastrada.",
  WALLET_NOT_CONNECTED: "Conecte a carteira antes de confirmar a compra.",
  WALLET_REJECTED: "A conexão foi recusada na carteira.",
  INVALID_ADDRESS: "Use um endereço 0x seguido de 40 caracteres hexadecimais.",
  AVATAR_INVALID: "Use uma imagem PNG, JPEG ou WebP.",
  AVATAR_TOO_LARGE: "A imagem deve ter até 1 MB.",
  VISITOR_ID_REQUIRED: "Não foi possível identificar seu carrinho. Recarregue a página.",
  BAD_REQUEST: "Não foi possível processar a requisição.",
};

export function getErrorMessage(code: string, fallback?: string): string {
  return errorMessages[code] ?? fallback ?? errorMessages.UNKNOWN ?? "";
}

type AppErrorOptions = {
  status?: number;
  fields?: Readonly<Record<string, string>>;
  serverMessage?: string;
  cause?: unknown;
};

export class AppError extends Error {
  readonly code: string;
  readonly details: unknown;
  readonly status: number | undefined;
  /** Field-level messages returned by the API, keyed by form field name. */
  readonly fields: Readonly<Record<string, string>>;

  constructor(code: string, details?: unknown, options: AppErrorOptions = {}) {
    super(getErrorMessage(code, options.serverMessage), { cause: options.cause });
    this.name = "AppError";
    this.code = code;
    this.details = details;
    this.status = options.status;
    this.fields = options.fields ?? {};
  }
}

function codeFromStatus(status: number): string {
  if (status === 401) return "UNAUTHORIZED";
  if (status === 403) return "FORBIDDEN";
  if (status === 404) return "NOT_FOUND";
  if (status === 409) return "CONFLICT";
  if (status === 422) return "VALIDATION_ERROR";
  if (status >= 500) return "SERVER_ERROR";
  return "UNKNOWN";
}

/** Normalizes anything thrown by the HTTP layer into an `AppError`. */
export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  if (isCancel(error)) return new AppError("CANCELED", undefined, { cause: error });

  if (isAxiosError(error)) {
    const { response } = error;
    if (response) {
      const body = apiErrorBodySchema.safeParse(response.data);
      if (body.success) {
        const { code, message, fields } = body.data.error;
        return new AppError(code, response.data, {
          status: response.status,
          serverMessage: message,
          ...(fields ? { fields } : {}),
          cause: error,
        });
      }
      return new AppError(codeFromStatus(response.status), response.data, {
        status: response.status,
        cause: error,
      });
    }
    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
      return new AppError("TIMEOUT", undefined, { cause: error });
    }
    return new AppError("NETWORK_ERROR", undefined, { cause: error });
  }

  return new AppError("UNKNOWN", error, { cause: error });
}

const transientCodes = new Set(["NETWORK_ERROR", "TIMEOUT", "SERVER_ERROR"]);

/** Failures worth retrying automatically: the same request may succeed later. */
export function isTransient(error: unknown): boolean {
  if (!(error instanceof AppError)) return false;
  if (transientCodes.has(error.code)) return true;
  return error.status !== undefined && (error.status >= 500 || error.status === 429);
}
