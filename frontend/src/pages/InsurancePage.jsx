import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  MdVerifiedUser, MdAttachMoney, MdBolt, MdCheckCircle, MdCancel,
  MdShield, MdLocalShipping, MdBuild, MdPublic, MdPerson,
} from 'react-icons/md';
import { PageHeader } from '../components/ui';
import { insuranceAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';

// Apólice genérica RELM Bike Protect — resumo exibido ao cliente.
// Baseada nas coberturas padrão do mercado BR de seguro para bikes de
// alto desempenho (roubo/furto qualificado, danos acidentais, transporte).
export const POLICY_SUMMARY = {
  coberturas: [
    { icon: MdShield, title: 'Roubo e furto qualificado', desc: 'Indenização integral em caso de roubo ou furto com arrombamento/violência, no Brasil.' },
    { icon: MdBuild, title: 'Danos acidentais', desc: 'Quedas, colisões, incêndio, raio, explosão e vandalismo — reparo ou reposição.' },
    { icon: MdLocalShipping, title: 'Transporte', desc: 'Danos durante transporte terrestre (rack, suporte veicular ou despacho).' },
    { icon: MdPublic, title: 'Acessórios', desc: 'Ciclocomputador, GPS e acessórios fixos cobertos até 20% do valor da bike.' },
  ],
  exclusoes: [
    'Furto simples (sem arrombamento ou violência)',
    'Desgaste natural de peças e mau uso',
    'Competições e provas (cobertura adicional sob consulta)',
    'Danos estéticos que não afetem o funcionamento',
  ],
  condicoes: [
    'Vigência de 12 meses a partir da emissão',
    'Franquia de 10% do valor da indenização',
    'Nota fiscal ou comprovação de propriedade exigida na contratação',
    'Membros RELM Care Plus: 1º ano incluso na compra da bike',
  ],
};

export default function InsurancePage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isCustomer = user?.userType === 'CUSTOMER' || user?.role === 'CUSTOMER';

  const [form, setForm] = useState({
    fullName: user?.fullName || user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bikeValue: '',
    city: user?.city || '',
    state: user?.state || '',
  });

  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        fullName: f.fullName || user.fullName || user.name || '',
        email: f.email || user.email || '',
        phone: f.phone || user.phone || '',
        city: f.city || user.city || '',
        state: f.state || user.state || '',
      }));
    }
  }, [user]);

  const [protocol, setProtocol] = useState(null);

  const quoteMutation = useMutation({
    mutationFn: (data) => insuranceAPI.createQuote(data),
    onSuccess: (res) => {
      setProtocol(res.data?.protocolNumber || res.protocolNumber);
      queryClient.invalidateQueries({ queryKey: ['customer-quotes'] });
      queryClient.invalidateQueries({ queryKey: ['customer-policies'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setForm({
        fullName: user?.fullName || user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        bikeValue: '',
        city: user?.city || '',
        state: user?.state || '',
      });
    },
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    quoteMutation.mutate({
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      bikeValue: form.bikeValue ? Number(form.bikeValue) : undefined,
      city: form.city ? form.city.trim() : undefined,
      state: form.state ? form.state.trim().toUpperCase() : undefined,
    });
  };

  return (
    <div className="min-h-screen bg-app dark:bg-app-dark py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="card p-8">
            <PageHeader
              title="Seguro RELM Bike Protect"
              subtitle="Proteção pensada para bicicletas de alto desempenho."
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="card text-center">
                <div className="text-primary mb-3 flex justify-center"><MdVerifiedUser size={32} /></div>
                <h3 className="font-title font-bold text-lg mb-2">Proteção Total</h3>
                <p className="text-sm text-gray-600">Roubo, furto qualificado e danos acidentais</p>
              </div>
              <div className="card text-center">
                <div className="text-primary mb-3 flex justify-center"><MdAttachMoney size={32} /></div>
                <h3 className="font-title font-bold text-lg mb-2">Melhor Preço</h3>
                <p className="text-sm text-gray-600">Condições especiais para membros do clube</p>
              </div>
              <div className="card text-center">
                <div className="text-primary mb-3 flex justify-center"><MdBolt size={32} /></div>
                <h3 className="font-title font-bold text-lg mb-2">Cotação Rápida</h3>
                <p className="text-sm text-gray-600">Resposta da equipe RELM em até 2 dias úteis</p>
              </div>
            </div>

            {/* Coberturas */}
            <h3 className="font-title font-bold text-xl mb-4">O que a apólice cobre</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {POLICY_SUMMARY.coberturas.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-3 p-4 rounded-lg bg-success/5 border border-success/20">
                  <Icon className="text-success shrink-0 mt-0.5" size={22} />
                  <div>
                    <p className="font-semibold">{title}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-2">
              <div>
                <h3 className="font-title font-bold text-xl mb-3">O que não cobre</h3>
                <ul className="space-y-2">
                  {POLICY_SUMMARY.exclusoes.map((e) => (
                    <li key={e} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <MdCancel className="text-danger shrink-0 mt-0.5" size={18} /> {e}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-title font-bold text-xl mb-3">Condições</h3>
                <ul className="space-y-2">
                  {POLICY_SUMMARY.condicoes.map((c) => (
                    <li key={c} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <MdCheckCircle className="text-primary shrink-0 mt-0.5" size={18} /> {c}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Formulário de cotação */}
          <div className="card p-8" id="cotacao">
            <h3 className="font-title font-bold text-xl mb-1">Solicite sua cotação</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Preencha os dados abaixo. Nossa equipe analisa e retorna com o valor do seguro.
            </p>

            {protocol ? (
              <div className="bg-success/10 border-l-4 border-success p-6 rounded flex items-start gap-3">
                <MdCheckCircle className="text-success shrink-0 mt-0.5" size={24} />
                <div>
                  <p className="font-semibold text-success-700 dark:text-success-100">Cotação enviada com sucesso!</p>
                  <p className="text-sm mt-1">
                    Seu protocolo é <span className="font-mono font-bold">{protocol}</span>.
                    A equipe RELM entrará em contato pelo e-mail informado.
                  </p>
                  {isCustomer && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded mt-2">
                      ✓ Esta cotação já está disponível na sua área <strong>Minhas Cotações</strong>.
                    </p>
                  )}
                  <div className="flex gap-3 mt-4">
                    {isCustomer && (
                      <Link to="/cliente/seguros" className="btn btn-primary btn-sm">
                        Ver Minhas Cotações
                      </Link>
                    )}
                    <button className="btn btn-outline btn-sm" onClick={() => setProtocol(null)}>
                      Fazer outra cotação
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isCustomer && user?.email && (
                  <div className="md:col-span-2 bg-primary/10 border border-primary/20 text-primary dark:text-primary-300 rounded-lg p-3 text-xs flex items-center gap-2">
                    <MdPerson size={18} className="shrink-0" />
                    <span>
                      Conectado como <strong>{user.email}</strong>. A cotação ficará vinculada automaticamente à sua conta.
                    </span>
                  </div>
                )}
                <div className="md:col-span-2">
                  <label className="label">Nome completo *</label>
                  <input className="input w-full" required maxLength={150} value={form.fullName} onChange={set('fullName')} />
                </div>
                <div>
                  <label className="label">E-mail *</label>
                  <input className="input w-full" type="email" required maxLength={255} value={form.email} onChange={set('email')} />
                </div>
                <div>
                  <label className="label">Telefone *</label>
                  <input className="input w-full" required maxLength={30} value={form.phone} onChange={set('phone')} placeholder="(11) 99999-9999" />
                </div>
                <div>
                  <label className="label">Valor da bike (R$)</label>
                  <input className="input w-full" type="number" min="0" step="0.01" value={form.bikeValue} onChange={set('bikeValue')} placeholder="Ex.: 25000" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="label">Cidade</label>
                    <input className="input w-full" maxLength={100} value={form.city} onChange={set('city')} />
                  </div>
                  <div>
                    <label className="label">UF</label>
                    <input className="input w-full" maxLength={2} value={form.state} onChange={set('state')} placeholder="SP" />
                  </div>
                </div>

                {quoteMutation.isError && (
                  <p className="md:col-span-2 text-sm text-danger">
                    {quoteMutation.error?.response?.data?.message?.toString?.() || 'Erro ao enviar a cotação. Tente novamente.'}
                  </p>
                )}

                <div className="md:col-span-2">
                  <button type="submit" className="btn btn-primary w-full md:w-auto" disabled={quoteMutation.isPending}>
                    {quoteMutation.isPending ? 'Enviando...' : 'Solicitar cotação'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
