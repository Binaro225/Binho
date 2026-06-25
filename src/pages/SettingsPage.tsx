import { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Settings, User, Bell, Shield, Language, Currency, LogOut, Upload, X, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import DeleteConfirmModal from '@/components/common/DeleteConfirmModal';

const SettingsPage = () => {
  const { authState, signOut, updateProfile } = useAppContext();

  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: '',
    email: '',
    avatar_url: '',
  });
  const [notificationSettings, setNotificationSettings] = useState({
    stock_alerts: true,
    savings_goals: true,
    debt_reminders: true,
    expense_analysis: true,
  });
  const [preferences, setPreferences] = useState({
    currency: 'FCFA',
    language: 'fr',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (authState.user) {
      setProfileData({
        full_name: authState.user.full_name || '',
        email: authState.user.email || '',
        avatar_url: authState.user.avatar_url || '',
      });
      setAvatarPreview(authState.user.avatar_url || null);
    }
  }, [authState.user]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSuccessMessage('');
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
    setSuccessMessage('');
  };

  const handleNotificationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setNotificationSettings((prev) => ({ ...prev, [name]: checked }));
  };

  const handlePreferenceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPreferences((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    setProfileData((prev) => ({ ...prev, avatar_url: '' }));
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!authState.user) return;

    setIsLoading(true);
    setSuccessMessage('');

    try {
      let avatarUrl = profileData.avatar_url;

      // Upload avatar if changed
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${authState.user.id}-${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile);

        if (uploadError) {
          throw uploadError;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        avatarUrl = urlData.publicUrl;
      }

      // Update profile
      await updateProfile({
        full_name: profileData.full_name,
        avatar_url: avatarUrl,
      });

      setSuccessMessage('Profil mis à jour avec succès !');
      setAvatarFile(null);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateNotifications = async () => {
    // Implémenter la mise à jour des notifications
    console.log('Mise à jour des notifications:', notificationSettings);
    setSuccessMessage('Préférences de notification mises à jour !');
  };

  const handleUpdatePreferences = async () => {
    // Implémenter la mise à jour des préférences
    console.log('Mise à jour des préférences:', preferences);
    setSuccessMessage('Préférences mises à jour !');
  };

  const handleDeleteAccount = async () => {
    if (!authState.user) return;

    try {
      // Supprimer l'utilisateur de Supabase Auth
      const { error } = await supabase.rpc('delete_user', {
        user_id: authState.user.id,
      });

      if (error) {
        throw error;
      }

      // Déconnecter l'utilisateur
      await signOut();
    } catch (error) {
      console.error('Erreur lors de la suppression du compte:', error);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'preferences', label: 'Préférences', icon: Settings },
    { id: 'security', label: 'Sécurité', icon: Shield },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Paramètres</h1>
          <p className="page-subtitle">
            Gérez votre profil et vos préférences
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800 text-sm mb-6">
            {successMessage}
          </div>
        )}

        {/* Tab Content */}
        <div className="space-y-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Informations du profil</h3>

              {/* Avatar */}
              <div>
                <label className="label">Photo de profil</label>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Photo de profil"
                        className="w-20 h-20 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-10 h-10 text-blue-600" />
                      </div>
                    )}
                    {avatarPreview && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      id="avatar"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="avatar"
                      className="btn btn-secondary btn-sm"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Changer la photo
                    </label>
                  </div>
                </div>
              </div>

              {/* Profile Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="full_name" className="label">
                    Nom complet
                  </label>
                  <input
                    type="text"
                    id="full_name"
                    name="full_name"
                    value={profileData.full_name}
                    onChange={handleProfileChange}
                    placeholder="Votre nom complet"
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Adresse email</label>
                  <input
                    type="email"
                    value={profileData.email}
                    readOnly
                    className="input bg-gray-100 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary"
                >
                  {isLoading ? (
                    <>
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></span>
                      Mise à jour en cours...
                    </>
                  ) : (
                    'Mettre à jour le profil'
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Préférences de notification
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Alertes de stock faible</h4>
                    <p className="text-sm text-gray-500">
                      Recevez des notifications lorsque le stock d'un produit est faible
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="stock_alerts"
                      checked={notificationSettings.stock_alerts}
                      onChange={handleNotificationChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Objectifs d'épargne</h4>
                    <p className="text-sm text-gray-500">
                      Recevez des notifications lorsque vous atteignez vos objectifs d'épargne
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="savings_goals"
                      checked={notificationSettings.savings_goals}
                      onChange={handleNotificationChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Rappels de dettes</h4>
                    <p className="text-sm text-gray-500">
                      Recevez des notifications pour les dettes à rembourser
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="debt_reminders"
                      checked={notificationSettings.debt_reminders}
                      onChange={handleNotificationChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Analyse des dépenses</h4>
                    <p className="text-sm text-gray-500">
                      Recevez des notifications pour les dépenses anormales
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="expense_analysis"
                      checked={notificationSettings.expense_analysis}
                      onChange={handleNotificationChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end">
                <button onClick={handleUpdateNotifications} className="btn btn-primary">
                  Mettre à jour les préférences
                </button>
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Préférences générales
              </h3>

              <div className="space-y-4">
                <div>
                  <label htmlFor="currency" className="label">
                    Devise
                  </label>
                  <select
                    id="currency"
                    name="currency"
                    value={preferences.currency}
                    onChange={handlePreferenceChange}
                    className="select"
                  >
                    <option value="FCFA">FCFA (XOF)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="language" className="label">
                    Langue
                  </label>
                  <select
                    id="language"
                    name="language"
                    value={preferences.language}
                    onChange={handlePreferenceChange}
                    className="select"
                  >
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                    <option value="es">Español</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end">
                <button onClick={handleUpdatePreferences} className="btn btn-primary">
                  Mettre à jour les préférences
                </button>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Sécurité du compte
              </h3>

              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <h4 className="font-medium text-yellow-800 mb-2">
                    Changer le mot de passe
                  </h4>
                  <p className="text-sm text-yellow-700 mb-3">
                    Pour changer votre mot de passe, veuillez utiliser le lien de réinitialisation.
                  </p>
                  <button className="btn btn-warning btn-sm">
                    Envoyer le lien de réinitialisation
                  </button>
                </div>

                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <h4 className="font-medium text-red-800 mb-2">
                    Supprimer le compte
                  </h4>
                  <p className="text-sm text-red-700 mb-3">
                    Cette action est irréversible. Toutes vos données seront supprimées définitivement.
                  </p>
                  <button
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="btn btn-danger btn-sm"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer mon compte
                  </button>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">
                    Déconnexion
                  </h4>
                  <p className="text-sm text-gray-500 mb-3">
                    Terminez votre session actuelle.
                  </p>
                  <button onClick={signOut} className="btn btn-secondary btn-sm">
                    <LogOut className="w-4 h-4 mr-2" />
                    Se déconnecter
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteAccount}
        title="Supprimer le compte"
        message="Êtes-vous absolument sûr de vouloir supprimer votre compte ? Cette action est irréversible et toutes vos données seront perdues."
        confirmText="Oui, supprimer mon compte"
        cancelText="Annuler"
      />
    </div>
  );
};

export default SettingsPage;
