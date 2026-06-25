import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSavings } from '@/hooks/useSavings';
import { Plus, Search, Filter, PiggyBank, Edit, Trash2, TrendingUp, Target } from 'lucide-react';
import { formatCurrency, formatDate, calculateProgress } from '@/utils';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import SavingsModal from '@/components/savings/SavingsModal';
import DeleteConfirmModal from '@/components/common/DeleteConfirmModal';
import AddToSavingsModal from '@/components/savings/AddToSavingsModal';

const SavingsPage = () => {
  const { savingsState, fetchSavingsGoals, deleteSavingsGoal, addToSavings } = useSavings();
  const [searchParams, setSearchParams] = useSearchParams();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAddToSavingsOpen, setIsAddToSavingsOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<any>(null);

  const [filters, setFilters] = useState({
    search: '',
    status: '',
  });

  const action = searchParams.get('action');
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = 10;

  useEffect(() => {
    fetchSavingsGoals(
      {
        search: filters.search || undefined,
        category: filters.status || undefined,
      },
      page,
      pageSize
    );
  }, [fetchSavingsGoals, filters, page, pageSize]);

  useEffect(() => {
    if (action === 'add') {
      setIsModalOpen(true);
      setEditingGoal(null);
      searchParams.delete('action');
      setSearchParams(searchParams);
    }
  }, [action, searchParams, setSearchParams]);

  const handleAdd = () => {
    setEditingGoal(null);
    setIsModalOpen(true);
  };

  const handleEdit = (goal: any) => {
    setEditingGoal(goal);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (deleteId) {
      await deleteSavingsGoal(deleteId);
      setIsDeleteModalOpen(false);
      setDeleteId(null);
    }
  };

  const handleAddToSavings = (goal: any) => {
    setSelectedGoal(goal);
    setIsAddToSavingsOpen(true);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSavingsGoals(
      {
        search: filters.search || undefined,
        category: filters.status || undefined,
      },
      1,
      pageSize
    );
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      status: '',
    });
    fetchSavingsGoals({}, 1, pageSize);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Atteint';
      case 'cancelled':
        return 'Annulé';
      default:
        return 'En cours';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Épargne</h1>
            <p className="page-subtitle">
              Gérez vos objectifs d'épargne et suivez votre progression
            </p>
          </div>
          <button onClick={handleAdd} className="btn btn-primary">
            <Plus className="w-5 h-5 mr-2" />
            Créer un objectif
          </button>
        </div>
      </div>

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
                  placeholder="Rechercher par nom..."
                  className="input pl-10"
                />
              </div>
            </div>
            <div>
              <label className="label">Statut</label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="select"
              >
                <option value="">Tous les statuts</option>
                <option value="active">En cours</option>
                <option value="completed">Atteint</option>
                <option value="cancelled">Annulé</option>
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

      {/* Savings Goals Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Liste des objectifs ({savingsState.total})
          </h3>
        </div>

        {savingsState.isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : savingsState.savingsGoals.length === 0 ? (
          <div className="text-center py-12">
            <PiggyBank className="w-16 h-16 text-gray-300 mx-auto" />
            <p className="text-gray-500 mt-4">Aucun objectif d'épargne</p>
            <p className="text-sm text-gray-400 mt-2">
              Commencez par créer votre premier objectif
            </p>
            <button onClick={handleAdd} className="btn btn-primary mt-4">
              <Plus className="w-5 h-5 mr-2" />
              Créer un objectif
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {savingsState.savingsGoals.map((goal) => {
                const progress = calculateProgress(goal.current_amount, goal.target_amount);
                return (
                  <div
                    key={goal.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                            <Target className="w-6 h-6 text-purple-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{goal.name}</h4>
                            <p className="text-sm text-gray-500">{goal.description || 'Aucune description'}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`badge ${getStatusColor(goal.status)}`}
                        >
                          {getStatusLabel(goal.status)}
                        </span>
                        <button
                          onClick={() => handleAddToSavings(goal)}
                          className="btn btn-success btn-sm"
                          disabled={goal.status === 'completed'}
                        >
                          <TrendingUp className="w-4 h-4 mr-1" />
                          Ajouter
                        </button>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex justify-between text-sm mb-2">
                        <div>
                          <p className="text-gray-500">Objectif</p>
                          <p className="font-medium">{formatCurrency(goal.target_amount)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Économisé</p>
                          <p className="font-medium text-green-600">
                            {formatCurrency(goal.current_amount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Date limite</p>
                          <p className="font-medium">{formatDate(goal.target_date)}</p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {progress.toFixed(1)}% de l'objectif atteint
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(goal)}
                          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(goal.id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {savingsState.total > pageSize && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-500">
                  Affichage {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, savingsState.total)} sur {savingsState.total}
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
                    Page {page} sur {Math.ceil(savingsState.total / pageSize)}
                  </span>
                  <button
                    onClick={() => {
                      if (page < Math.ceil(savingsState.total / pageSize)) {
                        searchParams.set('page', (page + 1).toString());
                        setSearchParams(searchParams);
                      }
                    }}
                    disabled={page >= Math.ceil(savingsState.total / pageSize)}
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
      <SavingsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        goal={editingGoal}
      />

      {/* Add to Savings Modal */}
      <AddToSavingsModal
        isOpen={isAddToSavingsOpen}
        onClose={() => setIsAddToSavingsOpen(false)}
        goal={selectedGoal}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Supprimer l'objectif"
        message="Êtes-vous sûr de vouloir supprimer cet objectif d'épargne ? Cette action est irréversible."
      />
    </div>
  );
};

export default SavingsPage;
