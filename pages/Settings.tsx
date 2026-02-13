import React, { useState, useEffect } from 'react';
import { Save, AlertTriangle, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { getStoredConfig, saveConfig, clearConfig, isInitialized } from '../services/firebase';
import { FirebaseConfig } from '../types';

export const SettingsPage: React.FC = () => {
  const [config, setConfig] = useState<FirebaseConfig>({
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
    imgbbApiKey: ''
  });
  
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const stored = getStoredConfig();
    if (stored) {
      setConfig(stored);
    }
    setIsReady(isInitialized());
  }, []);

  const handleChange = (key: keyof FirebaseConfig, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveConfig(config);
  };

  const handleClear = () => {
    if (confirm("Reset configuration?")) {
      clearConfig();
      setConfig({
        apiKey: '',
        authDomain: '',
        projectId: '',
        storageBucket: '',
        messagingSenderId: '',
        appId: '',
        imgbbApiKey: ''
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-white">Configurações do Projeto</h1>
        <p className="text-zinc-400 text-sm mt-1">Configure sua conexão com Firebase e ImgBB.</p>
      </div>

      <div className={`p-4 rounded-lg border ${isReady ? 'bg-brand-500/10 border-brand-500/20' : 'bg-yellow-500/10 border-yellow-500/20'}`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {isReady ? <CheckCircle2 className="h-5 w-5 text-brand-400" /> : <AlertTriangle className="h-5 w-5 text-yellow-500" />}
          </div>
          <div className="ml-3">
            <h3 className={`text-sm font-medium ${isReady ? 'text-brand-300' : 'text-yellow-500'}`}>
              {isReady ? 'Conectado' : 'Configuração Necessária'}
            </h3>
            <div className={`mt-2 text-sm ${isReady ? 'text-brand-200' : 'text-yellow-200/80'}`}>
              <p>
                {isReady 
                  ? 'Sua loja está conectada ao banco de dados.' 
                  : 'Você precisa fornecer as configurações do projeto para começar.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Seção Banco de Dados */}
        <div className="bg-card border border-zinc-800 rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-medium text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
            Firebase Firestore (Banco de Dados)
          </h2>
          <div className="grid gap-4">
            <Input 
              label="API Key" 
              value={config.apiKey} 
              onChange={e => handleChange('apiKey', e.target.value)} 
              placeholder="AIzaSy..."
              required
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input 
                label="Auth Domain" 
                value={config.authDomain} 
                onChange={e => handleChange('authDomain', e.target.value)} 
                placeholder="project-id.firebaseapp.com"
                required
              />
              <Input 
                label="Project ID" 
                value={config.projectId} 
                onChange={e => handleChange('projectId', e.target.value)} 
                placeholder="project-id"
                required
              />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <Input 
                label="Messaging Sender ID" 
                value={config.messagingSenderId} 
                onChange={e => handleChange('messagingSenderId', e.target.value)} 
                placeholder="123456789"
                required
              />
               <Input 
                label="App ID" 
                value={config.appId} 
                onChange={e => handleChange('appId', e.target.value)} 
                placeholder="1:123456789:web:..."
                required
              />
            </div>
          </div>
        </div>

        {/* Seção Imagens */}
        <div className="bg-card border border-zinc-800 rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-medium text-white flex items-center gap-2">
            <ImageIcon size={18} className="text-blue-400" />
            Hospedagem de Imagens (ImgBB)
          </h2>
          <p className="text-sm text-zinc-500">
            Usamos o ImgBB para hospedar as imagens gratuitamente. Crie uma conta e pegue sua chave.
          </p>
          <div className="grid gap-4">
            <Input 
              label="ImgBB Client API Key" 
              value={config.imgbbApiKey || ''} 
              onChange={e => handleChange('imgbbApiKey', e.target.value)} 
              placeholder="Ex: 3557a6e9..."
            />
             <div className="text-xs text-zinc-500">
              <a href="https://api.imgbb.com/" target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:underline flex items-center gap-1">
                Obter API Key aqui (Clique em "Get API Key")
              </a>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4">
           <Button type="button" variant="danger" size="sm" onClick={handleClear}>
            Limpar Config
          </Button>
          <Button type="submit">
            <Save size={16} className="mr-2" />
            Salvar Tudo
          </Button>
        </div>
      </form>

      <div className="bg-zinc-900/50 p-6 rounded-lg border border-zinc-800 text-sm text-zinc-400 space-y-2">
        <h4 className="font-semibold text-zinc-300">Como configurar:</h4>
        <ol className="list-decimal list-inside space-y-2 ml-2">
          <li>
            <strong>Firebase:</strong> Vá para <a href="https://console.firebase.google.com/" className="text-brand-400 hover:underline">Firebase Console</a>, crie um projeto, habilite o <strong>Firestore Database</strong> (em modo de teste) e pegue as chaves em "Configurações do Projeto" > ícone Web (&lt;/&gt;).
          </li>
          <li>
            <strong>ImgBB:</strong> Acesse <a href="https://api.imgbb.com/" className="text-brand-400 hover:underline">api.imgbb.com</a>, faça login/cadastro e copie a chave de API mostrada na tela.
          </li>
        </ol>
      </div>
    </div>
  );
};