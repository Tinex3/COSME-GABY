import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import api, { fmtClp, fmtDateTime } from '../lib/api';
import { ProfessionalProfile as ProfileT, ServiceOffering } from '../lib/types';
import StarRating from '../components/StarRating';
import ProfessionalsMap from '../components/ProfessionalsMap';
import { useAuth } from '../lib/auth';

function avg(reviews: { rating: number }[] = []) {
  if (!reviews.length) return 0;
  return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
}

export default function ProfessionalProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: p, isLoading } = useQuery({
    queryKey: ['professional', id],
    queryFn: async () => (await api.get<ProfileT>(`/professionals/${id}`)).data,
    enabled: !!id,
  });

  const [treatment, setTreatment] = useState<ServiceOffering | null>(null);
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [msg, setMsg] = useState('');

  const duracion = treatment?.duracionCustom ?? treatment?.treatment.duracionMin ?? 60;

  const { data: slots = [] } = useQuery({
    queryKey: ['slots', id, fecha, duracion],
    queryFn: async () =>
      (await api.get<string[]>('/slots', { params: { professionalId: id, fecha, duracionMin: duracion } })).data,
    enabled: !!id && !!fecha,
  });

  const book = useMutation({
    mutationFn: async () =>
      (await api.post('/appointments', { professionalId: id, treatmentId: treatment!.treatment.id, fecha, hora })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['slots'] });
      navigate('/panel/paciente?ok=1');
    },
    onError: (e: any) => setMsg(e?.response?.data?.message || 'No se pudo agendar'),
  });

  if (isLoading) return <div className="p-12 text-center text-garnet/60">Cargando perfil...</div>;
  if (!p) return <div className="p-12 text-center text-garnet/60">Profesional no encontrado.</div>;

  const rating = avg(p.reviews);
  const today = new Date().toISOString().slice(0, 10);

  const onBook = () => {
    setMsg('');
    if (!user) { navigate('/login'); return; }
    if (!treatment || !fecha || !hora) { setMsg('Elige tratamiento, fecha y hora'); return; }
    book.mutate();
  };

  return (
    <div className="bg-rose-soft min-h-screen pb-16">
      <div className="max-w-6xl mx-auto px-4 pt-8">
        <div className="card p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <div className="flex flex-col sm:flex-row gap-6">
              <img
                src={p.fotoUrl || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop'}
                alt={p.nombrePublico}
                className="w-48 h-56 object-cover rounded-2xl"
              />
              <div>
                <h1 className="text-3xl font-extrabold text-garnet-deep uppercase">{p.nombrePublico}</h1>
                <p className="font-semibold text-garnet">{p.titulo} · {p.comuna}</p>
                <div className="mt-1"><StarRating rating={rating} /> <span className="text-sm text-garnet/60">({p.reviews?.length || 0} reseñas)</span></div>
                {p.verificado && <div className="text-sm text-emerald-600 font-semibold mt-1">✓ Perfil verificado</div>}
                <div className="flex flex-wrap gap-2 mt-3">
                  {p.especialidades.map((e) => (
                    <span key={e} className="bg-rose-bg text-garnet text-xs font-semibold rounded-full px-3 py-1">{e}</span>
                  ))}
                </div>
                <p className="text-sm text-garnet/80 mt-4 leading-relaxed">{p.bio}</p>
              </div>
            </div>

            <h2 className="font-extrabold text-garnet-deep uppercase mt-8 mb-3">Tratamientos que ofrece</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(p.offerings || []).map((o) => (
                <button
                  key={o.id}
                  onClick={() => { setTreatment(o); setHora(''); }}
                  className={`text-left border-2 rounded-xl p-3 transition-colors cursor-pointer ${
                    treatment?.id === o.id ? 'border-mauve bg-rose-soft' : 'border-rose-bg bg-white hover:border-mauve/50'
                  }`}
                >
                  <div className="font-bold text-garnet-deep">{o.treatment.nombre}</div>
                  <div className="text-sm text-garnet/70">{o.duracionCustom ?? o.treatment.duracionMin} min</div>
                  <div className="font-bold text-mauve mt-1">{fmtClp(o.precioCustom ?? o.treatment.precioClp)}</div>
                </button>
              ))}
            </div>

            <h2 className="font-extrabold text-garnet-deep uppercase mt-8 mb-3">Reseñas</h2>
            {(p.reviews || []).length === 0 ? (
              <p className="text-sm text-garnet/50">Aún no hay reseñas para esta profesional.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {p.reviews!.map((r) => (
                  <div key={r.id} className="bg-rose-soft rounded-xl p-4">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-sm text-garnet-deep">{r.patient?.nombre || 'Paciente'}</span>
                      <StarRating rating={r.rating} size="text-sm" />
                    </div>
                    <p className="text-sm text-garnet/80 mt-1">{r.texto}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <aside>
            <div className="card border-2 border-mauve/40 p-5 sticky top-24">
              <h3 className="font-extrabold text-garnet-deep uppercase text-lg mb-4">💛 Agendar cita</h3>

              {!treatment && <p className="text-sm text-garnet/60 mb-3">1. Elige un tratamiento ↖</p>}

              {treatment && (
                <>
                  <label className="text-xs font-bold text-garnet uppercase">2. Fecha</label>
                  <input
                    type="date"
                    min={today}
                    value={fecha}
                    onChange={(e) => { setFecha(e.target.value); setHora(''); }}
                    className="input mt-1 mb-3"
                  />
                  <label className="text-xs font-bold text-garnet uppercase">3. Hora disponible</label>
                  {fecha ? (
                    slots.length === 0 ? (
                      <p className="text-sm text-garnet/60 mt-2">Sin horarios libres ese día. Prueba otra fecha.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2 mt-2 max-h-44 overflow-y-auto">
                        {slots.map((s) => (
                          <button
                            key={s}
                            onClick={() => setHora(s)}
                            className={`border-2 rounded-full px-3 py-1 text-sm font-semibold cursor-pointer ${
                              hora === s ? 'border-mauve bg-mauve text-white' : 'border-rose-bg text-garnet hover:border-mauve'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )
                  ) : (
                    <p className="text-sm text-garnet/60 mt-2">Selecciona una fecha para ver horarios.</p>
                  )}

                  {msg && <p className="text-sm text-red-500 mt-3">{msg}</p>}
                  <button
                    onClick={onBook}
                    disabled={!hora || book.isPending}
                    className="btn-primary w-full mt-4"
                  >
                    {book.isPending ? 'Agendando...' : user ? 'Confirmar cita' : 'Ingresar para agendar'}
                  </button>
                  <p className="text-[11px] text-garnet/50 mt-2 text-center">
                    La cita se confirma al instante (demo sin pago)
                  </p>
                </>
              )}
            </div>

            <div className="card p-4 mt-4">
              <div className="font-bold text-garnet-deep text-sm mb-2 uppercase">Ubicación</div>
              <ProfessionalsMap professionals={[p]} height="200px" single />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
