import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../utils/api.js';

export default function Hybrid({ onUnauth }) {
    const { t } = useTranslation();
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [busy, setBusy] = useState(false);
    const [editing, setEditing] = useState(false);
    const [search, setSearch] = useState('');
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
        <div className="flex-between routes-toolbar">
            <div className="field"><input aria-label={t('hybrid.domain')} placeholder={t('hybrid.domain')} value={search} onChange={e => setSearch(e.target.value)} /></div>
            <button className="btn btn-primary" onClick={() => { setForm({ domain: '', upstream: '', certificate: '' }); setEditing(true); }}>{t('routes.addRoute')}</button>
        </div>
        {editing && <div className="modal-overlay"><div className="modal" role="dialog" aria-modal="true" aria-labelledby="hybrid-form-title">
        <h3 className="modal-title" id="hybrid-form-title">{t('hybrid.manual')}</h3>
        <form onSubmit={async e => { e.preventDefault(); if (await action('/hybrid/sites', 'POST', form)) setEditing(false); }}>
            <div className="field"><label htmlFor="hybrid-domain">{t('hybrid.domain')}</label><input id="hybrid-domain" required value={form.domain} onChange={e => setForm({ ...form, domain: e.target.value })} /></div>
            <div className="field"><label htmlFor="hybrid-upstream">{t('hybrid.upstream')}</label><input id="hybrid-upstream" required value={form.upstream} onChange={e => setForm({ ...form, upstream: e.target.value })} /></div>
            <div className="field"><label htmlFor="hybrid-certificate">{t('hybrid.certificate')}</label><select id="hybrid-certificate" value={form.certificate} onChange={e => setForm({ ...form, certificate: e.target.value })}>
                <option value="">{t('hybrid.automatic')}</option>
                {data?.certificates.map(c => <option key={c.id} value={c.id}>{c.names} — {c.id.slice(0, 8)}</option>)}
            </select></div>
            <p className="modal-hint">{t('hybrid.networkHelp')}</p>
            {error && <p role="alert">{error}</p>}
            <div className="btn-row flex-end"><button className="btn btn-ghost" type="button" disabled={busy} onClick={() => setEditing(false)}>{t('common.cancel')}</button><button className="btn btn-primary" disabled={busy} type="submit">{t('common.save')}</button></div>
        </form>
        </div></div>}
        <div className="table-wrap"><table><thead><tr><th>{t('hybrid.domain')}</th><th>{t('hybrid.upstream')}</th><th>{t('hybrid.status')}</th><th>{t('hybrid.actions')}</th></tr></thead><tbody>
            {data?.sites.filter(s => s.domain.includes(search)).map(s => <tr key={s.domain}><td>{s.domain}</td><td>{s.upstream}</td><td>{s.status}</td><td>
                <button className="btn btn-ghost" disabled={busy} onClick={() => { setForm({ domain: s.domain, upstream: s.upstream, certificate: s.certificate }); setEditing(true); }}>{t('hybrid.edit')}</button>
                <button className="btn btn-danger" disabled={busy} onClick={() => { if (window.confirm(t('hybrid.confirmDelete', { domain: s.domain }))) action(`/hybrid/sites/${encodeURIComponent(s.domain)}`, 'DELETE'); }}>{t('common.delete')}</button>
            </td></tr>)}
        </tbody></table></div>
        <h3>{t('hybrid.labels')}</h3><p>{t('hybrid.labelHelp')}</p>
        <div className="table-wrap"><table><thead><tr><th>{t('hybrid.domain')}</th></tr></thead><tbody>{data?.labels.filter(h => h.includes(search)).map(h => <tr key={h}><td>{h}</td></tr>)}</tbody></table></div>
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
            <button className="btn btn-primary" disabled={busy} type="submit">{t('hybrid.upload')}</button>
        </form>
        <ul>{data?.certificates.map(c => <li key={c.id}>{c.names} — {t('hybrid.expiry', { date: c.validTo, days: c.daysRemaining })}<br /><code>{`caddy.tls: "/hybrid/certs/${c.id}/cert.pem /hybrid/certs/${c.id}/key.pem"`}</code></li>)}</ul>
    </section>;
}
