'use client';

import { useState, useEffect, useCallback } from 'react';
import { ONLINE_THRESHOLD_SECONDS } from '../../constants/onlineStatus';

interface OnlineStatusIndicatorProps {
  lastSeen: string | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showOfflineAsOrange?: boolean; // Option pour afficher orange au lieu de rouge
}

const OnlineStatusIndicator = ({ 
  lastSeen, 
  size = 'sm', 
  className = '',
  showOfflineAsOrange = false 
}: OnlineStatusIndicatorProps) => {
  const getStatus = useCallback((): 'online' | 'offline' => {
    if (!lastSeen) return 'offline';
    
    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    const diffInSeconds = (now.getTime() - lastSeenDate.getTime()) / 1000;
    
    // Seuil configurable (en secondes)
    return diffInSeconds <= ONLINE_THRESHOLD_SECONDS ? 'online' : 'offline';
  }, [lastSeen]);

  const [status, setStatus] = useState<'online' | 'offline'>(getStatus());

  // Recalculer le statut toutes les 5 secondes pour une mise à jour rapide
  useEffect(() => {
    const updateStatus = () => {
      setStatus(prev => {
        const newStatus = getStatus();
        if (newStatus !== prev) {
          console.log('🔄 Changement de statut:', prev, '→', newStatus, 'lastSeen:', lastSeen);
          return newStatus;
        }
        return prev;
      });
    };

    // Mettre à jour immédiatement quand lastSeen change
    updateStatus();

    // Puis toutes les 5 secondes pour réactivité rapide
    const interval = setInterval(() => {
      updateStatus();
    }, 5 * 1000);

    return () => clearInterval(interval);
  }, [lastSeen, getStatus]); // Retirer status car il change à chaque rendu
  
  // Définir la taille en pixels
  const sizeClasses = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  // Définir la couleur selon le statut
  const statusColor = status === 'online' 
    ? 'bg-green-500' 
    : showOfflineAsOrange ? 'bg-orange-500' : 'bg-red-500';

  const statusText = status === 'online' 
    ? `En ligne (actif dans les ${ONLINE_THRESHOLD_SECONDS} dernières secondes)` 
    : 'Hors ligne';

  // Ajout d'un log pour diagnostiquer les valeurs de lastSeen et du statut
  console.log('🟢 OnlineStatusIndicator:', { lastSeen, status });

  return (
    <div
      className={`${sizeClasses[size]} ${statusColor} rounded-full border-2 border-white ${className}`}
      title={statusText}
    />
  );
};

export default OnlineStatusIndicator;
