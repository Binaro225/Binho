import { useState, useEffect } from 'react';
import { useDebts } from '@/hooks/useDebts';
import { X, TrendingUp, Calendar, User } from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils';

interface DebtPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  debt: any | null;
  payments: any[];
}

interface FormData {
  amount: number;
  payment_date: string;
  description: string;
}

const DebtPaymentModal: React.FC<DebtPaymentModalProps> = ({
  isOpen,
  onClose,
  debt,
  payments,
}) => {
  const { addDebtPayment } = useDebts();

  const [formData, setFormData] = useState<FormData>({
    amount: 0,
    payment_date: new Date().toISOString().split('T')[0],
    description: '',
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (debt) {
      setFormData({
        amount: 0,
        payment_date: new Date().toISOString().split('T')[0],
        description: '',
      });
    }
  }, [debt, isOpen]);

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

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Le montant doit être supérieur à 0';
      isValid = false;
    }

    if (!formData.payment_date) {
      newErrors.payment_date = 'La date de paiement est requise';
      isValid = false;
    }

    if (!debt) {
      newErrors.amount = 'Aucune dette sélectionnée';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !debt) return;

    setIsSubmitting(true);

    try {
      await addDebtPayment(debt.id, {
        amount: formData.amount,
        payment_date: formData.payment_date,
        description: formData.description || null,
      });

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Erreur lors de l\'ajout du paiement:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !debt) return null;

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
                  Paiement enregistré !
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Le paiement a été ajouté avec succès.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculer le montant restant
  const remainingAmount = debt.amount - payments.reduce((sum, p) => sum + p.amount, 0);

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
                <User className="h-6 w-6 text-purple-600" />
              </div>
              <div className="text-center sm:text-left sm:ml-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                  Ajouter un paiement
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Enregistrez un paiement pour la dette "{debt.name}"
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6">
            {/* Debt Info */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Type</p>
                  <p className="font-medium">{debt.debt_type === 'given' ? 'Dette donnée' : 'Dette reçue'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Montant initial</p>
                  <p className="font-medium">{formatCurrency(debt.amount)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Montant restant</p>
                  <p className="font-medium text-green-600">{formatCurrency(remainingAmount)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Date d'échéance</p>
                  <p className="font-medium">{debt.due_date ? formatDate(debt.due_date) : '-'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="amount" className="label">
                  Montant du paiement *
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
                    max={remainingAmount}
                  />
                </div>
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Montant maximum: {formatCurrency(remainingAmount)}
                </p>
              </div>

              <div>
                <label htmlFor="payment_date" className="label">
                  Date du paiement *
                </label>
                <input
                  type="date"
                  id="payment_date"
                  name="payment_date"
                  value={formData.payment_date}
                  onChange={handleChange}
                  className={`input ${errors.payment_date ? 'input-error' : ''}`}
                />
                {errors.payment_date && (
                  <p className="mt-1 text-sm text-red-600">{errors.payment_date}</p>
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
                  placeholder="Description du paiement (optionnel)"
                  rows={3}
                  className="input resize-none"
                />
              </div>
            </div>

            {/* Payments History */}
            {payments.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                  Historique des paiements
                </h4>
                <div className="space-y-2">
                  {payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium">{formatDate(payment.payment_date)}</p>
                        <p className="text-xs text-gray-500">{payment.description || 'Paiement'}</p>
                      </div>
                      <span className="text-sm font-medium text-green-600">
                        {formatCurrency(payment.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                disabled={isSubmitting || formData.amount <= 0}
                className="btn btn-primary"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></span>
                    Enregistrement en cours...
                  </>
                ) : (
                  'Enregistrer le paiement'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DebtPaymentModal;
