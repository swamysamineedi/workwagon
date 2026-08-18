export default function Avatar({ name = '', src, size = 'md', className = '' }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`avatar avatar-${size} ${className}`}
        style={{ objectFit: 'cover' }}
      />
    );
  }
  return (
    <div className={`avatar avatar-${size} ${className}`}>
      {initials || '?'}
    </div>
  );
}
