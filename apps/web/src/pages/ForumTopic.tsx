import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { useState } from 'react';
import api, { fmtDateTime } from '../lib/api';
import { ForumTopic } from '../lib/types';
import { useAuth } from '../lib/auth';

export default function ForumTopicPage() {
  const { id } = useParams();
  const { user, isRole } = useAuth();
  const qc = useQueryClient();
  const [reply, setReply] = useState('');
  const [error, setError] = useState('');

  const { data: topic, isLoading } = useQuery({
    queryKey: ['forum-topic', id],
    queryFn: async () => (await api.get<ForumTopic>(`/forums/topics/${id}`)).data,
    enabled: !!id,
  });

  const sendReply = useMutation({
    mutationFn: () => api.post(`/forums/topics/${id}/replies`, { contenido: reply }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['forum-topic', id] });
      setReply('');
      setError('');
    },
    onError: (e: any) => setError(e?.response?.data?.message || 'Error al responder'),
  });

  const delTopic = useMutation({
    mutationFn: () => api.delete(`/forums/topics/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['forum-topics'] });
      window.location.href = '/foros';
    },
  });

  if (isLoading) return <div className="p-12 text-center text-garnet/60">Cargando...</div>;
  if (!topic) return <div className="p-12 text-center text-garnet/60">Tema no encontrado.</div>;

  return (
    <div className="bg-rose-soft min-h-screen pb-12">
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link to="/foros" className="text-sm font-bold text-garnet hover:underline">← Volver a foros</Link>

        <div className="card p-5 mt-4 mb-6">
          <div className="flex flex-wrap items-center gap-2 justify-between">
            <span className="text-xs font-bold uppercase text-mauve">{topic.category.nombre}</span>
            <div className="flex items-center gap-3">
              {topic.cerrado && (
                <span className="text-xs font-bold rounded-full px-3 py-1 bg-gray-100 text-gray-500">Cerrado</span>
              )}
              {isRole('ADMIN') && (
                <button onClick={() => delTopic.mutate()} className="text-xs font-bold text-red-400 hover:underline cursor-pointer">
                  Eliminar tema
                </button>
              )}
            </div>
          </div>
          <h1 className="text-2xl font-extrabold text-garnet-deep mt-2">{topic.titulo}</h1>
          <p className="text-garnet/80 mt-3 whitespace-pre-line">{topic.contenido}</p>
          <div className="text-xs text-garnet/50 mt-4">
            Por {topic.author.nombre} · {fmtDateTime(topic.createdAt)}
          </div>
        </div>

        <h2 className="font-bold text-garnet uppercase text-sm mb-3">
          Respuestas ({topic.replies?.length ?? 0})
        </h2>
        <div className="flex flex-col gap-3 mb-6">
          {(topic.replies || []).map((r) => (
            <div key={r.id} className="card p-4">
              <div className="text-sm font-bold text-garnet-deep">
                {r.author.nombre}
                <span className="text-garnet/50 font-normal"> · {fmtDateTime(r.createdAt)}</span>
              </div>
              <p className="text-sm text-garnet/80 mt-1 whitespace-pre-line">{r.contenido}</p>
            </div>
          ))}
          {(topic.replies || []).length === 0 && (
            <div className="card p-5 text-center text-garnet/60">Sin respuestas todavía.</div>
          )}
        </div>

        {user && !topic.cerrado && (
          <div className="card p-5">
            <h3 className="font-extrabold text-garnet-deep uppercase mb-3">Responder</h3>
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Escribe tu respuesta..."
              className="input min-h-[90px]"
            />
            {error && <p className="text-sm font-semibold text-red-500 mt-2">{error}</p>}
            <button
              onClick={() => sendReply.mutate()}
              disabled={!reply.trim() || sendReply.isPending}
              className="btn-primary mt-3"
            >
              {sendReply.isPending ? 'Enviando...' : 'Enviar respuesta'}
            </button>
          </div>
        )}
        {!user && (
          <div className="card p-4 text-sm text-garnet/70">
            <Link to="/login" className="font-bold text-garnet hover:underline">Inicia sesión</Link> para responder.
          </div>
        )}
      </div>
    </div>
  );
}
