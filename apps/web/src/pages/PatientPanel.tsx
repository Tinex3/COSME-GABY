import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { useState } from 'react';
import api, { fmtDateTime, fmtClp } from '../lib/api';
import { Appointment, ServiceOrder } from '../lib/types';

const ESTADO_COLORS: Record<string, string> = {
  CONFIRMADA: 'bg-emerald-100 text-emerald-700',
  COMPLETADA: 'bg-blue-100 text-blue-700',
  CANCELADA: 'bg-gray-100 text-gray-500',
  NO_PRESENTADO: 'bg-red-100 text-red-600',
};

const ORDER_COLORS: Record<string, string> = {
  PENDIENTE: 'bg-amber-100 text-amber-700',
  EN_ATENCION: 'bg-indigo-100 text-indigo-700',
  COMPLETADA: 'bg-emerald-100 text-emerald-700',
  CANCELADA: 'bg-gray-100 text-gray-500',
};

const ORDER_LABELS: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  EN_ATENCION: 'En atención',
  COMPLETADA: 'Completada',
  CANCELADA: 'Cancelada',
};

export default function PatientPanel() {
  const qc = useQueryClient();
  const [params] = useSearchParams();
  const justBooked = params.get('ok');
  const [reviewFor, setReviewFor] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [texto, setTexto] = useState('');
  const [orderOpen, setOrderOpen] = useState<string | null>(null);

  const { data: allAppts = [] } = useQuery({
    queryKey: ['my-appointments'],
    queryFn: async () => (await api.get<Appointment[]>('/appointments/me')).data,
  });
  const appts = allAppts.filter((a) => a.vista !== 'ESPECIALISTA');

  const { data: orders = [] } = useQuery({
    queryKey: ['my-orders'],
    queryFn: async () => (await api.get<ServiceOrder[]>('/orders/me')).data,
  });
  const myOrders = orders.filter((o) => o.vista !== 'ESPECIALISTA');

  const cancel = useMutation({
    mutationFn: (id: string) => api.post(`/appointments/${id}/cancel`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-appointments'] }),
  });

  const sendReview = useMutation({
    mutationFn: () => api.post('/reviews', { appointmentId: reviewFor, rating, texto }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-appointments'] });
      setReviewFor(null);
      setTexto('');
    },
  });

  const now = new Date();
  const upcoming = appts.filter((a) => a.estado === 'CONFIRMADA' && new Date(a.startAt) >= now);
  const past = appts.filter((a) => !(a.estado === 'CONFIRMADA' && new Date(a.startAt) >= now));

  return (
    <div className="bg-rose-soft min-h-screen pb-12">
      <div className="max-w-4xl mx-auto px-4 pt-8">
        <span className="badge-pill">Portal paciente</span>
        <h1 className="text-3xl font-extrabold text-garnet-deep mt-4 mb-6 uppercase">Mis citas</h1>

        {justBooked && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl p-4 mb-6 font-semibold">
            ✓ ¡Cita confirmada! La ves en "Próximas citas".
          </div>
        )}

        <h2 className="font-bold text-garnet uppercase text-sm mb-3">Próximas citas</h2>
        {upcoming.length === 0 ? (
          <div className="card p-6 text-center text-garnet/60 mb-8">
            No tienes citas próximas. <Link to="/profesionales" className="font-bold text-garnet hover:underline">Agenda una →</Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3 mb-8">
            {upcoming.map((a) => (
              <div key={a.id} className="card p-4 flex flex-wrap items-center gap-3 justify-between">
                <div>
                  <div className="font-bold text-garnet-deep">{a.treatment.nombre}</div>
                  <div className="text-sm text-garnet/70">
                    {a.professional?.user?.nombre} · {fmtDateTime(a.startAt)} · {a.treatment.duracionMin} min
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold rounded-full px-3 py-1 ${ESTADO_COLORS[a.estado]}`}>{a.estado}</span>
                  <button
                    onClick={() => cancel.mutate(a.id)}
                    disabled={cancel.isPending}
                    className="text-xs font-bold text-red-400 hover:text-red-600 cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <h2 className="font-bold text-garnet uppercase text-sm mb-3">Mis órdenes de servicio</h2>
        {myOrders.length === 0 ? (
          <div className="card p-6 text-center text-garnet/60 mb-8">Sin órdenes. Se generan automáticamente al agendar una cita.</div>
        ) : (
          <div className="flex flex-col gap-2 mb-8">
            {myOrders.map((o) => (
              <div key={o.id} className="card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-mono font-bold text-garnet-deep">{o.folio}</span>
                    <span className="text-sm text-garnet/70 ml-3">
                      {o.appointment.treatment.nombre} · {fmtDateTime(o.appointment.startAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold rounded-full px-3 py-1 ${ORDER_COLORS[o.estado]}`}>
                      {ORDER_LABELS[o.estado]}
                    </span>
                    <button
                      onClick={() => setOrderOpen(orderOpen === o.id ? null : o.id)}
                      className="text-xs font-bold text-garnet hover:underline cursor-pointer"
                    >
                      {orderOpen === o.id ? 'Ocultar detalle' : 'Ver detalle'}
                    </button>
                  </div>
                </div>
                {orderOpen === o.id && (
                  <div className="mt-3 bg-rose-soft rounded-xl p-3 text-sm">
                    <div className="text-garnet/70 mb-2">
                      Precio: <strong>{fmtClp(o.appointment.treatment.precioClp)}</strong>
                    </div>
                    <div className="font-bold text-garnet text-xs uppercase mb-1">Historial</div>
                    {o.events.map((e) => (
                      <div key={e.id} className="flex gap-2 text-xs text-garnet/70 py-0.5">
                        <span className="font-mono text-garnet/50">{fmtDateTime(e.createdAt)}</span>
                        <span className="font-bold">{ORDER_LABELS[e.estado] || e.estado}</span>
                        <span>— {e.comentario}</span>
                        {e.actor && <span className="text-garnet/50">({e.actor.nombre})</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <h2 className="font-bold text-garnet uppercase text-sm mb-3">Historial</h2>
        {past.length === 0 ? (
          <div className="card p-6 text-center text-garnet/60">Sin citas anteriores.</div>
        ) : (
          <div className="flex flex-col gap-3">
            {past.map((a) => (
              <div key={a.id} className="card p-4 flex flex-wrap items-center gap-3 justify-between">
                <div>
                  <div className="font-bold text-garnet-deep">{a.treatment.nombre}</div>
                  <div className="text-sm text-garnet/70">
                    {a.professional?.user?.nombre} · {fmtDateTime(a.startAt)}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold rounded-full px-3 py-1 ${ESTADO_COLORS[a.estado]}`}>{a.estado}</span>
                  {a.estado === 'COMPLETADA' && !a.review && (
                    <button
                      onClick={() => setReviewFor(a.id)}
                      className="btn-primary !py-1 !px-3 text-xs cursor-pointer"
                    >
                      Dejar reseña
                    </button>
                  )}
                  {a.review && <span className="text-xs text-garnet/50 font-semibold">✓ Reseñada</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {reviewFor && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000] p-4">
          <div className="card p-6 w-full max-w-md">
            <h3 className="font-extrabold text-garnet-deep uppercase mb-4">Dejar reseña</h3>
            <div className="flex gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  onClick={() => setRating(i)}
                  className={`text-3xl cursor-pointer ${i <= rating ? 'text-mauve' : 'text-mauve/25'}`}
                >
                  ★
                </button>
              ))}
            </div>
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Cuéntanos cómo fue tu experiencia..."
              className="input min-h-[100px]"
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => sendReview.mutate()} disabled={sendReview.isPending} className="btn-primary flex-1">
                Enviar
              </button>
              <button onClick={() => setReviewFor(null)} className="btn-secondary flex-1">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
