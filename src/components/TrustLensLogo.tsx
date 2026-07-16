/**
 * TrustLensLogo — the branded shield-eye logo.
 * Use `size` to control width/height in pixels (default 28).
 */
export function TrustLensLogo({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <img
      src="/logo.png"
      alt="TrustLens"
      width={size}
      height={size}
      className={`shrink-0 object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
