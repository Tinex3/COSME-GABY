import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import Logo from '../components/Logo';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [soyEspecialista, setSoyEspecialista] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register({
        nombre,
        email,
        password,
        roles: soyEspecialista ? ['PACIENTE', 'ESPECIALISTA'] : ['PACIENTE'],
      });
      navigate(soyEspecialista ? '/panel/especialista' : '/');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'No se pudo registrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-rose-soft min-h-screen flex items-center justify-center px-4 py-12">
      <div className="card p-8 w-full max-w-md">
        <div className="flex justify-center mb-6"><Logo /></div>
        <h1 className="text-2xl font-extrabold text-garnet-deep text-center uppercase">Crear cuenta</h1>
        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold text-garnet uppercase">Nombre</label>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} className="input mt-1" required />
          </div>
          <div>
            <label className="text-xs font-bold text-garnet uppercase">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input mt-1" required />
          </div>
          <div>
            <label className="text-xs font-bold text-garnet uppercase">Contraseña (mín. 6)</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input mt-1" minLength={6} required />
          </div>
          <label className="flex items-center gap-2 text-sm text-garnet font-medium cursor-pointer">
            <input type="checkbox" checked={soyEspecialista} onChange={(e) => setSoyEspecialista(e.target.checked)} />
            Soy especialista en cosmetología
          </label>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Creando cuenta...' : 'Registrarme'}
          </button>
        </form>
        <p className="text-sm text-center text-garnet/70 mt-5">
          ¿Ya tienes cuenta? <Link to="/login" className="font-bold text-garnet hover:underline">Ingresa</Link>
        </p>
      </div>
    </div>
  );
}
