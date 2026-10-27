import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { ProfessionalProfile } from '../lib/types';
import ProfessionalsMap from '../components/ProfessionalsMap';
import { Link } from 'react-router-dom';

export default function Ubicacion() {
  const { data: pros = [] } = useQuery({
    queryKey: ['professionals-map'],
    queryFn: async () => (await api.get<ProfessionalProfile[]>('/professionals')).data,
  });

  return (
    <div className="bg-rose-soft min-h-screen pb-12">
      <div className="max-w-6xl mx-auto px-4 pt-8">
        <span className="badge-pill">Ubicación</span>
        <h1 className="text-3xl md:text-4xl font-extrabold text-garnet-deep mt-4 mb-6 uppercase">
          Citas disponibles en tu zona
        </h1>
        <div className="card p-4">
          <ProfessionalsMap professionals={pros} height="480px" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {pros.map((p) => (
            <Link key={p.id} to={`/profesional/${p.id}`} className="card p-4 hover:shadow-lg transition-shadow">
              <div className="font-bold text-garnet-deep">{p.nombrePublico}</div>
              <div className="text-sm text-garnet/70">{p.comuna} · {p.titulo}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
