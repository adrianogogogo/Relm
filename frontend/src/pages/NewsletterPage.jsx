import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Mail } from 'lucide-react';
import { newsletterAPI } from '../services/api';
import { PageHeader } from '../components/ui';

export default function NewsletterPage() {
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    interests: [],
    acceptMarketing: true,
  });

  const mutation = useMutation({
    mutationFn: newsletterAPI.subscribe,
    onSuccess: () => {
      setSuccess(true);
      setFormData({
        email: '',
        fullName: '',
        interests: [],
        acceptMarketing: true,
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-app dark:bg-app-dark py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto card p-8 text-center">
            <div className="text-primary mb-4 flex justify-center"><Mail size={64} className="stroke-[1.5]" /></div>
            <h2 className="font-title text-3xl font-bold text-success mb-4">
              Inscrição Confirmada!
            </h2>
            <p className="text-gray-600 mb-8">
              Você receberá as novidades da Relm Bikes no seu email.
            </p>
            <button onClick={() => setSuccess(false)} className="btn btn-primary">
              Voltar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app dark:bg-app-dark py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="card p-8">
            <PageHeader
              title="Newsletter"
              subtitle="Inscreva-se e fique por dentro das novidades!"
            />

            {mutation.isError && (
              <div className="bg-error/10 border-l-4 border-error p-4 mb-6 rounded">
                <p className="text-error font-medium text-sm">Erro ao se inscrever. Tente novamente.</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="label">Nome Completo *</label>
                <input
                  type="text"
                  required
                  className="input"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="label">Email *</label>
                <input
                  type="email"
                  required
                  className="input"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>

              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="marketing"
                  checked={formData.acceptMarketing}
                  onChange={(e) =>
                    setFormData({ ...formData, acceptMarketing: e.target.checked })
                  }
                  className="mt-1"
                />
                <label htmlFor="marketing" className="ml-3 text-sm text-gray-700">
                  Aceito receber comunicações da Relm Bikes por email
                </label>
              </div>

              <button
                type="submit"
                disabled={mutation.isPending}
                className="btn btn-primary w-full"
              >
                {mutation.isPending ? 'Inscrevendo...' : 'Inscrever-se'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
