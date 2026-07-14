/**
 * Shared shell: edge-to-edge on real phones, a centered floating "app card"
 * on wider viewports so desktop doesn't just show a thin column glued to
 * the top-left of an empty page. `wide` widens the card further at the lg+
 * breakpoint and switches it to a row layout, for screens with a sidebar.
 */
export function AppFrame({
  children,
  wide = false,
}: {
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center sm:bg-cream-shade sm:py-10 sm:px-4">
      <div
        className={`w-full h-screen sm:h-[840px] sm:max-h-[92vh] max-w-[480px] bg-cream flex flex-col sm:rounded-[32px] sm:shadow-[0_30px_60px_-20px_rgba(30,50,40,0.35)] sm:border sm:border-black/5 overflow-hidden ${
          wide ? "lg:max-w-[1120px] lg:h-[840px] lg:flex-row" : ""
        }`}
      >
        {children}
      </div>
    </div>
  );
}
