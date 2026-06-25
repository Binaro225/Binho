import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { isValidEmail } from '@/utils';

const LoginPage = () => {
  const { signIn } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    general: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error when user types
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    let valid = true;
    const newErrors = { email: '', password: '', general: '' };

    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
      valid = false;
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Veuillez entrer un email valide';
      valid = false;
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Le mot de passe est requis';
      valid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors((prev) => ({ ...prev, general: '' }));

    try {
      const user = await signIn({
        email: formData.email,
        password: formData.password,
      });

      if (user) {
        navigate(from, { replace: true });
      }
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        general: 'Email ou mot de passe incorrect. Veuillez réessayer.',
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center">
            <span className="text-white text-2xl font-bold">FM</span>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Bienvenue sur FinMaster AI</h1>
        <p className="text-gray-500 mt-2">
          Connectez-vous pour gérer vos finances avec intelligence
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
            {errors.general}
          </div>
        )}

        <div>
          <label htmlFor="email" className="label">
            Adresse email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="votre@email.com"
            className={`input ${errors.email ? 'input-error' : ''}`}
            autoComplete="email"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="label">
            Mot de passe
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Votre mot de passe"
              className={`input ${errors.password ? 'input-error' : ''}`}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password}</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="remember"
              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <label htmlFor="remember" className="ml-2 text-sm text-gray-600">
              Se souvenir de moi
            </label>
          </div>
          <Link
            to="/forgot-password"
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Mot de passe oublié ?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full btn btn-primary"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Connexion en cours...
            </>
          ) : (
            'Se connecter'
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Vous n'avez pas de compte ?{' '}
          <Link
            to="/register"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            S'inscrire
          </Link>
        </p>
      </div>

      <div className="mt-8 text-center">
        <p className="text-xs text-gray-400">
          En vous connectant, vous acceptez nos{' '}
          <a href="#" className="text-blue-600 hover:underline">
            Conditions d'utilisation
          </a>{' '}
          et notre{' '}
          <a href="#" className="text-blue-600 hover:underline">
            Politique de confidentialité
          </a>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
