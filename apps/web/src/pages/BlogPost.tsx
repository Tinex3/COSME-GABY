import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';
import { BlogPost as PostT } from '../lib/types';

export default function BlogPost() {
  const { slug } = useParams();
  const { data: post, isLoading } = useQuery({
    queryKey: ['blog-post', slug],
    queryFn: async () => (await api.get<PostT>(`/blog/${slug}`)).data,
    enabled: !!slug,
  });

  if (isLoading) return <div className="p-12 text-center text-garnet/60">Cargando artículo...</div>;
  if (!post) return <div className="p-12 text-center text-garnet/60">Artículo no encontrado.</div>;

  return (
    <div className="bg-rose-soft min-h-screen pb-12">
      <article className="max-w-3xl mx-auto px-4 pt-8">
        <Link to="/blog" className="text-sm font-semibold text-garnet hover:underline">← Volver al blog</Link>
        <h1 className="text-3xl md:text-4xl font-extrabold text-garnet-deep mt-4 uppercase leading-tight">
          {post.titulo}
        </h1>
        {post.coverUrl && (
          <img src={post.coverUrl} alt="" className="w-full h-72 object-cover rounded-2xl mt-6" />
        )}
        <div className="card p-6 md:p-8 mt-6">
          {post.body?.split('\n').map((line, i) => {
            if (!line.trim()) return <br key={i} />;
            if (line.startsWith('## ')) {
              return <h2 key={i} className="font-extrabold text-garnet-deep text-xl mt-6 mb-2">{line.slice(3)}</h2>;
            }
            return (
              <p key={i} className="text-garnet/85 leading-relaxed mb-2" dangerouslySetInnerHTML={{
                __html: line
                  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\*(.+?)\*/g, '<em>$1</em>'),
              }} />
            );
          })}
        </div>
        <div className="text-center mt-8">
          <Link to="/profesionales" className="btn-primary inline-block">Agendar con una especialista →</Link>
        </div>
      </article>
    </div>
  );
}
