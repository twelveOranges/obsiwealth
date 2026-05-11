import type { AppModel } from "@ui/host/appModel";
import { t } from "@core/i18n";

export interface PasswordGateContext {
  plugin: AppModel;
  /** Translation helper, mirrors the view's `tr` closure. */
  tr: (key: Parameters<typeof t>[1], replacements?: Record<string, string>) => string;
  /** Invoked when the user enters the correct password. */
  onUnlock: () => void;
}

/**
 * Render the password gate into `el`.
 *
 * Extracted verbatim from `ObsiWealthMainView.canRenderProtectedPage`; its
 * behavior is byte-identical except that side effects are routed via `ctx`.
 */
export function renderPasswordGate(ctx: PasswordGateContext, el: HTMLElement): void {
  const tr = ctx.tr;

  const lock = el.createDiv();
  lock.style.flex = "1 1 auto";
  lock.style.display = "flex";
  lock.style.flexDirection = "column";
  lock.style.alignItems = "center";
  lock.style.justifyContent = "center";
  lock.style.gap = "12px";
  lock.style.padding = "24px";

  const title = lock.createDiv({ text: tr("passwordSecurity") });
  title.style.fontSize = "24px";
  title.style.fontWeight = "950";

  const desc = lock.createDiv({ text: tr("passwordPrompt") });
  desc.style.fontSize = "14px";
  desc.style.fontWeight = "800";
  desc.style.color = "var(--text-muted)";

  const input = lock.createEl("input");
  input.type = "password";
  input.placeholder = tr("password");
  input.style.width = "min(320px, 100%)";
  input.style.padding = "10px 12px";
  input.style.borderRadius = "12px";
  input.style.border = "1px solid var(--background-modifier-border)";

  const error = lock.createDiv();
  error.style.minHeight = "18px";
  error.style.fontSize = "13px";
  error.style.fontWeight = "800";
  error.style.color = "var(--text-error)";

  const button = lock.createEl("button", { text: tr("enter") });
  button.style.padding = "8px 18px";
  button.style.borderRadius = "999px";
  button.style.cursor = "pointer";

  const submit = () => {
    if (input.value === ctx.plugin.settings.password) {
      ctx.onUnlock();
      return;
    }
    error.innerText = tr("wrongPassword");
  };

  button.onclick = submit;
  input.onkeydown = (event) => {
    if (event.key === "Enter") {
      submit();
    }
  };

  input.focus();
}
