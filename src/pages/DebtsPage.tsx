import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDebts } from '@/hooks/useDebts';
import { Plus, Search, Filter, FileText, Edit, Trash2, User, Users, Calendar, AlertTriangle } from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import DebtModal from '@/components/debts/DebtModal';
import DeleteConfirmModal from '@/components/common/DeleteConfirmModal';
import DebtPaymentModal from '@/components/debts/DebtPaymentModal';

const debtTypes = [
  { value: 'given', label: 'Dette donnée' },
  { value: 'received', label: 'Dette reçue' },
];

const debtStatuses = [
  { value: 'pending', label: 'En attente' },
  { value: 'partial', label: 'Partiellement remboursée' },
  { value: 'paid', label: 'Remboursée' },
  { value: 'cancelled', label: 'Annulée' },
];

const DebtsPage = () => {
  const { debtsState, fetchDebts, deleteDebt, getDebtPayments } = useDebts();
  const [searchParams, setSearchParams] = useSearchParams();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [expandedDebtId, setExpandedDebtId] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    search: '',
    debt_type: '',
    status: '',
  });

  const action = searchParams.get('action');
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = 10;

  useEffect(() => {
    fetchDebts(
      {
        search: filters.search || undefined,
        category: filters.debt_type || undefined,
      },
      page,
      pageSize
    );
  }, [fetchDebts, filters, page, pageSize]);

  useEffect(() => {
    if (action === 'add') {
      setIsModalOpen(true);
      setEditingDebt(null);
      searchParams.delete('action');
      setSearchParams(searchParams);
    }
  }, [action, searchParams, setSearchParams]);

  const handleAdd = () => {
    setEditingDebt(null);
    setIsModalOpen(true);
  };

  const handleEdit = (debt: any) => {
    setEditingDebt(debt);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (deleteId) {
      await deleteDebt(deleteId);
      setIsDeleteModalOpen(false);
      setDeleteId(null);
    }
  };

  const handleAddPayment = async (debt: any) => {
    setSelectedDebt(debt);
    const payments = await getDebtPayments(debt.id);
    setPayments(payments);
    setIsPaymentModalOpen(true);
  };

  const handleToggleExpand = async (debtId: string) => {
    if (expandedDebtId === debtId) {
      setExpandedDebtId(null);
      setPayments([]);
    } else {
      const debt = debtsState.debts.find((d) => d.id === debtId);
      if (debt) {
        const payments = await getDebtPayments(debtId);
        setPayments(payments);
        setExpandedDebtId(debtId);
      }
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDebts(
      {
        search: filters.search || undefined,
        category: filters.debt_type || undefined,
      },
      1,
      pageSize
    );
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      debt_type: '',
      status: '',
    });
    fetchDebts({}, 1, pageSize);
  };

  const getTypeLabel = (type: string) => {
    const debtType = debtTypes.find((t) => t.value === type);
    return debtType ? debtType.label : type;
  };

  const getStatusLabel = (status: string) => {
    const debtStatus = debtStatuses.find((s) => s.value === status);
    return debtStatus ? debtStatus.label : status;
  };

  const getStatusColor = (status: string, type: string) => {
    if (status === 'paid') return 'bg-green-100 text-green-800';
    if (status === 'cancelled') return 'bg-red-100 text-red-800';
    if (status === 'partial') return 'bg-yellow-100 text-yellow-800';
    return type === 'given' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800';
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Dettes</h1>
            <p className="page-subtitle">
              Suivi de vos dettes données et reçues
            </p>
          </div>
          <button onClick={handleAdd} className="btn btn-primary">
            <Plus className="w-5 h-5 mr-2" />
            Ajouter une dette
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
                  placeholder="Rechercher par nom..."
                  className="input pl-10"
                />
              </div>
            </div>
            <div>
              <label className="label">Type</label>
              <select
                name="debt_type"
                value={filters.debt_type}
                onChange={handleFilterChange}
                className="select"
              >
                <option value="">Tous les types</option>
                {debtTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
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
                {debtStatuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
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

      {/* Debts Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Liste des dettes ({debtsState.total})
          </h3>
        </div>

        {debtsState.isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : debtsState.debts.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto" />
            <p className="text-gray-500 mt-4">Aucune dette enregistrée</p>
            <p className="text-sm text-gray-400 mt-2">
              Commencez par ajouter votre première dette
            </p>
            <button onClick={handleAdd} className="btn btn-primary mt-4">
              <Plus className="w-5 h-5 mr-2" />
              Ajouter une dette
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {debtsState.debts.map((debt) => (
                <div
                  key={debt.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center ${getStatusColor(debt.status, debt.debt_type)}`}
                        >
                          {debt.debt_type === 'given' ? (
                            <Users className="w-6 h-6 text-current" />
                          ) : (
                            <User className="w-6 h-6 text-current" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{debt.name}</h4>
                          <p className="text-sm text-gray-500">{debt.description || 'Aucune description'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`badge ${getStatusColor(debt.status, debt.debt_type)}`}
                      >
                        {getStatusLabel(debt.status)}
                      </span>
                      <button
                        onClick={() => handleAddPayment(debt)}
                        className="btn btn-success btn-sm"
                        disabled={debt.status === 'paid' || debt.status === 'cancelled'}
                      >
                        Rembourser
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Type</p>
                      <p className="font-medium">{getTypeLabel(debt.debt_type)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Montant</p>
                      <p className={`font-medium ${debt.debt_type === 'given' ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(debt.amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Date</p>
                      <p className="font-medium">{formatDate(debt.date)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Échéance</p>
                      <p className="font-medium">{debt.due_date ? formatDate(debt.due_date) : '-'}</p>
                    </div>
                  </div>

                  {/* Payments History */}
                  <div className="mt-4">
                    <button
                      onClick={() => handleToggleExpand(debt.id)}
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                    >
                      {expandedDebtId === debt.id ? 'Masquer' : 'Voir'} l'historique des paiements
                      <span className="ml-1">{expandedDebtId === debt.id ? '▲' : '▼'}</span>
                    </button>

                    {expandedDebtId === debt.id && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        {payments.length > 0 ? (
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
                        ) : (
                          <p className="text-sm text-gray-500">Aucun paiement enregistré</p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(debt)}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(debt.id)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {debtsState.total > pageSize && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-500">
                  Affichage {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, debtsState.total)} sur {debtsState.total}
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
                    Page {page} sur {Math.ceil(debtsState.total / pageSize)}
                  </span>
                  <button
                    onClick={() => {
                      if (page < Math.ceil(debtsState.total / pageSize)) {
                        searchParams.set('page', (page + 1).toString());
                        setSearchParams(searchParams);
                      }
                    }}
                    disabled={page >= Math.ceil(debtsState.total / pageSize)}
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
      <DebtModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        debt={editingDebt}
        types={debtTypes}
      />

      {/* Payment Modal */}
      <DebtPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        debt={selectedDebt}
        payments={payments}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Supprimer la dette"
        message="Êtes-vous sûr de vouloir supprimer cette dette ? Cette action est irréversible."
      />
    </div>
  );
};

export default DebtsPage;
