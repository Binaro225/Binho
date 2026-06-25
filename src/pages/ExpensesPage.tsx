import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useExpenses } from '@/hooks/useExpenses';
import { Plus, Search, Filter, TrendingDown, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { formatCurrency, formatDate, getCategoryColor } from '@/utils';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ExpenseModal from '@/components/expenses/ExpenseModal';
import DeleteConfirmModal from '@/components/common/DeleteConfirmModal';

const expenseCategories = [
  { value: 'nourriture', label: 'Nourriture' },
  { value: 'transport', label: 'Transport' },
  { value: 'internet', label: 'Internet' },
  { value: 'sante', label: 'Santé' },
  { value: 'education', label: 'Éducation' },
  { value: 'loyer', label: 'Loyer' },
  { value: 'divertissement', label: 'Divertissement' },
  { value: 'autre', label: 'Autre' },
];

const ExpensesPage = () => {
  const { expensesState, fetchExpenses, deleteExpense } = useExpenses();
  const [searchParams, setSearchParams] = useSearchParams();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    category: '',
    start_date: '',
    end_date: '',
  });

  const action = searchParams.get('action');
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = 10;

  useEffect(() => {
    fetchExpenses(
      {
        search: filters.search || undefined,
        category: filters.category || undefined,
        start_date: filters.start_date || undefined,
        end_date: filters.end_date || undefined,
      },
      page,
      pageSize
    );
  }, [fetchExpenses, filters, page, pageSize]);

  useEffect(() => {
    if (action === 'add') {
      setIsModalOpen(true);
      setEditingExpense(null);
      searchParams.delete('action');
      setSearchParams(searchParams);
    }
  }, [action, searchParams, setSearchParams]);

  const handleAdd = () => {
    setEditingExpense(null);
    setIsModalOpen(true);
  };

  const handleEdit = (expense: any) => {
    setEditingExpense(expense);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (deleteId) {
      await deleteExpense(deleteId);
      setIsDeleteModalOpen(false);
      setDeleteId(null);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchExpenses(
      {
        search: filters.search || undefined,
        category: filters.category || undefined,
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
      category: '',
      start_date: '',
      end_date: '',
    });
    fetchExpenses({}, 1, pageSize);
  };

  const getCategoryLabel = (value: string) => {
    const category = expenseCategories.find((c) => c.value === value);
    return category ? category.label : value;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Dépenses</h1>
            <p className="page-subtitle">
              Suivi de vos dépenses et analyse des habitudes de consommation
            </p>
          </div>
          <button onClick={handleAdd} className="btn btn-primary">
            <Plus className="w-5 h-5 mr-2" />
            Ajouter une dépense
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="label">Rechercher</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  placeholder="Rechercher..."
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
                {expenseCategories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Date de début</label>
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

      {/* Expenses Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Liste des dépenses ({expensesState.total})
          </h3>
        </div>

        {expensesState.isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : expensesState.expenses.length === 0 ? (
          <div className="text-center py-12">
            <TrendingDown className="w-16 h-16 text-gray-300 mx-auto" />
            <p className="text-gray-500 mt-4">Aucune dépense enregistrée</p>
            <p className="text-sm text-gray-400 mt-2">
              Commencez par ajouter votre première dépense
            </p>
            <button onClick={handleAdd} className="btn btn-primary mt-4">
              <Plus className="w-5 h-5 mr-2" />
              Ajouter une dépense
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Catégorie</th>
                    <th>Description</th>
                    <th className="text-right">Montant</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expensesState.expenses.map((expense) => (
                    <tr key={expense.id}>
                      <td>{formatDate(expense.date)}</td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            backgroundColor: `${getCategoryColor(expense.category)}20`,
                            color: getCategoryColor(expense.category),
                          }}
                        >
                          {getCategoryLabel(expense.category)}
                        </span>
                      </td>
                      <td className="truncate-2 max-w-xs">{expense.description || '-'}</td>
                      <td className="text-right font-medium text-red-600">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(expense)}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(expense.id)}
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
            {expensesState.total > pageSize && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-500">
                  Affichage {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, expensesState.total)} sur {expensesState.total}
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
                    Page {page} sur {Math.ceil(expensesState.total / pageSize)}
                  </span>
                  <button
                    onClick={() => {
                      if (page < Math.ceil(expensesState.total / pageSize)) {
                        searchParams.set('page', (page + 1).toString());
                        setSearchParams(searchParams);
                      }
                    }}
                    disabled={page >= Math.ceil(expensesState.total / pageSize)}
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
      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        expense={editingExpense}
        categories={expenseCategories}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Supprimer la dépense"
        message="Êtes-vous sûr de vouloir supprimer cette dépense ? Cette action est irréversible."
      />
    </div>
  );
};

export default ExpensesPage;
