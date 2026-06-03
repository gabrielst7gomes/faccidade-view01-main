const WPP =
  "https://api.whatsapp.com/send?phone=5562986031010&text=" +
  encodeURIComponent("Olá, vim pela Landing Page e quero saber mais sobre os cursos da FacCidade.");

export function WhatsAppButton() {
  return (
    <a
      href={WPP}
      target="_blank"
      rel="noopener"
      aria-label="Falar no WhatsApp"
      className="fixed bottom-20 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105 hover:shadow-2xl md:bottom-5"
    >
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden>
        <path d="M20.52 3.48A11.94 11.94 0 0 0 12.04 0C5.5 0 .2 5.3.2 11.84c0 2.08.55 4.12 1.6 5.92L0 24l6.4-1.68a11.83 11.83 0 0 0 5.64 1.44h.01c6.54 0 11.84-5.3 11.84-11.84 0-3.16-1.23-6.13-3.37-8.44ZM12.05 21.5h-.01a9.66 9.66 0 0 1-4.92-1.35l-.35-.21-3.8 1 1.02-3.7-.23-.38a9.66 9.66 0 1 1 17.94-5.02c0 5.34-4.34 9.66-9.65 9.66Zm5.31-7.23c-.29-.15-1.71-.84-1.97-.94-.27-.1-.46-.15-.66.15-.2.29-.76.94-.93 1.13-.17.2-.34.22-.63.07-.29-.15-1.22-.45-2.32-1.43-.86-.77-1.43-1.71-1.6-2-.17-.29-.02-.45.13-.6.13-.13.29-.34.43-.5.15-.17.2-.29.29-.49.1-.2.05-.36-.02-.51-.07-.15-.66-1.6-.91-2.18-.24-.58-.49-.5-.66-.5l-.56-.01c-.2 0-.51.07-.78.36-.27.29-1.02 1-1.02 2.45 0 1.44 1.04 2.83 1.19 3.02.15.2 2.05 3.13 4.97 4.39.69.3 1.24.48 1.66.62.7.22 1.33.19 1.83.12.56-.08 1.71-.7 1.96-1.37.24-.68.24-1.26.17-1.37-.07-.12-.27-.19-.56-.34Z" />
      </svg>
    </a>
  );
}
