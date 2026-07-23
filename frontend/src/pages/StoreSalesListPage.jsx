import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';
import { MdAdd, MdReceiptLong } from 'react-icons/md';
import { salesAPI } from '../services/api';
import { Card, PageHeader, Button } from '../components/ui';

const brl = (n) => Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Total da venda = soma de (valor unitário × quantidade) de cada item.
const saleTotal = (sale) =>
  (sale.items || []).reduce((sum, it) => sum + Number(it.unitPrice || 0) * (it.quantity || 1), 0);

export default function StoreSalesListPage() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const detailBase = isAdmin ? '/admin/customers' : '/loja/clientes';
  const createPath = isAdmin ? '/admin/vendas' : '/loja/vendas';

  // O backend escopa /sales pela loja quando o perfil é LOJA; para os perfis
  // RELM (admin/gestor/suporte) retorna as vendas de todas as lojas.
  const { data, isLoading } = useQuery({
    queryKey: ['sales-list', isAdmin],
    queryFn: () => salesAPI.getAll({ limit: 100 }),
  });
  const sales = data?.data || [];

  return (
    <div className="py-8 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-6">
          <PageHeader
            title="Minhas Vendas"
            subtitle={isAdmin
              ? 'Vendas registradas por todas as lojas. Clique no cliente para ver os itens e a garantia.'
              : 'Vendas da sua loja. Clique no cliente para ver os itens e a garantia restante.'}
            className="mb-0"
          />
          <Link to={createPath}>
            <Button icon={MdAdd}>Cadastrar Venda</Button>
          </Link>
        </div>

        {isLoading ? (
          <p className="text-gray-500 dark:text-slate-400">Carregando vendas...</p>
        ) : sales.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center text-center py-8 gap-2">
              <MdReceiptLong size={40} className="text-gray-300 dark:text-slate-600" />
              <p className="text-gray-500 dark:text-slate-400">Nenhuma venda registrada ainda.</p>
              <Link to={createPath} className="text-primary dark:text-primary-400 hover:underline text-sm font-semibold">
                Cadastrar a primeira venda
              </Link>
            </div>
          </Card>
        ) : (
          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-800">
                    <th className="px-4 py-3 font-semibold">Cliente</th>
                    <th className="px-4 py-3 font-semibold">Loja</th>
                    <th className="px-4 py-3 font-semibold">Data</th>
                    <th className="px-4 py-3 font-semibold text-center">Itens</th>
                    <th className="px-4 py-3 font-semibold text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                  {sales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-slate-900/40 transition-colors">
                      <td className="px-4 py-3">
                        {sale.customer?.id ? (
                          <Link
                            to={`${detailBase}/${sale.customer.id}?tab=purchases`}
                            className="font-medium text-primary dark:text-primary-400 hover:underline"
                          >
                            {sale.customer.fullName}
                          </Link>
                        ) : (
                          <span className="font-medium text-gray-900 dark:text-slate-100">
                            {sale.customer?.fullName || '—'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-slate-300">{sale.store?.tradeName || '—'}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-slate-300">
                        {new Date(sale.saleDate).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600 dark:text-slate-300">
                        {(sale.items || []).length}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-slate-100">
                        {brl(saleTotal(sale))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
