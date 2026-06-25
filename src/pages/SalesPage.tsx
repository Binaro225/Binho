import React from "react";
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSales } from "@/hooks/useSales";
import { useProducts } from "@/hooks/useProducts";
import { Plus, Search, Filter, ShoppingCart, Edit, Trash2, Package } from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import SaleModal from '@/components/sales/SaleModal';
import DeleteConfirmModal from '@/components/common/DeleteConfirmModal';

const SalesPage = () => {
  const { salesState, fetchSales, deleteSale, getSaleItems } = useSales();
  const { productsState } = useProducts();
  const [searchParams, setSearchParams] = useSearchParams();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [saleItems, setSaleItems] = useState<any[]>([]);
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    search: '',
    start_date: '',
    end_date: '',
  });

  const action = searchParams.get('action');
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = 10;

  useEffect(() => {
    fetchSales(
      {
        search: filters.search || undefined,
        start_date: filters.start_date || undefined,
        end_date: filters.end_date || undefined,
      },
      page,
      pageSize
    );
  }, [fetchSales, filters, page, pageSize]);

  useEffect(() => {
    if (action === 'add') {
      setIsModalOpen(true);
      setEditingSale(null);
      searchParams.delete('action');
      setSearchParams(searchParams);
    }
  }, [action, searchParams, setSearchParams]);

  const handleAdd = () => {
    setEditingSale(null);
    setIsModalOpen(true);
  };

  const handleEdit = (sale: any) => {
    setEditingSale(sale);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (deleteId) {
      await deleteSale(deleteId);
      setIsDeleteModalOpen(false);
      setDeleteId(null);
    }
  };

  const handleToggleExpand = async (saleId: string) => {
    if (expandedSaleId === saleId) {
      setExpandedSaleId(null);
      setSaleItems([]);
    } else {
      const items = await getSaleItems(saleId);
      setSaleItems(items);
      setExpandedSaleId(saleId);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSales(
      {
        search: filters.search || undefined,
        start_date: filters.start_date || undefined,
        end_date: filters.end_date || undefined,
      },
      1,
      pageSize
    );
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      start_date: '',
      end_date: '',
    });
    fetchSales({}, 1, pageSize);
  };

  const getProductName = (productId: string) => {
    const product = productsState.products.find((p) => p.id === productId);
    return product ? product.name : 'Produit inconnu';
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Ventes</h1>
            <p className="page-subtitle">
              Historique et gestion de vos ventes
            </p>
          </div>
          <button onClick={handleAdd} className="btn btn-primary">
            <Plus className="w-5 h-5 mr-2" />
            Enregistrer une vente
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Rechercher</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  placeholder="Rechercher par numero, client..."
                  className="input pl-10"
                />
              </div>
            </div>
            <div>
              <label className="label">Date de debut</label>
              <input
                type="date"
                name="start_date"
                value={filters.start_date}
                onChange={handleFilterChange}
                className="input"
              />
            </div>
            <div>
              <label className="label">Date de fin</label>
              <input
                type="date"
                name="end_date"
                value={filters.end_date}
                onChange={handleFilterChange}
                className="input"
              />
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

      {/* Sales Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Liste des ventes ({salesState.total})
          </h3>
        </div>

        {salesState.isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : salesState.sales.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto" />
            <p className="text-gray-500 mt-4">Aucune vente enregistree</p>
            <p className="text-sm text-gray-400 mt-2">
              Commencez par enregistrer votre premiere vente
            </p>
            <button onClick={handleAdd} className="btn btn-primary mt-4">
              <Plus className="w-5 h-5 mr-2" />
              Enregistrer une vente
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Numero</th>
                    <th>Client</th>
                    <th>Articles</th>
                    <th className="text-right">Montant</th>
                    <th className="text-right">Benefice</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {salesState.sales.map((sale) => (
                    <React.Fragment key={sale.id}>
                      <tr>
                        <td>{formatDate(sale.date)}</td>
                        <td className="font-medium">{sale.sale_number}</td>
                        <td>{sale.customer_name || 'Client anonyme'}</td>
                        <td>
                          <button
                            onClick={() => handleToggleExpand(sale.id)}
                            className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                          >
                            {expandedSaleId === sale.id ? 'Masquer' : 'Voir'}
                            <span className="ml-1">{expandedSaleId === sale.id ? '^' : 'v'}</span>
                          </button>
                        </td>
                        <td className="text-right font-medium">
                          {formatCurrency(sale.total_amount)}
                        </td>
                        <td className="text-right font-medium text-green-600">
                          {formatCurrency(sale.profit)}
                        </td>
                        <td>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEdit(sale)}
                              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(sale.id)}
                              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedSaleId === sale.id && (
                        <tr>
                          <td colSpan={7} className="py-4">
                            <div className="bg-gray-50 rounded-lg p-4">
                              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                                Details de la vente
                              </h4>
                              <div className="space-y-2">
                                {saleItems.map((item) => (
                                  <div
                                    key={item.id}
                                    className="flex items-center justify-between p-2 bg-white rounded-lg"
                                  >
                                    <div className="flex items-center">
                                      <Package className="w-5 h-5 text-gray-400 mr-3" />
                                      <span className="text-sm">{getProductName(item.product_id)}</span>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                      <span className="text-sm text-gray-500">
                                        x{item.quantity}
                                      </span>
                                      <span className="text-sm font-medium">
                                        {formatCurrency(item.total_price)}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              {sale.discount > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <p className="text-sm text-gray-500">
                                    Remise: {sale.discount}%
                                  </p>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {salesState.total > pageSize && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-500">
                  Affichage {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, salesState.total)} sur {salesState.total}
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
                    Precedent
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {page} sur {Math.ceil(salesState.total / pageSize)}
                  </span>
                  <button
                    onClick={() => {
                      if (page < Math.ceil(salesState.total / pageSize)) {
                        searchParams.set('page', (page + 1).toString());
                        setSearchParams(searchParams);
                      }
                    }}
                    disabled={page >= Math.ceil(salesState.total / pageSize)}
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
      <SaleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        sale={editingSale}
        products={productsState.products}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Supprimer la vente"
        message="Etes-vous sur de vouloir supprimer cette vente ? Cette action est irreversible et restaurera le stock des produits."
      />
    </div>
  );
};

export default SalesPage;
