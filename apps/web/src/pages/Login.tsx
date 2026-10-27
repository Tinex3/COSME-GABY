import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import Logo from '../components/Logo';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate(params.get('next') || '/');
    } catch {
      setError('Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-rose-soft min-h-screen flex items-center justify-center px-4 py-12">
      <div className="card p-8 w-full max-w-md">
        <div className="flex justify-center mb-6"><Logo /></div>
        <h1 className="text-2xl font-extrabold text-garnet-deep text-center uppercase">Ingresar</h1>
        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold text-garnet uppercase">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input mt-1" required />
          </div>
          <div>
            <label className="text-xs font-bold text-garnet uppercase">Contraseña</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input mt-1" required />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
        <p className="text-sm text-center text-garnet/70 mt-5">
          ¿No tienes cuenta? <Link to="/registro" className="font-bold text-garnet hover:underline">Regístrate</Link>
        </p>
      </div>
    </div>
  );
}
