import { useQuery } from '@tanstack/react-query';
import { FaWhatsapp } from 'react-icons/fa';
import { whatsappAPI } from '../services/api';

export default function WhatsAppFloatingButton() {
  const { data } = useQuery({
    queryKey: ['whatsapp-public-contact'],
    queryFn: whatsappAPI.getPublicContact,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: false,
  });

  const number = data?.number;
  if (!number) return null;

  const text = encodeURIComponent('Olá! Sou cliente RELM Care+ e preciso de ajuda.');
  const href = `https://wa.me/${number}?text=${text}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar com a Relm no WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-green-500 text-white shadow-lg hover:scale-110 transition-transform duration-200"
    >
      <FaWhatsapp size={28} />
    </a>
  );
}
