import { Outlet } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';

const AuthLayout = () => {
  const { authState } = useAppContext();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">FM</span>
                </div>
                <span className="ml-3 text-xl font-bold text-gray-900">FinMaster AI</span>
              </div>
            </div>
            
            {/* Lien vers l'application si déjà connecté */}
            {authState.isAuthenticated && (
              <a href="/" className="text-sm text-blue-600 hover:text-blue-700">
                Aller à l'application
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} FinMaster AI. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default AuthLayout;
