import { useAuthStore } from '../store/authStore';
import { PageHeader } from '../components/ui';
import ServicesCatalogSection from '../components/ServicesCatalogSection';

export default function AdminMasterServicesPage() {
  const user = useAuthStore((state) => state.user);
  // Usuário com loja vinculada vê o mesmo catálogo já cruzado com a oferta da
  // sua unidade — é a mesma tela de Oficina & Conveniências.
  const storeId = user?.storeId || null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Catálogo de Serviços & Conveniências"
        subtitle={
          storeId
            ? 'Padrão da rede Relm e o que a sua loja oferece, lado a lado.'
            : 'Gerencie os modelos de serviços e diretrizes padrões oferecidos pela rede de lojas Relm.'
        }
      />

      <ServicesCatalogSection storeId={storeId} canManageStore={!!storeId} />
    </div>
  );
}
