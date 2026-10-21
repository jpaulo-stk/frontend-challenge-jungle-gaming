import type { CartItem, Quote } from "@/shared/api/contracts/cart";
import { compareEth, formatEth } from "@/shared/lib/eth";

export function describeQuoteChanges(seen: Quote, fresh: Quote, items: CartItem[]): string[] {
  const changes: string[] = [];
  const nameOf = (itemId: string) => items.find((item) => item.id === itemId)?.name ?? "Item";

  for (const line of fresh.lines) {
    const before = seen.lines.find((candidate) => candidate.itemId === line.itemId);
    if (!before) {
      changes.push(`${nameOf(line.itemId)} entrou no pedido.`);
      continue;
    }
    if (compareEth(before.unitPrice, line.unitPrice) !== 0) {
      changes.push(
        `${nameOf(line.itemId)}: o preço mudou de ${formatEth(before.unitPrice)} para ${formatEth(line.unitPrice)}.`,
      );
    }
    if (before.quantity !== line.quantity) {
      changes.push(
        `${nameOf(line.itemId)}: a quantidade mudou de ${String(before.quantity)} para ${String(line.quantity)}.`,
      );
    }
  }
  for (const line of seen.lines) {
    if (!fresh.lines.some((candidate) => candidate.itemId === line.itemId)) {
      changes.push(`${nameOf(line.itemId)} saiu do pedido.`);
    }
  }

  for (const issue of fresh.issues) {
    if (issue.code === "EDITION_SOLD_OUT")
      changes.push(`${nameOf(issue.itemId)}: a edição esgotou.`);
    if (issue.code === "INSUFFICIENT_AVAILABILITY") {
      changes.push(
        `${nameOf(issue.itemId)}: restam apenas ${String(issue.available)} unidades desta edição.`,
      );
    }
  }

  if (seen.coupon && !fresh.coupon) {
    changes.push(`O cupom ${seen.coupon.code} não é mais válido e foi retirado.`);
  }
  if (compareEth(seen.networkFee, fresh.networkFee) !== 0) {
    changes.push(
      `A taxa de rede mudou de ${formatEth(seen.networkFee)} para ${formatEth(fresh.networkFee)}.`,
    );
  }
  if (compareEth(seen.total, fresh.total) !== 0) {
    changes.push(`O total mudou de ${formatEth(seen.total)} para ${formatEth(fresh.total)}.`);
  }
  return changes;
}
