import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import api from '../lib/api';
import { ProfessionalProfile, Treatment } from '../lib/types';
import ProfessionalCard from '../components/ProfessionalCard';
import ProfessionalsMap from '../components/ProfessionalsMap';

export default function Professionals() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get('q') || '');
  const [especialidad, setEspecialidad] = useState('');
  const [comuna, setComuna] = useState('');

  const { data: pros = [] } = useQuery({
    queryKey: ['professionals', q, especialidad, comuna],
    queryFn: async () =>
      (await api.get<ProfessionalProfile[]>('/professionals', { params: { q, especialidad, comuna } })).data,
  });
  const { data: treatments = [] } = useQuery({
    queryKey: ['treatments'],
    queryFn: async () => (await api.get<Treatment[]>('/treatments')).data,
  });

  const especialidades = Array.from(new Set(pros.flatMap((p) => p.especialidades)));
  const comunas = Array.from(new Set(pros.map((p) => p.comuna)));

  return (
    <div className="bg-rose-soft min-h-screen pb-12">
      <div className="max-w-7xl mx-auto px-4 pt-8">
        <span className="badge-pill">Profesionales para agendar</span>
        <h1 className="text-3xl md:text-4xl font-extrabold text-garnet-deep mt-4 mb-6 uppercase">
          Profesionales
        </h1>

        <div className="card p-4 mb-8 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-bold text-garnet uppercase">Buscar</label>
            <input
              value={q}
              onChange={(e) => { setQ(e.target.value); setParams({ q: e.target.value }); }}
              placeholder="Nombre o especialidad..."
              className="input mt-1"
            />
          </div>
          <div className="min-w-[180px]">
            <label className="text-xs font-bold text-garnet uppercase">Especialidad</label>
            <select value={especialidad} onChange={(e) => setEspecialidad(e.target.value)} className="input mt-1">
              <option value="">Todas</option>
              {especialidades.map((e) => <option key={e}>{e}</option>)}
            </select>
          </div>
          <div className="min-w-[160px]">
            <label className="text-xs font-bold text-garnet uppercase">Comuna</label>
            <select value={comuna} onChange={(e) => setComuna(e.target.value)} className="input mt-1">
              <option value="">Todas</option>
              {comunas.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2">
            {pros.length === 0 ? (
              <div className="card p-10 text-center text-garnet/60">
                No se encontraron profesionales con esos filtros.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 justify-items-center">
                {pros.map((p) => <ProfessionalCard key={p.id} p={p} />)}
              </div>
            )}
          </div>
          <div>
            <div className="card p-4 sticky top-24">
              <div className="font-bold text-garnet-deep mb-2 text-sm uppercase">Disponibles en tu zona</div>
              <ProfessionalsMap professionals={pros} height="360px" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
