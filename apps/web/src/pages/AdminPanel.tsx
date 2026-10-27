import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import api, { fmtDateTime, fmtClp } from '../lib/api';
import { ServiceOrder } from '../lib/types';

type Tab = 'dashboard' | 'usuarios' | 'blog' | 'especialistas' | 'ordenes' | 'resenas';

interface AdminMetrics {
  users: number; specialists: number; verified: number;
  appointments: number; completed: number; reviews: number; pendingCredentials: number;
}

interface Kpis {
  resumen: {
    users: number; specialists: number; verified: number;
    appointments: number; completed: number; cancelled: number;
    pendingCredentials: number; orders: number; usersNew30: number;
    proximas: number; tasaCompletado: number; promedioResenas: number; totalResenas: number;
  };
  citasPorDia: { fecha: string; total: number; completadas: number }[];
  ordenesPorEstado: Record<string, number>;
  topEspecialistas: { nombre: string; citas: number; resenas: number; promedio: number }[];
}

interface UserRow {
  id: string; email: string; nombre: string; roles: string[]; createdAt: string;
  profile?: {
    id: string; nombrePublico: string; comuna: string; verificado: boolean;
    credential?: { numeroRegistro: string; estado: string } | null;
  } | null;
}

interface ReviewRow {
  id: string; rating: number; texto: string; createdAt: string;
  patient?: { nombre: string }; professional?: { nombrePublico: string };
}

interface BlogRow {
  id: string; titulo: string; slug: string; resumen: string; body: string;
  coverUrl?: string | null; publicado: boolean; createdAt: string;
}

const ORDER_COLORS: Record<string, string> = {
  PENDIENTE: '#f59e0b',
  EN_ATENCION: '#6366f1',
  COMPLETADA: '#10b981',
  CANCELADA: '#9ca3af',
};

const ORDER_LABELS: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  EN_ATENCION: 'En atención',
  COMPLETADA: 'Completada',
  CANCELADA: 'Cancelada',
};

export default function AdminPanel() {
  const [tab, setTab] = useState<Tab>('dashboard');

  return (
    <div className="bg-rose-soft min-h-screen pb-12">
      <div className="max-w-6xl mx-auto px-4 pt-8">
        <span className="badge-pill">SuperAdmin</span>
        <h1 className="text-3xl font-extrabold text-garnet-deep mt-4 mb-6 uppercase">Panel de administración</h1>

        <div className="flex gap-2 mb-6 flex-wrap">
          {(['dashboard', 'usuarios', 'blog', 'especialistas', 'ordenes', 'resenas'] as Tab[]).map((t) => (
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

        {tab === 'dashboard' && <DashboardTab />}
        {tab === 'usuarios' && <UsersTab />}
        {tab === 'blog' && <BlogTab />}
        {tab === 'especialistas' && <SpecialistsTab />}
        {tab === 'ordenes' && <OrdersTab />}
        {tab === 'resenas' && <ReviewsTab />}
      </div>
    </div>
  );
}

function DashboardTab() {
  const { data: kpis, isLoading } = useQuery({
    queryKey: ['admin-kpis'],
    queryFn: async () => (await api.get<Kpis>('/admin/kpis')).data,
  });

  if (isLoading || !kpis) return <div className="card p-6 text-center text-garnet/60">Cargando indicadores...</div>;

  const { resumen: r, citasPorDia, ordenesPorEstado, topEspecialistas } = kpis;
  const pieData = Object.entries(ordenesPorEstado).map(([estado, value]) => ({
    name: ORDER_LABELS[estado] || estado,
    value,
  }));

  const stats = [
    { label: 'Usuarios totales', value: r.users },
    { label: 'Usuarios nuevos (30d)', value: r.usersNew30 },
    { label: 'Especialistas', value: r.specialists },
    { label: 'Verificados', value: r.verified },
    { label: 'Citas totales', value: r.appointments },
    { label: 'Próximas citas', value: r.proximas },
    { label: 'Tasa de completado', value: `${r.tasaCompletado}%` },
    { label: 'Órdenes de servicio', value: r.orders },
    { label: 'Reseñas', value: r.totalResenas },
    { label: 'Promedio reseñas', value: r.promedioResenas || '—' },
    { label: 'Citas canceladas', value: r.cancelled },
    { label: 'Credenciales pendientes', value: r.pendingCredentials },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((m) => (
          <div key={m.label} className="card p-4 text-center">
            <div className="text-3xl font-extrabold text-garnet">{m.value}</div>
            <div className="text-xs font-bold text-garnet/60 uppercase mt-1">{m.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="font-extrabold text-garnet-deep uppercase mb-4">Citas por día (últimos 14 días)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={citasPorDia}>
              <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" name="Citas" fill="#6b7280" radius={[4, 4, 0, 0]} />
              <Bar dataKey="completadas" name="Completadas" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="font-extrabold text-garnet-deep uppercase mb-4">Órdenes por estado</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                {pieData.map((d, i) => (
                  <Cell key={i} fill={ORDER_COLORS[Object.keys(ordenesPorEstado)[i]] || '#6366f1'} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-extrabold text-garnet-deep uppercase mb-4">Top especialistas</h3>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={topEspecialistas}>
            <XAxis dataKey="nombre" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="citas" name="Citas" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="resenas" name="Reseñas" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          {topEspecialistas.map((t) => (
            <div key={t.nombre} className="flex justify-between bg-rose-soft rounded-lg px-3 py-2">
              <span className="font-semibold text-garnet-deep">{t.nombre}</span>
              <span className="text-garnet/70">
                {t.citas} citas · {t.resenas} reseñas · ★ {t.promedio || '—'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function UsersTab() {
  const qc = useQueryClient();
  const { data: users = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => (await api.get<UserRow[]>('/admin/users')).data,
  });

  const verify = useMutation({
    mutationFn: ({ profileId, approved }: { profileId: string; approved: boolean }) =>
      api.post(`/admin/profiles/${profileId}/verify`, { approved }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      qc.invalidateQueries({ queryKey: ['admin-kpis'] });
    },
  });

  return (
    <div className="card p-5 overflow-x-auto">
      <h2 className="font-extrabold text-garnet-deep uppercase mb-4">Usuarios y verificación de especialistas</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-garnet/60 border-b border-rose-bg">
            <th className="py-2 pr-3">Nombre</th>
            <th className="py-2 pr-3">Email</th>
            <th className="py-2 pr-3">Roles</th>
            <th className="py-2 pr-3">Estado perfil</th>
            <th className="py-2">Acción</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b border-rose-bg/50">
              <td className="py-2 pr-3 font-semibold text-garnet-deep">{u.nombre}</td>
              <td className="py-2 pr-3 text-garnet/70">{u.email}</td>
              <td className="py-2 pr-3 text-xs">{u.roles.join(', ')}</td>
              <td className="py-2 pr-3">
                {u.profile ? (
                  <span className={`text-xs font-bold ${u.profile.verificado ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {u.profile.verificado ? '✓ Verificado' : '⚠ Pendiente'}
                    {u.profile.credential && ` · reg. ${u.profile.credential.numeroRegistro} (${u.profile.credential.estado})`}
                  </span>
                ) : '—'}
              </td>
              <td className="py-2">
                {u.profile && (
                  <div className="flex gap-2">
                    {!u.profile.verificado && (
                      <button onClick={() => verify.mutate({ profileId: u.profile!.id, approved: true })} className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer">
                        Aprobar
                      </button>
                    )}
                    {u.profile.verificado && (
                      <button onClick={() => verify.mutate({ profileId: u.profile!.id, approved: false })} className="text-xs font-bold text-red-400 hover:underline cursor-pointer">
                        Revocar
                      </button>
                    )}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BlogTab() {
  const qc = useQueryClient();
  const empty = { titulo: '', resumen: '', body: '', coverUrl: '', publicado: true };
  const [form, setForm] = useState({ ...empty });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  const { data: posts = [] } = useQuery({
    queryKey: ['admin-blog'],
    queryFn: async () => (await api.get<BlogRow[]>('/blog/all/admin')).data,
  });

  const save = useMutation({
    mutationFn: () =>
      editingId ? api.patch(`/blog/${editingId}`, form) : api.post('/blog', form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-blog'] });
      qc.invalidateQueries({ queryKey: ['blog'] });
      setForm({ ...empty });
      setEditingId(null);
      setMsg('✓ Artículo guardado');
    },
    onError: () => setMsg('Error al guardar'),
  });

  const del = useMutation({
    mutationFn: (id: string) => api.delete(`/blog/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-blog'] }),
  });

  const toggle = useMutation({
    mutationFn: (p: BlogRow) => api.patch(`/blog/${p.id}`, { ...p, publicado: !p.publicado }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-blog'] }),
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="card p-5">
        <h3 className="font-extrabold text-garnet-deep uppercase mb-4">
          {editingId ? 'Editar artículo' : 'Nuevo artículo'}
        </h3>
        <div className="flex flex-col gap-3">
          <input
            value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            placeholder="Título"
            className="input"
          />
          <input
            value={form.resumen}
            onChange={(e) => setForm({ ...form, resumen: e.target.value })}
            placeholder="Resumen (breve descripción)"
            className="input"
          />
          <textarea
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            placeholder="Contenido del artículo..."
            className="input min-h-[160px]"
          />
          <input
            value={form.coverUrl}
            onChange={(e) => setForm({ ...form, coverUrl: e.target.value })}
            placeholder="URL de imagen de portada (opcional)"
            className="input"
          />
          <label className="flex items-center gap-2 text-sm font-semibold text-garnet cursor-pointer">
            <input
              type="checkbox"
              checked={form.publicado}
              onChange={(e) => setForm({ ...form, publicado: e.target.checked })}
            />
            Publicado (visible en el blog)
          </label>
          {msg && <p className="text-sm font-semibold text-garnet">{msg}</p>}
          <div className="flex gap-3">
            <button
              onClick={() => save.mutate()}
              disabled={!form.titulo || !form.body || save.isPending}
              className="btn-primary flex-1"
            >
              {save.isPending ? 'Guardando...' : 'Guardar'}
            </button>
            {editingId && (
              <button
                onClick={() => { setEditingId(null); setForm({ ...empty }); setMsg(''); }}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-extrabold text-garnet-deep uppercase mb-4">Artículos ({posts.length})</h3>
        <div className="flex flex-col gap-2">
          {posts.map((p) => (
            <div key={p.id} className="bg-rose-soft rounded-xl p-3 text-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-bold text-garnet-deep">{p.titulo}</span>
                  <span className={`text-xs font-bold ml-2 ${p.publicado ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {p.publicado ? '✓ Publicado' : 'BORRADOR'}
                  </span>
                  <div className="text-xs text-garnet/50 mt-1">{fmtDateTime(p.createdAt)}</div>
                </div>
                <div className="flex gap-2 whitespace-nowrap">
                  <button
                    onClick={() => { setEditingId(p.id); setForm({ titulo: p.titulo, resumen: p.resumen, body: p.body, coverUrl: p.coverUrl || '', publicado: p.publicado }); }}
                    className="text-xs font-bold text-garnet hover:underline cursor-pointer"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => toggle.mutate(p)}
                    className="text-xs font-bold text-mauve hover:underline cursor-pointer"
                  >
                    {p.publicado ? 'Ocultar' : 'Publicar'}
                  </button>
                  <button
                    onClick={() => del.mutate(p.id)}
                    className="text-xs font-bold text-red-400 hover:underline cursor-pointer"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
          {posts.length === 0 && <p className="text-sm text-garnet/50">Sin artículos.</p>}
        </div>
      </div>
    </div>
  );
}

function SpecialistsTab() {
  const qc = useQueryClient();
  const empty = {
    email: '', password: '', nombre: '', comuna: 'Viña del Mar',
    titulo: 'Cosmetóloga', bio: '', especialidades: '', verificado: true,
  };
  const [form, setForm] = useState({ ...empty });
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const create = useMutation({
    mutationFn: () =>
      api.post('/admin/specialists', {
        ...form,
        especialidades: form.especialidades.split(',').map((s) => s.trim()).filter(Boolean),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      qc.invalidateQueries({ queryKey: ['admin-kpis'] });
      qc.invalidateQueries({ queryKey: ['professionals'] });
      setForm({ ...empty });
      setErr('');
      setMsg('✓ Especialista creado y verificado. Ya puede iniciar sesión.');
    },
    onError: (e: any) => {
      setMsg('');
      setErr(e?.response?.data?.message || 'Error al crear');
    },
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="card p-5">
        <h3 className="font-extrabold text-garnet-deep uppercase mb-4">Crear nuevo cosmetólogo/a</h3>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre completo" className="input" />
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="input" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Contraseña (mín. 6)" className="input" />
            <input value={form.comuna} onChange={(e) => setForm({ ...form, comuna: e.target.value })} placeholder="Comuna" className="input" />
          </div>
          <input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Título (ej: Cosmetóloga, Esteticista)" className="input" />
          <input value={form.especialidades} onChange={(e) => setForm({ ...form, especialidades: e.target.value })} placeholder="Especialidades, separadas por coma" className="input" />
          <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Biografía pública..." className="input min-h-[80px]" />
          <label className="flex items-center gap-2 text-sm font-semibold text-garnet cursor-pointer">
            <input type="checkbox" checked={form.verificado} onChange={(e) => setForm({ ...form, verificado: e.target.checked })} />
            Marcar como verificado
          </label>
          {msg && <p className="text-sm font-semibold text-emerald-600">{msg}</p>}
          {err && <p className="text-sm font-semibold text-red-500">{err}</p>}
          <button
            onClick={() => create.mutate()}
            disabled={!form.nombre || !form.email || !form.password || create.isPending}
            className="btn-primary"
          >
            {create.isPending ? 'Creando...' : 'Crear especialista'}
          </button>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-extrabold text-garnet-deep uppercase mb-2">Cómo funciona</h3>
        <ul className="text-sm text-garnet/70 list-disc pl-5 space-y-2">
          <li>Se crea un usuario con roles PACIENTE + ESPECIALISTA.</li>
          <li>Recibe su cuenta con el email y la contraseña que indiques.</li>
          <li>Puede iniciar sesión de inmediato y completar su perfil (bio, tratamientos, horario).</li>
          <li>Si lo marcas como verificado, aparece con sello ✓ en el catálogo público.</li>
          <li>Las credenciales de Superintendencia las sube ella desde su panel.</li>
        </ul>
      </div>
    </div>
  );
}

function OrdersTab() {
  const qc = useQueryClient();
  const { data: orders = [] } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => (await api.get<ServiceOrder[]>('/orders/all')).data,
  });

  const transition = useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: string }) =>
      api.post(`/orders/${id}/estado`, { estado, comentario: 'Actualizada por administración' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-orders'] }),
  });

  return (
    <div className="card p-5 overflow-x-auto">
      <h2 className="font-extrabold text-garnet-deep uppercase mb-4">Órdenes de servicio ({orders.length})</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-garnet/60 border-b border-rose-bg">
            <th className="py-2 pr-3">Folio</th>
            <th className="py-2 pr-3">Tratamiento</th>
            <th className="py-2 pr-3">Paciente</th>
            <th className="py-2 pr-3">Especialista</th>
            <th className="py-2 pr-3">Fecha cita</th>
            <th className="py-2 pr-3">Estado</th>
            <th className="py-2">Acción</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-b border-rose-bg/50">
              <td className="py-2 pr-3 font-mono font-bold text-garnet-deep">{o.folio}</td>
              <td className="py-2 pr-3">{o.appointment.treatment.nombre}</td>
              <td className="py-2 pr-3 text-garnet/70">{o.appointment.patient.nombre}</td>
              <td className="py-2 pr-3 text-garnet/70">{o.appointment.professional.user?.nombre}</td>
              <td className="py-2 pr-3 text-garnet/70">{fmtDateTime(o.appointment.startAt)}</td>
              <td className="py-2 pr-3">
                <span
                  className="text-xs font-bold rounded-full px-3 py-1"
                  style={{ backgroundColor: `${ORDER_COLORS[o.estado]}22`, color: ORDER_COLORS[o.estado] }}
                >
                  {ORDER_LABELS[o.estado]}
                </span>
              </td>
              <td className="py-2">
                <div className="flex gap-2">
                  {o.estado === 'PENDIENTE' && (
                    <button onClick={() => transition.mutate({ id: o.id, estado: 'EN_ATENCION' })} className="text-xs font-bold text-indigo-500 hover:underline cursor-pointer">
                      Iniciar
                    </button>
                  )}
                  {o.estado === 'EN_ATENCION' && (
                    <button onClick={() => transition.mutate({ id: o.id, estado: 'COMPLETADA' })} className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer">
                      Completar
                    </button>
                  )}
                  {(o.estado === 'PENDIENTE' || o.estado === 'EN_ATENCION') && (
                    <button onClick={() => transition.mutate({ id: o.id, estado: 'CANCELADA' })} className="text-xs font-bold text-red-400 hover:underline cursor-pointer">
                      Cancelar
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr><td colSpan={7} className="py-6 text-center text-garnet/50">Sin órdenes.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function ReviewsTab() {
  const qc = useQueryClient();
  const { data: reviews = [] } = useQuery({
    queryKey: ['admin-reviews'],
    queryFn: async () => (await api.get<ReviewRow[]>('/admin/reviews')).data,
  });

  const delReview = useMutation({
    mutationFn: (id: string) => api.delete(`/reviews/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-reviews'] }),
  });

  return (
    <div className="card p-5">
      <h2 className="font-extrabold text-garnet-deep uppercase mb-4">Moderación de reseñas</h2>
      <div className="flex flex-col gap-2">
        {reviews.map((r) => (
          <div key={r.id} className="flex items-center gap-3 bg-rose-soft rounded-xl p-3 text-sm">
            <span className="text-mauve font-bold">{'★'.repeat(r.rating)}</span>
            <div className="flex-1 min-w-0">
              <span className="font-semibold text-garnet-deep">{r.professional?.nombrePublico}</span>
              <span className="text-garnet/60"> · por {r.patient?.nombre} · {fmtDateTime(r.createdAt)}</span>
              <p className="text-garnet/80 truncate">{r.texto}</p>
            </div>
            <button onClick={() => delReview.mutate(r.id)} className="text-xs font-bold text-red-400 hover:underline cursor-pointer whitespace-nowrap">
              Eliminar
            </button>
          </div>
        ))}
        {reviews.length === 0 && <p className="text-sm text-garnet/50">Sin reseñas.</p>}
      </div>
    </div>
  );
}
