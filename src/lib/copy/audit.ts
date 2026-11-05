import type { AuditEntry } from '@/lib/api/types/audit'

/** Audit action codes in words (design §4.6). The log shows "Tunde Bakare hid comment C-5501". */
export const AUDIT_ACTIONS: Record<string, { label: string; verb: string }> = {
  open_case: { label: 'Case opened', verb: 'opened' },
  offer_accepted: { label: 'Offer accepted', verb: 'recorded the accepted offer for' },
  assign: { label: 'Assigned', verb: 'assigned' },
  unassign: { label: 'Unassigned', verb: 'unassigned' },
  note: { label: 'Note added', verb: 'added a note to' },
  hide: { label: 'Content hidden', verb: 'hid' },
  remove: { label: 'Content removed', verb: 'removed' },
  warn: { label: 'Account warned', verb: 'warned' },
  restrict: { label: 'Account restricted', verb: 'restricted' },
  lift_restriction: { label: 'Restriction lifted', verb: 'lifted the restriction on' },
  close: { label: 'Report closed', verb: 'closed' },
  request_info: { label: 'Information requested', verb: 'requested information on' },
  escalate: { label: 'Escalated', verb: 'escalated' },
  propose: { label: 'Decision proposed', verb: 'proposed a decision on' },
  resolve: { label: 'Transaction resolved', verb: 'resolved' },
  release: { label: 'Item released', verb: 'released an item in' },
  view_phone: { label: 'Phone number viewed', verb: 'viewed a phone number in' },
  view_messages: { label: 'Messages viewed', verb: 'viewed private messages in' },
  view_evidence: { label: 'Evidence viewed', verb: 'viewed evidence in' },
  view_venue: { label: 'Handover venue viewed', verb: 'viewed the handover venue in' },
  update_settings: { label: 'Settings changed', verb: 'changed' },
}

/** `"Tunde Bakare hid comment C-5501"` */
export function auditSentence(entry: Pick<AuditEntry, 'actor' | 'action' | 'target'>): string {
  const verb = AUDIT_ACTIONS[entry.action]?.verb ?? entry.action.replaceAll('_', ' ')
  return `${entry.actor} ${verb} ${entry.target.label}`
}
