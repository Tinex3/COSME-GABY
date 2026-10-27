import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import api, { fmtDateTime, DIAS, fmtClp } from '../lib/api';
import { Appointment, AvailabilityRule, AvailabilityException, Treatment, ServiceOrder } from '../lib/types';
import { useAuth } from '../lib/auth';

type Tab = 'citas' | 'ordenes' | 'disponibilidad' | 'perfil' | 'credenciales';

export default function SpecialistDashboard() {
  const { user, refresh } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('citas');

  const profile = user?.profile;

  const { data: allAppts = [] } = useQuery({
    queryKey: ['my-appointments'],
    queryFn: async () => (await api.get<Appointment[]>('/appointments/me')).data,
  });
  const appts = allAppts.filter((a) => a.vista === 'ESPECIALISTA');

  const transition = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) => api.post(`/appointments/${id}/${action}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-appointments'] }),
  });

  const now = new Date();
  const upcoming = appts.filter((a) => a.estado === 'CONFIRMADA' && new Date(a.startAt) >= now);
  const past = appts.filter((a) => !(a.estado === 'CONFIRMADA' && new Date(a.startAt) >= now));

  return (
    <div className="bg-rose-soft min-h-screen pb-12">
      <div className="max-w-5xl mx-auto px-4 pt-8">
        <span className="badge-pill">Dashboard especialista</span>
        <h1 className="text-3xl font-extrabold text-garnet-deep mt-4 mb-1 uppercase">
          {profile?.nombrePublico || user?.nombre}
        </h1>
        <p className="text-garnet/70 text-sm mb-6">
          {profile?.verificado ? '✓ Perfil verificado' : '⚠ Perfil pendiente de verificación por el administrador'}
        </p>

        <div className="flex gap-2 mb-6 flex-wrap">
          {(['citas', 'ordenes', 'disponibilidad', 'perfil', 'credenciales'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wide cursor-pointer ${
                tab === t ? 'bg-garnet text-white' : 'bg-white text-garnet border border-rose-bg hover:border-mauve'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'citas' && (
          <>
            <h2 className="font-bold text-garnet uppercase text-sm mb-3">Próximas citas ({upcoming.length})</h2>
            {upcoming.length === 0 ? (
              <div className="card p-6 text-center text-garnet/60 mb-8">No tienes citas próximas.</div>
            ) : (
              <div className="flex flex-col gap-3 mb-8">
                {upcoming.map((a) => (
                  <div key={a.id} className="card p-4 flex flex-wrap items-center gap-3 justify-between">
                    <div>
                      <div className="font-bold text-garnet-deep">{a.patient?.nombre} · {a.treatment.nombre}</div>
                      <div className="text-sm text-garnet/70">{fmtDateTime(a.startAt)} · {a.patient?.email}</div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => transition.mutate({ id: a.id, action: 'complete' })} className="btn-primary !py-1.5 !px-4 text-xs">
                        Completada
                      </button>
                      <button onClick={() => transition.mutate({ id: a.id, action: 'noshow' })} className="btn-secondary !py-1 !px-3 text-xs !border-red-300 !text-red-400 hover:!bg-red-400">
                        No presentó
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <h2 className="font-bold text-garnet uppercase text-sm mb-3">Historial</h2>
            <div className="flex flex-col gap-3">
              {past.map((a) => (
                <div key={a.id} className="card p-4 flex flex-wrap items-center justify-between opacity-80">
                  <div>
                    <div className="font-semibold text-garnet-deep">{a.patient?.nombre} · {a.treatment.nombre}</div>
                    <div className="text-sm text-garnet/60">{fmtDateTime(a.startAt)}</div>
                  </div>
                  <span className="text-xs font-bold rounded-full px-3 py-1 bg-gray-100 text-gray-500">{a.estado}</span>
                </div>
              ))}
              {past.length === 0 && <div className="card p-6 text-center text-garnet/60">Sin historial.</div>}
            </div>
          </>
        )}

        {tab === 'ordenes' && <OrdersTab />}
        {tab === 'disponibilidad' && <AvailabilityTab />}
        {tab === 'perfil' && <ProfileTab />}
        {tab === 'credenciales' && <CredentialTab />}
      </div>
    </div>
  );
}

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

function OrdersTab() {
  const qc = useQueryClient();
  const [open, setOpen] = useState<string | null>(null);
  const [comentario, setComentario] = useState('');

  const { data: allOrders = [] } = useQuery({
    queryKey: ['my-orders'],
    queryFn: async () => (await api.get<ServiceOrder[]>('/orders/me')).data,
  });
  const orders = allOrders.filter((o) => o.vista === 'ESPECIALISTA');

  const transition = useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: string }) =>
      api.post(`/orders/${id}/estado`, { estado, comentario }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-orders'] });
      qc.invalidateQueries({ queryKey: ['my-appointments'] });
      setOpen(null);
      setComentario('');
    },
  });

  return (
    <div>
      <p className="text-sm text-garnet/70 mb-4">
        Órdenes de servicio de tus citas. Flujo: Pendiente → En atención → Completada (o Cancelada).
      </p>
      {orders.length === 0 ? (
        <div className="card p-6 text-center text-garnet/60">Sin órdenes todavía.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((o) => (
            <div key={o.id} className="card p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="font-mono font-bold text-garnet-deep">{o.folio}</span>
                  <div className="text-sm text-garnet/70">
                    {o.appointment.patient.nombre} · {o.appointment.treatment.nombre} · {fmtDateTime(o.appointment.startAt)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold rounded-full px-3 py-1 ${ORDER_COLORS[o.estado]}`}>
                    {ORDER_LABELS[o.estado]}
                  </span>
                  {o.estado === 'PENDIENTE' && (
                    <button onClick={() => transition.mutate({ id: o.id, estado: 'EN_ATENCION' })} className="btn-secondary !py-1 !px-3 text-xs">
                      Iniciar atención
                    </button>
                  )}
                  {o.estado === 'EN_ATENCION' && (
                    <button onClick={() => setOpen(open === o.id ? null : o.id)} className="btn-primary !py-1 !px-3 text-xs">
                      Finalizar
                    </button>
                  )}
                  {(o.estado === 'PENDIENTE' || o.estado === 'EN_ATENCION') && (
                    <button onClick={() => transition.mutate({ id: o.id, estado: 'CANCELADA' })} className="text-xs font-bold text-red-400 hover:underline cursor-pointer">
                      Cancelar
                    </button>
                  )}
                  <button
                    onClick={() => setOpen(open === o.id ? null : o.id)}
                    className="text-xs font-bold text-garnet hover:underline cursor-pointer"
                  >
                    {open === o.id ? 'Ocultar' : 'Detalle'}
                  </button>
                </div>
              </div>

              {open === o.id && (
                <div className="mt-3 bg-rose-soft rounded-xl p-3 text-sm">
                  {o.estado === 'EN_ATENCION' && (
                    <div className="mb-3">
                      <label className="text-xs font-bold text-garnet uppercase">Nota de cierre (opcional)</label>
                      <div className="flex gap-2 mt-1">
                        <input
                          value={comentario}
                          onChange={(e) => setComentario(e.target.value)}
                          placeholder="Ej: Sesión realizada, recomendar hidratación..."
                          className="input flex-1"
                        />
                        <button
                          onClick={() => transition.mutate({ id: o.id, estado: 'COMPLETADA' })}
                          className="btn-primary !py-1.5 text-xs"
                        >
                          Completar orden
                        </button>
                      </div>
                    </div>
                  )}
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
    </div>
  );
}

function AvailabilityTab() {
  const qc = useQueryClient();
  const [rules, setRules] = useState<AvailabilityRule[]>([]);
  const [newRule, setNewRule] = useState({ diaSemana: 1, horaInicio: '10:00', horaFin: '14:00' });
  const [exForm, setExForm] = useState({ fecha: '', tipo: 'BLOQUEO', horaInicio: '', horaFin: '' });

  const { data: savedRules = [] } = useQuery({
    queryKey: ['availability-rules'],
    queryFn: async () => (await api.get<AvailabilityRule[]>('/availability/rules')).data,
  });

  useEffect(() => setRules(savedRules), [savedRules]);

  const { data: exceptions = [] } = useQuery({
    queryKey: ['availability-exceptions'],
    queryFn: async () => (await api.get<AvailabilityException[]>('/availability/exceptions')).data,
  });

  const saveRules = useMutation({
    mutationFn: () => api.patch('/availability/rules', { rules }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['availability-rules'] }),
  });

  const addEx = useMutation({
    mutationFn: () =>
      api.post('/availability/exceptions', {
        fecha: exForm.fecha,
        tipo: exForm.tipo,
        horaInicio: exForm.horaInicio || undefined,
        horaFin: exForm.horaFin || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['availability-exceptions'] });
      setExForm({ fecha: '', tipo: 'BLOQUEO', horaInicio: '', horaFin: '' });
    },
  });

  const delEx = useMutation({
    mutationFn: (id: string) => api.delete(`/availability/exceptions/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['availability-exceptions'] }),
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="card p-5">
        <h3 className="font-extrabold text-garnet-deep uppercase mb-4">Horario recurrente semanal</h3>
        <div className="flex flex-col gap-2 mb-4">
          {rules.map((r, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="font-bold text-garnet w-24">{DIAS[r.diaSemana]}</span>
              <span>{r.horaInicio} – {r.horaFin}</span>
              <button
                onClick={() => setRules(rules.filter((_, j) => j !== i))}
                className="text-red-400 font-bold ml-auto cursor-pointer"
              >✕</button>
            </div>
          ))}
          {rules.length === 0 && <p className="text-sm text-garnet/50">Sin horarios definidos.</p>}
        </div>
        <div className="flex flex-wrap gap-2 items-end bg-rose-soft rounded-xl p-3">
          <select value={newRule.diaSemana} onChange={(e) => setNewRule({ ...newRule, diaSemana: Number(e.target.value) })} className="input !w-auto">
            {[1, 2, 3, 4, 5, 6, 0].map((d) => <option key={d} value={d}>{DIAS[d]}</option>)}
          </select>
          <input type="time" value={newRule.horaInicio} onChange={(e) => setNewRule({ ...newRule, horaInicio: e.target.value })} className="input !w-auto" />
          <input type="time" value={newRule.horaFin} onChange={(e) => setNewRule({ ...newRule, horaFin: e.target.value })} className="input !w-auto" />
          <button
            onClick={() => setRules([...rules, { ...newRule, id: '' }])}
            className="btn-secondary !py-1.5 text-sm"
          >+ Agregar</button>
        </div>
        <button onClick={() => saveRules.mutate()} disabled={saveRules.isPending} className="btn-primary w-full mt-4">
          {saveRules.isPending ? 'Guardando...' : 'Guardar horario'}
        </button>
      </div>

      <div className="card p-5">
        <h3 className="font-extrabold text-garnet-deep uppercase mb-4">Excepciones (días bloqueados / extras)</h3>
        <div className="flex flex-col gap-2 mb-4">
          {exceptions.map((ex) => (
            <div key={ex.id} className="flex items-center gap-2 text-sm bg-rose-soft rounded-lg p-2">
              <span className={`text-xs font-bold rounded px-2 py-0.5 ${ex.tipo === 'BLOQUEO' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700'}`}>
                {ex.tipo === 'BLOQUEO' ? 'Bloqueo' : 'Extra'}
              </span>
              <span>{ex.fecha.slice(0, 10)} {ex.horaInicio && `· ${ex.horaInicio}-${ex.horaFin}`}</span>
              <button onClick={() => delEx.mutate(ex.id)} className="text-red-400 font-bold ml-auto cursor-pointer">✕</button>
            </div>
          ))}
          {exceptions.length === 0 && <p className="text-sm text-garnet/50">Sin excepciones.</p>}
        </div>
        <div className="flex flex-wrap gap-2 items-end bg-rose-soft rounded-xl p-3">
          <input type="date" value={exForm.fecha} onChange={(e) => setExForm({ ...exForm, fecha: e.target.value })} className="input !w-auto" />
          <select value={exForm.tipo} onChange={(e) => setExForm({ ...exForm, tipo: e.target.value })} className="input !w-auto">
            <option value="BLOQUEO">Bloqueo total</option>
            <option value="HORARIO_EXTRA">Horario extra</option>
          </select>
          {exForm.tipo === 'HORARIO_EXTRA' && (
            <>
              <input type="time" value={exForm.horaInicio} onChange={(e) => setExForm({ ...exForm, horaInicio: e.target.value })} className="input !w-auto" />
              <input type="time" value={exForm.horaFin} onChange={(e) => setExForm({ ...exForm, horaFin: e.target.value })} className="input !w-auto" />
            </>
          )}
          <button onClick={() => addEx.mutate()} disabled={!exForm.fecha || addEx.isPending} className="btn-secondary !py-1.5 text-sm">
            + Agregar
          </button>
        </div>
      </div>
    </div>
  );
}

function ProfileTab() {
  const { user, refresh } = useAuth();
  const p = user?.profile;
  const [bio, setBio] = useState('');
  const [especialidades, setEspecialidades] = useState('');
  const [comuna, setComuna] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (p) {
      setBio(p.bio || '');
      setEspecialidades((p.especialidades || []).join(', '));
      setComuna(p.comuna || '');
    }
  }, [p]);

  const { data: allTreatments = [] } = useQuery({
    queryKey: ['treatments'],
    queryFn: async () => (await api.get<Treatment[]>('/treatments')).data,
  });

  const [selected, setSelected] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (p?.offerings) setSelected(new Set(p.offerings.map((o) => o.treatment.id)));
  }, [p]);

  const save = useMutation({
    mutationFn: async () => {
      await api.patch('/professionals/me', {
        bio,
        especialidades: especialidades.split(',').map((s) => s.trim()).filter(Boolean),
        comuna,
      });
      const items = allTreatments.filter((t) => selected.has(t.id)).map((t) => ({ treatmentId: t.id }));
      await api.post('/professionals/me/offerings', { items });
    },
    onSuccess: async () => {
      setMsg('✓ Perfil guardado');
      await refresh();
    },
    onError: () => setMsg('Error al guardar'),
  });

  return (
    <div className="card p-5 max-w-xl">
      <h3 className="font-extrabold text-garnet-deep uppercase mb-4">Mi perfil público</h3>
      <div className="flex flex-col gap-3">
        <div>
          <label className="text-xs font-bold text-garnet uppercase">Bio</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} className="input mt-1 min-h-[90px]" />
        </div>
        <div>
          <label className="text-xs font-bold text-garnet uppercase">Especialidades (separadas por coma)</label>
          <input value={especialidades} onChange={(e) => setEspecialidades(e.target.value)} className="input mt-1" />
        </div>
        <div>
          <label className="text-xs font-bold text-garnet uppercase">Comuna</label>
          <input value={comuna} onChange={(e) => setComuna(e.target.value)} className="input mt-1" />
        </div>
        <div>
          <label className="text-xs font-bold text-garnet uppercase">Tratamientos que ofreces</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {allTreatments.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  const s = new Set(selected);
                  s.has(t.id) ? s.delete(t.id) : s.add(t.id);
                  setSelected(s);
                }}
                className={`border-2 rounded-full px-3 py-1 text-xs font-semibold cursor-pointer ${
                  selected.has(t.id) ? 'border-mauve bg-mauve text-white' : 'border-rose-bg text-garnet'
                }`}
              >
                {t.nombre} · {fmtClp(t.precioClp)}
              </button>
            ))}
          </div>
        </div>
        {msg && <p className="text-sm font-semibold text-garnet">{msg}</p>}
        <button onClick={() => save.mutate()} disabled={save.isPending} className="btn-primary">
          {save.isPending ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  );
}

function CredentialTab() {
  const { user, refresh } = useAuth();
  const credential = user?.profile?.credential;
  const [numero, setNumero] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (credential?.numeroRegistro) setNumero(credential.numeroRegistro);
  }, [credential]);

  const submit = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append('numeroRegistro', numero);
      if (file) fd.append('archivo', file);
      await api.post('/professionals/me/credential', fd);
    },
    onSuccess: async () => {
      setMsg('✓ Credencial enviada, pendiente de revisión');
      await refresh();
    },
    onError: () => setMsg('Error al enviar'),
  });

  return (
    <div className="card p-5 max-w-xl">
      <h3 className="font-extrabold text-garnet-deep uppercase mb-2">Certificación profesional</h3>
      <p className="text-sm text-garnet/70 mb-4">
        Sube tu registro de la Superintendencia de Salud de Chile. Un administrador lo revisará.
      </p>
      {credential && (
        <div className="bg-rose-soft rounded-xl p-3 text-sm mb-4">
          <div>Registro: <strong>{credential.numeroRegistro}</strong></div>
          <div>Estado: <strong className={credential.estado === 'APROBADO' ? 'text-emerald-600' : 'text-amber-600'}>{credential.estado}</strong></div>
          {credential.archivoUrl && (
            <a href={credential.archivoUrl} target="_blank" rel="noreferrer" className="text-garnet underline">Ver archivo</a>
          )}
        </div>
      )}
      <div className="flex flex-col gap-3">
        <input value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="N° registro Superintendencia" className="input" />
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="input text-sm" accept=".pdf,.jpg,.png" />
        {msg && <p className="text-sm font-semibold text-garnet">{msg}</p>}
        <button onClick={() => submit.mutate()} disabled={!numero || submit.isPending} className="btn-primary">
          {submit.isPending ? 'Enviando...' : 'Enviar credencial'}
        </button>
      </div>
    </div>
  );
}
