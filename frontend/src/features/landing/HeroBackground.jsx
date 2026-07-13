export function HeroBackground() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 75% 60% at 50% 40%, hsl(var(--primary) / 0.1) 0%, hsl(var(--primary) / 0.04) 45%, transparent 75%)",
        }}
      />
    </div>
  );
}
