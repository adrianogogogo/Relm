import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { FaWhatsapp } from 'react-icons/fa';
import { MdSearch } from 'react-icons/md';
import { whatsappAPI, customersAPI } from '../services/api';
import { Card, PageHeader, Button } from '../components/ui';

const TARGET_OPTIONS = [
  { value: 'ALL', label: 'Todos os clientes' },
  { value: 'CARE', label: 'Somente CARE' },
  { value: 'PLUS', label: 'Somente PLUS' },
  { value: 'CUSTOM', label: 'Selecionar clientes' },
];

export default function AdminWhatsAppPage() {
  // ── Settings state ──────────────────────────────────────────────────────
  const [settingsForm, setSettingsForm] = useState({
    number: '',
    cloudToken: '',
    phoneNumberId: '',
    templateName: '',
  });
  const [settingsFeedback, setSettingsFeedback] = useState(null);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const { data: settings, refetch: refetchSettings } = useQuery({
    queryKey: ['whatsapp-settings'],
    queryFn: whatsappAPI.getSettings,
    onSuccess: (data) => {
      if (!settingsLoaded) {
        setSettingsForm({
          number: data.number || '',
          cloudToken: '',
          phoneNumberId: data.phoneNumberId || '',
          templateName: data.templateName || '',
        });
        setSettingsLoaded(true);
      }
    },
  });

  const saveMutation = useMutation({
    mutationFn: whatsappAPI.saveSettings,
    onSuccess: () => {
      setSettingsFeedback({ type: 'success', text: 'Configurações salvas com sucesso.' });
      refetchSettings();
      setTimeout(() => setSettingsFeedback(null), 4000);
    },
    onError: (err) => {
      setSettingsFeedback({
        type: 'error',
        text: err?.response?.data?.message || 'Erro ao salvar configurações.',
      });
    },
  });

  function handleSaveSettings(e) {
    e.preventDefault();
    const payload = {};
    if (settingsForm.number !== undefined) payload.number = settingsForm.number;
    if (settingsForm.cloudToken) payload.cloudToken = settingsForm.cloudToken;
    if (settingsForm.phoneNumberId !== undefined) payload.phoneNumberId = settingsForm.phoneNumberId;
    if (settingsForm.templateName !== undefined) payload.templateName = settingsForm.templateName;
    saveMutation.mutate(payload);
  }

  // ── Broadcast state ─────────────────────────────────────────────────────
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState('ALL');
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [broadcastResult, setBroadcastResult] = useState(null);

  const { data: customerResults = [] } = useQuery({
    queryKey: ['whatsapp-customer-search', customerSearch],
    queryFn: () => customersAPI.getAll({ search: customerSearch }),
    enabled: target === 'CUSTOM' && customerSearch.length > 1,
  });

  const broadcastMutation = useMutation({
    mutationFn: whatsappAPI.broadcast,
    onSuccess: (data) => {
      setBroadcastResult(data);
    },
    onError: (err) => {
      setBroadcastResult({
        configured: true,
        error: err?.response?.data?.message || 'Erro ao enviar broadcast.',
      });
    },
  });

  function handleBroadcast(e) {
    e.preventDefault();
    const payload = { message, target };
    if (target === 'CUSTOM') {
      payload.customerIds = selectedCustomers.map((c) => c.id);
    }
    const targetLabel = TARGET_OPTIONS.find((o) => o.value === target)?.label || target;
    const confirmed = window.confirm(
      `Confirmar envio de mensagem WhatsApp para: ${targetLabel}${
        target === 'CUSTOM' ? ` (${selectedCustomers.length} cliente(s) selecionado(s))` : ''
      }?\n\nMensagem:\n"${message.substring(0, 100)}${message.length > 100 ? '...' : ''}"`,
    );
    if (!confirmed) return;
    setBroadcastResult(null);
    broadcastMutation.mutate(payload);
  }

  function toggleCustomer(customer) {
    setSelectedCustomers((prev) => {
      const exists = prev.find((c) => c.id === customer.id);
      return exists ? prev.filter((c) => c.id !== customer.id) : [...prev, customer];
    });
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="WhatsApp"
        subtitle="Botão de contato e envio em massa via WhatsApp Cloud API"
        icon={FaWhatsapp}
      />

      {/* ── Configuração ── */}
      <Card>
        <h2 className="text-lg font-semibold text-primary mb-4">Configuração</h2>
        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">
              Número WhatsApp
            </label>
            <input
              type="text"
              className="input w-full"
              placeholder="somente dígitos com DDD, ex: 5511999999999"
              value={settingsForm.number}
              onChange={(e) => setSettingsForm((f) => ({ ...f, number: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-1">
              Phone Number ID (Cloud API)
            </label>
            <input
              type="text"
              className="input w-full"
              placeholder="ID do número na Meta Business"
              value={settingsForm.phoneNumberId}
              onChange={(e) => setSettingsForm((f) => ({ ...f, phoneNumberId: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-1">
              Token da Cloud API
              {settings?.tokenSet && (
                <span className="ml-2 text-xs text-muted">
                  (atual: {settings.tokenMasked} — deixe vazio para manter)
                </span>
              )}
            </label>
            <input
              type="password"
              className="input w-full"
              placeholder={settings?.tokenSet ? settings.tokenMasked || '••••' : 'Cole o token aqui'}
              value={settingsForm.cloudToken}
              onChange={(e) => setSettingsForm((f) => ({ ...f, cloudToken: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-1">
              Template Name (para mensagens iniciadas pela empresa)
            </label>
            <input
              type="text"
              className="input w-full"
              placeholder="nome do template aprovado na Meta"
              value={settingsForm.templateName}
              onChange={(e) => setSettingsForm((f) => ({ ...f, templateName: e.target.value }))}
            />
          </div>

          {settingsFeedback && (
            <p
              className={`text-sm ${
                settingsFeedback.type === 'success' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {settingsFeedback.text}
            </p>
          )}

          <Button type="submit" variant="primary" loading={saveMutation.isPending}>
            Salvar Configurações
          </Button>
        </form>
      </Card>

      {/* ── Envio em massa ── */}
      <Card>
        <h2 className="text-lg font-semibold text-primary mb-4">Envio em Massa</h2>

        {settings && !settings.tokenSet && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded text-sm text-yellow-800">
            Credenciais da Cloud API não configuradas — configure acima. O botão do cliente
            (wa.me) funciona apenas com o número.
          </div>
        )}

        <form onSubmit={handleBroadcast} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">
              Mensagem <span className="text-muted">({message.length}/1000)</span>
            </label>
            <textarea
              className="input w-full h-32 resize-none"
              maxLength={1000}
              required
              placeholder="Digite a mensagem a ser enviada..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-2">Público-alvo</label>
            <div className="flex flex-wrap gap-3">
              {TARGET_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="target"
                    value={opt.value}
                    checked={target === opt.value}
                    onChange={() => setTarget(opt.value)}
                  />
                  <span className="text-sm">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {target === 'CUSTOM' && (
            <div className="space-y-2">
              <div className="relative">
                <MdSearch className="absolute left-3 top-3 text-muted" size={18} />
                <input
                  type="text"
                  className="input w-full pl-9"
                  placeholder="Buscar clientes por nome ou e-mail..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                />
              </div>

              {customerResults.length > 0 && (
                <div className="border border-border rounded max-h-48 overflow-y-auto">
                  {customerResults.map((c) => {
                    const selected = selectedCustomers.find((s) => s.id === c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleCustomer(c)}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-surface-hover flex justify-between ${
                          selected ? 'bg-primary/10 font-medium' : ''
                        }`}
                      >
                        <span>{c.fullName}</span>
                        <span className="text-muted">{c.email}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {selectedCustomers.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedCustomers.map((c) => (
                    <span
                      key={c.id}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
                    >
                      {c.fullName}
                      <button
                        type="button"
                        onClick={() => toggleCustomer(c)}
                        className="hover:text-red-500"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            loading={broadcastMutation.isPending}
            disabled={!message.trim() || (target === 'CUSTOM' && selectedCustomers.length === 0)}
          >
            Enviar via WhatsApp
          </Button>
        </form>

        {broadcastResult && (
          <div className="mt-4 p-4 border border-border rounded space-y-1">
            {broadcastResult.configured === false ? (
              <p className="text-yellow-700 font-medium">{broadcastResult.message}</p>
            ) : broadcastResult.error ? (
              <p className="text-red-600">{broadcastResult.error}</p>
            ) : (
              <>
                <p className="font-medium text-green-700">Broadcast concluído</p>
                <p className="text-sm text-secondary">Enviados: {broadcastResult.sent}</p>
                <p className="text-sm text-secondary">Falhas: {broadcastResult.failed}</p>
                <p className="text-sm text-secondary">Sem telefone (ignorados): {broadcastResult.skipped}</p>
                <p className="text-sm text-muted">Total de destinatários resolvidos: {broadcastResult.total}</p>
              </>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
