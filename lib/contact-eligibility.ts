import type { Lead } from './types';
export function hasApprovedContact(lead: Lead) {
    const contact = lead.contactVerification;
    return !!contact && !!lead.email && contact.email === lead.email.toLowerCase() && contact.identityConfirmed &&
        (contact.status === 'verified' || (contact.status === 'manually-approved' && contact.hunterStatus === 'accept_all' && !!contact.manualApprovedAt));
}
