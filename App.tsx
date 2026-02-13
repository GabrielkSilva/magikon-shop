import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Plus, Trash2, Search, Upload, Image as ImageIcon, PackageOpen, Edit2, FolderOpen } from 'lucide-react';
import { Category, Product } from './types';
import { Button } from './components/ui/Button';
import { Input } from './components/ui/Input';
import { Modal } from './components/ui/Modal';
import { 
  subscribeToCollection, 
  addItem, 
  updateItem,
  deleteItem, 
  uploadImage,
  PRODUCTS_COLLECTION, 
  CATEGORIES_COLLECTION 
} from './services/firebase';

function App() {
  // --- Estados de Dados ---
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // --- Estados de UI ---
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Modais
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // --- Estado do Formulário de Produto (Criação/Edição) ---
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodCategoryId, setProdCategoryId] = useState('');
  const [prodImageFile, setProdImageFile] = useState<File | null>(null);
  const [prodImagePreview, setProdImagePreview] = useState<string | null>(null);

  // --- Estado do Formulário de Categoria ---
  const [catName, setCatName] = useState('');

  // --- Carregamento Inicial ---
  useEffect(() => {
    const unsubProd = subscribeToCollection(PRODUCTS_COLLECTION, (data) => setProducts(data as Product[]));
    const unsubCat = subscribeToCollection(CATEGORIES_COLLECTION, (data) => setCategories(data as Category[]));
    return () => {
      unsubProd();
      unsubCat();
    };
  }, []);

  // --- Handlers de Produto ---

  const openProductModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setProdName(product.name);
      setProdCategoryId(product.categoryId);
      setProdImagePreview(product.imageUrl);
      setProdImageFile(null);
    } else {
      setEditingProduct(null);
      setProdName('');
      setProdCategoryId('');
      setProdImagePreview(null);
      setProdImageFile(null);
    }
    setIsProductModalOpen(true);
  };

  const handleProductImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProdImageFile(file);
      setProdImagePreview(URL.createObjectURL(file));
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || !prodCategoryId) return;

    setLoading(true);
    try {
      let imageUrl = editingProduct?.imageUrl || '';

      // Se houver nova imagem, faz upload
      if (prodImageFile) {
        imageUrl = await uploadImage(prodImageFile);
      } else if (!imageUrl) {
        // Placeholder
        imageUrl = `https://picsum.photos/seed/${encodeURIComponent(prodName)}/400/400`;
      }

      const productData = {
        name: prodName,
        categoryId: prodCategoryId,
        imageUrl,
      };

      if (editingProduct) {
        await updateItem(PRODUCTS_COLLECTION, editingProduct.id, productData);
      } else {
        await addItem(PRODUCTS_COLLECTION, productData);
      }

      setIsProductModalOpen(false);
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar produto: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      await deleteItem(PRODUCTS_COLLECTION, id);
    }
  };

  // --- Handlers de Categoria ---

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName) return;
    setLoading(true);
    try {
      // Simplificado: Apenas nome e data (gerada no service)
      await addItem(CATEGORIES_COLLECTION, { 
        name: catName
      });
      setCatName('');
    } catch (error) {
      console.error(error);
      alert('Erro ao criar categoria.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm('Excluir categoria? Produtos relacionados podem ficar sem categoria.')) {
      await deleteItem(CATEGORIES_COLLECTION, id);
    }
  };

  // --- Utilitários ---
  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || 'Sem categoria';
  
  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <Layout>
      {/* Barra de Ações e Busca */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        
        {/* Barra de Busca */}
        <div className="relative w-full md:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="text-zinc-500" size={18} />
          </div>
          <input 
            type="text"
            placeholder="Buscar produtos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 placeholder-zinc-600"
          />
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-3 shrink-0">
          <Button variant="secondary" onClick={() => setIsCategoryModalOpen(true)}>
            <FolderOpen size={16} className="mr-2" />
            Categorias
          </Button>
          <Button onClick={() => openProductModal()}>
            <Plus size={16} className="mr-2" />
            Novo Produto
          </Button>
        </div>
      </div>

      {/* Grid de Produtos */}
      {products.length === 0 ? (
         <div className="text-center py-32 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
         <div className="mx-auto w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 mb-4">
           <PackageOpen size={32} />
         </div>
         <h3 className="text-white text-lg font-medium">Nenhum produto encontrado</h3>
         <p className="text-zinc-500 mt-2">Comece adicionando itens ao seu inventário.</p>
         <div className="flex justify-center gap-4 mt-6">
            <Button onClick={() => openProductModal()}>
                Adicionar Produto
            </Button>
         </div>
       </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {filteredProducts.map((product) => (
            <div key={product.id} className="group bg-card border border-zinc-800 rounded-xl overflow-hidden hover:border-brand-500/30 hover:shadow-xl hover:shadow-brand-900/10 transition-all duration-300 flex flex-col">
              {/* Imagem */}
              <div className="relative aspect-square bg-zinc-900 overflow-hidden">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="flex items-center justify-center h-full text-zinc-600">
                    <ImageIcon size={32} />
                  </div>
                )}
                
                {/* Ações Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                   <button 
                    onClick={() => openProductModal(product)}
                    className="p-2 bg-zinc-900 text-white rounded-full shadow-lg hover:bg-brand-600 transition-colors"
                    title="Editar"
                  >
                    <Edit2 size={18} />
                   </button>
                   <button 
                    onClick={() => handleDeleteProduct(product.id)}
                    className="p-2 bg-zinc-900 text-red-500 rounded-full shadow-lg hover:bg-red-500 hover:text-white transition-colors"
                    title="Excluir"
                  >
                    <Trash2 size={18} />
                   </button>
                </div>
              </div>
              
              {/* Infos */}
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2 gap-2">
                  <h3 className="font-semibold text-white truncate text-base" title={product.name}>{product.name}</h3>
                </div>
                
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">
                    {getCategoryName(product.categoryId)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- MODAL DE PRODUTO (Criar / Editar) --- */}
      <Modal 
        isOpen={isProductModalOpen} 
        onClose={() => setIsProductModalOpen(false)} 
        title={editingProduct ? "Editar Produto" : "Novo Produto"}
      >
        <form onSubmit={handleProductSubmit} className="space-y-5">
          {/* Upload de Imagem */}
          <div className="w-full">
            <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">Imagem do Produto</label>
            <div 
              className={`
                relative border-2 border-dashed border-zinc-700 rounded-lg h-48 flex flex-col items-center justify-center text-center
                hover:border-brand-500 hover:bg-zinc-800/50 transition-colors cursor-pointer group overflow-hidden
                ${prodImagePreview ? 'border-brand-500/50 bg-zinc-900' : ''}
              `}
            >
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleProductImageChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
              />
              
              {prodImagePreview ? (
                <div className="w-full h-full relative">
                   <img src={prodImagePreview} alt="Preview" className="w-full h-full object-contain" />
                   <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-sm font-medium">
                      Trocar Imagem
                   </div>
                </div>
              ) : (
                <div className="flex flex-col items-center p-4">
                  <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 mb-3 group-hover:text-brand-400 transition-colors">
                    <Upload size={20} />
                  </div>
                  <p className="text-sm text-zinc-300 font-medium">Clique para fazer upload</p>
                  <p className="text-xs text-zinc-500 mt-1">PNG, JPG ou GIF</p>
                </div>
              )}
            </div>
          </div>

          <Input 
            label="Nome do Produto" 
            value={prodName}
            onChange={(e) => setProdName(e.target.value)}
            required
            placeholder="Ex: Camiseta Preta"
          />

          <div>
             <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">
              Categoria
            </label>
            <select
              value={prodCategoryId}
              onChange={(e) => setProdCategoryId(e.target.value)}
              required
              className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 appearance-none"
            >
              <option value="">Selecione uma categoria (Obrigatório)</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end pt-2 border-t border-zinc-800 mt-4">
            <Button type="button" variant="ghost" className="mr-2" onClick={() => setIsProductModalOpen(false)}>Cancelar</Button>
            <Button type="submit" isLoading={loading}>
              {editingProduct ? 'Salvar Alterações' : 'Criar Produto'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* --- MODAL DE CATEGORIAS --- */}
      <Modal 
        isOpen={isCategoryModalOpen} 
        onClose={() => setIsCategoryModalOpen(false)} 
        title="Gerenciar Categorias"
      >
        <div className="space-y-6">
          {/* Form para Adicionar */}
          <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
            <h4 className="text-sm font-medium text-white mb-3 flex items-center">
              <Plus size={14} className="mr-1 text-brand-400" /> Nova Categoria
            </h4>
            <form onSubmit={handleCategorySubmit} className="space-y-3">
              <div className="grid grid-cols-1 gap-3">
                <Input 
                  placeholder="Nome (Ex: Roupas)"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="bg-zinc-950"
                  required
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" size="sm" isLoading={loading}>Adicionar</Button>
              </div>
            </form>
          </div>

          {/* Lista de Categorias */}
          <div>
            <h4 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Categorias Existentes</h4>
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {categories.length === 0 ? (
                <p className="text-zinc-500 text-sm italic">Nenhuma categoria cadastrada.</p>
              ) : (
                categories.map(cat => (
                  <div key={cat.id} className="flex items-center justify-between p-3 bg-card border border-zinc-800 rounded-md hover:border-zinc-700 transition-colors group">
                    <div>
                      <div className="font-medium text-zinc-200 text-sm">{cat.name}</div>
                    </div>
                    <button 
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                      title="Excluir Categoria"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}

export default App;
