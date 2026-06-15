import { PRODUCT_LOGO, PRODUCT_NAME } from '../../lib/brand';

type BrandLogoProps = {
  className?: string;
  imgClassName?: string;
  showName?: boolean;
  nameClassName?: string;
  tagline?: string;
  taglineClassName?: string;
};

export function BrandLogo({
  className = '',
  imgClassName = 'h-9 w-auto',
  showName = false,
  nameClassName = 'text-xl font-bold font-display tracking-tight text-gray-950',
  tagline,
  taglineClassName = 'text-[10px] text-gray-500 font-mono tracking-wider',
}: BrandLogoProps) {
  return (
    <div className={`flex items-center gap-2.5 min-w-0 ${className}`}>
      <img
        src={PRODUCT_LOGO}
        alt={PRODUCT_NAME}
        className={`shrink-0 object-contain ${imgClassName}`}
      />
      {(showName || tagline) && (
        <div className="min-w-0">
          {showName ? <span className={nameClassName}>{PRODUCT_NAME}</span> : null}
          {tagline ? <p className={taglineClassName}>{tagline}</p> : null}
        </div>
      )}
    </div>
  );
}
