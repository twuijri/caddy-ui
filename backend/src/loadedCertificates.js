import { X509Certificate } from 'node:crypto';
import { caddyGet } from './caddy.js';
import { readContainerFile } from './containerFs.js';

// Inspect origin files, not the public Cloudflare edge certificate.
export async function loadedCertificates(instance) {
    let files;
    try { files = await caddyGet('/config/apps/tls/certificates/load_files', instance.adminUrl); } catch { return []; }
    const result = [];
    for (const path of new Set((files || []).map(f => f.certificate).filter(Boolean))) {
        try {
            const cert = new X509Certificate(await readContainerFile(instance.containerName, path));
            const daysRemaining = Math.floor((Date.parse(cert.validTo) - Date.now()) / 86400000);
            result.push({ domain: cert.subjectAltName || cert.subject, issuer: 'imported', issuerDir: 'imported', path, validFrom: cert.validFrom, validTo: cert.validTo, daysRemaining, isManaged: true, isInternal: false, status: daysRemaining < 0 ? 'expired' : daysRemaining < 14 ? 'expiring' : 'valid' });
        } catch { /* File might not be mounted; do not expose key material. */ }
    }
    return result;
}
