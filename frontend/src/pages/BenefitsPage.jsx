import { useState, useEffect } from 'react';
import { benefitsAPI } from '../services/benefitsAPI';
import { Gift, Plus, Edit2, Trash2, X, Star, TrendingUp, Tag, Upload, Image as ImageIcon } from 'lucide-react';

const BENEFIT_CATEGORIES = {
  DISCOUNT: 'Desconto',
  EXCLUSIVE_ACCESS: 'Acesso Exclusivo',
  CASHBACK: 'Cashback',
  FREE_SHIPPING: 'Frete Grátis',
  PARTNER_BENEFIT: 'Benefício Parceiro',
  OTHER: 'Outro',
};

export default function BenefitsPage() {
  const [benefits, setBenefits] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBenefit, setEditingBenefit] = useState(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [terms, setTerms] = useState('');
  const [category, setCategory] = useState('DISCOUNT');
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [partnerLogo, setPartnerLogo] = useState('');
  const [howToRedeem, setHowToRedeem] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [active, setActive] = useState(true);
  const [featured, setFeatured] = useState(false);
  const [maxRedemptions, setMaxRedemptions] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [benefitsRes, statsRes] = await Promise.all([
        benefitsAPI.getAll(),
        benefitsAPI.getStatistics(),
      ]);
      setBenefits(benefitsRes.data);
      setStatistics(statsRes.data);
    } catch (error) {
      console.error('Erro ao carregar benefícios:', error);
      alert('Erro ao carregar benefícios');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const benefitData = {
      title,
      description,
      terms,
      category,
      discountPercentage: discountPercentage ? parseInt(discountPercentage) : undefined,
      partnerName,
      partnerLogo,
      howToRedeem,
      imageUrl,
      validFrom,
      validUntil,
      active,
      featured,
      maxRedemptions: maxRedemptions ? parseInt(maxRedemptions) : undefined,
    };

    try {
      if (editingBenefit) {
        await benefitsAPI.update(editingBenefit.id, benefitData);
        alert('Benefício atualizado com sucesso!');
      } else {
        await benefitsAPI.create(benefitData);
        alert('Benefício criado com sucesso!');
      }

      resetForm();
      loadData();
    } catch (error) {
      console.error('Erro ao salvar benefício:', error);
      alert('Erro ao salvar benefício: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEdit = (benefit) => {
    setEditingBenefit(benefit);
    setTitle(benefit.title);
    setDescription(benefit.description);
    setTerms(benefit.terms || '');
    setCategory(benefit.category);
    setDiscountPercentage(benefit.discountPercentage || '');
    setPartnerName(benefit.partnerName || '');
    setPartnerLogo(benefit.partnerLogo || '');
    setHowToRedeem(benefit.howToRedeem || '');
    setImageUrl(benefit.imageUrl || '');
    setValidFrom(benefit.validFrom.split('T')[0]);
    setValidUntil(benefit.validUntil.split('T')[0]);
    setActive(benefit.active);
    setFeatured(benefit.featured);
    setMaxRedemptions(benefit.maxRedemptions || '');
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este benefício?')) return;

    try {
      await benefitsAPI.delete(id);
      alert('Benefício excluído com sucesso!');
      loadData();
    } catch (error) {
      console.error('Erro ao excluir benefício:', error);
      alert('Erro ao excluir benefício');
    }
  };

  const resetForm = () => {
    setEditingBenefit(null);
    setTitle('');
    setDescription('');
    setTerms('');
    setCategory('DISCOUNT');
    setDiscountPercentage('');
    setPartnerName('');
    setPartnerLogo('');
    setHowToRedeem('');
    setImageUrl('');
    setValidFrom('');
    setValidUntil('');
    setActive(true);
    setFeatured(false);
    setMaxRedemptions('');
    setShowForm(false);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00BCD4]"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">RELM Club</h1>
            <p className="text-gray-600 mt-1">Gerencie os benefícios do clube</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-[#00BCD4] text-white px-4 py-2 rounded-lg hover:bg-[#2FC0D3] transition-colors"
          >
            {showForm ? <X size={20} /> : <Plus size={20} />}
            {showForm ? 'Cancelar' : 'Novo Benefício'}
          </button>
        </div>

        {/* Statistics */}
        {statistics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="text-sm text-gray-600 mb-1">Total</div>
              <div className="text-2xl font-bold text-gray-900">{statistics.total}</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="text-sm text-gray-600 mb-1">Ativos</div>
              <div className="text-2xl font-bold text-[#00FF8E]">{statistics.active}</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="text-sm text-gray-600 mb-1">Destacados</div>
              <div className="text-2xl font-bold text-[#00BCD4]">{statistics.featured}</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="text-sm text-gray-600 mb-1">Total Resgates</div>
              <div className="text-2xl font-bold text-[#2FC0D3]">{statistics.totalRedemptions}</div>
            </div>
          </div>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            {editingBenefit ? 'Editar Benefício' : 'Novo Benefício'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCD4] text-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCD4] text-black"
                >
                  {Object.entries(BENEFIT_CATEGORIES).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCD4] text-black"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Parceiro
                </label>
                <input
                  type="text"
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCD4] text-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Desconto (%)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={discountPercentage}
                  onChange={(e) => setDiscountPercentage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCD4] text-black"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL da Imagem
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="/uploads/benefits/imagem.jpg"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCD4] text-black"
                  />
                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => window.open(imageUrl, '_blank')}
                      className="p-2 text-[#00BCD4] hover:bg-blue-50 rounded-lg"
                      title="Visualizar"
                    >
                      <ImageIcon size={20} />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Logo do Parceiro (URL)
                </label>
                <input
                  type="url"
                  value={partnerLogo}
                  onChange={(e) => setPartnerLogo(e.target.value)}
                  placeholder="/uploads/partners/logo.png"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCD4] text-black"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Como Resgatar
              </label>
              <textarea
                value={howToRedeem}
                onChange={(e) => setHowToRedeem(e.target.value)}
                rows={2}
                placeholder="Instruções de como resgatar o benefício..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCD4] text-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Termos e Condições
              </label>
              <textarea
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                rows={2}
                placeholder="Termos e condições do benefício..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCD4] text-black"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Válido de *
                </label>
                <input
                  type="date"
                  value={validFrom}
                  onChange={(e) => setValidFrom(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCD4] text-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Válido até *
                </label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCD4] text-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Máx. de Resgates
                </label>
                <input
                  type="number"
                  min="1"
                  value={maxRedemptions}
                  onChange={(e) => setMaxRedemptions(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCD4] text-black"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="active"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="h-4 w-4 text-[#00BCD4] focus:ring-[#00BCD4] border-gray-300 rounded"
                />
                <label htmlFor="active" className="ml-2 block text-sm text-gray-900">
                  Benefício Ativo
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="featured"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="h-4 w-4 text-[#00BCD4] focus:ring-[#00BCD4] border-gray-300 rounded"
                />
                <label htmlFor="featured" className="ml-2 block text-sm text-gray-900">
                  Benefício Destacado
                </label>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-[#00BCD4] text-white px-6 py-2 rounded-lg hover:bg-[#2FC0D3] transition-colors"
              >
                {editingBenefit ? 'Atualizar' : 'Criar'} Benefício
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Benefits List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {benefits.map((benefit) => (
          <div key={benefit.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Image */}
            {benefit.imageUrl && (
              <div className="h-48 bg-gray-200 relative">
                <img
                  src={benefit.imageUrl}
                  alt={benefit.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                {benefit.featured && (
                  <div className="absolute top-2 right-2 bg-[#00FF8E] text-gray-900 px-2 py-1 rounded flex items-center gap-1">
                    <Star size={14} fill="currentColor" />
                    <span className="text-xs font-medium">Destaque</span>
                  </div>
                )}
              </div>
            )}

            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{benefit.title}</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                      {BENEFIT_CATEGORIES[benefit.category]}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        benefit.active
                          ? 'bg-[#00FF8E] text-gray-900'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {benefit.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>
              </div>

              {benefit.partnerName && (
                <div className="mb-2 flex items-center gap-2">
                  <Tag size={14} className="text-[#00BCD4]" />
                  <span className="text-sm text-gray-700">{benefit.partnerName}</span>
                </div>
              )}

              {benefit.discountPercentage && (
                <div className="mb-3 bg-[#00BCD4] bg-opacity-10 p-2 rounded">
                  <div className="text-2xl font-bold text-[#00BCD4]">
                    {benefit.discountPercentage}% OFF
                  </div>
                </div>
              )}

              <p className="text-gray-600 text-sm mb-4 line-clamp-3">{benefit.description}</p>

              <div className="text-xs text-gray-500 mb-4">
                <div>Válido: {formatDate(benefit.validFrom)} - {formatDate(benefit.validUntil)}</div>
                {benefit.maxRedemptions && (
                  <div>
                    Resgates: {benefit.currentRedemptions}/{benefit.maxRedemptions}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(benefit)}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#00BCD4] text-white px-3 py-2 rounded-lg hover:bg-[#2FC0D3] transition-colors text-sm"
                  title="Editar"
                >
                  <Edit2 size={16} />
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(benefit.id)}
                  className="flex items-center justify-center gap-2 bg-[#FF4043] text-white px-3 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm"
                  title="Excluir"
                >
                  <Trash2 size={16} />
                  Excluir
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {benefits.length === 0 && (
        <div className="text-center py-12">
          <Gift size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">Nenhum benefício cadastrado</p>
        </div>
      )}
    </div>
  );
}
