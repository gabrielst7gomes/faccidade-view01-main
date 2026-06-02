export function UrgencyBar() {
  const message =
    "🎓 Faça já sua matrícula e garanta 50% de desconto do início ao fim do curso  •  Vagas limitadas  •  Inscreva-se agora";
  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-[36px] w-full overflow-hidden bg-cta text-cta-foreground">
      <div className="flex whitespace-nowrap py-1.5 text-sm font-semibold">
        <div className="ticker flex shrink-0 gap-12 pr-12">
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i}>{message}</span>
          ))}
        </div>
        <div className="ticker flex shrink-0 gap-12 pr-12" aria-hidden>
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i}>{message}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
