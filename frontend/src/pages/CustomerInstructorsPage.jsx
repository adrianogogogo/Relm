import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { instructorsAPI } from '../services/api';
import { Card, PageHeader, Button } from '../components/ui';
import {
  MdDirectionsBike,
  MdLocationOn,
  MdPublic,
  MdWorkspacePremium,
  MdContentCopy,
  MdClose,
  MdWhatsapp,
  MdOpenInNew,
  MdInfoOutline,
} from 'react-icons/md';

// UFs em ordem alfabética. ponytail: lista fixa no front, sem endpoint nem
// pacote — o Brasil não ganha estado novo com frequência.
const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

const DISCLAIMER =
  'Profissionais independentes. A contratação, o pagamento e a execução do ' +
  'serviço são de responsabilidade exclusiva do profissional.';

function CredentialModal({ credential, onClose }) {
  const [copied, setCopied] = useState(false);
  const whatsappDigits = (credential.contact?.phone || '').replace(/\D/g, '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <Card className="w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          aria-label="Fechar"
        >
          <MdClose size={22} />
        </button>

        <h3 className="font-title font-bold text-lg text-gray-900 dark:text-slate-100 pr-6">
          Sua credencial em {credential.instructor?.name}
        </h3>

        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
          Apresente este código ao profissional. Ele confere o seu status direto
          no sistema da Relm.
        </p>

        <div className="mt-4 rounded-lg border-2 border-dashed border-[#183757]/40 bg-[#0A1929]/5 dark:bg-[#2196F3]/10 p-4 text-center">
          <p className="font-mono font-bold text-2xl tracking-widest text-[#0A1929] dark:text-[#2196F3]">
            {credential.code}
          </p>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(credential.code);
              setCopied(true);
            }}
            className="mt-2 text-xs text-gray-500 dark:text-slate-400 inline-flex items-center gap-1 hover:underline"
          >
            <MdContentCopy size={13} /> {copied ? 'Copiado!' : 'Copiar código'}
          </button>
        </div>

        <dl className="mt-4 space-y-1 text-xs">
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-slate-400">Seu plano</dt>
            <dd className="font-semibold text-gray-900 dark:text-slate-100">
              {credential.tier === 'PLUS' ? 'Relm Plus' : 'Relm Care'}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-slate-400">Seu desconto</dt>
            <dd className="font-semibold text-gray-900 dark:text-slate-100 text-right max-w-[60%]">
              {credential.tier === 'PLUS' && credential.benefitPlus
                ? credential.benefitPlus
                : credential.benefit}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-slate-400">Válida até</dt>
            <dd className="font-semibold text-gray-900 dark:text-slate-100">
              {new Date(credential.expiresAt).toLocaleDateString('pt-BR')}
            </dd>
          </div>
        </dl>

        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-800 flex flex-wrap gap-2">
          {whatsappDigits && (
            <a
              href={`https://wa.me/55${whatsappDigits}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              <MdWhatsapp size={16} /> Falar no WhatsApp
            </a>
          )}
          {credential.contact?.link && (
            <a
              href={credential.contact.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 dark:border-slate-700 px-3 py-2 text-sm font-semibold text-gray-700 dark:text-slate-200 hover:border-[#183757]"
            >
              <MdOpenInNew size={16} /> Site / Instagram
            </a>
          )}
        </div>

        <p className="mt-3 text-[10px] leading-snug text-gray-400 dark:text-slate-500 flex gap-1">
          <MdInfoOutline size={13} className="shrink-0 mt-px" /> {DISCLAIMER}
        </p>
      </Card>
    </div>
  );
}

function InstructorCard({ instructor, isPlus, onWant, pending }) {
  return (
    <Card className="flex flex-col gap-3 transition-shadow hover:shadow-md">
      <div className="flex items-center gap-3">
        {instructor.logoUrl ? (
          <img
            src={instructor.logoUrl}
            alt={instructor.name}
            className="w-12 h-12 object-contain rounded-lg border border-gray-100 dark:border-slate-800 shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-lg border border-gray-100 dark:border-slate-800 flex items-center justify-center bg-gray-50 dark:bg-slate-900 shrink-0">
            <MdDirectionsBike size={22} className="text-gray-400" />
          </div>
        )}
        <div className="min-w-0">
          <h4 className="font-title font-bold text-gray-900 dark:text-slate-100 text-sm truncate">
            {instructor.name}
          </h4>
          <p className="text-[10px] text-gray-500 dark:text-slate-400 flex items-center gap-0.5">
            {instructor.remote ? (
              <>
                <MdPublic size={11} /> Atende online
              </>
            ) : (
              <>
                <MdLocationOn size={11} />
                {[instructor.city, instructor.state].filter(Boolean).join('/') || 'Presencial'}
              </>
            )}
          </p>
        </div>
      </div>

      {instructor.specialties?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {instructor.specialties.map((s) => (
            <span
              key={s.id}
              className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300"
            >
              {s.name}
            </span>
          ))}
        </div>
      )}

      {instructor.description && (
        <p className="text-[11px] text-gray-500 dark:text-slate-400 line-clamp-2">
          {instructor.description}
        </p>
      )}

      {/* As duas linhas de desconto. Nada é escondido: o Care VÊ o do Plus — é
          o argumento de venda da assinatura. */}
      <div className="space-y-1.5">
        <div
          className={`rounded-lg p-2 text-xs border ${
            !isPlus
              ? 'border-[#183757]/30 bg-[#0A1929]/10 dark:bg-[#2196F3]/20 text-[#0A1929] dark:text-[#2196F3] font-semibold'
              : 'border-gray-200 dark:border-slate-800 text-gray-500 dark:text-slate-400'
          }`}
        >
          <span className="font-bold">Todos:</span> {instructor.benefit}
        </div>
        {instructor.benefitPlus && (
          <div
            className={`rounded-lg p-2 text-xs border flex items-start gap-1.5 ${
              isPlus
                ? 'border-amber-300 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 font-semibold'
                : 'border-amber-200/60 bg-amber-50/40 dark:bg-amber-950/20 text-amber-800/80 dark:text-amber-400/80'
            }`}
          >
            <MdWorkspacePremium size={14} className="shrink-0 mt-px" />
            <span>
              <span className="font-bold">Plus:</span> {instructor.benefitPlus}
              {!isPlus && (
                <>
                  {' — '}
                  <Link to="/cliente/assinatura" className="underline font-semibold">
                    seja Plus
                  </Link>
                </>
              )}
            </span>
          </div>
        )}
      </div>

      <div className="pt-1 border-t border-gray-100 dark:border-slate-800">
        <Button onClick={() => onWant(instructor)} disabled={pending} className="w-full text-sm">
          {pending ? 'Gerando...' : 'Quero esse desconto'}
        </Button>
        <p className="mt-1.5 text-[10px] text-gray-400 dark:text-slate-500 text-center">
          O contato aparece com a sua credencial.
        </p>
      </div>
    </Card>
  );
}

export default function CustomerInstructorsPage() {
  const [state, setState] = useState('');
  const [specialtyId, setSpecialtyId] = useState('');
  const [onlyRemote, setOnlyRemote] = useState(false);
  const [credential, setCredential] = useState(null);
  const [stateTouched, setStateTouched] = useState(false);

  const { data: specialties = [] } = useQuery({
    queryKey: ['instructor-specialties-customer'],
    queryFn: instructorsAPI.getSpecialtiesForCustomer,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['customer-instructors', state, specialtyId, onlyRemote],
    queryFn: () =>
      instructorsAPI.getForCustomer({
        state: state || undefined,
        specialtyId: specialtyId || undefined,
        remote: onlyRemote ? 'true' : undefined,
      }),
  });

  // Pré-seleciona a UF do cliente na primeira carga, sem travar a troca manual.
  if (!stateTouched && !state && data?.customerState) {
    setStateTouched(true);
    setState(data.customerState);
  }

  const credentialMutation = useMutation({
    mutationFn: (instructor) => instructorsAPI.createCredential(instructor.id),
    onSuccess: (result) => setCredential(result),
  });

  const instructors = data?.instructors ?? [];
  const isPlus = !!data?.isPlus;
  // Tela vazia é o pior desfecho para um benefício que existe para vender
  // assinatura: se o filtro de UF não achou ninguém, oferece os remotos.
  const emptyByState = !isLoading && instructors.length === 0 && !!state && !onlyRemote;

  return (
    <div className="py-8 px-6">
      <div className="max-w-5xl mx-auto">
        <PageHeader
          title="Instrutores & Assessorias"
          subtitle="Profissionais parceiros com desconto para membros do clube — e desconto maior para quem é Plus"
        />

        <div className="flex flex-wrap items-center gap-2 mb-6">
          <select
            value={state}
            onChange={(e) => {
              setStateTouched(true);
              setState(e.target.value);
            }}
            className="rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-slate-200"
          >
            <option value="">Todas as UFs</option>
            {UFS.map((uf) => (
              <option key={uf} value={uf}>
                {uf}
              </option>
            ))}
          </select>

          <select
            value={specialtyId}
            onChange={(e) => setSpecialtyId(e.target.value)}
            className="rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-slate-200"
          >
            <option value="">Todas as especialidades</option>
            {specialties.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setOnlyRemote((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
              onlyRemote
                ? 'bg-[#0A1929] dark:bg-[#2196F3] text-white border-[#0A1929]'
                : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-700'
            }`}
          >
            <MdPublic size={13} /> Atende online
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <span className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : instructors.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-500 dark:text-slate-400">
              {emptyByState
                ? `Nenhum profissional presencial em ${state} por enquanto.`
                : 'Nenhum profissional disponível no momento.'}
            </p>
            {emptyByState && (
              <button
                onClick={() => {
                  setState('');
                  setOnlyRemote(true);
                }}
                className="mt-3 text-sm font-semibold text-[#0A1929] dark:text-[#2196F3] underline"
              >
                Ver quem atende online
              </button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {instructors.map((instructor) => (
              <InstructorCard
                key={instructor.id}
                instructor={instructor}
                isPlus={isPlus}
                pending={
                  credentialMutation.isPending &&
                  credentialMutation.variables?.id === instructor.id
                }
                onWant={credentialMutation.mutate}
              />
            ))}
          </div>
        )}

        <p className="mt-6 text-[11px] text-gray-400 dark:text-slate-500 flex gap-1">
          <MdInfoOutline size={14} className="shrink-0 mt-px" /> {DISCLAIMER}
        </p>
      </div>

      {credential && (
        <CredentialModal credential={credential} onClose={() => setCredential(null)} />
      )}
    </div>
  );
}
