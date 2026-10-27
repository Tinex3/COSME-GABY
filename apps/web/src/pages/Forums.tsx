import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import api, { fmtDateTime } from '../lib/api';
import { ForumCategory, ForumTopic } from '../lib/types';
import { useAuth } from '../lib/auth';

export default function Forums() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [catFilter, setCatFilter] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ categoryId: '', titulo: '', contenido: '' });
  const [error, setError] = useState('');

  const { data: categories = [] } = useQuery({
    queryKey: ['forum-categories'],
    queryFn: async () => (await api.get<ForumCategory[]>('/forums/categories')).data,
  });

  const { data: topics = [] } = useQuery({
    queryKey: ['forum-topics', catFilter],
    queryFn: async () =>
      (await api.get<ForumTopic[]>('/forums/topics', { params: catFilter ? { category: catFilter } : {} })).data,
  });

  const createTopic = useMutation({
    mutationFn: () => api.post('/forums/topics', form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['forum-topics'] });
      setShowForm(false);
      setForm({ categoryId: '', titulo: '', contenido: '' });
      setError('');
    },
    onError: (e: any) => setError(e?.response?.data?.message || 'Error al crear el tema'),
  });

  return (
    <div className="bg-rose-soft min-h-screen pb-12">
      <div className="max-w-4xl mx-auto px-4 pt-8">
        <span className="badge-pill">Comunidad</span>
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 mb-6">
          <h1 className="text-3xl font-extrabold text-garnet-deep uppercase">Foros de discusión</h1>
          {user && (
            <button onClick={() => setShowForm(!showForm)} className="btn-primary !py-2 !px-4 text-sm">
              {showForm ? 'Cerrar' : '+ Nuevo tema'}
            </button>
          )}
        </div>

        {!user && (
          <div className="card p-4 text-sm text-garnet/70 mb-6">
            <Link to="/login" className="font-bold text-garnet hover:underline">Inicia sesión</Link> para crear temas y responder.
          </div>
        )}

        {showForm && (
          <div className="card p-5 mb-6">
            <h3 className="font-extrabold text-garnet-deep uppercase mb-4">Nuevo tema</h3>
            <div className="flex flex-col gap-3">
              <select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="input"
              >
                <option value="">Selecciona una categoría...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
              <input
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                placeholder="Título del tema"
                className="input"
              />
              <textarea
                value={form.contenido}
                onChange={(e) => setForm({ ...form, contenido: e.target.value })}
                placeholder="Escribe tu pregunta o comentario..."
                className="input min-h-[100px]"
              />
              {error && <p className="text-sm font-semibold text-red-500">{error}</p>}
              <button
                onClick={() => createTopic.mutate()}
                disabled={!form.categoryId || !form.titulo || !form.contenido || createTopic.isPending}
                className="btn-primary"
              >
                {createTopic.isPending ? 'Publicando...' : 'Publicar tema'}
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setCatFilter('')}
            className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase cursor-pointer ${
              !catFilter ? 'bg-garnet text-white' : 'bg-white text-garnet border border-rose-bg hover:border-mauve'
            }`}
          >
            Todas
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCatFilter(c.slug)}
              className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase cursor-pointer ${
                catFilter === c.slug ? 'bg-garnet text-white' : 'bg-white text-garnet border border-rose-bg hover:border-mauve'
              }`}
            >
              {c.nombre} ({c._count?.topics ?? 0})
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          {topics.map((t) => (
            <Link key={t.id} to={`/foros/${t.id}`} className="card p-4 hover:border-mauve transition-colors">
              <div className="flex flex-wrap items-center gap-2 justify-between">
                <div className="font-bold text-garnet-deep">{t.titulo}</div>
                {t.cerrado && (
                  <span className="text-xs font-bold rounded-full px-3 py-1 bg-gray-100 text-gray-500">Cerrado</span>
                )}
              </div>
              <p className="text-sm text-garnet/70 mt-1 line-clamp-2">{t.contenido}</p>
              <div className="text-xs text-garnet/50 mt-2">
                {t.category.nombre} · por {t.author.nombre} · {fmtDateTime(t.createdAt)} · {t._count?.replies ?? 0} respuesta{(t._count?.replies ?? 0) === 1 ? '' : 's'}
              </div>
            </Link>
          ))}
          {topics.length === 0 && (
            <div className="card p-6 text-center text-garnet/60">No hay temas todavía. ¡Sé el primero en comentar!</div>
          )}
        </div>
      </div>
    </div>
  );
}
