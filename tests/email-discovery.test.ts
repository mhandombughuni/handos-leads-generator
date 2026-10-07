import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractPublicEmails, contactPageLinks, discoverEmails } from '../lib/email-discovery';
import { normalizeListing } from '../lib/discovery';
test('extracts published footer and mailto emails without guessing hidden form recipients', () => {
    const html = '<footer>info&#64;localbusiness.org</footer><a href="mailto:Owner%40localbusiness.org?subject=Hello">Email</a><script>"secret@other.org"</script><form action="/submit"></form>';
    assert.deepEqual(extractPublicEmails(html), ['owner@localbusiness.org', 'info@localbusiness.org']);
    assert.deepEqual(extractPublicEmails('<form action="/submit"></form>'), []);
});
test('contact links are bounded, deduplicated and restricted to the website origin', () => {
    const html = '<a href="/contact">Contact us</a><a href="https://elsewhere.org/contact">Contact</a><a href="/about">About</a><a href="/team">Team</a><a href="/contact">Contact</a>';
    assert.deepEqual(contactPageLinks(html, 'https://localbusiness.org'), ['https://localbusiness.org/contact', 'https://localbusiness.org/about']);
});
test('email discovery persists source evidence and leaves verification untouched', async () => {
    const key = process.env.HUNTER_API_KEY;
    delete process.env.HUNTER_API_KEY;
    try {
        const lead = normalizeListing({ title: 'Local business', website: 'https://localbusiness.org' }, { locationType: 'city', location: 'Fairfax', industry: 'Healthcare' });
        const read = async (url: string) => ({ url, html: url.endsWith('/contact') ? '<html><footer>hello@localbusiness.org</footer></html>' : '<html><a href="/contact">Contact us</a></html>' });
        const result = await discoverEmails(lead, read);
        assert.equal(result.emailCandidates?.[0].email, 'hello@localbusiness.org');
        assert.deepEqual(result.emailCandidates?.[0].sources, ['https://localbusiness.org/contact']);
        assert.equal(lead.email, null);
        assert.equal(lead.contactVerification, undefined);
        const failed = await discoverEmails(lead, async () => { throw new Error('blocked'); });
        assert.equal(failed.emailDiscovery?.status, 'incomplete');
    }
    finally {
        if (key !== undefined)
            process.env.HUNTER_API_KEY = key;
    }
});
