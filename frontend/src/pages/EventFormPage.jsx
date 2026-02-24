import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { eventsAPI, storesAPI } from '../services/api';

export default function EventFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    startAt: '',
    endAt: '',
    maxParticipants: '',
    isPublic: true,
    requiresMembership: false,
    imageUrl: '',
    category: '',
    storeId: '',
  });

  const [errors, setErrors] = useState({});

  // Carregar lojas para seleção
  const { data: stores } = useQuery({
    queryKey: ['stores'],
    queryFn: () => storesAPI.getAll().then((res) => res.data),
  });

  // Carregar evento se for edição
  const { data: event, isLoading: loadingEvent } = useQuery({
    queryKey: ['event', id],
    queryFn: () => eventsAPI.getById(id).then((res) => res.data),
    enabled: isEditMode,
  });

  useEffect(() => {
    if (event && isEditMode) {
      setFormData({
        title: event.title || '',
        description: event.description || '',
        location: event.location || '',
        startAt: event.startAt ? new Date(event.startAt).toISOString().slice(0, 16) : '',
        endAt: event.endAt ? new Date(event.endAt).toISOString().slice(0, 16) : '',
        maxParticipants: event.maxParticipants || '',
        isPublic: event.isPublic ?? true,
        requiresMembership: event.requiresMembership ?? false,
        imageUrl: event.imageUrl || '',
        category: event.category || '',
        storeId: event.storeId || '',
      });
    }
  }, [event, isEditMode]);

  const createMutation = useMutation({
    mutationFn: (data) => eventsAPI.create(data),
    onSuccess: () => {
      alert('Evento criado com sucesso!');
      navigate('/admin/events');
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Erro ao criar evento');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => eventsAPI.update(id, data),
    onSuccess: () => {
      alert('Evento atualizado com sucesso!');
      navigate('/admin/events');
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Erro ao atualizar evento');
    },
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Limpar erro do campo
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Título é obrigatório';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Local é obrigatório';
    }

    if (!formData.startAt) {
      newErrors.startAt = 'Data de início é obrigatória';
    }

    if (!formData.endAt) {
      newErrors.endAt = 'Data de término é obrigatória';
    }

    if (formData.startAt && formData.endAt) {
      const start = new Date(formData.startAt);
      const end = new Date(formData.endAt);
      if (start >= end) {
        newErrors.endAt = 'Data de término deve ser após a data de início';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const payload = {
      title: formData.title,
      description: formData.description,
      location: formData.location,
      startAt: new Date(formData.startAt).toISOString(),
      endAt: new Date(formData.endAt).toISOString(),
      isPublic: formData.isPublic,
      requiresMembership: formData.requiresMembership,
      ...(formData.maxParticipants && {
        maxParticipants: parseInt(formData.maxParticipants),
      }),
      ...(formData.imageUrl && { imageUrl: formData.imageUrl }),
      ...(formData.category && { category: formData.category }),
      ...(formData.storeId && { storeId: formData.storeId }),
    };

    if (isEditMode) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  if (isEditMode && loadingEvent) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-500 mt-4">Carregando evento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <button
              onClick={() => navigate('/admin/events')}
              className="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-2"
            >
              ← Voltar para eventos
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditMode ? 'Editar Evento' : 'Novo Evento'}
            </h1>
            <p className="text-gray-600 mt-2">
              {isEditMode
                ? 'Atualize as informações do evento'
                : 'Preencha os dados para criar um novo evento'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="card">
            {/* Título */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título do Evento *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`input ${errors.title ? 'border-red-500' : ''}`}
                placeholder="Ex: Pedal Relm - Domingo de Ciclismo"
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title}</p>
              )}
            </div>

            {/* Descrição */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                className={`input ${errors.description ? 'border-red-500' : ''}`}
                placeholder="Descreva o evento, nível de dificuldade, o que levar..."
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description}</p>
              )}
            </div>

            {/* Local */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Local *
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className={`input ${errors.location ? 'border-red-500' : ''}`}
                placeholder="Ex: Parque Ibirapuera - Portão 3"
              />
              {errors.location && (
                <p className="text-red-500 text-sm mt-1">{errors.location}</p>
              )}
            </div>

            {/* Datas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data/Hora Início *
                </label>
                <input
                  type="datetime-local"
                  name="startAt"
                  value={formData.startAt}
                  onChange={handleChange}
                  className={`input ${errors.startAt ? 'border-red-500' : ''}`}
                />
                {errors.startAt && (
                  <p className="text-red-500 text-sm mt-1">{errors.startAt}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data/Hora Término *
                </label>
                <input
                  type="datetime-local"
                  name="endAt"
                  value={formData.endAt}
                  onChange={handleChange}
                  className={`input ${errors.endAt ? 'border-red-500' : ''}`}
                />
                {errors.endAt && (
                  <p className="text-red-500 text-sm mt-1">{errors.endAt}</p>
                )}
              </div>
            </div>

            {/* Categoria e Vagas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="">Selecione...</option>
                  <option value="Pedal">🚴 Pedal</option>
                  <option value="Oficina">🔧 Oficina</option>
                  <option value="Encontro">🤝 Encontro</option>
                  <option value="Competição">🏆 Competição</option>
                  <option value="Workshop">📚 Workshop</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Máximo de Participantes
                </label>
                <input
                  type="number"
                  name="maxParticipants"
                  value={formData.maxParticipants}
                  onChange={handleChange}
                  min="1"
                  className="input"
                  placeholder="Deixe vazio para ilimitado"
                />
              </div>
            </div>

            {/* Loja Organizadora */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loja Organizadora (opcional)
              </label>
              <select
                name="storeId"
                value={formData.storeId}
                onChange={handleChange}
                className="input"
              >
                <option value="">Nenhuma loja</option>
                {stores?.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name} - {store.city}/{store.state}
                  </option>
                ))}
              </select>
            </div>

            {/* URL da Imagem */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL da Imagem
              </label>
              <input
                type="url"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                className="input"
                placeholder="https://exemplo.com/imagem.jpg"
              />
            </div>

            {/* Checkboxes */}
            <div className="mb-6 space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isPublic"
                  checked={formData.isPublic}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  🌐 Evento público (visível para todos)
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="requiresMembership"
                  checked={formData.requiresMembership}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  ⭐ Requer membership do clube de vantagens
                </label>
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => navigate('/admin/events')}
                className="btn btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={createMutation.isLoading || updateMutation.isLoading}
                className="btn btn-primary flex-1"
              >
                {createMutation.isLoading || updateMutation.isLoading
                  ? 'Salvando...'
                  : isEditMode
                  ? 'Atualizar Evento'
                  : 'Criar Evento'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
