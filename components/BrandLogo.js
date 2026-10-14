export default function BrandLogo({ className = "h-8 w-auto" }) {
  return (
    <img
      src="/tssc-logo.png"
      alt="Tire Store Service Center"
      className={`block object-contain object-left ${className}`}
    />
  );
}
