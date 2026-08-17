export default function Avatar({ name = '', size = 'md', src, className = '' }) {
  const initials = name
    .split(' ')
    .map(p => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';

  if (src) {
    return (
      <img
        src={src} alt={name}
        className={`avatar avatar-${size} ${className}`}
        style={{ objectFit: 'cover' }}
      />
    );
  }

  return (
    <span className={`avatar avatar-${size} ${className}`} aria-label={name}>
      {initials}
    </span>
  );
}
