/**
 * Hero backdrop — decorative only. A faint grid and two slow, soft light
 * pools, deliberately kept off to the edges so nothing sits behind the words.
 */
export function HeroBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-grid mask-fade-edges opacity-[0.25]" />

      <div className="absolute -right-[6%] -top-[16%] h-[36rem] w-[36rem] animate-drift rounded-full bg-cool/12 blur-[140px]" />
      <div className="absolute -left-[12%] top-1/3 h-[26rem] w-[26rem] animate-float rounded-full bg-accent/10 blur-[130px]" />
      <div className="absolute bottom-[-10%] right-1/4 h-72 w-72 animate-drift rounded-full bg-violet/10 blur-[120px] [animation-delay:-9s]" />

      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-paper" />
    </div>
  );
}
