import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import api from '../lib/api';
import { ProfessionalProfile, BlogPost } from '../lib/types';
import ProfessionalCard from '../components/ProfessionalCard';
import ProfessionalsMap from '../components/ProfessionalsMap';

export default function Home() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const { data: pros = [] } = useQuery({
    queryKey: ['home-professionals'],
    queryFn: async () => (await api.get<ProfessionalProfile[]>('/professionals')).data,
  });
  const { data: posts = [] } = useQuery({
    queryKey: ['home-blog'],
    queryFn: async () => (await api.get<BlogPost[]>('/blog')).data,
  });

  return (
    <div>
      <section className="bg-gradient-to-b from-rose-bg to-rose-soft pt-8 pb-12">
        <div className="max-w-7xl mx-auto px-4">
          <form
            onSubmit={(e) => { e.preventDefault(); navigate(`/profesionales?q=${encodeURIComponent(q)}`); }}
            className="flex justify-center mb-8"
          >
            <div className="flex items-center gap-2 w-full max-w-2xl">
              <div className="flex items-center flex-1 border-2 border-mauve/40 rounded-full overflow-hidden bg-white shadow-sm">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar profesional o tratamiento..."
                  className="flex-1 px-5 py-3 focus:outline-none"
                />
                <span className="px-3 text-sm font-semibold text-garnet border-l border-rose-bg whitespace-nowrap">
                  📍 Cerca de mí
                </span>
              </div>
              <button type="submit" className="btn-primary !py-3">BUSCAR</button>
            </div>
          </form>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <span className="badge-pill">Profesionales para agendar</span>
              <h1 className="text-3xl md:text-4xl font-extrabold text-garnet-deep mt-4 mb-6 uppercase leading-tight">
                Encuentra aquí tu cosmetóloga ideal
              </h1>
              <div className="flex gap-5 overflow-x-auto pb-4 -mx-1 px-1">
                {pros.slice(0, 4).map((p) => (
                  <ProfessionalCard key={p.id} p={p} />
                ))}
              </div>
              <Link to="/profesionales" className="btn-secondary inline-block mt-4">
                Ver todas las profesionales →
              </Link>
            </div>

            <aside>
              <span className="badge-pill">Post informativos de piel</span>
              <h2 className="text-2xl font-extrabold text-garnet-deep mt-4 mb-4 uppercase leading-tight">
                Consejos de cuidado de la piel (Blog)
              </h2>
              <div className="flex flex-col gap-3">
                {posts.slice(0, 3).map((post) => (
                  <Link key={post.id} to={`/blog/${post.slug}`} className="card p-3 flex gap-3 hover:shadow-lg transition-shadow">
                    <img
                      src={post.coverUrl || 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=200&h=200&fit=crop'}
                      alt=""
                      className="w-20 h-20 object-cover rounded-xl flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-garnet-deep leading-snug">{post.titulo}</h3>
                      <p className="text-xs text-garnet/70 mt-1 line-clamp-3">{post.resumen.slice(0, 110)}... <span className="text-garnet font-semibold">leer más</span></p>
                    </div>
                  </Link>
                ))}
              </div>
            </aside>
          </div>

          <div className="mt-10">
            <div className="card p-4">
              <div className="font-bold text-garnet-deep mb-2 text-sm uppercase tracking-wide">
                💜 Citas disponibles en tu zona
              </div>
              <ProfessionalsMap professionals={pros} height="280px" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
