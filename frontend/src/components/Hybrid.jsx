import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../utils/api.js';

export default function Hybrid({ onUnauth }) {
    const { t } = useTranslation();
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [busy, setBusy] = useState(false);
    const [form, setForm] = useState({ domain: '', upstream: '', certificate: '' });
    const [certificate, setCertificate] = useState(null);
    const [privateKey, setPrivateKey] = useState(null);
    const refresh = useCallback(async () => {
        try { setData(await apiFetch('/hybrid', {}, onUnauth)); setError(''); }
        catch (err) { setError(err.message); }
    }, [onUnauth]);
    useEffect(() => {
        refresh();
        const id = setInterval(refresh, 5000);
        return () => clearInterval(id);
    }, [refresh]);
    async function action(path, method, body) {
        setBusy(true); setError(''); setMessage('');
        try {
            const result = await apiFetch(path, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }, onUnauth);
            setMessage(result.certificatePath ? `${result.certificatePath} ${result.keyPath}` : t('hybrid.pendingHelp'));
            await refresh();
            return true;
        } catch (err) { setError(err.message); return false; }
        finally { setBusy(false); }
    }
    return <section style={{ padding: 24 }}>
        <h2>{t('hybrid.title')}</h2>
        <p>{t('hybrid.help')}</p>
        {error && <p role="alert" style={{ color: 'var(--danger)' }}>{error}</p>}
        {message && <p role="status" style={{ overflowWrap: 'anywhere' }}>{message}</p>}
        <h3>{t('hybrid.manual')}</h3>
        <form onSubmit={e => { e.preventDefault(); action('/hybrid/sites', 'POST', form); }} style={{ display: 'grid', gap: 12, maxWidth: 650 }}>
            <label>{t('hybrid.domain')}<input required value={form.domain} onChange={e => setForm({ ...form, domain: e.target.value })} /></label>
            <label>{t('hybrid.upstream')}<input required value={form.upstream} onChange={e => setForm({ ...form, upstream: e.target.value })} /></label>
            <label>{t('hybrid.certificate')}<select value={form.certificate} onChange={e => setForm({ ...form, certificate: e.target.value })}>
                <option value="">{t('hybrid.automatic')}</option>
                {data?.certificates.map(c => <option key={c.id} value={c.id}>{c.names} — {c.id.slice(0, 8)}</option>)}
            </select></label>
            <button disabled={busy} type="submit">{t('common.save')}</button>
        </form>
        <p>{t('hybrid.networkHelp')}</p>
        <div style={{ overflowX: 'auto' }}><table><thead><tr><th>{t('hybrid.domain')}</th><th>{t('hybrid.upstream')}</th><th>{t('hybrid.status')}</th><th>{t('hybrid.actions')}</th></tr></thead><tbody>
            {data?.sites.map(s => <tr key={s.domain}><td>{s.domain}</td><td>{s.upstream}</td><td>{s.status}</td><td>
                <button disabled={busy} onClick={() => setForm({ domain: s.domain, upstream: s.upstream, certificate: s.certificate })}>{t('hybrid.edit')}</button>
                <button disabled={busy} onClick={() => { if (window.confirm(t('hybrid.confirmDelete', { domain: s.domain }))) action(`/hybrid/sites/${encodeURIComponent(s.domain)}`, 'DELETE'); }}>{t('common.delete')}</button>
            </td></tr>)}
        </tbody></table></div>
        <h3>{t('hybrid.labels')}</h3><p>{t('hybrid.labelHelp')}</p>
        <ul>{data?.labels.map(h => <li key={h}>{h}</li>)}</ul>
        <h3>{t('hybrid.upload')}</h3><p>{t('hybrid.keyHelp')}</p>
        <form style={{ display: 'grid', gap: 12, maxWidth: 650 }} onSubmit={async e => {
            e.preventDefault(); const element = e.currentTarget;
            if (!certificate || !privateKey) return;
            if (await action('/hybrid/certificates', 'POST', { certificate: await certificate.text(), privateKey: await privateKey.text() })) {
                setCertificate(null); setPrivateKey(null); element.reset();
            }
        }}>
            <label>{t('hybrid.certificate')}<input required type="file" onChange={e => setCertificate(e.target.files[0])} /></label>
            <label>{t('hybrid.key')}<input required type="file" onChange={e => setPrivateKey(e.target.files[0])} /></label>
            <button disabled={busy} type="submit">{t('hybrid.upload')}</button>
        </form>
        <ul>{data?.certificates.map(c => <li key={c.id}>{c.names} — {t('hybrid.expiry', { date: c.validTo, days: c.daysRemaining })}<br /><code>{`caddy.tls: "/hybrid/certs/${c.id}/cert.pem /hybrid/certs/${c.id}/key.pem"`}</code></li>)}</ul>
    </section>;
}
