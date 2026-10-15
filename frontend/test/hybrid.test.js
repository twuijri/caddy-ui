import { describe, expect, it } from 'vitest';
import { filterHybridSites, validateHybridSite } from '../src/utils/hybrid.js';

const site = { domain: 'app.example.com', upstream: 'app:8080', certificate: '' };

describe('Hybrid source presentation', () => {
    const data = { sites: [{ ...site, status: 'pending' }], labels: ['app.example.com', 'external.example.com'] };

    it('keeps both owners visible when labels claim a manual hostname', () => {
        const rows = filterHybridSites(data, 'app.example.com');
        expect(rows).toHaveLength(2);
        expect(rows.map(row => row.source)).toEqual(['manual', 'labels']);
        expect(rows[1]).toMatchObject({ status: 'labels', upstream: '' });
    });

    it('combines source filtering with case-insensitive domain and upstream search', () => {
        expect(filterHybridSites(data, ' APP:8080 ', 'manual')).toHaveLength(1);
        expect(filterHybridSites(data, ' APP:8080 ', 'labels')).toHaveLength(0);
        expect(filterHybridSites(data, 'EXTERNAL', 'labels')[0].domain).toBe('external.example.com');
        expect(filterHybridSites(null)).toEqual([]);
    });
});

describe('Hybrid route validation', () => {
    it('allows a valid route and existing route updates', () => {
        expect(validateHybridSite(site, [])).toBe('');
        expect(validateHybridSite({ ...site, upstream: '192.168.1.10:443' }, [])).toBe('');
    });

    it.each(['https://app.example.com', 'app.example.com/path', 'app.example.com:443', '-app.example.com'])('rejects invalid domain %s', domain => {
        expect(validateHybridSite({ ...site, domain }, [])).toBe('hybrid.invalidDomain');
    });

    it.each(['app', 'app:0', 'app:65536', 'https://app:443', 'app:8080/path'])('rejects invalid upstream %s', upstream => {
        expect(validateHybridSite({ ...site, upstream }, [])).toBe('hybrid.invalidUpstream');
    });

    it('protects exact and wildcard label ownership without blocking deeper hostnames', () => {
        expect(validateHybridSite(site, ['app.example.com'])).toBe('hybrid.conflictHelp');
        expect(validateHybridSite(site, ['*.example.com'])).toBe('hybrid.conflictHelp');
        expect(validateHybridSite({ ...site, domain: 'nested.app.example.com' }, ['*.example.com'])).toBe('');
    });
});
