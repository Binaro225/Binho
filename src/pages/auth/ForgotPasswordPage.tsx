import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import { ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { isValidEmail } from '@/utils';

const ForgotPasswordPage = () => {
  const { resetPassword } = useAppContext();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setError('');
  };

  const validateForm = () => {
    if (!email.trim()) {
      setError('L\'email est requis');
      return false;
    }
    if (!isValidEmail(email)) {
      setError('Veuillez entrer un email valide');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setError('');

    try {
      const result = await resetPassword(email);
      if (result) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (err) {
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Email de réinitialisation envoyé
        </h1>
        <p className="text-gray-500 mb-6">
          Vérifiez votre boîte mail pour le lien de réinitialisation.
        </p>
        <p className="text-sm text-gray-400">
          Redirection vers la page de connexion...
        </p>
      </div>
    );
  }

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
        <h1 className="text-2xl font-bold text-gray-900">
          Mot de passe oublié ?
        </h1>
        <p className="text-gray-500 mt-2">
          Entrez votre email et nous vous enverrons un lien de réinitialisation
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="email" className="label">
            Adresse email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={handleChange}
            placeholder="votre@email.com"
            className={`input ${error ? 'input-error' : ''}`}
            autoComplete="email"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full btn btn-primary"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Envoi en cours...
            </>
          ) : (
            'Envoyer le lien de réinitialisation'
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

export default ForgotPasswordPage;
