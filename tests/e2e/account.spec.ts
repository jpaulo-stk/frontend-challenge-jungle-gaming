import { expect, test } from "@playwright/test";

import { api, openWithScenario } from "../fixtures/mock-api.ts";
import { loginThroughDialog, signIn } from "../fixtures/session.ts";

// 1x1 transparent PNG.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

test.describe("cadastro e login", () => {
  test("cadastro valida os campos e mostra o conflito de e-mail no campo", async ({ page }) => {
    await openWithScenario(page);
    await page.goto("/criar-conta");
    const dialog = page.getByRole("dialog", { name: "Criar perfil de colecionador" });

    await dialog.getByLabel(/^Nome de usuário/).fill("novo.colecionador");
    await dialog.getByLabel(/^E-mail/).fill("colecionador@kurio.test");
    await dialog.getByLabel(/^Senha/).fill("segredo123");
    await dialog.getByLabel(/^Confirmar senha/).fill("outra-senha");
    await dialog.getByRole("button", { name: "Criar conta", exact: true }).click();
    await expect(dialog.getByText("As senhas não coincidem.")).toBeVisible();

    await dialog.getByLabel(/^Confirmar senha/).fill("segredo123");
    await dialog.getByRole("button", { name: "Criar conta", exact: true }).click();
    const email = dialog.getByLabel(/^E-mail/);
    await expect(email).toHaveAttribute("aria-invalid", "true");
    await expect(dialog.getByText("Este e-mail já está cadastrado.")).toBeVisible();
  });

  test("credencial errada avisa sem limpar o formulário", async ({ page }) => {
    await openWithScenario(page);
    await page.goto("/entrar");
    const dialog = page.getByRole("dialog", { name: "Entrar" });

    await dialog.getByLabel(/^E-mail/).fill("colecionador@kurio.test");
    await dialog.getByLabel(/^Senha/).fill("senha-errada");
    await dialog.getByRole("button", { name: "Entrar", exact: true }).click();

    await expect(dialog.getByRole("alert")).toHaveText("E-mail ou senha incorretos.");
    await expect(dialog.getByLabel(/^E-mail/)).toHaveValue("colecionador@kurio.test");
  });
});

test.describe("sessão", { tag: "@desktop" }, () => {
  test("rota privada leva ao login e volta ao destino", async ({ page }) => {
    await openWithScenario(page);
    await page.goto("/perfil/carteiras");
    await expect(page).toHaveURL(/\/entrar\?redirect=%2Fperfil%2Fcarteiras/);

    await loginThroughDialog(page);
    await expect(page).toHaveURL("/perfil/carteiras");
    await expect(page.getByRole("heading", { name: "Carteira principal" })).toBeVisible();
  });

  test("carrinho do visitante é preservado ao entrar", async ({ page }) => {
    await openWithScenario(page);
    // The app creates the visitor id on its first request.
    const visitorId = await page
      .waitForFunction(() => localStorage.getItem("kurio.visitor-id"))
      .then((handle) => handle.jsonValue() as Promise<string>);
    for (const nftId of ["golden-signal-160", "honey-bass-037"]) {
      await api(page, {
        method: "POST",
        path: "/cart/items",
        body: { nftId, editionId: "open", quantity: 1 },
        headers: { "X-Visitor-Id": visitorId },
      });
    }
    await page.reload();
    await expect(page.getByRole("link", { name: "Carrinho, 2 itens" })).toBeVisible();

    await page.getByRole("banner").getByRole("link", { name: "Entrar" }).click();
    await loginThroughDialog(page, "nova.sato@kurio.test");
    // Nova already had 1 item; the 2 from the visit are kept.
    await expect(page.getByRole("link", { name: "Carrinho, 3 itens" })).toBeVisible();
  });

  test("sessão expirada no meio da navegação volta ao mesmo ponto após o login", async ({
    page,
  }) => {
    await openWithScenario(page);
    await signIn(page);
    await page.goto("/perfil/dados");
    await expect(page.getByLabel(/^Nome de exibição/)).toHaveValue("Colecionador Kurio");

    await page.evaluate(() => window.__kurioMock?.expireSessionOnNextRequest());
    await page.getByRole("link", { name: "Carteiras" }).click();

    await expect(page.getByText(/Sua sessão expirou/)).toBeVisible();
    await expect(page).toHaveURL(/\/entrar\?redirect=%2Fperfil%2Fcarteiras/);
    await loginThroughDialog(page);
    await expect(page).toHaveURL("/perfil/carteiras");
  });

  test("troca de usuário não mostra nenhum dado do anterior", async ({ page }) => {
    await openWithScenario(page);
    await signIn(page);
    await page.goto("/favoritos");
    await expect(page.getByRole("heading", { level: 3, name: "Emerald Ape #042" })).toBeVisible();

    await page.goto("/perfil");
    await page.getByRole("button", { name: "Sair" }).click();
    await expect(page.getByText("Você saiu da sua conta.")).toBeVisible();
    await expect(page.getByRole("banner").getByRole("link", { name: "Entrar" })).toBeVisible();

    await page.getByRole("banner").getByRole("link", { name: "Entrar" }).click();
    await loginThroughDialog(page, "nova.sato@kurio.test");
    await page.goto("/favoritos");
    await expect(page.getByRole("heading", { level: 3, name: "Sage Nomad #009" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 3, name: "Emerald Ape #042" })).toHaveCount(0);

    await page.goto("/perfil/dados");
    await expect(page.getByLabel(/^Nome de exibição/)).toHaveValue("Nova Sato");
    await expect(page.getByRole("link", { name: "Carrinho, 1 item" })).toBeVisible();
  });

  test("diálogo de login: foco preso e devolvido ao fechar", async ({ page }) => {
    await openWithScenario(page);
    const trigger = page.getByRole("banner").getByRole("link", { name: "Entrar" });
    await trigger.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog", { name: "Entrar" });
    await expect(dialog).toBeVisible();

    for (let step = 0; step < 12; step += 1) {
      await page.keyboard.press("Tab");
      const inside = await dialog.evaluate((node) => node.contains(document.activeElement));
      expect(inside).toBe(true);
    }
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });
});

test.describe("perfil", { tag: "@desktop" }, () => {
  test("edição persiste após refresh e atualiza o header", async ({ page }) => {
    await openWithScenario(page);
    await signIn(page);
    await page.goto("/perfil/dados");

    await page.getByLabel(/^Nome de exibição/).fill("Colecionadora Lua");
    await page.getByRole("button", { name: "Salvar", exact: true }).click();
    await expect(
      page.getByRole("status").filter({ hasText: "Dados do perfil salvos." }),
    ).toBeVisible();
    await expect(
      page.getByRole("banner").getByRole("link", { name: "Colecionadora Lua" }),
    ).toBeVisible();

    await page.reload();
    await expect(page.getByLabel(/^Nome de exibição/)).toHaveValue("Colecionadora Lua");
  });

  test("usuário já usado aparece no campo", async ({ page }) => {
    await openWithScenario(page);
    await signIn(page);
    await page.goto("/perfil/dados");

    await page.getByLabel(/^Nome de usuário/).fill("nova.sato");
    await page.getByRole("button", { name: "Salvar", exact: true }).click();
    await expect(page.getByLabel(/^Nome de usuário/)).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByText("Este nome de usuário já está em uso.")).toBeVisible();
  });

  test("senha atual errada fica no campo; a correta altera a senha", async ({ page }) => {
    await openWithScenario(page);
    await signIn(page);
    await page.goto("/perfil/dados");

    await page.getByLabel(/^Senha atual/).fill("errada123");
    await page.getByLabel(/^Nova senha/).fill("novaSenha123");
    await page.getByLabel(/^Confirmar nova senha/).fill("novaSenha123");
    await page.getByRole("button", { name: "Salvar", exact: true }).click();
    await expect(page.getByText("A senha atual está incorreta.")).toBeVisible();
    await expect(page.getByLabel(/^Senha atual/)).toHaveAttribute("aria-invalid", "true");

    await page.getByLabel(/^Senha atual/).fill("kurio123");
    await page.getByRole("button", { name: "Salvar", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "Senha alterada." })).toBeVisible();

    const login = await api(page, {
      method: "POST",
      path: "/auth/login",
      body: { email: "colecionador@kurio.test", password: "novaSenha123" },
    });
    expect(login.status).toBe(200);
  });

  test("avatar: arquivo inválido avisa; envio e remoção funcionam", async ({ page }) => {
    await openWithScenario(page);
    await signIn(page);
    await page.goto("/perfil/dados");
    const file = page.getByLabel("Arquivo do avatar");

    await file.setInputFiles({
      name: "notas.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("x"),
    });
    await expect(page.getByText("Use uma imagem PNG, JPEG ou WebP.")).toBeVisible();

    await file.setInputFiles({ name: "avatar.png", mimeType: "image/png", buffer: PNG });
    await expect(page.getByRole("img", { name: "Avatar de Colecionador Kurio" })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("img", { name: "Avatar de Colecionador Kurio" })).toBeVisible();

    await page.getByRole("button", { name: "Remover" }).click();
    await expect(page.getByRole("img", { name: "Sem avatar" })).toBeVisible();
  });
});

test.describe("carteiras", { tag: "@desktop" }, () => {
  test("endereço inválido é recusado; a edição válida persiste", async ({ page }) => {
    await openWithScenario(page);
    await signIn(page);
    await page.goto("/perfil/carteiras");
    const primary = page.getByRole("form", { name: "Carteira principal" });
    const address = primary.getByLabel(/^Endereço da carteira/);

    await address.fill("0x123");
    await primary.getByRole("button", { name: "Salvar carteira" }).click();
    await expect(primary.getByText(/Use um endereço 0x seguido de 40/)).toBeVisible();

    await address.fill("0x1111111111111111111111111111111111111111");
    await primary.getByRole("button", { name: "Salvar carteira" }).click();
    await expect(primary.getByRole("status")).toHaveText("Carteira principal salva.");
    await page.reload();
    await expect(
      page.getByRole("form", { name: "Carteira principal" }).getByLabel(/^Endereço da carteira/),
    ).toHaveValue("0x1111111111111111111111111111111111111111");
  });

  test("carteira secundária igual à principal", async ({ page }) => {
    await openWithScenario(page);
    await signIn(page);
    await page.goto("/perfil/carteiras");
    await expect(page.getByText("Você ainda não adicionou uma carteira secundária.")).toBeVisible();

    await page.getByLabel("Igual à carteira principal").check();
    await page.getByRole("button", { name: "Adicionar" }).click();
    const secondary = page.getByRole("form", { name: "Carteira secundária" });
    await expect(secondary.getByLabel(/^Nome de exibição/)).toHaveValue("Colecionador Kurio");

    await secondary.getByRole("button", { name: "Salvar carteira" }).click();
    await expect(secondary.getByText("Informe o apelido da carteira.")).toBeVisible();
    await secondary.getByLabel(/^Apelido da carteira/).fill("Reserva");
    await secondary.getByRole("button", { name: "Salvar carteira" }).click();
    await expect(secondary.getByRole("status")).toHaveText("Carteira secundária salva.");
  });
});

test.describe("conta no mobile", { tag: "@mobile" }, () => {
  test("login em tela cheia com link para o cadastro", async ({ page }) => {
    await openWithScenario(page);
    await page.goto("/entrar");
    await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible();
    await page.getByRole("link", { name: "Crie uma conta" }).click();
    await expect(page).toHaveURL(/\/criar-conta/);
    await expect(page.getByRole("heading", { name: "Criar perfil de colecionador" })).toBeVisible();
  });

  test("perfil vira lista navegável", async ({ page }) => {
    await openWithScenario(page);
    await signIn(page);
    await page.goto("/perfil");
    await expect(page.getByRole("heading", { level: 1, name: "Meu perfil" })).toBeVisible();
    await page.getByRole("link", { name: "Carteiras" }).click();
    await expect(page.getByRole("heading", { name: "Carteira principal" })).toBeVisible();
    await page.getByRole("main").getByRole("link", { name: "Meu perfil" }).click();
    await expect(page).toHaveURL("/perfil");
  });
});
