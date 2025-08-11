import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('사용자가 PWA 설치를 수락했습니다');
    } else {
      console.log('사용자가 PWA 설치를 거부했습니다');
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">Uparupa Journal 앱 설치</h3>
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        홈 화면에 추가하여 더 빠르게 접근하고 오프라인에서도 사용할 수 있습니다.
      </p>
      <div className="flex gap-2">
        <Button onClick={handleInstall} className="flex-1">
          설치하기
        </Button>
        <Button 
          variant="outline" 
          onClick={handleDismiss}
          className="flex-1"
        >
          나중에
        </Button>
      </div>
    </div>
  );
};
