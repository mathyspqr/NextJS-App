'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';

import { supabase } from './shared';
import { ConversationUser, User, VoiceCall, WebRTCSignal } from '../../types/chat';

type UseVoiceCallsParams = {
  activeConversationUser: ConversationUser | null;
  isAuthenticated: boolean;
  user: User | null;
};

export const useVoiceCalls = ({ activeConversationUser, isAuthenticated, user }: UseVoiceCallsParams) => {
  const [incomingCall, setIncomingCall] = useState<VoiceCall | null>(null);
  const [activeCall, setActiveCall] = useState<VoiceCall | null>(null);
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'ringing' | 'connecting' | 'connected'>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [microphoneActive, setMicrophoneActive] = useState(false);
  const [audioNeedsInteraction, setAudioNeedsInteraction] = useState(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const pendingIceRef = useRef<RTCIceCandidateInit[]>([]);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);

  const cleanupWebRTC = () => {
    try {
      pcRef.current?.close();
    } catch {}
    pcRef.current = null;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
    }
    localStreamRef.current = null;

    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach(t => t.stop());
    }
    remoteStreamRef.current = null;

    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }

    pendingIceRef.current = [];
    setIsMuted(false);
    setMicrophoneActive(false);
    setAudioNeedsInteraction(false);
  };

  const ensurePeerConnection = async (callId: string, otherUserId: string) => {
    if (!localStreamRef.current) {
      try {
        const audioConstraints = {
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: { ideal: 48000, min: 16000 },
            channelCount: 1
          }
        };

        localStreamRef.current = await navigator.mediaDevices.getUserMedia(audioConstraints);
      } catch {
        throw new Error('Microphone access required for voice calls');
      }
    }

    if (!pcRef.current) {
      const iceServers = [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        {
          urls: 'turn:openrelay.metered.ca:80',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        }
      ];

      const pc = new RTCPeerConnection({
        iceServers: iceServers,
        iceCandidatePoolSize: 10
      });

      pcRef.current = pc;

      const localAudioTrack = localStreamRef.current.getAudioTracks()[0];
      if (localAudioTrack) {
        pc.addTrack(localAudioTrack, localStreamRef.current);
      }

      pc.ontrack = (event) => {
        if (event.track.kind === 'audio') {
          remoteStreamRef.current = new MediaStream([event.track]);

          const audioElement = remoteAudioRef.current;
          if (audioElement) {
            audioElement.srcObject = remoteStreamRef.current;
            audioElement.volume = 1.0;
            audioElement.muted = false;

            const playPromise = audioElement.play();
            if (playPromise !== undefined) {
              playPromise.then(() => {
                setAudioNeedsInteraction(false);
              }).catch(() => {
                setAudioNeedsInteraction(true);

                const resumeAudio = () => {
                  audioElement.play().catch(() => {});
                  document.removeEventListener('touchstart', resumeAudio);
                  document.removeEventListener('click', resumeAudio);
                };

                document.addEventListener('touchstart', resumeAudio, { once: true });
                document.addEventListener('click', resumeAudio, { once: true });
              });
            }
          }
        }
      };

      pc.onicecandidate = async (event) => {
        if (event.candidate && user) {
          try {
            await supabase.from('webrtc_signals').insert({
              call_id: callId,
              sender_id: user.id,
              receiver_id: otherUserId,
              signal_type: 'ice_candidate',
              signal_data: event.candidate
            });
          } catch (error) {
            console.error('Failed to send ICE candidate:', error);
          }
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'failed') {
          cleanupWebRTC();
        }
      };
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const ch = supabase
      .channel(`voice-calls-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'voice_calls' },
        (payload) => {
          const call = payload.new as VoiceCall;

          if (call.receiver_id === user.id && call.status === 'calling') {
            setIncomingCall(call);
            setCallStatus('ringing');
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'voice_calls' },
        (payload) => {
          const call = payload.new as VoiceCall;

          if (activeCall?.id === call.id && (call.status === 'ended' || call.status === 'missed')) {
            setActiveCall(null);
            setIncomingCall(null);
            setCallStatus('idle');
            cleanupWebRTC();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [isAuthenticated, user, activeCall]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const currentCall = activeCall || incomingCall;
    if (!currentCall) return;

    const ch = supabase
      .channel(`webrtc-signals-${currentCall.id}-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'webrtc_signals' },
        async (payload) => {
          const sig = payload.new as WebRTCSignal;

          if (sig.call_id !== currentCall.id) return;
          if (sig.receiver_id !== user.id) return;
          if (sig.sender_id === user.id) return;

          const otherUserId = sig.sender_id;

          try {
            const pc = pcRef.current;
            if (!pc) {
              return;
            }

            if (sig.signal_type === 'offer') {
              await pc.setRemoteDescription(sig.signal_data as RTCSessionDescriptionInit);
              for (const c of pendingIceRef.current) {
                try { await pc.addIceCandidate(c); } catch {}
              }
              pendingIceRef.current = [];

              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);

              await supabase.from('webrtc_signals').insert({
                call_id: activeCall?.id,
                sender_id: user.id,
                receiver_id: otherUserId,
                signal_type: 'answer',
                signal_data: answer,
              });
            }

            if (sig.signal_type === 'answer') {
              await pc.setRemoteDescription(sig.signal_data as RTCSessionDescriptionInit);
              for (const c of pendingIceRef.current) {
                try { await pc.addIceCandidate(c); } catch {}
              }
              pendingIceRef.current = [];
            }

            if (sig.signal_type === 'ice_candidate') {
              if (!pc.remoteDescription) {
                pendingIceRef.current.push(sig.signal_data as RTCIceCandidateInit);
                return;
              }

              await pc.addIceCandidate(sig.signal_data as RTCIceCandidateInit);
            }
          } catch (e) {
            console.error(e);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [isAuthenticated, user, activeCall, incomingCall]);

  const startVoiceCall = async () => {
    if (!user || !activeConversationUser) return;

    try {
      setCallStatus('calling');

      const { data: call, error: callError } = await supabase
        .from('voice_calls')
        .insert({
          caller_id: user.id,
          receiver_id: activeConversationUser.id,
          status: 'calling',
        })
        .select('*')
        .single();

      if (callError) throw callError;
      setActiveCall(call);

      await ensurePeerConnection(call.id, activeConversationUser.id);

      const pc = pcRef.current!;
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      await supabase.from('webrtc_signals').insert({
        call_id: call.id,
        sender_id: user.id,
        receiver_id: activeConversationUser.id,
        signal_type: 'offer',
        signal_data: offer,
      });
    } catch (e) {
      console.error('Failed to start call:', e);
      toast.error('Impossible de démarrer l\'appel');
      setCallStatus('idle');
      setActiveCall(null);
      cleanupWebRTC();
    }
  };

  const acceptVoiceCall = async (call: VoiceCall) => {
    if (!user) return;

    try {
      setCallStatus('connecting');
      setActiveCall(call);
      setIncomingCall(null);

      await supabase.from('voice_calls')
        .update({ status: 'connected', started_at: new Date().toISOString() })
        .eq('id', call.id);

      const otherUserId = call.caller_id;
      await ensurePeerConnection(call.id, otherUserId);

      const { data: existingOffer } = await supabase
        .from('webrtc_signals')
        .select('*')
        .eq('call_id', call.id)
        .eq('signal_type', 'offer')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingOffer?.signal_data) {
        const pc = pcRef.current!;
        await pc.setRemoteDescription(existingOffer.signal_data);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        await supabase.from('webrtc_signals').insert({
          call_id: call.id,
          sender_id: user.id,
          receiver_id: otherUserId,
          signal_type: 'answer',
          signal_data: answer,
        });

        setCallStatus('connected');
      }
    } catch (e) {
      console.error('Failed to accept call:', e);
      toast.error('Erreur lors de l\'acceptation');
      setCallStatus('idle');
      setActiveCall(null);
      cleanupWebRTC();
    }
  };

  const declineVoiceCall = async (call: VoiceCall) => {
    try {
      await supabase.from('voice_calls')
        .update({ status: 'missed', ended_at: new Date().toISOString() })
        .eq('id', call.id);
    } catch {}
    setIncomingCall(null);
    setCallStatus('idle');
  };

  const hangupVoiceCall = async () => {
    if (!activeCall) return;

    try {
      await supabase.from('voice_calls')
        .update({ status: 'ended', ended_at: new Date().toISOString() })
        .eq('id', activeCall.id);
    } catch {}

    setActiveCall(null);
    setIncomingCall(null);
    setCallStatus('idle');
    cleanupWebRTC();
  };

  const toggleMute = () => {
    const s = localStreamRef.current;
    if (!s) return;
    const enabled = isMuted;
    s.getAudioTracks().forEach(t => (t.enabled = enabled));
    setIsMuted(!isMuted);
    setMicrophoneActive(enabled);
  };

  const activateAudio = () => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current
        .play()
        .then(() => {
          setAudioNeedsInteraction(false);
        })
        .catch(() => {});
    }
  };

  return {
    acceptVoiceCall,
    activateAudio,
    activeCall,
    audioNeedsInteraction,
    callStatus,
    declineVoiceCall,
    hangupVoiceCall,
    incomingCall,
    isMuted,
    microphoneActive,
    remoteAudioRef,
    startVoiceCall,
    toggleMute,
  };
};
