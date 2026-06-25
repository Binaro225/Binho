import { useState, useEffect } from 'react';
import { useSavings } from '@/hooks/useSavings';
import { X, PiggyBank, TrendingUp } from 'lucide-react';
import { formatCurrency, calculateProgress } from '@/utils';

interface AddToSavingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: any | null;
}

const AddToSavingsModal: React.FC<AddToSavingsModalProps> = ({
  isOpen,
  onClose,
  goal,
}) => {
  const { addToSavings } = useSavings();

  const [amount, setAmount] = useState(0);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (goal) {
      setAmount(0);
      setError('');
      setSuccess(false);
    }
  }, [goal, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    setAmount(value);
    setError('');
  };

  const validateForm = () => {
    if (!amount || amount <= 0) {
      setError('Le montant doit être supérieur à 0');
      return false;
    }

    if (!goal) {
      setError('Aucun objectif sélectionné');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !goal) return;

    setIsSubmitting(true);
    setError('');

    try {
      await addToSavings(goal.id, amount);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !goal) return null;

  const progress = calculateProgress(goal.current_amount, goal.target_amount);
  const newAmount = goal.current_amount + amount;
  const newProgress = calculateProgress(newAmount, goal.target_amount);

  if (success) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div
            className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
            aria-hidden="true"
          />
          <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">
                  Ajout réussi !
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Le montant a été ajouté à votre objectif d'épargne.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          aria-hidden="true"
          onClick={onClose}
        />

        {/* Modal Content */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 sm:mx-0 sm:h-10 sm:w-10">
                <PiggyBank className="h-6 w-6 text-purple-600" />
              </div>
              <div className="text-center sm:text-left sm:ml-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                  Ajouter à l'épargne
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Ajoutez de l'argent à votre objectif "{goal.name}"
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6">
            {/* Progress */}
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Progression actuelle</span>
                <span className="font-medium">{progress.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-gray-500">
                  {formatCurrency(goal.current_amount)}
                </span>
                <span className="text-gray-500">
                  {formatCurrency(goal.target_amount)}
                </span>
              </div>
            </div>

            {/* New Progress Preview */}
            {amount > 0 && (
              <div className="mb-6 p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800 mb-2">
                  Après ajout de {formatCurrency(amount)}:
                </p>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">Nouvelle progression</span>
                  <span className="font-medium text-green-600">{newProgress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(newProgress, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-500">
                    {formatCurrency(goal.current_amount + amount)}
                  </span>
                  <span className="text-gray-500">
                    {formatCurrency(goal.target_amount)}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="amount" className="label">
                  Montant à ajouter *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">FCFA</span>
                  <input
                    type="number"
                    id="amount"
                    value={amount}
                    onChange={handleChange}
                    placeholder="0"
                    className={`input pl-10 ${error ? 'input-error' : ''}`}
                    min="0"
                    step="1"
                  />
                </div>
                {error && (
                  <p className="mt-1 text-sm text-red-600">{error}</p>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting || amount <= 0}
                className="btn btn-primary"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></span>
                    Ajout en cours...
                  </>
                ) : (
                  'Ajouter à l\'épargne'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddToSavingsModal;
