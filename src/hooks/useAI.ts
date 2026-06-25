import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { AIMessage, AIAction, AIContext } from '@/types';
import { useAuth } from './useAuth';
import { useIncomes } from './useIncomes';
import { useExpenses } from './useExpenses';
import { useProducts } from './useProducts';
import { useSales } from './useSales';
import { useSavings } from './useSavings';
import { useDebts } from './useDebts';
import { v4 as uuidv4 } from 'uuid';

// Configuration de l'API Mistral

export interface MistralConfig {
  apiKey: string;
  model: string;
  endpoint: string;
}

export interface AIState {
  messages: AIMessage[];
  isLoading: boolean;
  error: string | null;
  isThinking: boolean;
  pendingAction: AIAction | null;
}

export interface ToolFunction {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (params: Record<string, any>) => Promise<any>;
}

export const useAI = () => {
  const { authState } = useAuth();
  const { addIncome } = useIncomes();
  const { addExpense } = useExpenses();
  const { addProduct, updateProduct, updateStock } = useProducts();
  const { recordSale } = useSales();
  const { createSavingsGoal, addToSavings } = useSavings();
  const { addDebt } = useDebts();

  const [aiState, setAiState] = useState<AIState>({
    messages: [],
    isLoading: false,
    error: null,
    isThinking: false,
    pendingAction: null,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fonctions outils disponibles pour l'IA
  const tools: ToolFunction[] = [
    {
      name: 'add_income',
      description: 'Ajouter un revenu pour l\'utilisateur',
      parameters: {
        type: 'object',
        properties: {
          amount: { type: 'number', description: 'Montant du revenu' },
          category: { type: 'string', description: 'Categorie du revenu (salaire, freelance, vente, cadeau, commission, autre)' },
          description: { type: 'string', description: 'Description du revenu' },
          date: { type: 'string', description: 'Date du revenu (format YYYY-MM-DD)' },
        },
        required: ['amount', 'category', 'date'],
      },
      execute: async (params) => {
        if (!authState.user) return null;
        return await addIncome({
          amount: params.amount,
          category: params.category as any,
          description: params.description,
          date: params.date,
        });
      },
    },
    {
      name: 'add_expense',
      description: 'Ajouter une depense pour l\'utilisateur',
      parameters: {
        type: 'object',
        properties: {
          amount: { type: 'number', description: 'Montant de la depense' },
          category: { type: 'string', description: 'Categorie de la depense (nourriture, transport, internet, sante, education, loyer, divertissement, autre)' },
          description: { type: 'string', description: 'Description de la depense' },
          date: { type: 'string', description: 'Date de la depense (format YYYY-MM-DD)' },
        },
        required: ['amount', 'category', 'date'],
      },
      execute: async (params) => {
        if (!authState.user) return null;
        return await addExpense({
          amount: params.amount,
          category: params.category as any,
          description: params.description,
          date: params.date,
        });
      },
    },
    {
      name: 'add_product',
      description: 'Ajouter un produit au stock',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Nom du produit' },
          description: { type: 'string', description: 'Description du produit' },
          category: { type: 'string', description: 'Categorie du produit' },
          purchase_price: { type: 'number', description: 'Prix d\'achat' },
          selling_price: { type: 'number', description: 'Prix de vente' },
          quantity: { type: 'number', description: 'Quantite initiale' },
          min_quantity: { type: 'number', description: 'Quantite minimale pour alerte' },
          supplier: { type: 'string', description: 'Fournisseur du produit' },
        },
        required: ['name', 'purchase_price', 'selling_price', 'quantity'],
      },
      execute: async (params) => {
        if (!authState.user) return null;
        return await addProduct({
          name: params.name,
          description: params.description,
          category: params.category,
          purchase_price: params.purchase_price,
          selling_price: params.selling_price,
          quantity: params.quantity,
          min_quantity: params.min_quantity || 0,
          supplier: params.supplier,
        });
      },
    },
    {
      name: 'update_product',
      description: 'Mettre a jour un produit existant',
      parameters: {
        type: 'object',
        properties: {
          product_id: { type: 'string', description: 'ID du produit a mettre a jour' },
          name: { type: 'string', description: 'Nouveau nom du produit' },
          description: { type: 'string', description: 'Nouvelle description' },
          category: { type: 'string', description: 'Nouvelle categorie' },
          purchase_price: { type: 'number', description: 'Nouveau prix d\'achat' },
          selling_price: { type: 'number', description: 'Nouveau prix de vente' },
          quantity: { type: 'number', description: 'Nouvelle quantite' },
          min_quantity: { type: 'number', description: 'Nouvelle quantite minimale' },
          supplier: { type: 'string', description: 'Nouveau fournisseur' },
        },
        required: ['product_id'],
      },
      execute: async (params) => {
        if (!authState.user) return null;
        const productId = params.product_id;
        delete params.product_id;
        return await updateProduct(productId, params);
      },
    },
    {
      name: 'record_sale',
      description: 'Enregistrer une vente',
      parameters: {
        type: 'object',
        properties: {
          customer_name: { type: 'string', description: 'Nom du client' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                product_id: { type: 'string', description: 'ID du produit' },
                quantity: { type: 'number', description: 'Quantite vendue' },
                unit_price: { type: 'number', description: 'Prix unitaire' },
              },
              required: ['product_id', 'quantity', 'unit_price'],
            },
          },
          discount: { type: 'number', description: 'Remise en pourcentage' },
          date: { type: 'string', description: 'Date de la vente (format YYYY-MM-DD)' },
        },
        required: ['items', 'date'],
      },
      execute: async (params) => {
        if (!authState.user) return null;
        return await recordSale({
          customer_name: params.customer_name,
          items: params.items,
          discount: params.discount || 0,
          date: params.date,
        });
      },
    },
    {
      name: 'update_stock',
      description: 'Mettre a jour le stock d\'un produit',
      parameters: {
        type: 'object',
        properties: {
          product_id: { type: 'string', description: 'ID du produit' },
          quantity_change: { type: 'number', description: 'Changement de quantite (positif pour entree, negatif pour sortie)' },
          type: { type: 'string', enum: ['in', 'out'], description: 'Type de mouvement (in ou out)' },
        },
        required: ['product_id', 'quantity_change', 'type'],
      },
      execute: async (params) => {
        if (!authState.user) return null;
        return await updateStock(params.product_id, params.quantity_change, params.type as 'in' | 'out');
      },
    },
    {
      name: 'create_savings_goal',
      description: 'Creer un objectif d\'epargne',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Nom de l\'objectif' },
          target_amount: { type: 'number', description: 'Montant cible' },
          target_date: { type: 'string', description: 'Date cible (format YYYY-MM-DD)' },
          description: { type: 'string', description: 'Description de l\'objectif' },
        },
        required: ['name', 'target_amount', 'target_date'],
      },
      execute: async (params) => {
        if (!authState.user) return null;
        return await createSavingsGoal({
          name: params.name,
          target_amount: params.target_amount,
          target_date: params.target_date,
          description: params.description,
        });
      },
    },
    {
      name: 'add_to_savings',
      description: 'Ajouter de l\'argent a un objectif d\'epargne',
      parameters: {
        type: 'object',
        properties: {
          goal_id: { type: 'string', description: 'ID de l\'objectif d\'epargne' },
          amount: { type: 'number', description: 'Montant a ajouter' },
        },
        required: ['goal_id', 'amount'],
      },
      execute: async (params) => {
        if (!authState.user) return null;
        return await addToSavings(params.goal_id, params.amount);
      },
    },
    {
      name: 'add_debt',
      description: 'Ajouter une dette',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Nom de la dette' },
          amount: { type: 'number', description: 'Montant de la dette' },
          debt_type: { type: 'string', enum: ['given', 'received'], description: 'Type de dette (given ou received)' },
          date: { type: 'string', description: 'Date de la dette (format YYYY-MM-DD)' },
          due_date: { type: 'string', description: 'Date d\'echeance (format YYYY-MM-DD)' },
          description: { type: 'string', description: 'Description de la dette' },
        },
        required: ['name', 'amount', 'debt_type', 'date'],
      },
      execute: async (params) => {
        if (!authState.user) return null;
        return await addDebt({
          name: params.name,
          amount: params.amount,
          debt_type: params.debt_type as 'given' | 'received',
          date: params.date,
          due_date: params.due_date,
          description: params.description,
        });
      },
    },
  ];

  // Recuperer le contexte financier de l'utilisateur
  const getFinancialContext = useCallback(async (): Promise<AIContext | null> => {
    if (!authState.user) return null;

    try {
      const [incomes, expenses, products, sales, savingsGoals, debts] = await Promise.all([
        supabase.from('incomes').select('*').eq('user_id', authState.user.id).order('date', { ascending: false }),
        supabase.from('expenses').select('*').eq('user_id', authState.user.id).order('date', { ascending: false }),
        supabase.from('products').select('*').eq('user_id', authState.user.id),
        supabase.from('sales').select('*').eq('user_id', authState.user.id).order('date', { ascending: false }),
        supabase.from('savings_goals').select('*').eq('user_id', authState.user.id),
        supabase.from('debts').select('*').eq('user_id', authState.user.id),
      ]);

      return {
        user_id: authState.user.id,
        financial_data: {
          incomes: incomes.data || [],
          expenses: expenses.data || [],
          products: products.data || [],
          sales: sales.data || [],
          savings_goals: savingsGoals.data || [],
          debts: debts.data || [],
        },
        preferences: {
          currency: 'FCFA',
          language: 'fr',
        },
      };
    } catch (error) {
      console.error('Erreur lors de la recuperation du contexte financier:', error);
      return null;
    }
  }, [authState.user]);

  // Envoyer un message a l'IA
  const sendMessage = useCallback(async (message: string) => {
    if (!authState.user) {
      setAiState({
        ...aiState,
        error: 'Utilisateur non connecte',
      });
      return;
    }

    try {
      setAiState((prev) => ({
        ...prev,
        isLoading: true,
        isThinking: true,
        error: null,
      }));

      // Ajouter le message de l'utilisateur
      const userMessage: AIMessage = {
        id: uuidv4(),
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
      };

      setAiState((prev) => ({
        ...prev,
        messages: [...prev.messages, userMessage],
      }));

      // Recuperer le contexte financier
      const context = await getFinancialContext();

      // Preparer le prompt avec le contexte
      const systemPrompt = `
Tu es FinMaster AI, un comptable personnel intelligent qui comprend et gere les finances de l'utilisateur.

Contexte de l'utilisateur:
- Devise: ${context?.preferences.currency || 'FCFA'}
- Revenus recents: ${context?.financial_data.incomes.length || 0} entrees
- Depenses recentes: ${context?.financial_data.expenses.length || 0} entrees
- Produits en stock: ${context?.financial_data.products.length || 0} articles
- Ventes enregistrees: ${context?.financial_data.sales.length || 0} ventes
- Objectifs d'epargne: ${context?.financial_data.savings_goals.length || 0} objectifs
- Dettes: ${context?.financial_data.debts.length || 0} dettes

Regles:
1. Reponds toujours en francais
2. Sois precis et base sur les donnees disponibles
3. Si tu dois effectuer une action (ajouter, modifier, supprimer), demande toujours confirmation avant d'executer
4. Utilise les outils disponibles pour interagir avec les donnees
5. Si tu ne peux pas repondre avec les donnees disponibles, dis-le clairement
6. Fournis des conseils financiers intelligents bases sur l'analyse des donnees

Donnees financieres detaillees:
${JSON.stringify(context?.financial_data, null, 2)}
`;

      // Preparer les definitions des outils pour l'API
      const toolsDefinitions = tools.map((tool) => ({
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
        },
      }));

      // Appeler l'API Mistral
      const mistralApiKey = import.meta.env.VITE_MISTRAL_API_KEY;
      const mistralModel = 'mistral-large-latest';

      if (!mistralApiKey) {
        throw new Error('Cle API Mistral non configuree');
      }

      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mistralApiKey}`,
        },
        body: JSON.stringify({
          model: mistralModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message },
          ],
          tools: toolsDefinitions,
          tool_choice: 'auto',
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur API Mistral: ${response.statusText}`);
      }

      const data = await response.json();

      // Traiter la reponse
      if (data.choices && data.choices[0]) {
        const choice = data.choices[0];

        // Si l'IA veut utiliser un outil
        if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
          const toolCall = choice.message.tool_calls[0];
          const toolName = toolCall.function.name;
          const toolArgs = JSON.parse(toolCall.function.arguments);

          // Trouver l'outil correspondant
          const tool = tools.find((t) => t.name === toolName);

          if (tool) {
            // Creer un message assistant avec l'appel d'outil
            const assistantMessage: AIMessage = {
              id: uuidv4(),
              role: 'assistant',
              content: choice.message.content || `Je vais executer l'action: ${toolName}`,
              timestamp: new Date().toISOString(),
              action: {
                type: toolName as any,
                data: toolArgs,
                confirmed: false,
              },
            };

            setAiState((prev) => ({
              ...prev,
              messages: [...prev.messages, assistantMessage],
              isLoading: false,
              isThinking: false,
              pendingAction: assistantMessage.action!,
            }));

            return;
          }
        }

        // Reponse normale sans appel d'outil
        const assistantMessage: AIMessage = {
          id: uuidv4(),
          role: 'assistant',
          content: choice.message.content || 'Desole, je n\'ai pas pu generer de reponse.',
          timestamp: new Date().toISOString(),
        };

        setAiState((prev) => ({
          ...prev,
          messages: [...prev.messages, assistantMessage],
          isLoading: false,
          isThinking: false,
          pendingAction: null,
        }));
      }
    } catch (error) {
      const userMessage: AIMessage = {
        id: uuidv4(),
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
      };
      setAiState({
        messages: [...aiState.messages, userMessage],
        isLoading: false,
        isThinking: false,
        error: error instanceof Error ? error.message : 'Erreur lors de l\'envoi du message',
        pendingAction: null,
      });
    }
  }, [authState.user, aiState.messages, getFinancialContext]);

  // Executer une action confirmee
  const executeAction = useCallback(async (action: AIAction) => {
    try {
      setAiState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      // Trouver et executer l'outil
      const tool = tools.find((t) => t.name === action.type);

      if (!tool) {
        throw new Error('Outil non trouve');
      }

      const result = await tool.execute(action.data);

      // Ajouter un message de confirmation
      const confirmationMessage: AIMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: `Action executee avec succes: ${action.type}\nResultat: ${JSON.stringify(result, null, 2)}`,
        timestamp: new Date().toISOString(),
      };

      setAiState((prev) => ({
        ...prev,
        messages: [...prev.messages, confirmationMessage],
        isLoading: false,
        pendingAction: null,
      }));

      return result;
    } catch (error) {
      setAiState({
        ...aiState,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erreur lors de l\'execution de l\'action',
        pendingAction: null,
      });
      return null;
    }
  }, [aiState.messages]);

  // Annuler l'action en attente
  const cancelAction = useCallback(() => {
    setAiState((prev) => ({
      ...prev,
      pendingAction: null,
    }));
  }, []);

  // Effacer les messages
  const clearMessages = useCallback(() => {
    setAiState({
      messages: [],
      isLoading: false,
      error: null,
      isThinking: false,
      pendingAction: null,
    });
  }, []);

  // Analyser les finances
  const analyzeFinances = useCallback(async () => {
    if (!authState.user) {
      setAiState({
        ...aiState,
        error: 'Utilisateur non connecte',
      });
      return null;
    }

    try {
      setAiState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      const context = await getFinancialContext();

      if (!context) {
        throw new Error('Contexte financier non disponible');
      }

      // Calculer les statistiques
      const totalIncome = context.financial_data.incomes.reduce((sum, i: any) => sum + i.amount, 0);
      const totalExpenses = context.financial_data.expenses.reduce((sum, e: any) => sum + e.amount, 0);
      const totalSales = context.financial_data.sales.reduce((sum, s: any) => sum + s.total_amount, 0);
      const totalProfit = context.financial_data.sales.reduce((sum, s: any) => sum + s.profit, 0);
      const totalSavings = context.financial_data.savings_goals.reduce((sum, s: any) => sum + s.current_amount, 0);
      const totalDebtGiven = context.financial_data.debts
        .filter((d: any) => d.debt_type === 'given')
        .reduce((sum, d: any) => sum + d.amount, 0);
      const totalDebtReceived = context.financial_data.debts
        .filter((d: any) => d.debt_type === 'received')
        .reduce((sum, d: any) => sum + d.amount, 0);

      const netWorth = totalIncome - totalExpenses + totalProfit + totalSavings - totalDebtGiven + totalDebtReceived;

      // Detecter les categories de depenses les plus elevees
      const expenseCategories: Record<string, number> = {};
      context.financial_data.expenses.forEach((e: any) => {
        expenseCategories[e.category] = (expenseCategories[e.category] || 0) + e.amount;
      });
      const topExpenseCategories = Object.entries(expenseCategories)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

      // Generer l'analyse
      const analysis = `
# Analyse Financiere Complete

## Resume Global
- **Valeur nette**: ${netWorth.toLocaleString()} ${context.preferences.currency}
- **Revenus totaux**: ${totalIncome.toLocaleString()} ${context.preferences.currency}
- **Depenses totales**: ${totalExpenses.toLocaleString()} ${context.preferences.currency}
- **Benefices des ventes**: ${totalProfit.toLocaleString()} ${context.preferences.currency}
- **Epargne actuelle**: ${totalSavings.toLocaleString()} ${context.preferences.currency}
- **Dettes a recevoir**: ${totalDebtReceived.toLocaleString()} ${context.preferences.currency}
- **Dettes a payer**: ${totalDebtGiven.toLocaleString()} ${context.preferences.currency}

## Top 3 Categories de Depenses
${topExpenseCategories.map(([category, amount], index) => 
  `${index + 1}. **${category}**: ${amount.toLocaleString()} ${context.preferences.currency}`
).join('\n')}

## Recommandations
${netWorth < 0 ? 
  '- Attention: Votre valeur nette est negative. Vous depensez plus que vous ne gagnez.' : 
  '- Votre situation financiere est saine.'}
${totalExpenses > totalIncome * 0.7 ? 
  '- Conseil: Vos depenses representent plus de 70% de vos revenus. Essayez de reduire vos depenses.' : ''}
${context.financial_data.products.length === 0 ? 
  '- Opportunite: Vous n\'avez pas de produits en stock. Pensez a ajouter des articles a vendre.' : ''}
${context.financial_data.savings_goals.length === 0 ? 
  '- Conseil: Creez des objectifs d\'epargne pour mieux gerer vos economies.' : ''}
`;

      // Ajouter le message d'analyse
      const analysisMessage: AIMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: analysis,
        timestamp: new Date().toISOString(),
      };

      setAiState((prev) => ({
        ...prev,
        messages: [...prev.messages, analysisMessage],
        isLoading: false,
      }));

      return analysis;
    } catch (error) {
      setAiState({
        ...aiState,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erreur lors de l\'analyse financiere',
      });
      return null;
    }
  }, [authState.user, aiState.messages, getFinancialContext]);

  // Generer un rapport
  const generateReport = useCallback(async (type: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly') => {
    if (!authState.user) {
      setAiState({
        ...aiState,
        error: 'Utilisateur non connecte',
      });
      return null;
    }

    try {
      setAiState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      const context = await getFinancialContext();

      if (!context) {
        throw new Error('Contexte financier non disponible');
      }

      // Filtrer les donnees selon la periode
      const now = new Date();
      let startDate: Date;

      switch (type) {
        case 'daily':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'weekly':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'monthly':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'yearly':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      const startDateStr = startDate.toISOString();

      // Filtrer les donnees
      const filteredIncomes = context.financial_data.incomes.filter(
        (i: any) => i.date >= startDateStr
      );
      const filteredExpenses = context.financial_data.expenses.filter(
        (e: any) => e.date >= startDateStr
      );
      const filteredSales = context.financial_data.sales.filter(
        (s: any) => s.date >= startDateStr
      );

      // Calculer les totaux
      const totalIncome = filteredIncomes.reduce((sum, i: any) => sum + i.amount, 0);
      const totalExpenses = filteredExpenses.reduce((sum, e: any) => sum + e.amount, 0);
      const totalSales = filteredSales.reduce((sum, s: any) => sum + s.total_amount, 0);
      const totalProfit = filteredSales.reduce((sum, s: any) => sum + s.profit, 0);

      // Generer le rapport
      const report = `
# Rapport Financier ${type.charAt(0).toUpperCase() + type.slice(1)}

**Periode**: ${startDate.toLocaleDateString()} - ${now.toLocaleDateString()}

## Resume
- **Revenus**: ${totalIncome.toLocaleString()} ${context.preferences.currency}
- **Depenses**: ${totalExpenses.toLocaleString()} ${context.preferences.currency}
- **Solde**: ${(totalIncome - totalExpenses).toLocaleString()} ${context.preferences.currency}
- **Ventes**: ${totalSales.toLocaleString()} ${context.preferences.currency}
- **Benefices**: ${totalProfit.toLocaleString()} ${context.preferences.currency}

## Details

### Revenus par categorie
${Object.entries(
  filteredIncomes.reduce((acc: Record<string, number>, income: any) => {
    acc[income.category] = (acc[income.category] || 0) + income.amount;
    return acc;
  }, {})
).map(([category, amount]) => `- **${category}**: ${amount.toLocaleString()} ${context.preferences.currency}`)
.join('\n')}

### Depenses par categorie
${Object.entries(
  filteredExpenses.reduce((acc: Record<string, number>, expense: any) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {})
).map(([category, amount]) => `- **${category}**: ${amount.toLocaleString()} ${context.preferences.currency}`)
.join('\n')}

### Ventes
- **Nombre de ventes**: ${filteredSales.length}
- **Ventes totales**: ${totalSales.toLocaleString()} ${context.preferences.currency}
- **Benefices totaux**: ${totalProfit.toLocaleString()} ${context.preferences.currency}
`;

      // Ajouter le message de rapport
      const reportMessage: AIMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: report,
        timestamp: new Date().toISOString(),
      };

      setAiState((prev) => ({
        ...prev,
        messages: [...prev.messages, reportMessage],
        isLoading: false,
      }));

      return report;
    } catch (error) {
      setAiState({
        ...aiState,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la generation du rapport',
      });
      return null;
    }
  }, [authState.user, aiState.messages, getFinancialContext]);

  // Faire defiler vers le bas des messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiState.messages]);

  return {
    aiState,
    messagesEndRef,
    sendMessage,
    executeAction,
    cancelAction,
    clearMessages,
    analyzeFinances,
    generateReport,
    tools,
  };
};

export default useAI;
