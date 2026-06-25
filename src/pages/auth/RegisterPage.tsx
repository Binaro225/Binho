import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import { Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import { isValidEmail, isValidPassword } from '@/utils';

const RegisterPage = () => {
  const { signUp } = useAppContext();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    general: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
    const newErrors = {
      full_name: '',
      email: '',
      password: '',
      confirmPassword: '',
      general: '',
    };

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Le nom complet est requis';
      valid = false;
    } else if (formData.full_name.length < 2) {
      newErrors.full_name = 'Le nom doit contenir au moins 2 caractères';
      valid = false;
    }

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
    } else if (!isValidPassword(formData.password)) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
      valid = false;
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
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
      const user = await signUp({
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
      });

      if (user) {
        navigate('/login', {
          state: {
            message: 'Inscription réussie ! Veuillez vous connecter.',
            type: 'success',
          },
        });
      }
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        general: 'Une erreur est survenue lors de l\'inscription. Veuillez réessayer.',
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Back Button */}
      <button
        onClick={() => navigate('/login')}
        className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Retour à la connexion
      </button>

      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center">
            <span className="text-white text-2xl font-bold">FM</span>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Créer un compte</h1>
        <p className="text-gray-500 mt-2">
          Rejoignez FinMaster AI pour gérer vos finances intelligemment
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
            {errors.general}
          </div>
        )}

        <div>
          <label htmlFor="full_name" className="label">
            Nom complet
          </label>
          <input
            type="text"
            id="full_name"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            placeholder="Votre nom complet"
            className={`input ${errors.full_name ? 'input-error' : ''}`}
            autoComplete="name"
          />
          {errors.full_name && (
            <p className="mt-1 text-sm text-red-600">{errors.full_name}</p>
          )}
        </div>

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
              placeholder="Créez un mot de passe"
              className={`input ${errors.password ? 'input-error' : ''}`}
              autoComplete="new-password"
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
          <p className="mt-1 text-xs text-gray-500">
            Doit contenir au moins 6 caractères
          </p>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="label">
            Confirmer le mot de passe
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirmez votre mot de passe"
              className={`input ${errors.confirmPassword ? 'input-error' : ''}`}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full btn btn-primary"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Création en cours...
            </>
          ) : (
            'Créer mon compte'
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Vous avez déjà un compte ?{' '}
          <Link
            to="/login"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Se connecter
          </Link>
        </p>
      </div>

      <div className="mt-8 text-center">
        <p className="text-xs text-gray-400">
          En créant un compte, vous acceptez nos{' '}
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

export default RegisterPage;
