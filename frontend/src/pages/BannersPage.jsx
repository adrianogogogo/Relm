import React, { useState, useEffect } from 'react';
import { bannersAPI } from '../services/api';
import { Plus, Edit2, Trash2, Eye, EyeOff, ChevronUp, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const BannersPage = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN_RELM';
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    imageUrl: '',
    linkUrl: '',
    linkText: '',
    displayOrder: 0,
    active: true,
  });

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      setLoading(true);
      const data = await bannersAPI.getAll();
      setBanners(data);
    } catch (err) {
      console.error('Erro ao carregar banners:', err);
      alert('Erro ao carregar banners');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBanner) {
        await bannersAPI.update(editingBanner.id, formData);
      } else {
        await bannersAPI.create(formData);
      }
      resetForm();
      loadBanners();
      alert(`Banner ${editingBanner ? 'atualizado' : 'criado'} com sucesso!`);
    } catch (err) {
      console.error('Erro ao salvar banner:', err);
      alert('Erro ao salvar banner');
    }
  };

  const handleEdit = (banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle || '',
      imageUrl: banner.imageUrl,
      linkUrl: banner.linkUrl || '',
      linkText: banner.linkText || '',
      displayOrder: banner.displayOrder,
      active: banner.active,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Deseja realmente excluir este banner?')) return;
    
    try {
      await bannersAPI.delete(id);
      loadBanners();
      alert('Banner excluído com sucesso!');
    } catch (err) {
      console.error('Erro ao excluir banner:', err);
      alert('Erro ao excluir banner');
    }
  };

  const handleToggleActive = async (banner) => {
    try {
      await bannersAPI.update(banner.id, { active: !banner.active });
      loadBanners();
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      alert('Erro ao atualizar status do banner');
    }
  };

  const handleMoveUp = async (banner, index) => {
    if (index === 0) return;
    const prevBanner = banners[index - 1];
    
    try {
      await bannersAPI.update(banner.id, { displayOrder: prevBanner.displayOrder });
      await bannersAPI.update(prevBanner.id, { displayOrder: banner.displayOrder });
      loadBanners();
    } catch (err) {
      console.error('Erro ao reordenar:', err);
      alert('Erro ao reordenar banners');
    }
  };

  const handleMoveDown = async (banner, index) => {
    if (index === banners.length - 1) return;
    const nextBanner = banners[index + 1];
    
    try {
      await bannersAPI.update(banner.id, { displayOrder: nextBanner.displayOrder });
      await bannersAPI.update(nextBanner.id, { displayOrder: banner.displayOrder });
      loadBanners();
    } catch (err) {
      console.error('Erro ao reordenar:', err);
      alert('Erro ao reordenar banners');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      subtitle: '',
      imageUrl: '',
      linkUrl: '',
      linkText: '',
      displayOrder: 0,
      active: true,
    });
    setEditingBanner(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Banners do Site</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={20} />
          Novo Banner
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingBanner ? 'Editar Banner' : 'Novo Banner'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Título*</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Subtítulo</label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">URL da Imagem*</label>
              <input
                type="text"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="/uploads/banners/banner1.png"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">URL do Link</label>
                <input
                  type="text"
                  value={formData.linkUrl}
                  onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="/garantia ou https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Texto do Botão</label>
                <input
                  type="text"
                  value={formData.linkText}
                  onChange={(e) => setFormData({ ...formData, linkText: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Saiba Mais"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Ordem de Exibição</label>
                <input
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) })}
                  className="w-full border rounded-lg px-3 py-2"
                  min="0"
                />
              </div>
              <div className="flex items-center gap-2 mt-6">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4"
                  id="active"
                />
                <label htmlFor="active" className="text-sm font-medium">Banner Ativo</label>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
              >
                {editingBanner ? 'Atualizar' : 'Criar'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-lg"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Banners List */}
      <div className="space-y-4">
        {banners.map((banner, index) => (
          <div key={banner.id} className="bg-white rounded-lg shadow-md p-4">
            <div className="flex gap-4">
              {/* Preview */}
              <div className="w-48 h-32 flex-shrink-0">
                <img
                  src={banner.imageUrl}
                  alt={banner.title}
                  className="w-full h-full object-cover rounded"
                />
              </div>

              {/* Content */}
              <div className="flex-grow">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">{banner.title}</h3>
                    {banner.subtitle && (
                      <p className="text-gray-600 text-sm">{banner.subtitle}</p>
                    )}
                    <div className="mt-2 text-sm text-gray-500">
                      {banner.linkUrl && (
                        <div>Link: {banner.linkUrl}</div>
                      )}
                      <div>Ordem: {banner.displayOrder}</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {/* Reorder */}
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => handleMoveUp(banner, index)}
                        disabled={index === 0}
                        className="p-1 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30"
                        title="Mover para cima"
                      >
                        <ChevronUp size={16} />
                      </button>
                      <button
                        onClick={() => handleMoveDown(banner, index)}
                        disabled={index === banners.length - 1}
                        className="p-1 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30"
                        title="Mover para baixo"
                      >
                        <ChevronDown size={16} />
                      </button>
                    </div>

                    {/* Toggle Active */}
                    <button
                      onClick={() => handleToggleActive(banner)}
                      className={`p-2 rounded ${
                        banner.active
                          ? 'text-green-600 hover:bg-green-50'
                          : 'text-gray-400 hover:bg-gray-100'
                      }`}
                      title={banner.active ? 'Desativar' : 'Ativar'}
                    >
                      {banner.active ? <Eye size={20} /> : <EyeOff size={20} />}
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => handleEdit(banner)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      title="Editar"
                    >
                      <Edit2 size={20} />
                    </button>

                    {/* Delete */}
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(banner.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                        title="Excluir"
                      >
                        <Trash2 size={20} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {banners.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Nenhum banner cadastrado. Clique em "Novo Banner" para começar.
          </div>
        )}
      </div>
    </div>
  );
};

export default BannersPage;
