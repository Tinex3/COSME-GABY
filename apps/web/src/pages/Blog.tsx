import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { BlogPost as PostT } from '../lib/types';

export default function Blog() {
  const { data: posts = [] } = useQuery({
    queryKey: ['blog'],
    queryFn: async () => (await api.get<PostT[]>('/blog')).data,
  });

  return (
    <div className="bg-rose-soft min-h-screen pb-12">
      <div className="max-w-5xl mx-auto px-4 pt-8">
        <span className="badge-pill">Post informativos de piel</span>
        <h1 className="text-3xl md:text-4xl font-extrabold text-garnet-deep mt-4 mb-8 uppercase">
          Consejos de cuidado de la piel
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {posts.map((p) => (
            <Link key={p.id} to={`/blog/${p.slug}`} className="card overflow-hidden hover:shadow-lg transition-shadow group">
              <img
                src={p.coverUrl || 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&h=400&fit=crop'}
                alt=""
                className="w-full h-44 object-cover group-hover:scale-105 transition-transform"
              />
              <div className="p-4">
                <h2 className="font-extrabold text-garnet-deep leading-snug">{p.titulo}</h2>
                <p className="text-sm text-garnet/70 mt-2">{p.resumen}</p>
                <span className="text-sm font-semibold text-garnet mt-2 inline-block">leer más →</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
