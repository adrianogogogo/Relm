import EventsFeed from '../components/feed/EventsFeed';

export default function DistribuidorEventosPage() {
  return (
    <EventsFeed
      title="Eventos"
      subtitle="Eventos direcionados a distribuidores"
      queryKey="distribuidor-feed-events"
    />
  );
}
