import BenefitsFeed from '../components/feed/BenefitsFeed';

export default function StoreBenefitsPage() {
  return (
    <BenefitsFeed
      title="Benefícios"
      subtitle="Vantagens direcionadas à sua loja"
      queryKey="store-feed-benefits"
    />
  );
}
