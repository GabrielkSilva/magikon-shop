import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Plus, Trash2, Search, Upload, Image as ImageIcon, PackageOpen, Edit2, FolderOpen, X } from 'lucide-react';
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

// --- Componente ProductCard (Atualizado) ---
interface ProductCardProps { 
  product: Product;
  getCategoryName: (id: string) => string;
  onEdit: (p: Product) => void;
  onDelete: (id: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  getCategoryName, 
  onEdit, 
  onDelete 
}) => {
  // Garante que temos um array de imagens. Se 'images' não existir, usa 'imageUrl'.
  const images = product.images && product.images.length > 0 
    ? product.images 
    : (product.imageUrl ? [product.imageUrl] : []);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Reseta o index se o produto mudar
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [product.id]);

  const hasMultipleImages = images.length > 1;

  return (
    <div className="group bg-card border border-zinc-800 rounded-xl overflow-hidden hover:border-brand-500/30 transition-all duration-300 flex flex-col relative">
      {/* Container da Imagem */}
      <div className="relative aspect-[21/9.5] bg-zinc-900 overflow-hidden border-b border-zinc-800/50 group/image">
        
        {/* Renderiza TODAS as imagens empilhadas para pré-carregamento (Carrossel Instantâneo) */}
        {images.length > 0 ? (
          images.map((img, idx) => (
            <img 
              key={idx}
              src={img} 
              alt={`${product.name} - ${idx + 1}`} 
              className={`
                absolute inset-0 w-full h-full object-cover transition-opacity duration-300
                ${currentImageIndex === idx ? 'opacity-100 z-10' : 'opacity-0 z-0'}
              `} 
            />
          ))
        ) : (
          <div className="flex items-center justify-center h-full text-zinc-600">
            <ImageIcon size={32} />
          </div>
        )}

        {/* Toggles Numéricos (Canto Superior Esquerdo) */}
        {hasMultipleImages && (
          <div className="absolute top-2 left-2 flex gap-1 z-20">
             {images.map((_, idx) => (
               <button
                 key={idx}
                 onClick={(e) => {
                   e.stopPropagation();
                   setCurrentImageIndex(idx);
                 }}
                 className={`
                   w-6 h-6 rounded flex items-center justify-center text-xs font-bold transition-all backdrop-blur-md border shadow-sm
                   ${currentImageIndex === idx 
                     ? 'bg-white text-black border-white scale-105 shadow-md' 
                     : 'bg-black/60 text-white/90 border-transparent hover:bg-black/80 hover:border-zinc-500'}
                 `}
               >
                 {idx + 1}
               </button>
             ))}
          </div>
        )}
      </div>
      
      {/* Infos e Ações */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2 gap-2">
          <h3 className="font-semibold text-white truncate text-base" title={product.name}>{product.name}</h3>
        </div>
        
        <div className="flex items-center justify-between mt-auto pt-3">
          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">
            {getCategoryName(product.categoryId)}
          </span>

          <div className="flex gap-1">
             <button 
              onClick={() => onEdit(product)}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
              title="Editar"
            >
              <Edit2 size={16} />
             </button>
             <button 
              onClick={() => onDelete(product.id)}
              className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
              title="Excluir"
            >
              <Trash2 size={16} />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

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
  
  // Gestão de Imagens
  const [prodNewFiles, setProdNewFiles] = useState<File[]>([]);
  const [prodExistingImages, setProdExistingImages] = useState<string[]>([]); // URLs já salvas
  const [prodPreviews, setProdPreviews] = useState<string[]>([]); // Previews locais das novas imagens

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
    // Limpa estados de imagem
    setProdNewFiles([]);
    setProdPreviews([]);

    if (product) {
      setEditingProduct(product);
      setProdName(product.name);
      setProdCategoryId(product.categoryId);
      
      // Carrega imagens existentes (suporte a legado usando imageUrl se images estiver vazio)
      const existing = product.images && product.images.length > 0 
        ? product.images 
        : (product.imageUrl ? [product.imageUrl] : []);
        
      setProdExistingImages(existing);
    } else {
      setEditingProduct(null);
      setProdName('');
      setProdCategoryId(categories.length > 0 ? categories[0].id : '');
      setProdExistingImages([]);
    }
    setIsProductModalOpen(true);
  };

  const handleProductImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files) as File[];
      const newPreviews = files.map(file => URL.createObjectURL(file));

      setProdNewFiles(prev => [...prev, ...files]);
      setProdPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeNewImage = (index: number) => {
    setProdNewFiles(prev => prev.filter((_, i) => i !== index));
    setProdPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setProdExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || !prodCategoryId) return;

    setLoading(true);
    try {
      // 1. Upload das novas imagens
      const uploadPromises = prodNewFiles.map(file => uploadImage(file));
      const newImageUrls = await Promise.all(uploadPromises);

      // 2. Combinar imagens existentes com novas
      const finalImages = [...prodExistingImages, ...newImageUrls];

      // 3. Define a imagem "capa" (primeira da lista)
      let mainImageUrl = finalImages.length > 0 ? finalImages[0] : '';
      
      // Fallback se nenhuma imagem for fornecida
      if (finalImages.length === 0) {
         mainImageUrl = `https://picsum.photos/seed/${encodeURIComponent(prodName)}/400/400`;
         finalImages.push(mainImageUrl);
      }

      const productData = {
        name: prodName,
        categoryId: prodCategoryId,
        imageUrl: mainImageUrl, // Compatibilidade
        images: finalImages,    // Multi-imagens
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
            <ProductCard 
              key={product.id}
              product={product}
              getCategoryName={getCategoryName}
              onEdit={openProductModal}
              onDelete={handleDeleteProduct}
            />
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
          {/* Upload de Imagem Multipla */}
          <div className="w-full space-y-3">
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider">Imagens do Produto</label>
            
            {/* Grid de Previews */}
            {(prodExistingImages.length > 0 || prodPreviews.length > 0) && (
              <div className="grid grid-cols-4 gap-3 mb-3">
                {/* Imagens Existentes (vindas do BD) */}
                {prodExistingImages.map((url, idx) => (
                  <div key={`existing-${idx}`} className="relative group aspect-square rounded-md overflow-hidden border border-zinc-700">
                    <img src={url} alt="Existente" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(idx)}
                      className="absolute top-1 right-1 bg-black/60 hover:bg-red-500/80 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <X size={12} />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-[10px] text-white text-center py-0.5">
                      Salva
                    </div>
                  </div>
                ))}
                
                {/* Novas Imagens (Preview local) */}
                {prodPreviews.map((url, idx) => (
                  <div key={`new-${idx}`} className="relative group aspect-square rounded-md overflow-hidden border border-brand-500/50">
                    <img src={url} alt="Novo" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeNewImage(idx)}
                      className="absolute top-1 right-1 bg-black/60 hover:bg-red-500/80 text-white rounded-full p-1 transition-all"
                    >
                      <X size={12} />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-brand-600/80 text-[10px] text-white text-center py-0.5">
                      Nova
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Dropzone */}
            <div className="relative border-2 border-dashed border-zinc-700 rounded-lg h-32 flex flex-col items-center justify-center text-center hover:border-brand-500 hover:bg-zinc-800/50 transition-colors cursor-pointer overflow-hidden">
              <input 
                type="file" 
                accept="image/*"
                multiple 
                onChange={handleProductImageChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
              />
              <div className="flex flex-col items-center p-4 pointer-events-none">
                <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 mb-2">
                  <Upload size={16} />
                </div>
                <p className="text-sm text-zinc-300 font-medium">Adicionar Imagens</p>
                <p className="text-xs text-zinc-500 mt-1">Pode selecionar várias</p>
              </div>
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