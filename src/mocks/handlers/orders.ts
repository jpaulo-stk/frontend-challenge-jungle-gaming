import { delay, http, HttpResponse } from "msw";

import { getConfig } from "@/mocks/config";
import { getDb } from "@/mocks/db/store";
import { createOrder } from "@/mocks/domain/orders";
import { toOrder } from "@/mocks/domain/serialize";
import { API, apiError, readBody, requireUser } from "@/mocks/handlers/http";
import { createOrderRequestSchema } from "@/shared/api/contracts/order";

export const orderHandlers = [
  http.post(`${API}/orders`, async ({ request }) => {
    const { user } = requireUser(request);
    const idempotencyKey = request.headers.get("idempotency-key");
    if (!idempotencyKey) {
      return apiError(400, "IDEMPOTENCY_KEY_REQUIRED", "Envie o cabeçalho Idempotency-Key.");
    }
    const body = await readBody(request, createOrderRequestSchema);
    const { order, created } = createOrder(user, idempotencyKey, body);

    // order-timeout: the order exists, but the first response never arrives.
    // A retry with the same key reaches the branch above and recovers it.
    if (created && getConfig().scenario === "order-timeout") await delay("infinite");

    return HttpResponse.json(toOrder(order), { status: created ? 201 : 200 });
  }),

  http.get(`${API}/orders`, ({ request }) => {
    const { user } = requireUser(request);
    const status = new URL(request.url).searchParams.get("status");
    const items = getDb()
      .orders.filter((order) => order.userId === user.id && (!status || order.status === status))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(toOrder);
    return HttpResponse.json({ items });
  }),

  http.get(`${API}/orders/:id`, ({ request, params }) => {
    const { user } = requireUser(request);
    // Another collector's order is reported as missing, never as forbidden,
    // so order ids cannot be probed.
    const order = getDb().orders.find(
      (candidate) => candidate.id === params.id && candidate.userId === user.id,
    );
    if (!order) return apiError(404, "ORDER_NOT_FOUND", "Pedido não encontrado.");
    return HttpResponse.json(toOrder(order));
  }),
];
