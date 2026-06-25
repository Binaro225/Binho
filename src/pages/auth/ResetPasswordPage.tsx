import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Eye, EyeOff, Loader2, CheckCircle, XCircle } from 'lucide-react';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({
    password: '',
    confirmPassword: '',
    general: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isValidToken, setIsValidToken] = useState(true);

  const token = searchParams.get('token');
  const type = searchParams.get('type');

  useEffect(() => {
    // Vérifier si le token est valide
    const verifyToken = async () => {
      if (!token || type !== 'recovery') {
        setIsValidToken(false);
        return;
      }

      try {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'recovery',
        });

        if (error) {
          setIsValidToken(false);
        }
      } catch (err) {
        setIsValidToken(false);
      }
    };

    verifyToken();
  }, [token, type]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    let valid = true;
    const newErrors = {
      password: '',
      confirmPassword: '',
      general: '',
    };

    if (!formData.password.trim()) {
      newErrors.password = 'Le mot de passe est requis';
      valid = false;
    } else if (formData.password.length < 6) {
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

    if (!validateForm() || !token) return;

    setIsLoading(true);
    setErrors((prev) => ({ ...prev, general: '' }));

    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.password,
      });

      if (error) {
        throw error;
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        general: 'Une erreur est survenue. Veuillez réessayer.',
      }));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isValidToken) {
    return (
      <div className="w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Lien invalide
        </h1>
        <p className="text-gray-500 mb-6">
          Le lien de réinitialisation a expiré ou est invalide.
        </p>
        <Link
          to="/forgot-password"
          className="btn btn-primary"
        >
          Demander un nouveau lien
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Mot de passe réinitialisé
        </h1>
        <p className="text-gray-500 mb-6">
          Votre mot de passe a été réinitialisé avec succès.
        </p>
        <p className="text-sm text-gray-400">
          Redirection vers la page de connexion...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center">
            <span className="text-white text-2xl font-bold">FM</span>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          Réinitialiser le mot de passe
        </h1>
        <p className="text-gray-500 mt-2">
          Entrez votre nouveau mot de passe
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
            {errors.general}
          </div>
        )}

        <div>
          <label htmlFor="password" className="label">
            Nouveau mot de passe
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Nouveau mot de passe"
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
        </div>

        <div>
          <label htmlFor="confirmPassword" className="label">
            Confirmer le nouveau mot de passe
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirmez le nouveau mot de passe"
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
              Réinitialisation en cours...
            </>
          ) : (
            'Réinitialiser le mot de passe'
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Vous vous souvenez de votre mot de passe ?{' '}
          <Link
            to="/login"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
