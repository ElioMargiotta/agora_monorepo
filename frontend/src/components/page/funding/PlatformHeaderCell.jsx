export default function PlatformHeaderCell({ platformId, meta, suffix }) {
  return (
    <div className="flex items-center justify-center gap-2">
      <img src={meta.image} alt={meta.name} className="h-5 w-5 rounded" />
      <span className="hidden sm:inline">{meta.name} {suffix}</span>
      <span className="sm:hidden">{meta.name}</span>
    </div>
  );
}
