import { Link } from 'react-router-dom';
import { ProfessionalProfile } from '../lib/types';
import StarRating from './StarRating';

function avgRating(p: ProfessionalProfile): number {
  const rs = p.reviews || [];
  if (!rs.length) return 0;
  return rs.reduce((s, r) => s + r.rating, 0) / rs.length;
}

export default function ProfessionalCard({ p }: { p: ProfessionalProfile }) {
  const rating = avgRating(p);
  return (
    <div className="card p-4 flex flex-col items-center text-center min-w-[220px] max-w-[280px]">
      <img
        src={p.fotoUrl || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop'}
        alt={p.nombrePublico}
        className="w-36 h-44 object-cover rounded-xl mb-3"
      />
      <h3 className="font-extrabold text-lg text-garnet-deep uppercase">{p.nombrePublico}</h3>
      <p className="text-sm font-semibold text-garnet/80">{p.titulo}</p>
      <StarRating rating={rating} />
      {p.verificado && (
        <span className="text-[11px] text-emerald-600 font-semibold mt-1">✓ Perfil verificado</span>
      )}
      <Link to={`/profesional/${p.id}`} className="btn-primary mt-3 w-full text-center block">
        Agendar Cita
      </Link>
    </div>
  );
}
