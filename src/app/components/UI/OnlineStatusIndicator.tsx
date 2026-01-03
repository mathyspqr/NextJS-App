'use client';

import { useState, useEffect } from 'react';

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
  const getStatus = (): 'online' | 'offline' => {
    if (!lastSeen) return 'offline';
    
    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    const diffInSeconds = (now.getTime() - lastSeenDate.getTime()) / 1000;
    
    // Seuil à 5 minutes (300 secondes)
    return diffInSeconds <= 300 ? 'online' : 'offline';
  };

  const [status, setStatus] = useState<'online' | 'offline'>(getStatus());

  // Recalculer le statut toutes les 5 secondes pour une mise à jour rapide
  useEffect(() => {
    const updateStatus = () => {
      const newStatus = getStatus();
      if (newStatus !== status) {
        console.log('🔄 Changement de statut:', status, '→', newStatus, 'lastSeen:', lastSeen);
        setStatus(newStatus);
      }
    };

    // Mettre à jour immédiatement quand lastSeen change
    updateStatus();

    // Puis toutes les 5 secondes pour réactivité rapide
    const interval = setInterval(() => {
      updateStatus();
    }, 5 * 1000);

    return () => clearInterval(interval);
  }, [lastSeen]); // Retirer status des dépendances pour éviter la boucle
  
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
    ? 'En ligne (actif dans les 5 dernières minutes)' 
    : 'Hors ligne';

  return (
    <div
      className={`${sizeClasses[size]} ${statusColor} rounded-full border-2 border-white ${className}`}
      title={statusText}
    />
  );
};

export default OnlineStatusIndicator;
