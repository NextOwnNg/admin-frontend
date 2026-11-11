import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Modal } from '@heroui/react'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { Banner } from '@/components/ui/Banner'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { Field } from '@/components/ui/Field'
import { SelectField } from '@/components/ui/SelectField'
import { useCaseAction } from '@/features/actions/api/useCaseAction'
import { useTransactionAction } from '@/features/actions/api/useTransactionAction'
import { ReasonCodeField } from '@/features/actions/components/ReasonCodeField'
import { TargetPicker } from '@/features/actions/components/TargetPicker'
import {
  closeOutcomesFor,
  reasonKindFor,
  targetsFor,
  type ActionContext,
  type ActionDefinition,
  type ActionValues,
} from '@/features/actions/definitions'
import { getCase } from '@/features/cases/api/case-api'
import { getTransaction, transactionQueryKey } from '@/features/transactions/api/transaction-api'
import { toApiError } from '@/lib/api/api-error'
import { errorMessage, fieldErrorsOf, isConflict } from '@/lib/api/error-message'
import { newIdempotencyKey } from '@/lib/api/idempotency'
import { caseQueryKey, reasonCodeLabel, useReasonCodes } from '@/lib/api/reference'
import type { AuditEntry } from '@/lib/api/types/audit'
import type { CaseActionBody, CaseActionId } from '@/lib/api/types/cases'
import type { TransactionOutcome } from '@/lib/api/types/transactions'
import { ROLE_LABELS } from '@/lib/copy/labels'
import { TRANSACTION_OUTCOME } from '@/lib/copy/status'
import { useSessionStore } from '@/stores/session'

type DialogProps = {
  definition: ActionDefinition
  context: ActionContext
  open: boolean
  onOpenChange: (open: boolean) => void
  onDone: (entry: AuditEntry) => void
  /** Pre-filled values, e.g. the item when opened from that item's row */
  initial?: Partial<ActionValues>
}

/**
 * Every privileged action's form (design §4.5): target, action fields and a required reason, then an
 * explicit confirmation naming actor, target, consequence and reason. One Idempotency-Key per opening.
 */
export function ActionDialog({ open, onOpenChange, ...props }: DialogProps) {
  return (
    <Modal isOpen={open} onOpenChange={onOpenChange}>
      <Modal.Backdrop isDismissable={false}>
        <Modal.Container size="md" className="max-w-160">
          <Modal.Dialog className="rounded-card">
            <ActionForm {...props} close={() => onOpenChange(false)} />
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  )
}

const DURATIONS = [
  { value: '1', label: '1 day' },
  { value: '3', label: '3 days' },
  { value: '7', label: '7 days' },
  { value: '30', label: '30 days' },
]

function schemaFor(definition: ActionDefinition) {
  const needs = (field: ActionDefinition['required'][number]) => definition.required.includes(field)
  const text = z.string().trim().max(1000, 'Keep it under 1,000 characters.')
  const choice = (message: string, required: boolean) => (required ? z.string().min(1, message) : z.string().optional())
  return z.object({
    targetId: z.string().min(1, 'Choose who or what this applies to.'),
    reasonCode: choice('Choose a reason.', definition.reasonKind !== null),
    note: needs('note') ? text.min(1, 'Add a note for the next person.') : text.optional(),
    message: needs('message') ? text.min(1, 'Write the message the member will see.') : text.optional(),
    durationDays: needs('durationDays')
      ? z.enum(['1', '3', '7', '30'], { message: 'Choose how long.' })
      : z.enum(['1', '3', '7', '30']).optional(),
    outcome: choice('Choose the outcome.', needs('outcome')),
    itemId: choice('Choose the item.', needs('item')),
  })
}

const upperFirst = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

type Notice = { tone: 'warning' | 'error' | 'info'; title: string; body?: string; retry?: boolean }

const versionOf = (context: ActionContext) =>
  context.kind === 'case' ? context.caseDetail.version : context.tx.version
const historyOf = (context: ActionContext) =>
  context.kind === 'case' ? context.caseDetail.history : context.tx.history

function ActionForm({
  definition,
  context,
  onDone,
  initial,
  close,
}: Omit<DialogProps, 'open' | 'onOpenChange'> & { close: () => void }) {
  const queryClient = useQueryClient()
  const { displayName, roles } = useSessionStore()
  const reasons = useReasonCodes()
  const targets = targetsFor(definition, context)
  // Kept from the opening: another operator's change can take a target away while the form is open
  const [openedTargets] = useState(targets)
  const caseAction = useCaseAction(context.kind === 'case' ? context.caseDetail.id : '')
  const txAction = useTransactionAction(
    context.kind === 'transaction' ? context.tx.id : '',
    context.kind === 'transaction' ? context.caseId : undefined,
  )

  // Fixed for this opening: retries and resubmits after a conflict reuse the key (design §4.5)
  const [idempotencyKey] = useState(newIdempotencyKey)
  const [knownEntries] = useState(() => new Set(historyOf(context).map((e) => e.id)))
  const [expectedVersion, setExpectedVersion] = useState(() => versionOf(context))
  const [confirming, setConfirming] = useState(false)
  const [checking, setChecking] = useState(false)
  const [notice, setNotice] = useState<Notice | null>(null)

  const form = useForm<ActionValues>({
    resolver: zodResolver(schemaFor(definition)) as never,
    mode: 'onChange',
    defaultValues: {
      targetId: targets[0]?.id ?? '',
      reasonCode: '',
      note: '',
      message: '',
      outcome: '',
      itemId: '',
      ...initial,
    },
  })
  const { register, control, formState, getValues, setValue, setError } = form
  const values = useWatch({ control }) as ActionValues
  const gone = !targets.some((t) => t.id === values.targetId)
  const target =
    targets.find((t) => t.id === values.targetId) ??
    openedTargets.find((t) => t.id === values.targetId) ??
    openedTargets[0]!
  const reasonKind = reasonKindFor(definition, values)

  // A different outcome can need a different kind of reason: start the reason again
  const lastKind = useRef(reasonKind)
  useEffect(() => {
    if (lastKind.current === reasonKind) return
    lastKind.current = reasonKind
    setValue('reasonCode', '', { shouldValidate: true })
  }, [reasonKind, setValue])

  const reason = reasons.data?.find((r) => r.code === values.reasonCode)
  const copy = { target, values, context }
  const actor = `${displayName ?? 'You'} (${roles.map((r) => ROLE_LABELS[r]).join(', ')})`

  async function refresh() {
    if (context.kind === 'case') {
      const fresh = await queryClient.fetchQuery({
        queryKey: caseQueryKey(context.caseDetail.id),
        queryFn: () => getCase(context.caseDetail.id),
        staleTime: 0,
      })
      return { version: fresh.version, history: fresh.history }
    }
    const fresh = await queryClient.fetchQuery({
      queryKey: transactionQueryKey(context.tx.id, context.caseId),
      queryFn: () => getTransaction(context.tx.id, context.caseId),
      staleTime: 0,
    })
    return { version: fresh.version, history: fresh.history }
  }

  async function send(v: ActionValues): Promise<AuditEntry> {
    const note = v.note?.trim() || undefined
    if (context.kind === 'case') {
      const body: CaseActionBody = {
        action: definition.id as CaseActionId,
        target: { type: target.type, id: target.id },
        reasonCode: v.reasonCode || undefined,
        note,
        message: v.message?.trim() || undefined,
        durationDays: v.durationDays ? (Number(v.durationDays) as CaseActionBody['durationDays']) : undefined,
        outcome: (v.outcome || undefined) as CaseActionBody['outcome'],
        expectedVersion,
      }
      return (await caseAction.mutateAsync({ body, idempotencyKey })).auditEntry
    }
    const result =
      definition.id === 'release'
        ? await txAction.mutateAsync({
            kind: 'release',
            idempotencyKey,
            body: { itemId: v.itemId ?? '', reasonCode: v.reasonCode ?? '', note, expectedVersion },
          })
        : await txAction.mutateAsync({
            kind: 'resolve',
            idempotencyKey,
            body: {
              outcome: v.outcome as TransactionOutcome,
              reasonCode: v.reasonCode ?? '',
              note,
              expectedVersion,
            },
          })
    return result.auditEntry
  }

  /** After a lost answer: the entry this action would have written, if the server applied it */
  const appliedEntry = (history: AuditEntry[]) =>
    history.find(
      (e) =>
        !knownEntries.has(e.id) && e.action === definition.id && e.target.id === target.id && e.actor === displayName,
    )

  async function confirm() {
    setNotice(null)
    try {
      const entry = await send(getValues())
      onDone(entry)
      close()
    } catch (error) {
      if (isConflict(error)) {
        const fresh = await refresh().catch(() => null)
        if (fresh) setExpectedVersion(fresh.version)
        setNotice({
          tone: 'warning',
          title: 'This case changed since you opened it.',
          body: 'Review the latest version before acting again. Your entries are kept.',
        })
        return
      }
      if (toApiError(error).isOutcomeUnknown) {
        setChecking(true)
        const fresh = await refresh().catch(() => null)
        setChecking(false)
        const entry = fresh && appliedEntry(fresh.history)
        if (entry) {
          onDone(entry)
          close()
          return
        }
        setNotice({
          tone: 'error',
          title: "We couldn't confirm this was recorded.",
          body: "Nothing new appears in the history. Try again: it can't be recorded twice.",
          retry: true,
        })
        return
      }
      const fields = fieldErrorsOf(error)
      if (fields) {
        for (const [field, message] of Object.entries(fields)) {
          const name = (field === 'target' ? 'targetId' : field) as keyof ActionValues
          setError(name, { message })
        }
      }
      setNotice({ tone: 'error', title: errorMessage(error, "The action wasn't recorded.") })
    }
  }

  const outcomeOptions =
    context.kind === 'transaction'
      ? context.tx.allowedOutcomes.map((o) => ({ value: o, label: TRANSACTION_OUTCOME[o] }))
      : // A support agent proposes what should happen to the transaction behind a transaction case
        definition.id === 'propose' && context.caseDetail.transactionId
        ? (Object.entries(TRANSACTION_OUTCOME) as [TransactionOutcome, string][]).map(([value, label]) => ({
            value,
            label,
          }))
        : closeOutcomesFor(context.caseDetail.kind).map(([value, label]) => ({ value, label }))
  const completionWithheld = context.kind === 'transaction' && !context.tx.allowedOutcomes.includes('completed')
  const itemOptions =
    context.kind === 'transaction'
      ? context.tx.reservations
          .filter((r) => r.releasable && !r.releasedAt)
          .map((r) => ({ value: r.itemId, label: r.itemTitle }))
      : []
  const errors = formState.errors

  return (
    <>
      <Modal.Header>
        <Modal.Heading className="text-h3 text-ink">{definition.label}</Modal.Heading>
      </Modal.Header>
      <Modal.Body className="flex flex-col gap-4">
        {checking && <Banner tone="info" title="Checking the latest status…" />}
        {notice && (
          <Banner
            tone={notice.tone}
            title={notice.title}
            action={
              notice.retry ? (
                <Button size="sm" variant="secondary" onPress={() => void confirm()}>
                  Try again
                </Button>
              ) : undefined
            }
          >
            {notice.body}
          </Banner>
        )}

        {gone && (
          <Banner tone="warning" title={`${upperFirst(target.label)} is no longer available for this action.`}>
            Nothing was recorded. Close this and review the case.
          </Banner>
        )}

        {targets.length > 1 ? (
          <TargetPicker
            targets={targets}
            value={values.targetId}
            onChange={(id) => setValue('targetId', id, { shouldValidate: true })}
          />
        ) : (
          <p className="text-body text-ink">
            <span className="text-muted">Applies to </span>
            {target.label}
          </p>
        )}

        {definition.fields.includes('outcome') && (
          <SelectField
            label="Outcome"
            placeholder="Choose the outcome"
            options={outcomeOptions}
            error={errors.outcome?.message}
            hint={
              definition.id === 'resolve' && completionWithheld
                ? "Completed isn't available: it needs two valid participant confirmations and no open restriction."
                : undefined
            }
            {...register('outcome')}
          />
        )}
        {definition.fields.includes('item') && (
          <SelectField
            label="Item"
            placeholder="Choose the item"
            options={itemOptions}
            error={errors.itemId?.message}
            {...register('itemId')}
          />
        )}
        {definition.fields.includes('durationDays') && (
          <SelectField
            label="Duration"
            placeholder="Choose how long"
            options={DURATIONS}
            error={errors.durationDays?.message}
            {...register('durationDays')}
          />
        )}
        {reasonKind && (
          <ReasonCodeField
            kind={reasonKind}
            targetType={target.type}
            caseKind={context.kind === 'case' ? context.caseDetail.kind : undefined}
            error={errors.reasonCode?.message}
            {...register('reasonCode')}
          />
        )}
        {definition.fields.includes('message') && (
          <Field
            label="Message to the member"
            hint="Plain words; the member sees this exactly."
            error={errors.message?.message}
          >
            {({ inputId, describedBy, invalid }) => (
              <textarea
                id={inputId}
                aria-describedby={describedBy}
                aria-invalid={invalid || undefined}
                rows={3}
                maxLength={1000}
                className="field-input min-h-20 py-3"
                {...register('message')}
              />
            )}
          </Field>
        )}
        {definition.fields.includes('note') && (
          <Field
            label="Note"
            hint={definition.required.includes('note') ? 'Only staff see it.' : 'Optional. Only staff see it.'}
            error={errors.note?.message}
          >
            {({ inputId, describedBy, invalid }) => (
              <textarea
                id={inputId}
                aria-describedby={describedBy}
                aria-invalid={invalid || undefined}
                rows={2}
                maxLength={1000}
                className="field-input min-h-16 py-3"
                {...register('note')}
              />
            )}
          </Field>
        )}
      </Modal.Body>
      <Modal.Footer className="flex justify-end gap-2">
        <Button variant="tertiary" onPress={close} isDisabled={checking}>
          Cancel
        </Button>
        <Button
          isDisabled={!formState.isValid || checking || gone}
          onPress={() => void form.handleSubmit(() => setConfirming(true))()}
        >
          Continue
        </Button>
      </Modal.Footer>

      <ConfirmModal
        open={confirming}
        onOpenChange={setConfirming}
        title={definition.confirmTitle(copy)}
        actor={actor}
        target={target.label}
        consequence={definition.consequence(copy)}
        reason={reason ? reasonCodeLabel(reason) : undefined}
        confirmLabel={definition.label}
        tone={definition.destructive ? 'destructive' : 'standard'}
        onConfirm={confirm}
      />
    </>
  )
}
