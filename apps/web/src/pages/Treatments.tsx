import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api, { fmtClp } from '../lib/api';
import { Treatment } from '../lib/types';

export default function Treatments() {
  const { data: treatments = [] } = useQuery({
    queryKey: ['treatments'],
    queryFn: async () => (await api.get<Treatment[]>('/treatments')).data,
  });

  return (
    <div className="bg-rose-soft min-h-screen pb-12">
      <div className="max-w-6xl mx-auto px-4 pt-8">
        <span className="badge-pill">Catálogo</span>
        <h1 className="text-3xl md:text-4xl font-extrabold text-garnet-deep mt-4 mb-8 uppercase">
          Tratamientos
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {treatments.map((t) => (
            <div key={t.id} className="card p-5 flex flex-col">
              <span className="text-xs font-bold text-mauve uppercase tracking-wide">{t.categoria}</span>
              <h2 className="font-extrabold text-xl text-garnet-deep mt-1">{t.nombre}</h2>
              <p className="text-sm text-garnet/70 mt-2 flex-1">{t.descripcion}</p>
              <div className="flex justify-between items-center mt-4">
                <span className="text-sm text-garnet/60">{t.duracionMin} min</span>
                <span className="font-extrabold text-mauve">{fmtClp(t.precioClp)}</span>
              </div>
              <Link to="/profesionales" className="btn-primary text-center mt-4 block text-sm">
                Buscar profesional
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
