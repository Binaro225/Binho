import { useState, useEffect } from 'react';
import { useSales } from '@/hooks/useSales';
import { X, ShoppingCart, Plus, Trash2, Percent } from 'lucide-react';
import { formatCurrency } from '@/utils';
import { Product } from '@/types';

interface SaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: any | null;
  products: Product[];
}

interface FormData {
  customer_name: string;
  items: {
    product_id: string;
    quantity: number;
    unit_price: number;
  }[];
  discount: number;
  date: string;
}

const SaleModal: React.FC<SaleModalProps> = ({
  isOpen,
  onClose,
  sale,
  products,
}) => {
  const { recordSale } = useSales();

  const [formData, setFormData] = useState<FormData>({
    customer_name: '',
    items: [],
    discount: 0,
    date: new Date().toISOString().split('T')[0],
  });
  const [errors, setErrors] = useState<{ items?: string; discount?: string; date?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (sale) {
      setFormData({
        customer_name: sale.customer_name || '',
        items: [], // Will be loaded separately
        discount: sale.discount,
        date: sale.date.split('T')[0],
      });
    } else {
      setFormData({
        customer_name: '',
        items: [],
        discount: 0,
        date: new Date().toISOString().split('T')[0],
      });
    }
  }, [sale, isOpen]);

  const handleAddItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          product_id: '',
          quantity: 1,
          unit_price: 0,
        },
      ],
    }));
  };

  const handleRemoveItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleItemChange = (index: number, field: keyof FormData['items'][0], value: any) => {
    setFormData((prev) => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      
      // Si le produit change, mettre à jour le prix unitaire
      if (field === 'product_id') {
        const product = products.find((p) => p.id === value);
        if (product) {
          newItems[index].unit_price = product.selling_price;
        }
      }
      
      return { ...prev, items: newItems };
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors: { items?: string; discount?: string; date?: string } = {};
    let isValid = true;

    if (formData.items.length === 0) {
      newErrors.items = 'Au moins un article est requis';
      isValid = false;
    }

    // Vérifier que tous les articles ont un produit sélectionné
    formData.items.forEach((item, index) => {
      if (!item.product_id) {
        newErrors.items = `Veuillez sélectionner un produit pour l'article ${index + 1}`;
        isValid = false;
      }
      if (!item.quantity || item.quantity <= 0) {
        newErrors.items = `La quantité doit être supérieure à 0 pour l'article ${index + 1}`;
        isValid = false;
      }
    });

    if (formData.discount < 0 || formData.discount > 100) {
      newErrors.discount = 'La remise doit être entre 0 et 100%';
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
      await recordSale({
        customer_name: formData.customer_name || undefined,
        items: formData.items.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
        discount: formData.discount,
        date: formData.date,
      });

      onClose();
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la vente:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculer le total
  const calculateTotal = () => {
    return formData.items.reduce(
      (sum, item) => sum + item.quantity * item.unit_price,
      0
    );
  };

  const total = calculateTotal();
  const discountAmount = total * (formData.discount / 100);
  const finalAmount = total - discountAmount;

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
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 sm:mx-0 sm:h-10 sm:w-10">
                <ShoppingCart className="h-6 w-6 text-purple-600" />
              </div>
              <div className="text-center sm:text-left sm:ml-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                  {sale ? 'Modifier la vente' : 'Enregistrer une vente'}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {sale ? 'Modifiez les informations de cette vente' : 'Entrez les informations de la nouvelle vente'}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="customer_name" className="label">
                  Nom du client
                </label>
                <input
                  type="text"
                  id="customer_name"
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleChange}
                  placeholder="Nom du client (optionnel)"
                  className="input"
                />
              </div>

              <div>
                <label className="label">Articles</label>
                {errors.items && (
                  <p className="text-sm text-red-600 mb-2">{errors.items}</p>
                )}
                <div className="space-y-3">
                  {formData.items.map((item, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-3 relative"
                    >
                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs text-gray-500">Produit *</label>
                          <select
                            value={item.product_id}
                            onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                            className="select mt-1"
                          >
                            <option value="">Sélectionnez un produit</option>
                            {products.map((product) => (
                              <option key={product.id} value={product.id}>
                                {product.name} ({formatCurrency(product.selling_price)})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Quantité *</label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                            min="1"
                            className="input mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Prix unitaire</label>
                          <div className="relative mt-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">FCFA</span>
                            <input
                              type="number"
                              value={item.unit_price}
                              onChange={(e) => handleItemChange(index, 'unit_price', parseInt(e.target.value) || 0)}
                              min="0"
                              className="input pl-10"
                              readOnly
                            />
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 text-sm">
                        <span className="font-medium">Total:</span> {formatCurrency(item.quantity * item.unit_price)}
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="w-full flex items-center justify-center py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
                  >
                    <Plus className="w-5 h-5 text-gray-400 mr-2" />
                    Ajouter un article
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="discount" className="label">
                    Remise (%)
                  </label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      id="discount"
                      name="discount"
                      value={formData.discount}
                      onChange={handleChange}
                      min="0"
                      max="100"
                      className={`input pl-10 ${errors.discount ? 'input-error' : ''}`}
                    />
                  </div>
                  {errors.discount && (
                    <p className="mt-1 text-sm text-red-600">{errors.discount}</p>
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
              </div>

              {/* Summary */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                  Résumé de la vente
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Sous-total ({formData.items.reduce((sum, item) => sum + item.quantity, 0)} article(s)):</span>
                    <span className="font-medium">{formatCurrency(total)}</span>
                  </div>
                  {formData.discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Remise ({formData.discount}%):</span>
                      <span className="font-medium text-red-600">-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="font-semibold text-gray-900">Total:</span>
                    <span className="font-bold text-green-600">{formatCurrency(finalAmount)}</span>
                  </div>
                </div>
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
                disabled={isSubmitting || formData.items.length === 0}
                className="btn btn-primary"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></span>
                    Enregistrement en cours...
                  </>
                ) : sale ? (
                  'Modifier'
                ) : (
                  'Enregistrer la vente'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SaleModal;
