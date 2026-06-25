import { useState, useRef, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Bot, Send, X, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { formatDateTime } from '@/utils';

const AIAssistantPage = () => {
  const { aiState, sendMessage, executeAction, cancelAction, clearMessages, analyzeFinances, generateReport } = useAppContext();
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    await sendMessage(message);
    setMessage('');
  };

  const handleExecuteAction = async () => {
    if (aiState.pendingAction) {
      await executeAction(aiState.pendingAction);
    }
  };

  // Suggestions de questions
  const suggestions = [
    "Ajoute une dépense de 5 000 FCFA pour internet",
    "J'ai vendu 3 chargeurs à 2 000 FCFA",
    "Combien ai-je gagné ce mois-ci ?",
    "Quels produits se vendent le mieux ?",
    "Combien me reste-t-il en stock ?",
    "Analyse mes finances",
    "Comment économiser davantage ?",
  ];

  // Faire défiler vers le bas des messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiState.messages]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Assistant IA</h1>
            <p className="page-subtitle">
              Votre comptable personnel intelligent
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={analyzeFinances} className="btn btn-secondary btn-sm">
              Analyser mes finances
            </button>
            <button onClick={clearMessages} className="btn btn-ghost btn-sm">
              <X className="w-4 h-4 mr-1" />
              Effacer
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Container */}
        <div className="lg:col-span-2">
          <div className="ai-chat-container h-[calc(100vh-200px)]">
            {/* Chat Header */}
            <div className="ai-chat-header">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <span className="font-medium">FinMaster AI</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs bg-white bg-opacity-20 px-2 py-0.5 rounded-full">
                  En ligne
                </span>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="ai-chat-messages">
              {aiState.messages.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bot className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Bonjour ! Comment puis-je vous aider ?
                  </h3>
                  <p className="text-gray-500 mt-2">
                    Je suis votre assistant financier intelligent. Posez-moi n'importe quelle question sur vos finances.
                  </p>
                </div>
              ) : (
                aiState.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`ai-message ${msg.role === 'user' ? 'ai-message-user' : msg.role === 'assistant' ? 'ai-message-assistant' : 'ai-message-system'}`}
                  >
                    <div className="ai-message-content">
                      {msg.content.split('\n').map((line, i) => (
                        <p key={i} className={i > 0 ? 'mt-2' : ''}>
                          {line}
                        </p>
                      ))}
                    </div>
                    <div className="ai-message-time">
                      {formatDateTime(msg.timestamp)}
                    </div>
                    
                    {/* Action Confirmation */}
                    {msg.action && !msg.action.confirmed && (
                      <div className="ai-action-confirmation mt-3">
                        <p className="text-sm font-medium text-yellow-800 mb-2">
                          Action en attente de confirmation:
                        </p>
                        <p className="text-sm text-yellow-700 mb-3">
                          {msg.action.type.replace(/_/g, ' ')}
                        </p>
                        <div className="flex space-x-2">
                          <button
                            onClick={handleExecuteAction}
                            className="btn btn-success btn-sm"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Confirmer
                          </button>
                          <button
                            onClick={cancelAction}
                            className="btn btn-danger btn-sm"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Annuler
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
              
              {aiState.isThinking && (
                <div className="ai-message ai-message-assistant">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-200 border-t-blue-600"></div>
                    <span className="text-sm">Réflexion en cours...</span>
                  </div>
                </div>
              )}
              
              {aiState.error && (
                <div className="ai-message ai-message-system">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    <span className="text-sm">{aiState.error}</span>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="ai-chat-input">
              <form onSubmit={handleSendMessage} className="ai-input-container">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Posez votre question..."
                  className="ai-input"
                  disabled={aiState.isLoading}
                />
                <button
                  type="submit"
                  disabled={!message.trim() || aiState.isLoading}
                  className="ai-send-button"
                >
                  {aiState.isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Suggestions Sidebar */}
        <div className="lg:col-span-1">
          <div className="card h-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Suggestions
            </h3>
            <div className="space-y-3">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setMessage(suggestion);
                    sendMessage(suggestion);
                    setMessage('');
                  }}
                  className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                Actions rapides
              </h4>
              <div className="space-y-2">
                <button
                  onClick={analyzeFinances}
                  className="w-full text-left p-2 rounded-lg hover:bg-gray-50 transition-colors text-sm text-blue-600"
                >
                  Analyser mes finances
                </button>
                <button
                  onClick={() => generateReport('monthly')}
                  className="w-full text-left p-2 rounded-lg hover:bg-gray-50 transition-colors text-sm text-blue-600"
                >
                  Générer un rapport mensuel
                </button>
                <button
                  onClick={() => generateReport('yearly')}
                  className="w-full text-left p-2 rounded-lg hover:bg-gray-50 transition-colors text-sm text-blue-600"
                >
                  Générer un rapport annuel
                </button>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                Conseils
              </h4>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Astuce:</strong> Vous pouvez demander à l'IA d'ajouter des revenus, des dépenses ou des produits directement en utilisant des phrases naturelles.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantPage;
