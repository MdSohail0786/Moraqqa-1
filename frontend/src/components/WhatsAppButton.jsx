import { MessageCircle } from 'lucide-react';
import { useSettings } from '../context/SettingsContext.jsx';
import { useLayout } from '../context/LayoutContext.jsx';

/**
 * Floating WhatsApp CTA. The number comes from the API (WHATSAPP_NUMBER on the server),
 * never from frontend source. The message mentions the project/page being viewed.
 * Renders nothing until a number is configured, so there is never a dead button.
 */
export default function WhatsAppButton() {
  const { settings } = useSettings();
  const { waTopic } = useLayout();
  const { number, message } = settings.whatsapp || {};
  if (!number) return null;

  const text = waTopic ? `${message} I was looking at “${waTopic}”.` : message;
  const href = `https://wa.me/${number}?text=${encodeURIComponent(text)}`;

  return (
    <a className="whatsapp" href={href} target="_blank" rel="noopener noreferrer" aria-label="Chat with MORAQQA on WhatsApp" data-cursor="view">
      <MessageCircle size={22} aria-hidden="true" />
      <span className="whatsapp__label">WhatsApp</span>
    </a>
  );
}
