import { CONVOCOIN_ASSET } from '../lib/convocoins';

type ConvoCoinIconProps = {
  size?: number;
  className?: string;
};

export function ConvoCoinIcon({ size = 16, className = '' }: ConvoCoinIconProps) {
  return (
    <img
      src={CONVOCOIN_ASSET}
      alt=""
      width={size}
      height={size}
      className={`shrink-0 object-contain ${className}`.trim()}
      aria-hidden
    />
  );
}
