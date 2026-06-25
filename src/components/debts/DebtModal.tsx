import { useState, useEffect } from 'react';
import { useDebts } from '@/hooks/useDebts';
import { X, FileText, Users, User } from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils';

interface DebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  debt: any | null;
  types: { value: string; label: string }[];
}

interface FormData {
  name: string;
  amount: number;
  debt_type: string;
  date: string;
  due_date: string;
  description: string;
}

const DebtModal: React.FC<DebtModalProps> = ({
  isOpen,
  onClose,
  debt,
  types,
}) => {
  const { addDebt, updateDebt } = useDebts();

  const [formData, setFormData] = useState<FormData>({
    name: '',
    amount: 0,
    debt_type: 'given',
    date: new Date().toISOString().split('T')[0],
    due_date: '',
    description: '',
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (debt) {
      setFormData({
        name: debt.name,
        amount: debt.amount,
        debt_type: debt.debt_type,
        date: debt.date.split('T')[0],
        due_date: debt.due_date ? debt.due_date.split('T')[0] : '',
        description: debt.description || '',
      });
    } else {
      setFormData({
        name: '',
        amount: 0,
        debt_type: 'given',
        date: new Date().toISOString().split('T')[0],
        due_date: '',
        description: '',
      });
    }
  }, [debt, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Le montant doit être supérieur à 0';
      isValid = false;
    }

    if (!formData.debt_type) {
      newErrors.debt_type = 'Le type de dette est requis';
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
      if (debt) {
        await updateDebt(debt.id, {
          name: formData.name,
          amount: formData.amount,
          debt_type: formData.debt_type as 'given' | 'received',
          date: formData.date,
          due_date: formData.due_date || null,
          description: formData.description,
        });
      } else {
        await addDebt({
          name: formData.name,
          amount: formData.amount,
          debt_type: formData.debt_type as 'given' | 'received',
          date: formData.date,
          due_date: formData.due_date || undefined,
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
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-orange-100 sm:mx-0 sm:h-10 sm:w-10">
                {formData.debt_type === 'given' ? (
                  <Users className="h-6 w-6 text-orange-600" />
                ) : (
                  <User className="h-6 w-6 text-orange-600" />
                )}
              </div>
              <div className="text-center sm:text-left sm:ml-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                  {debt ? 'Modifier la dette' : 'Ajouter une dette'}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {debt ? 'Modifiez les informations de cette dette' : 'Entrez les informations de la nouvelle dette'}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="label">
                  Nom *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Nom de la dette ou de la personne"
                  className={`input ${errors.name ? 'input-error' : ''}`}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

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
                <label htmlFor="debt_type" className="label">
                  Type de dette *
                </label>
                <select
                  id="debt_type"
                  name="debt_type"
                  value={formData.debt_type}
                  onChange={handleChange}
                  className={`select ${errors.debt_type ? 'input-error' : ''}`}
                >
                  <option value="">Sélectionnez un type</option>
                  {types.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {errors.debt_type && (
                  <p className="mt-1 text-sm text-red-600">{errors.debt_type}</p>
                )}
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

              <div>
                <label htmlFor="due_date" className="label">
                  Date d'échéance
                </label>
                <input
                  type="date"
                  id="due_date"
                  name="due_date"
                  value={formData.due_date}
                  onChange={handleChange}
                  className="input"
                  min={formData.date}
                />
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
                  placeholder="Description de la dette (optionnel)"
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
                ) : debt ? (
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

export default DebtModal;
