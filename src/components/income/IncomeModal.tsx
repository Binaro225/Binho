import { useState, useEffect } from 'react';
import { useIncomes } from '@/hooks/useIncomes';
import { X, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/utils';

interface IncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  income: any | null;
  categories: { value: string; label: string }[];
}

interface FormData {
  amount: number;
  category: string;
  description: string;
  date: string;
}

const IncomeModal: React.FC<IncomeModalProps> = ({
  isOpen,
  onClose,
  income,
  categories,
}) => {
  const { addIncome, updateIncome } = useIncomes();

  const [formData, setFormData] = useState<FormData>({
    amount: 0,
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (income) {
      setFormData({
        amount: income.amount,
        category: income.category,
        description: income.description || '',
        date: income.date.split('T')[0],
      });
    } else {
      setFormData({
        amount: 0,
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
      });
    }
  }, [income, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error when user types
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<FormData> = {};
    let isValid = true;

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Le montant doit être supérieur à 0';
      isValid = false;
    }

    if (!formData.category) {
      newErrors.category = 'La catégorie est requise';
      isValid = false;
    }

    if (!formData.date) {
      newErrors.date = 'La date est requise';
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
      if (income) {
        // Update existing income
        await updateIncome(income.id, {
          amount: formData.amount,
          category: formData.category,
          description: formData.description,
          date: formData.date,
        });
      } else {
        // Add new income
        await addIncome({
          amount: formData.amount,
          category: formData.category as any,
          description: formData.description,
          date: formData.date,
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
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-center sm:text-left sm:ml-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                  {income ? 'Modifier le revenu' : 'Ajouter un revenu'}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {income ? 'Modifiez les informations de ce revenu' : 'Entrez les informations du nouveau revenu'}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="amount" className="label">
                  Montant *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">FCFA</span>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    placeholder="0"
                    className={`input pl-10 ${errors.amount ? 'input-error' : ''}`}
                    min="0"
                    step="1"
                  />
                </div>
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                )}
              </div>

              <div>
                <label htmlFor="category" className="label">
                  Catégorie *
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className={`select ${errors.category ? 'input-error' : ''}`}
                >
                  <option value="">Sélectionnez une catégorie</option>
                  {categories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600">{errors.category}</p>
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
                  placeholder="Description du revenu (optionnel)"
                  rows={3}
                  className="input resize-none"
                />
              </div>

              <div>
                <label htmlFor="date" className="label">
                  Date *
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className={`input ${errors.date ? 'input-error' : ''}`}
                />
                {errors.date && (
                  <p className="mt-1 text-sm text-red-600">{errors.date}</p>
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
                disabled={isSubmitting}
                className="btn btn-primary"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></span>
                    Sauvegarde en cours...
                  </>
                ) : income ? (
                  'Modifier'
                ) : (
                  'Ajouter'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default IncomeModal;
