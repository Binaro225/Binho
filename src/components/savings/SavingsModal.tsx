import { useState, useEffect } from 'react';
import { useSavings } from '@/hooks/useSavings';
import { X, PiggyBank, Target } from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils';

interface SavingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: any | null;
}

interface FormData {
  name: string;
  target_amount: number;
  target_date: string;
  description: string;
}

const SavingsModal: React.FC<SavingsModalProps> = ({
  isOpen,
  onClose,
  goal,
}) => {
  const { createSavingsGoal, updateSavingsGoal } = useSavings();

  const [formData, setFormData] = useState<FormData>({
    name: '',
    target_amount: 0,
    target_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 jours dans le futur
    description: '',
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (goal) {
      setFormData({
        name: goal.name,
        target_amount: goal.target_amount,
        target_date: goal.target_date.split('T')[0],
        description: goal.description || '',
      });
    } else {
      setFormData({
        name: '',
        target_amount: 0,
        target_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: '',
      });
    }
  }, [goal, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<FormData> = {};
    let isValid = true;

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis';
      isValid = false;
    }

    if (!formData.target_amount || formData.target_amount <= 0) {
      newErrors.target_amount = 'Le montant cible doit être supérieur à 0';
      isValid = false;
    }

    if (!formData.target_date) {
      newErrors.target_date = 'La date cible est requise';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      if (goal) {
        await updateSavingsGoal(goal.id, {
          name: formData.name,
          target_amount: formData.target_amount,
          target_date: formData.target_date,
          description: formData.description,
        });
      } else {
        await createSavingsGoal({
          name: formData.name,
          target_amount: formData.target_amount,
          target_date: formData.target_date,
          description: formData.description,
        });
      }

      onClose();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

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
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 sm:mx-0 sm:h-10 sm:w-10">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
              <div className="text-center sm:text-left sm:ml-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                  {goal ? 'Modifier l\'objectif' : 'Créer un objectif d\'épargne'}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {goal ? 'Modifiez les informations de cet objectif' : 'Entrez les informations du nouvel objectif'}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="label">
                  Nom de l'objectif *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Ex: Achat d'une voiture, Vacances d'été"
                  className={`input ${errors.name ? 'input-error' : ''}`}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="target_amount" className="label">
                  Montant cible *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">FCFA</span>
                  <input
                    type="number"
                    id="target_amount"
                    name="target_amount"
                    value={formData.target_amount}
                    onChange={handleChange}
                    placeholder="0"
                    className={`input pl-10 ${errors.target_amount ? 'input-error' : ''}`}
                    min="0"
                    step="1"
                  />
                </div>
                {errors.target_amount && (
                  <p className="mt-1 text-sm text-red-600">{errors.target_amount}</p>
                )}
              </div>

              <div>
                <label htmlFor="target_date" className="label">
                  Date cible *
                </label>
                <input
                  type="date"
                  id="target_date"
                  name="target_date"
                  value={formData.target_date}
                  onChange={handleChange}
                  className={`input ${errors.target_date ? 'input-error' : ''}`}
                  min={new Date().toISOString().split('T')[0]}
                />
                {errors.target_date && (
                  <p className="mt-1 text-sm text-red-600">{errors.target_date}</p>
                )}
              </div>

              <div>
                <label htmlFor="description" className="label">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Description de l'objectif (optionnel)"
                  rows={3}
                  className="input resize-none"
                />
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
                disabled={isSubmitting}
                className="btn btn-primary"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></span>
                    Sauvegarde en cours...
                  </>
                ) : goal ? (
                  'Modifier'
                ) : (
                  'Créer'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SavingsModal;
