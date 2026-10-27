import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ReactNode, useState } from 'react';
import Logo from './Logo';
import { useAuth } from '../lib/auth';

const NAV = [
  { to: '/profesionales', label: 'PROFESIONALES' },
  { to: '/tratamientos', label: 'TRATAMIENTOS' },
  { to: '/blog', label: 'BLOG' },
  { to: '/foros', label: 'FOROS' },
  { to: '/ubicacion', label: 'UBICACIÓN' },
];

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout, isRole } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState('');

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/profesionales?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-rose-bg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center gap-4">
          <Link to="/">
            <Logo compact />
          </Link>
          <nav className="hidden md:flex items-center gap-5 ml-auto mr-2">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  `text-sm font-bold tracking-wide ${isActive ? 'text-garnet' : 'text-garnet-deep/80 hover:text-garnet'}`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
          <form onSubmit={onSearch} className="flex items-center gap-2 flex-1 min-w-[240px] md:max-w-md">
            <div className="flex items-center flex-1 border-2 border-rose-bg rounded-full overflow-hidden bg-white">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar profesional o tratamiento..."
                className="flex-1 px-4 py-2 text-sm focus:outline-none"
              />
              <span className="px-2 text-xs font-semibold text-garnet whitespace-nowrap border-l border-rose-bg">
                📍 Cerca de mí
              </span>
            </div>
            <button type="submit" className="btn-primary !px-5 !py-2 text-sm">
              BUSCAR
            </button>
          </form>
          <div className="flex items-center gap-2 ml-auto md:ml-0">
            {user ? (
              <>
                {isRole('ADMIN') && (
                  <Link to="/admin" className="text-xs font-bold text-garnet hover:underline">Admin</Link>
                )}
                {isRole('ESPECIALISTA') && (
                  <Link to="/panel/especialista" className="text-xs font-bold text-garnet hover:underline">
                    Mi panel
                  </Link>
                )}
                {isRole('PACIENTE') && (
                  <Link to="/panel/paciente" className="text-xs font-bold text-garnet hover:underline">
                    Mis citas
                  </Link>
                )}
                <button
                  onClick={() => { logout(); navigate('/'); }}
                  className="text-xs font-bold text-garnet/60 hover:text-garnet"
                >
                  Salir
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-secondary !py-1.5 !px-4 text-sm">Ingresar</Link>
                <Link to="/registro" className="btn-primary !py-1.5 !px-4 text-sm">Registrarse</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-garnet text-white/90 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="font-extrabold text-xl text-white">COSMETIA BELLEZA</div>
            <p className="text-sm text-white/70 mt-1">Tu cosme está aquí!</p>
          </div>
          <div className="text-sm">
            <div className="font-bold mb-2">Enlaces</div>
            <div className="flex flex-col gap-1 text-white/70">
              {NAV.map((n) => (
                <Link key={n.to} to={n.to} className="hover:text-white">{n.label}</Link>
              ))}
            </div>
          </div>
          <div className="text-sm">
            <div className="font-bold mb-2">Contacto</div>
            <p className="text-white/70">Viña del Mar · Valparaíso · Chile</p>
            <p className="text-white/70">hola@cosmetiabelleza.com</p>
          </div>
        </div>
        <div className="border-t border-white/15 text-center text-xs py-3 text-white/60">
          www.cosmetiabelleza.com
        </div>
      </footer>
    </div>
  );
}
