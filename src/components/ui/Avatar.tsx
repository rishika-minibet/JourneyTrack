import { initials } from '../../utils/format';

const PALETTE = [
  'bg-green-100 text-green-700',
  'bg-emerald-100 text-emerald-700',
  'bg-teal-100 text-teal-700',
  'bg-sky-100 text-sky-700',
  'bg-violet-100 text-violet-700',
  'bg-amber-100 text-amber-700',
];

interface AvatarProps {
  name: string;
  size?: 'sm' | 'lg';
}

export function Avatar({ name, size = 'sm' }: AvatarProps) {
  const color = PALETTE[name.length % PALETTE.length];
  const dimensions = size === 'lg' ? 'h-12 w-12 text-base' : 'h-9 w-9 text-xs';
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${color} ${dimensions}`}>
      {initials(name)}
    </span>
  );
}
