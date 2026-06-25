import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProducts } from '@/hooks/useProducts';
import { Plus, Search, Filter, Package, Edit, Trash2, Eye, AlertTriangle } from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ProductModal from '@/components/products/ProductModal';
import DeleteConfirmModal from '@/components/common/DeleteConfirmModal';

const ProductsPage = () => {
  const { productsState, fetchProducts, deleteProduct, updateStock } = useProducts();
  const [searchParams, setSearchParams] = useSearchParams();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    category: '',
  });

  const action = searchParams.get('action');
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = 10;

  useEffect(() => {
    fetchProducts(
      {
        search: filters.search || undefined,
        category: filters.category || undefined,
      },
      page,
      pageSize
    );
  }, [fetchProducts, filters, page, pageSize]);

  useEffect(() => {
    if (action === 'add') {
      setIsModalOpen(true);
      setEditingProduct(null);
      searchParams.delete('action');
      setSearchParams(searchParams);
    }
  }, [action, searchParams, setSearchParams]);

  const handleAdd = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (deleteId) {
      await deleteProduct(deleteId);
      setIsDeleteModalOpen(false);
      setDeleteId(null);
    }
  };

  const handleStockUpdate = async (productId: string, type: 'in' | 'out') => {
    const product = productsState.products.find((p) => p.id === productId);
    if (!product) return;

    const quantityChange = type === 'in' ? 1 : -1;
    await updateStock(productId, quantityChange, type);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts(
      {
        search: filters.search || undefined,
        category: filters.category || undefined,
      },
      1,
      pageSize
    );
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      category: '',
    });
    fetchProducts({}, 1, pageSize);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Produits</h1>
            <p className="page-subtitle">
              Gestion de votre stock et catalogue de produits
            </p>
          </div>
          <button onClick={handleAdd} className="btn btn-primary">
            <Plus className="w-5 h-5 mr-2" />
            Ajouter un produit
          </button>
        </div>
      </div>

      {/* Alerts */}
      {productsState.lowStockAlerts > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3" />
          <p className="text-yellow-800">
            {productsState.lowStockAlerts} produit(s) ont un stock faible
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Rechercher</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  placeholder="Rechercher par nom, description..."
                  className="input pl-10"
                />
              </div>
            </div>
            <div>
              <label className="label">Catégorie</label>
              <select
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                className="select"
              >
                <option value="">Toutes les catégories</option>
                <option value="Électronique">Électronique</option>
                <option value="Alimentation">Alimentation</option>
                <option value="Vêtements">Vêtements</option>
                <option value="Autre">Autre</option>
              </select>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button type="submit" className="btn btn-secondary btn-sm">
              <Filter className="w-4 h-4 mr-2" />
              Filtrer
            </button>
            <button
              type="button"
              onClick={handleClearFilters}
              className="btn btn-ghost btn-sm"
            >
              Effacer
            </button>
          </div>
        </form>
      </div>

      {/* Products Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Liste des produits ({productsState.total})
          </h3>
        </div>

        {productsState.isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : productsState.products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto" />
            <p className="text-gray-500 mt-4">Aucun produit enregistré</p>
            <p className="text-sm text-gray-400 mt-2">
              Commencez par ajouter votre premier produit
            </p>
            <button onClick={handleAdd} className="btn btn-primary mt-4">
              <Plus className="w-5 h-5 mr-2" />
              Ajouter un produit
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Catégorie</th>
                    <th>Prix d'achat</th>
                    <th>Prix de vente</th>
                    <th>Stock</th>
                    <th>Fournisseur</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {productsState.products.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                            <Package className="w-5 h-5 text-blue-600" />
                          </div>
                          <span className="font-medium">{product.name}</span>
                        </div>
                      </td>
                      <td>{product.category}</td>
                      <td>{formatCurrency(product.purchase_price)}</td>
                      <td>{formatCurrency(product.selling_price)}</td>
                      <td>
                        <span
                          className={`badge ${
                            product.quantity <= product.min_quantity
                              ? 'badge-danger'
                              : product.quantity <= product.min_quantity * 1.5
                              ? 'badge-warning'
                              : 'badge-success'
                          }`}
                        >
                          {product.quantity}
                        </span>
                      </td>
                      <td>{product.supplier || '-'}</td>
                      <td>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleStockUpdate(product.id, 'in')}
                            className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                            title="Ajouter au stock"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleStockUpdate(product.id, 'out')}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            title="Retirer du stock"
                            disabled={product.quantity <= 0}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(product)}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {productsState.total > pageSize && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-500">
                  Affichage {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, productsState.total)} sur {productsState.total}
                </p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      if (page > 1) {
                        searchParams.set('page', (page - 1).toString());
                        setSearchParams(searchParams);
                      }
                    }}
                    disabled={page <= 1}
                    className="btn btn-ghost btn-sm"
                  >
                    Précédent
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {page} sur {Math.ceil(productsState.total / pageSize)}
                  </span>
                  <button
                    onClick={() => {
                      if (page < Math.ceil(productsState.total / pageSize)) {
                        searchParams.set('page', (page + 1).toString());
                        setSearchParams(searchParams);
                      }
                    }}
                    disabled={page >= Math.ceil(productsState.total / pageSize)}
                    className="btn btn-ghost btn-sm"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={editingProduct}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Supprimer le produit"
        message="Êtes-vous sûr de vouloir supprimer ce produit ? Cette action est irréversible."
      />
    </div>
  );
};

export default ProductsPage;
