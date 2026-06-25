import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Product, ProductFormData, FilterOptions } from '@/types';
import { useAuth } from './useAuth';

export interface ProductsState {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  total: number;
  lowStockAlerts: number;
}

export const useProducts = () => {
  const { authState } = useAuth();
  const [productsState, setProductsState] = useState<ProductsState>({
    products: [],
    isLoading: false,
    error: null,
    total: 0,
    lowStockAlerts: 0,
  });

  const fetchProducts = useCallback(async (filters?: FilterOptions, page: number = 1, pageSize: number = 10) => {
    if (!authState.user) {
      setProductsState({
        products: [],
        isLoading: false,
        error: 'Utilisateur non connecté',
        total: 0,
        lowStockAlerts: 0,
      });
      return;
    }

    try {
      setProductsState((prev) => ({ ...prev, isLoading: true, error: null }));

      let query = supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('user_id', authState.user.id)
        .order('name', { ascending: true });

      // Appliquer les filtres
      if (filters) {
        if (filters.search) {
          query = query.or(
            `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,category.ilike.%${filters.search}%`
          );
        }
        if (filters.category) {
          query = query.eq('category', filters.category);
        }
      }

      // Appliquer la pagination
      const offset = (page - 1) * pageSize;
      query = query.range(offset, offset + pageSize - 1);

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      // Compter les alertes de stock faible
      const lowStockCount = data.filter((p) => p.quantity <= p.min_quantity).length;

      setProductsState({
        products: data || [],
        isLoading: false,
        error: null,
        total: count || 0,
        lowStockAlerts: lowStockCount,
      });
    } catch (error) {
      setProductsState({
        products: [],
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la récupération des produits',
        total: 0,
        lowStockAlerts: 0,
      });
    }
  }, [authState.user]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const addProduct = async (productData: ProductFormData): Promise<Product | null> => {
    if (!authState.user) {
      setProductsState({
        ...productsState,
        error: 'Utilisateur non connecté',
      });
      return null;
    }

    try {
      setProductsState((prev) => ({ ...prev, isLoading: true, error: null }));

      const { data, error } = await supabase
        .from('products')
        .insert({
          user_id: authState.user.id,
          name: productData.name,
          description: productData.description || null,
          category: productData.category,
          purchase_price: productData.purchase_price,
          selling_price: productData.selling_price,
          quantity: productData.quantity,
          min_quantity: productData.min_quantity,
          supplier: productData.supplier || null,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Rafraîchir la liste
      await fetchProducts();

      return data;
    } catch (error) {
      setProductsState({
        ...productsState,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erreur lors de l\'ajout du produit',
      });
      return null;
    }
  };

  const updateProduct = async (id: string, productData: Partial<ProductFormData>): Promise<Product | null> => {
    if (!authState.user) {
      setProductsState({
        ...productsState,
        error: 'Utilisateur non connecté',
      });
      return null;
    }

    try {
      setProductsState((prev) => ({ ...prev, isLoading: true, error: null }));

      const { data, error } = await supabase
        .from('products')
        .update({
          ...productData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', authState.user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Rafraîchir la liste
      await fetchProducts();

      return data;
    } catch (error) {
      setProductsState({
        ...productsState,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la mise à jour du produit',
      });
      return null;
    }
  };

  const deleteProduct = async (id: string): Promise<boolean> => {
    if (!authState.user) {
      setProductsState({
        ...productsState,
        error: 'Utilisateur non connecté',
      });
      return false;
    }

    try {
      setProductsState((prev) => ({ ...prev, isLoading: true, error: null }));

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
        .eq('user_id', authState.user.id);

      if (error) {
        throw error;
      }

      // Rafraîchir la liste
      await fetchProducts();

      return true;
    } catch (error) {
      setProductsState({
        ...productsState,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la suppression du produit',
      });
      return false;
    }
  };

  const getProductById = async (id: string): Promise<Product | null> => {
    if (!authState.user) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .eq('user_id', authState.user.id)
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      return null;
    }
  };

  const updateStock = async (productId: string, quantityChange: number, type: 'in' | 'out' = 'in'): Promise<Product | null> => {
    if (!authState.user) {
      setProductsState({
        ...productsState,
        error: 'Utilisateur non connecté',
      });
      return null;
    }

    try {
      setProductsState((prev) => ({ ...prev, isLoading: true, error: null }));

      // Récupérer le produit actuel
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .eq('user_id', authState.user.id)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      if (!product) {
        throw new Error('Produit non trouvé');
      }

      // Calculer la nouvelle quantité
      const newQuantity = type === 'in'
        ? product.quantity + quantityChange
        : product.quantity - quantityChange;

      if (newQuantity < 0) {
        throw new Error('Quantité insuffisante en stock');
      }

      // Mettre à jour le stock
      const { data, error } = await supabase
        .from('products')
        .update({
          quantity: newQuantity,
          updated_at: new Date().toISOString(),
        })
        .eq('id', productId)
        .eq('user_id', authState.user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Rafraîchir la liste
      await fetchProducts();

      return data;
    } catch (error) {
      setProductsState({
        ...productsState,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la mise à jour du stock',
      });
      return null;
    }
  };

  const getLowStockProducts = async (): Promise<Product[]> => {
    if (!authState.user) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', authState.user.id)
        .lte('quantity', 'min_quantity')
        .order('quantity', { ascending: true });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      return [];
    }
  };

  const getBestSellingProducts = async (limit: number = 5): Promise<Product[]> => {
    if (!authState.user) {
      return [];
    }

    try {
      // Récupérer les produits avec le plus de ventes
      const { data, error } = await supabase
        .from('sale_items')
        .select('product_id, quantity')
        .eq('sale_id.user_id', authState.user.id);

      if (error) {
        throw error;
      }

      // Agrégation des quantités par produit
      const productSales: Record<string, number> = {};
      data.forEach((item) => {
        productSales[item.product_id] = (productSales[item.product_id] || 0) + item.quantity;
      });

      // Trier par quantité vendue
      const sortedProductIds = Object.entries(productSales)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([id]) => id);

      // Récupérer les détails des produits
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', authState.user.id)
        .in('id', sortedProductIds);

      if (productsError) {
        throw productsError;
      }

      return products || [];
    } catch (error) {
      return [];
    }
  };

  const getTotalStockValue = async (): Promise<number> => {
    if (!authState.user) {
      return 0;
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .select('purchase_price, quantity')
        .eq('user_id', authState.user.id);

      if (error) {
        throw error;
      }

      return data.reduce((sum, product) => sum + product.purchase_price * product.quantity, 0);
    } catch (error) {
      return 0;
    }
  };

  return {
    productsState,
    fetchProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    getProductById,
    updateStock,
    getLowStockProducts,
    getBestSellingProducts,
    getTotalStockValue,
  };
};

export default useProducts;
