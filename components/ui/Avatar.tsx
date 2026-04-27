const GRADIENTS = [
  'from-blue-600 to-cyan-500',
  'from-violet-600 to-purple-500',
  'from-emerald-600 to-teal-500',
  'from-rose-600 to-pink-500',
  'from-amber-600 to-orange-500',
  'from-indigo-600 to-blue-500',
  'from-cyan-600 to-sky-500',
  'from-fuchsia-600 to-pink-500',
];

function gradient(name: string) {
  return GRADIENTS[name.charCodeAt(0) % GRADIENTS.length];
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

interface Props {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE: Record<string, string> = {
  sm: 'w-8 h-8 text-xs rounded-lg',
  md: 'w-10 h-10 text-sm rounded-xl',
  lg: 'w-14 h-14 text-base rounded-2xl',
  xl: 'w-24 h-24 text-2xl rounded-3xl',
};

export default function Avatar({ name, size = 'md', className = '' }: Props) {
  return (
    <div
      className={`bg-gradient-to-br ${gradient(name)} ${SIZE[size]} shrink-0 flex items-center justify-center text-white font-bold shadow-lg ${className}`}
    >
      {initials(name)}
    </div>
  );
}
