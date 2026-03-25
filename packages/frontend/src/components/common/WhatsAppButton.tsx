import { useLocation } from 'react-router-dom';

const WhatsAppButton = () => {
  const { pathname } = useLocation();

  // Only show on the main page
  if (pathname !== '/') {
    return null;
  }

  const scrollToContact = () => {
    const el = document.getElementById('contact');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <button
      onClick={scrollToContact}
      aria-label="Contact"
      className="fixed bottom-5 right-5 z-50 w-14 h-14 bg-primary-500 hover:bg-primary-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-110"
    >
      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    </button>
  );
};

export default WhatsAppButton;
