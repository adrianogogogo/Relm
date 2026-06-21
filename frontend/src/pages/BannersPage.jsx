import React, { useState, useEffect } from 'react';
import { bannersAPI } from '../services/api';
import { MdAdd, MdEdit, MdDelete, MdVisibility, MdVisibilityOff, MdKeyboardArrowUp, MdKeyboardArrowDown } from 'react-icons/md';
import { useAuthStore } from '../store/authStore';
import { Card, PageHeader, Button } from '../components/ui';

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
        <div className="text-xl text-gray-500 dark:text-slate-400">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="py-8 px-6">
      <div className="max-w-6xl mx-auto">
        <PageHeader
          title="Banners do Site"
          subtitle={`${banners.length} banner(s) cadastrado(s)`}
          action={
            <Button icon={MdAdd} onClick={() => setShowForm(!showForm)}>Novo Banner</Button>
          }
        />

        {/* Form */}
        {showForm && (
          <Card className="mb-6">
            <h2 className="font-title text-xl font-bold mb-4 text-gray-900 dark:text-slate-100">
              {editingBanner ? 'Editar Banner' : 'Novo Banner'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Título*</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Subtítulo</label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="label">URL da Imagem*</label>
                <input
                  type="text"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="input"
                  placeholder="/uploads/banners/banner1.png"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">URL do Link</label>
                  <input
                    type="text"
                    value={formData.linkUrl}
                    onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                    className="input"
                    placeholder="/garantia ou https://..."
                  />
                </div>
                <div>
                  <label className="label">Texto do Botão</label>
                  <input
                    type="text"
                    value={formData.linkText}
                    onChange={(e) => setFormData({ ...formData, linkText: e.target.value })}
                    className="input"
                    placeholder="Saiba Mais"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Ordem de Exibição</label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) })}
                    className="input"
                    min="0"
                  />
                </div>
                <div className="flex items-center gap-2 mt-8">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-4 h-4 rounded text-primary focus:ring-primary"
                    id="active"
                  />
                  <label htmlFor="active" className="text-sm font-medium text-gray-700 dark:text-slate-300">Banner Ativo</label>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn btn-primary">
                  {editingBanner ? 'Atualizar' : 'Criar'}
                </button>
                <button type="button" onClick={resetForm} className="btn btn-outline">
                  Cancelar
                </button>
              </div>
            </form>
          </Card>
        )}

        {/* Banners List */}
        <div className="space-y-4">
          {banners.map((banner, index) => (
            <Card key={banner.id} className="p-4">
              <div className="flex gap-4">
                {/* Preview */}
                <div className="w-48 h-32 flex-shrink-0">
                  <img
                    src={banner.imageUrl}
                    alt={banner.title}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>

                {/* Content */}
                <div className="flex-grow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">{banner.title}</h3>
                      {banner.subtitle && (
                        <p className="text-gray-600 dark:text-slate-400 text-sm">{banner.subtitle}</p>
                      )}
                      <div className="mt-2 text-sm text-gray-500 dark:text-slate-400">
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
                          className="p-1 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded disabled:opacity-30"
                          title="Mover para cima"
                        >
                          <MdKeyboardArrowUp size={16} />
                        </button>
                        <button
                          onClick={() => handleMoveDown(banner, index)}
                          disabled={index === banners.length - 1}
                          className="p-1 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded disabled:opacity-30"
                          title="Mover para baixo"
                        >
                          <MdKeyboardArrowDown size={16} />
                        </button>
                      </div>

                      {/* Toggle Active */}
                      <button
                        onClick={() => handleToggleActive(banner)}
                        className={`p-2 rounded ${
                          banner.active
                            ? 'text-success hover:bg-success/10'
                            : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                        }`}
                        title={banner.active ? 'Desativar' : 'Ativar'}
                      >
                        {banner.active ? <MdVisibility size={20} /> : <MdVisibilityOff size={20} />}
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => handleEdit(banner)}
                        className="p-2 text-primary hover:bg-primary/10 rounded"
                        title="Editar"
                      >
                        <MdEdit size={20} />
                      </button>

                      {/* Delete */}
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(banner.id)}
                          className="p-2 text-error hover:bg-error/10 rounded"
                          title="Excluir"
                        >
                          <MdDelete size={20} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {banners.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-slate-400">
              Nenhum banner cadastrado. Clique em "Novo Banner" para começar.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BannersPage;
