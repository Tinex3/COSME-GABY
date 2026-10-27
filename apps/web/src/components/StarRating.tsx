export default function StarRating({ rating, size = 'text-base' }: { rating: number; size?: string }) {
  return (
    <span className={`${size} text-mauve tracking-tight`} aria-label={`${rating} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= Math.round(rating) ? '' : 'opacity-30'}>
          ★
        </span>
      ))}
    </span>
  );
}
