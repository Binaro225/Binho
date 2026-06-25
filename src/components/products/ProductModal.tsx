import { useState, useEffect } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { X, Package } from 'lucide-react';
import { formatCurrency } from '@/utils';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any | null;
}

interface FormData {
  name: string;
  description: string;
  category: string;
  purchase_price: number;
  selling_price: number;
  quantity: number;
  min_quantity: number;
  supplier: string;
}

const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  const { addProduct, updateProduct } = useProducts();

  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    category: '',
    purchase_price: 0,
    selling_price: 0,
    quantity: 0,
    min_quantity: 0,
    supplier: '',
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description || '',
        category: product.category,
        purchase_price: product.purchase_price,
        selling_price: product.selling_price,
        quantity: product.quantity,
        min_quantity: product.min_quantity,
        supplier: product.supplier || '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        category: '',
        purchase_price: 0,
        selling_price: 0,
        quantity: 0,
        min_quantity: 0,
        supplier: '',
      });
    }
  }, [product, isOpen]);

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

    if (!formData.category) {
      newErrors.category = 'La catégorie est requise';
      isValid = false;
    }

    if (!formData.purchase_price || formData.purchase_price <= 0) {
      newErrors.purchase_price = 'Le prix d\'achat doit être supérieur à 0';
      isValid = false;
    }

    if (!formData.selling_price || formData.selling_price <= 0) {
      newErrors.selling_price = 'Le prix de vente doit être supérieur à 0';
      isValid = false;
    }

    if (formData.selling_price <= formData.purchase_price) {
      newErrors.selling_price = 'Le prix de vente doit être supérieur au prix d\'achat';
      isValid = false;
    }

    if (!formData.quantity || formData.quantity < 0) {
      newErrors.quantity = 'La quantité doit être supérieure ou égale à 0';
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
      if (product) {
        await updateProduct(product.id, {
          name: formData.name,
          description: formData.description,
          category: formData.category,
          purchase_price: formData.purchase_price,
          selling_price: formData.selling_price,
          quantity: formData.quantity,
          min_quantity: formData.min_quantity,
          supplier: formData.supplier,
        });
      } else {
        await addProduct({
          name: formData.name,
          description: formData.description,
          category: formData.category,
          purchase_price: formData.purchase_price,
          selling_price: formData.selling_price,
          quantity: formData.quantity,
          min_quantity: formData.min_quantity,
          supplier: formData.supplier,
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
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-center sm:text-left sm:ml-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                  {product ? 'Modifier le produit' : 'Ajouter un produit'}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {product ? 'Modifiez les informations de ce produit' : 'Entrez les informations du nouveau produit'}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  placeholder="Nom du produit"
                  className={`input ${errors.name ? 'input-error' : ''}`}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
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
                  <option value="Électronique">Électronique</option>
                  <option value="Alimentation">Alimentation</option>
                  <option value="Vêtements">Vêtements</option>
                  <option value="Mobilier">Mobilier</option>
                  <option value="Autre">Autre</option>
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600">{errors.category}</p>
                )}
              </div>

              <div>
                <label htmlFor="purchase_price" className="label">
                  Prix d'achat *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">FCFA</span>
                  <input
                    type="number"
                    id="purchase_price"
                    name="purchase_price"
                    value={formData.purchase_price}
                    onChange={handleChange}
                    placeholder="0"
                    className={`input pl-10 ${errors.purchase_price ? 'input-error' : ''}`}
                    min="0"
                    step="1"
                  />
                </div>
                {errors.purchase_price && (
                  <p className="mt-1 text-sm text-red-600">{errors.purchase_price}</p>
                )}
              </div>

              <div>
                <label htmlFor="selling_price" className="label">
                  Prix de vente *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">FCFA</span>
                  <input
                    type="number"
                    id="selling_price"
                    name="selling_price"
                    value={formData.selling_price}
                    onChange={handleChange}
                    placeholder="0"
                    className={`input pl-10 ${errors.selling_price ? 'input-error' : ''}`}
                    min="0"
                    step="1"
                  />
                </div>
                {errors.selling_price && (
                  <p className="mt-1 text-sm text-red-600">{errors.selling_price}</p>
                )}
              </div>

              <div>
                <label htmlFor="quantity" className="label">
                  Quantité *
                </label>
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  placeholder="0"
                  className={`input ${errors.quantity ? 'input-error' : ''}`}
                  min="0"
                  step="1"
                />
                {errors.quantity && (
                  <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>
                )}
              </div>

              <div>
                <label htmlFor="min_quantity" className="label">
                  Quantité minimale
                </label>
                <input
                  type="number"
                  id="min_quantity"
                  name="min_quantity"
                  value={formData.min_quantity}
                  onChange={handleChange}
                  placeholder="0"
                  className="input"
                  min="0"
                  step="1"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="description" className="label">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Description du produit (optionnel)"
                  rows={3}
                  className="input resize-none"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="supplier" className="label">
                  Fournisseur
                </label>
                <input
                  type="text"
                  id="supplier"
                  name="supplier"
                  value={formData.supplier}
                  onChange={handleChange}
                  placeholder="Nom du fournisseur (optionnel)"
                  className="input"
                />
              </div>
            </div>

            {/* Summary */}
            {formData.purchase_price > 0 && formData.selling_price > 0 && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                  Résumé
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Prix d'achat</p>
                    <p className="font-medium">{formatCurrency(formData.purchase_price)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Prix de vente</p>
                    <p className="font-medium">{formatCurrency(formData.selling_price)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Bénéfice unitaire</p>
                    <p className="font-medium text-green-600">
                      {formatCurrency(formData.selling_price - formData.purchase_price)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Marge</p>
                    <p className="font-medium">
                      {formData.purchase_price > 0
                        ? `${(((formData.selling_price - formData.purchase_price) / formData.purchase_price) * 100).toFixed(2)}%`
                        : '0%'}
                    </p>
                  </div>
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
                disabled={isSubmitting}
                className="btn btn-primary"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></span>
                    Sauvegarde en cours...
                  </>
                ) : product ? (
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

export default ProductModal;
