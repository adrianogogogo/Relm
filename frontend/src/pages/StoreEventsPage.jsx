import EventsFeed from '../components/feed/EventsFeed';

export default function StoreEventsPage() {
  return (
    <EventsFeed
      title="Eventos"
      subtitle="Eventos direcionados à sua loja"
      queryKey="store-feed-events"
    />
  );
}
