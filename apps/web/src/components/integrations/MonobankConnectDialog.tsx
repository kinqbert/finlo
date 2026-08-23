import { useState, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  ExternalLink,
  Landmark,
  RefreshCw,
  Unplug,
} from "lucide-react";
import {
  completeMonobank,
  disconnectMonobankWebhook,
  previewMonobank,
  registerMonobankWebhook,
} from "@/api";
import { Button } from "@/components/ui/Button";
import { FinanceDialog, FormField } from "@/components/ui/FinanceDialog";
import { InlineError } from "@/components/ui/Feedback";
import { formatMoney, errorMessage } from "@/lib/format";
import { queryKeys } from "@/lib/query";
import type { FinanceActions, MonobankPreview } from "@/types";

type Step = "intro" | "token" | "selection" | "complete";

export function MonobankConnectDialog({ data, isDemo }: FinanceActions) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const [step, setStep] = useState<Step>("intro");
  const [token, setToken] = useState("");
  const [preview, setPreview] = useState<MonobankPreview | null>(null);
  const [accountIDs, setAccountIDs] = useState<string[]>([]);
  const [jarIDs, setJarIDs] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [disconnectError, setDisconnectError] = useState("");
  const previewMutation = useMutation({ mutationFn: previewMonobank });
  const completeMutation = useMutation({ mutationFn: completeMonobank });
  const webhookMutation = useMutation({ mutationFn: registerMonobankWebhook });
  const disconnectMutation = useMutation({
    mutationFn: disconnectMonobankWebhook,
  });
  const busy =
    previewMutation.isPending ||
    completeMutation.isPending ||
    webhookMutation.isPending ||
    disconnectMutation.isPending;

  function reset() {
    setStep("intro");
    setToken("");
    setPreview(null);
    setAccountIDs([]);
    setJarIDs([]);
    setError("");
  }

  async function validateToken() {
    setError("");
    try {
      const result = await previewMutation.mutateAsync(token);
      setToken("");
      setPreview(result);
      setAccountIDs(result.accounts.map((account) => account.id));
      setJarIDs(result.jars.map((jar) => jar.id));
      setStep("selection");
    } catch (caught) {
      setError(errorMessage(caught, "Could not validate this Monobank token."));
    }
  }

  async function finish() {
    if (!preview) return;
    setError("");
    try {
      const connection = await completeMutation.mutateAsync({
        connection_id: preview.connection_id,
        account_ids: accountIDs,
        jar_ids: jarIDs,
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.session });
      if (connection.status === "webhook_error") {
        setError(
          connection.last_error ||
            "Accounts were added, but Monobank could not activate the webhook.",
        );
        return;
      }
      setStep("complete");
    } catch (caught) {
      setError(
        errorMessage(caught, "Could not finish the Monobank connection."),
      );
    }
  }

  async function retryWebhook() {
    const connection = data.monobankConnection;
    if (!connection) return;
    setError("");
    try {
      const updated = await webhookMutation.mutateAsync();
      await queryClient.invalidateQueries({ queryKey: queryKeys.session });
      if (updated.status === "webhook_error") {
        setError(
          updated.last_error || "Monobank could not activate the webhook.",
        );
      }
    } catch (caught) {
      setError(
        errorMessage(caught, "Could not activate the Monobank webhook."),
      );
    }
  }

  async function disconnectWebhook() {
    setDisconnectError("");
    try {
      await disconnectMutation.mutateAsync();
      await queryClient.invalidateQueries({ queryKey: queryKeys.session });
      setDisconnectOpen(false);
    } catch (caught) {
      setDisconnectError(
        errorMessage(caught, "Could not disconnect the Monobank webhook."),
      );
    }
  }

  function toggle(
    values: string[],
    id: string,
    selected: boolean,
    update: (next: string[]) => void,
  ) {
    update(selected ? [...values, id] : values.filter((value) => value !== id));
  }

  if (
    data.monobankConnection &&
    data.monobankConnection.status !== "pending"
  ) {
    const hasWebhookError =
      data.monobankConnection.status === "webhook_error";
    const disconnected = data.monobankConnection.status === "disconnected";
    return (
      <div className="grid justify-items-end gap-1">
        <div className="flex flex-wrap justify-end gap-1.5">
          <Button
            variant={hasWebhookError || disconnected ? "primary" : "secondary"}
            disabled={isDemo || busy}
            onClick={() => void retryWebhook()}
          >
            <RefreshCw
              className={webhookMutation.isPending ? "animate-spin" : undefined}
              size={15}
            />{" "}
            {webhookMutation.isPending
              ? "Registering…"
              : hasWebhookError
                ? "Retry webhook"
                : disconnected
                  ? "Reconnect webhook"
                  : "Re-register webhook"}
          </Button>
          {!disconnected && (
            <Dialog.Root
              open={disconnectOpen}
              onOpenChange={(next) => {
                if (!disconnectMutation.isPending) {
                  setDisconnectOpen(next);
                  if (next) setDisconnectError("");
                }
              }}
            >
              <Dialog.Trigger asChild>
                <Button variant="danger" disabled={isDemo || busy}>
                  <Unplug size={15} /> Disconnect
                </Button>
              </Dialog.Trigger>
              <FinanceDialog
                busy={disconnectMutation.isPending}
                eyebrow="Monobank connection"
                title="Disconnect the webhook?"
                description="Finlo will stop receiving new Monobank transactions. Your imported accounts, goals, transactions, token, and category rules will remain available."
              >
                <div className="mt-5 grid gap-3">
                  <InlineError message={disconnectError} />
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      disabled={disconnectMutation.isPending}
                      onClick={() => setDisconnectOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      disabled={disconnectMutation.isPending}
                      onClick={() => void disconnectWebhook()}
                    >
                      <Unplug size={15} />{" "}
                      {disconnectMutation.isPending
                        ? "Disconnecting…"
                        : "Disconnect webhook"}
                    </Button>
                  </div>
                </div>
              </FinanceDialog>
            </Dialog.Root>
          )}
        </div>
        {error && (
          <small className="max-w-60 text-right text-[8px] text-[#984b37]">
            {error}
          </small>
        )}
        {webhookMutation.isSuccess && !error && (
          <small className="text-right text-[8px] font-bold text-[#53725f]">
            Webhook registered.
          </small>
        )}
      </div>
    );
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!busy) {
          setOpen(next);
          if (!next) reset();
        }
      }}
    >
      <Dialog.Trigger asChild>
        <Button variant="primary" disabled={isDemo}>
          <Landmark size={15} /> Connect Monobank
        </Button>
      </Dialog.Trigger>
      <FinanceDialog
        busy={busy}
        eyebrow={`Monobank · Step ${step === "intro" ? 1 : step === "token" ? 2 : step === "selection" ? 3 : 4} of 4`}
        title={
          step === "intro"
            ? "Connect Monobank"
            : step === "token"
              ? "Create your personal token"
              : step === "selection"
                ? "Choose what to add"
                : "Monobank is connected"
        }
        description={
          step === "intro"
            ? "Only transactions received after setup will be imported."
            : step === "token"
              ? "The token goes directly to Finlo’s server and is encrypted before storage."
              : step === "selection"
                ? `Connected as ${preview?.client_name ?? "Monobank client"}.`
                : "New transactions will arrive automatically through the webhook."
        }
      >
        <div className="mt-5">
          {step === "intro" && (
            <div className="grid gap-3">
              <div className="rounded-xl bg-[#f3f6ef] p-4 text-[11px] leading-[1.6] text-muted">
                <strong className="mb-1 block text-xs text-ink">
                  What Finlo will access
                </strong>
                Selected account balances, new transactions, and selected jars.
                Existing transactions will not be downloaded.
              </div>
              <Button variant="primary" onClick={() => setStep("token")}>
                Start setup
              </Button>
            </div>
          )}

          {step === "token" && (
            <div className="grid gap-4">
              <ol className="m-0 grid gap-2 pl-5 text-[11px] leading-[1.5] text-muted">
                <li>Open Monobank’s personal API page.</li>
                <li>Confirm your phone number in the Monobank app.</li>
                <li>Create and copy a personal token, then paste it below.</li>
              </ol>
              <a
                className="inline-flex items-center gap-1.5 justify-self-start text-[11px] font-bold text-brand"
                href="https://api.monobank.ua/"
                target="_blank"
                rel="noreferrer"
              >
                Open Monobank API <ExternalLink size={13} />
              </a>
              <FormField label="Personal token">
                <input
                  type="password"
                  autoComplete="off"
                  value={token}
                  disabled={busy}
                  onChange={(event) => setToken(event.target.value)}
                  placeholder="Paste your token"
                />
              </FormField>
              <InlineError message={error} />
              <div className="flex justify-between gap-2">
                <Button type="button" onClick={() => setStep("intro")}>
                  Back
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  disabled={!token.trim() || busy}
                  onClick={() => void validateToken()}
                >
                  {busy ? "Checking…" : "Check token"}
                </Button>
              </div>
            </div>
          )}

          {step === "selection" && preview && (
            <div className="grid gap-4">
              <Selection
                title="Accounts"
                empty="No supported accounts were found."
              >
                {preview.accounts.map((account) => (
                  <SelectionRow
                    key={account.id}
                    checked={accountIDs.includes(account.id)}
                    onChange={(checked) =>
                      toggle(accountIDs, account.id, checked, setAccountIDs)
                    }
                    title={account.name}
                    detail={`${account.type} · ${account.currency}`}
                    value={formatMoney(account.balance_minor, account.currency)}
                  />
                ))}
              </Selection>
              <Selection title="Jars as goals" empty="No jars were found.">
                {preview.jars.map((jar) => (
                  <SelectionRow
                    key={jar.id}
                    checked={jarIDs.includes(jar.id)}
                    onChange={(checked) =>
                      toggle(jarIDs, jar.id, checked, setJarIDs)
                    }
                    title={jar.title || "Untitled jar"}
                    detail={
                      jar.target_minor
                        ? `Goal ${formatMoney(jar.target_minor, jar.currency)}`
                        : "No target"
                    }
                    value={formatMoney(jar.balance_minor, jar.currency)}
                  />
                ))}
              </Selection>
              <InlineError message={error} />
              <div className="flex justify-between gap-2">
                <Button type="button" onClick={() => setStep("token")}>
                  Back
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  disabled={busy || accountIDs.length + jarIDs.length === 0}
                  onClick={() => void finish()}
                >
                  {busy ? "Connecting…" : "Add selected"}
                </Button>
              </div>
            </div>
          )}

          {step === "complete" && (
            <div className="grid justify-items-center gap-3 py-5 text-center">
              <span className="grid size-12 place-items-center rounded-full bg-[#e6f2df] text-brand">
                <Check size={24} />
              </span>
              <p className="m-0 max-w-72 text-[11px] leading-[1.6] text-muted">
                Your selected accounts and jars are ready. Finlo will categorize
                each new transaction using your MCC rules.
              </p>
              <Dialog.Close asChild>
                <Button variant="primary">Done</Button>
              </Dialog.Close>
            </div>
          )}
        </div>
      </FinanceDialog>
    </Dialog.Root>
  );
}

function Selection({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: ReactNode;
}) {
  const hasChildren = Array.isArray(children)
    ? children.length > 0
    : Boolean(children);
  return (
    <section>
      <h3 className="mt-0 mb-2 text-xs">{title}</h3>
      <div className="max-h-44 overflow-y-auto rounded-xl border border-line">
        {hasChildren ? (
          children
        ) : (
          <p className="m-0 p-3 text-[10px] text-muted">{empty}</p>
        )}
      </div>
    </section>
  );
}

function SelectionRow({
  checked,
  onChange,
  title,
  detail,
  value,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  title: string;
  detail: string;
  value: string;
}) {
  return (
    <label className="grid cursor-pointer grid-cols-[auto_1fr_auto] items-center gap-2.5 border-b border-line px-3 py-2.5 last:border-b-0 hover:bg-canvas">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="min-w-0">
        <strong className="block overflow-hidden text-[11px] text-ellipsis whitespace-nowrap">
          {title}
        </strong>
        <small className="text-[9px] text-muted">{detail}</small>
      </span>
      <b className="text-[10px]">{value}</b>
    </label>
  );
}
