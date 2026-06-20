import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { warrantyAPI } from '../services/api';
import { PageHeader } from '../components/ui';

export default function WarrantyPage() {
  const [success, setSuccess] = useState(false);
  const [protocol, setProtocol] = useState('');

  const mutation = useMutation({
    mutationFn: warrantyAPI.createPublic,
    onSuccess: (data) => {
      setSuccess(true);
      setProtocol(data.data.protocol_number);
      setFormData({
        customer: {
          fullName: '',
          email: '',
          phone: '',
          cpf: '',
          address: '',
          city: '',
          state: '',
          country: 'Brasil',
          postalCode: '',
        },
        product: {
          brand: 'Relm',
          productName: '',
          model: '',
          serialNumber: '',
          purchaseDate: '',
          purchaseStore: '',
          invoiceNumber: '',
        },
        issueDescription: '',
      });
    },
  });

  const [formData, setFormData] = useState({
    customer: {
      fullName: '',
      email: '',
      phone: '',
      cpf: '',
      address: '',
      city: '',
      state: '',
      country: 'Brasil',
      postalCode: '',
    },
    product: {
      brand: 'Relm',
      productName: '',
      model: '',
      serialNumber: '',
      purchaseDate: '',
      purchaseStore: '',
      invoiceNumber: '',
    },
    issueDescription: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      brand: formData.product.brand,
      product_type: formData.product.productName,
      model: formData.product.model,
      serial_number: formData.product.serialNumber,
      purchase_date: formData.product.purchaseDate,
      purchase_store_name: formData.product.purchaseStore,
      invoice_number: formData.product.invoiceNumber,
      full_name: formData.customer.fullName,
      email: formData.customer.email,
      phone: formData.customer.phone,
      cpf: formData.customer.cpf,
      address: formData.customer.address,
      city: formData.customer.city,
      state: formData.customer.state,
      country: formData.customer.country,
      zip_code: formData.customer.postalCode,
      marketing_consent: true,
      customer_notes: formData.issueDescription,
    };
    mutation.mutate(payload);
  };

  const handleChange = (section, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  if (success) {
    return (
      <div className="min-h-screen bg-app dark:bg-app-dark py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto card p-8 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="font-title text-3xl font-bold text-success mb-4">
              Garantia Registrada com Sucesso!
            </h2>
            <p className="text-xl text-gray-700 mb-6">
              Seu protocolo é: <span className="font-bold text-primary">{protocol}</span>
            </p>
            <p className="text-gray-600 mb-8">
              Você receberá atualizações sobre o status da sua garantia por email.
            </p>
            <button
              onClick={() => setSuccess(false)}
              className="btn btn-primary"
            >
              Registrar Nova Garantia
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app dark:bg-app-dark py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="card p-8">
            <PageHeader
              title="Solicitação de Garantia"
              subtitle="Preencha o formulário abaixo para registrar sua solicitação de garantia."
            />

            {mutation.isError && (
              <div className="bg-error/10 border-l-4 border-error p-4 mb-6 rounded">
                <p className="text-error font-medium text-sm">
                  Erro ao enviar solicitação. Tente novamente.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Customer Info */}
              <section>
                <h2 className="font-title text-2xl font-bold mb-4">Dados do Cliente</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="label">Nome Completo *</label>
                    <input
                      type="text"
                      required
                      className="input"
                      value={formData.customer.fullName}
                      onChange={(e) =>
                        handleChange('customer', 'fullName', e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="label">Email *</label>
                    <input
                      type="email"
                      required
                      className="input"
                      value={formData.customer.email}
                      onChange={(e) =>
                        handleChange('customer', 'email', e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="label">Telefone *</label>
                    <input
                      type="tel"
                      required
                      className="input"
                      value={formData.customer.phone}
                      onChange={(e) =>
                        handleChange('customer', 'phone', e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="label">CPF *</label>
                    <input
                      type="text"
                      required
                      className="input"
                      value={formData.customer.cpf}
                      onChange={(e) =>
                        handleChange('customer', 'cpf', e.target.value)
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="label">Endereço *</label>
                    <input
                      type="text"
                      required
                      className="input"
                      value={formData.customer.address}
                      onChange={(e) =>
                        handleChange('customer', 'address', e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="label">Cidade *</label>
                    <input
                      type="text"
                      required
                      className="input"
                      value={formData.customer.city}
                      onChange={(e) =>
                        handleChange('customer', 'city', e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="label">Estado *</label>
                    <input
                      type="text"
                      required
                      className="input"
                      value={formData.customer.state}
                      onChange={(e) =>
                        handleChange('customer', 'state', e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="label">CEP *</label>
                    <input
                      type="text"
                      required
                      className="input"
                      value={formData.customer.postalCode}
                      onChange={(e) =>
                        handleChange('customer', 'postalCode', e.target.value)
                      }
                    />
                  </div>
                </div>
              </section>

              {/* Product Info */}
              <section>
                <h2 className="font-title text-2xl font-bold mb-4">Dados do Produto</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Marca *</label>
                    <input
                      type="text"
                      required
                      className="input"
                      value={formData.product.brand}
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="label">Produto *</label>
                    <input
                      type="text"
                      required
                      className="input"
                      value={formData.product.productName}
                      onChange={(e) =>
                        handleChange('product', 'productName', e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="label">Modelo *</label>
                    <input
                      type="text"
                      required
                      className="input"
                      value={formData.product.model}
                      onChange={(e) =>
                        handleChange('product', 'model', e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="label">Número de Série *</label>
                    <input
                      type="text"
                      required
                      className="input"
                      value={formData.product.serialNumber}
                      onChange={(e) =>
                        handleChange('product', 'serialNumber', e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="label">Data de Compra *</label>
                    <input
                      type="date"
                      required
                      className="input"
                      value={formData.product.purchaseDate}
                      onChange={(e) =>
                        handleChange('product', 'purchaseDate', e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="label">Loja de Compra *</label>
                    <input
                      type="text"
                      required
                      className="input"
                      value={formData.product.purchaseStore}
                      onChange={(e) =>
                        handleChange('product', 'purchaseStore', e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="label">Número da Nota Fiscal *</label>
                    <input
                      type="text"
                      required
                      className="input"
                      value={formData.product.invoiceNumber}
                      onChange={(e) =>
                        handleChange('product', 'invoiceNumber', e.target.value)
                      }
                    />
                  </div>
                </div>
              </section>

              {/* Issue Description */}
              <section>
                <h2 className="font-title text-2xl font-bold mb-4">Descrição do Problema</h2>
                <textarea
                  required
                  rows="6"
                  className="input"
                  placeholder="Descreva detalhadamente o problema com o produto..."
                  value={formData.issueDescription}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      issueDescription: e.target.value,
                    }))
                  }
                />
              </section>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="btn btn-primary flex-1"
                >
                  {mutation.isPending ? 'Enviando...' : 'Enviar Solicitação'}
                </button>
                <a href="/" className="btn btn-outline">
                  Cancelar
                </a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
