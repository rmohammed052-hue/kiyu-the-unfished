import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

// FIX #8: Complete call state machine with all states
export type CallState =
  | 'idle'           // No call active
  | 'initiating'     // Requesting media devices
  | 'ringing'        // Offer sent, waiting for answer
  | 'connecting'     // ICE candidates exchanging
  | 'connected'      // P2P connection established
  | 'reconnecting'   // Connection dropped, attempting recovery
  | 'disconnected'   // Call ended normally
  | 'failed'         // Connection failed
  | 'error';         // Error occurred

interface UseWebRTCProps {
  isInitiator: boolean;
  targetUserId?: string;
  onCallEnd?: () => void;
  onIncomingCall?: (callerId: string, callerName: string) => void;
}

export function useWebRTC({ isInitiator, targetUserId, onCallEnd, onIncomingCall }: UseWebRTCProps) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callState, setCallState] = useState<CallState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // FIX #8: Automatic reconnection logic
  const attemptReconnection = useCallback(async () => {
    if (reconnectAttempts >= 3) {
      console.error('❌ Max reconnection attempts reached');
      setCallState('failed');
      setError('Connection failed after multiple attempts');
      cleanup();
      if (onCallEnd) onCallEnd();
      return;
    }

    console.log(`🔄 Attempting reconnection (${reconnectAttempts + 1}/3)...`);
    setCallState('reconnecting');
    setReconnectAttempts(prev => prev + 1);

    // Wait 2 seconds before reconnecting
    reconnectTimeoutRef.current = setTimeout(async () => {
      try {
        if (peerConnectionRef.current && targetUserId) {
          // Restart ICE
          const offer = await peerConnectionRef.current.createOffer({ iceRestart: true });
          await peerConnectionRef.current.setLocalDescription(offer);
          
          socketRef.current?.emit('call_offer', {
            offer: peerConnectionRef.current.localDescription,
            targetUserId
          });
          
          console.log('✅ ICE restart initiated');
        }
      } catch (err) {
        console.error('❌ Reconnection failed:', err);
        attemptReconnection();
      }
    }, 2000);
  }, [reconnectAttempts, targetUserId, onCallEnd]);

  const cleanup = useCallback(() => {
    console.log('🧹 Cleaning up WebRTC resources');
    
    // Clear reconnection timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Stop all media tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log(`Stopped ${track.kind} track`);
      });
      localStreamRef.current = null;
      setLocalStream(null);
    }

    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
      setRemoteStream(null);
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    setCallState('idle');
    setError(null);
    setReconnectAttempts(0);
    setIsMuted(false);
    setIsVideoOff(false);
  }, [remoteStream]);

  useEffect(() => {
    const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
    
    const socket = io({
      auth: { token }
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('WebRTC Socket connected');
    });

    socket.on('call_initiate', async ({ callerId, callerName }) => {
      console.log('Incoming call from:', callerName);
      if (onIncomingCall) {
        onIncomingCall(callerId, callerName);
      }
    });

    socket.on('call_offer', async ({ offer, callerId }) => {
      console.log('Received offer from:', callerId);
      try {
        await handleOffer(offer, callerId);
      } catch (err: any) {
        console.error('Error handling offer:', err);
        setError(err.message);
      }
    });

    socket.on('call_answer', async ({ answer }) => {
      console.log('Received answer');
      try {
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        }
      } catch (err: any) {
        console.error('Error handling answer:', err);
        setError(err.message);
      }
    });

    socket.on('ice_candidate', async ({ candidate }) => {
      console.log('Received ICE candidate');
      try {
        if (peerConnectionRef.current && candidate) {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (err: any) {
        console.error('Error adding ICE candidate:', err);
      }
    });

    socket.on('call_end', () => {
      console.log('Call ended by remote peer');
      cleanup();
      if (onCallEnd) {
        onCallEnd();
      }
    });

    socket.on('disconnect', () => {
      console.log('WebRTC Socket disconnected');
      cleanup();
    });

    return () => {
      cleanup();
      socket.disconnect();
    };
  }, [onCallEnd, onIncomingCall]);

  const handleOffer = async (offer: RTCSessionDescriptionInit, callerId: string) => {
    const stream = await getUserMedia();
    if (!stream) return;

    const pc = createPeerConnection(callerId);
    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
    });

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socketRef.current?.emit('call_answer', {
      answer: pc.localDescription,
      targetUserId: callerId
    });
  };

  const createPeerConnection = (remoteUserId: string): RTCPeerConnection => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    const pc = new RTCPeerConnection(RTC_CONFIG);
    peerConnectionRef.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit('ice_candidate', {
          candidate: event.candidate,
          targetUserId: remoteUserId
        });
      }
    };

    pc.ontrack = (event) => {
      console.log('Received remote track');
      const stream = event.streams[0];
      setRemoteStream(stream);
    };

    // FIX #8: Enhanced connection state handling with all states
    pc.onconnectionstatechange = () => {
      console.log('Connection state:', pc.connectionState);
      
      switch (pc.connectionState) {
        case 'connecting':
          setCallState('connecting');
          setError(null);
          break;
          
        case 'connected':
          setCallState('connected');
          setError(null);
          setReconnectAttempts(0); // Reset reconnect counter on success
          console.log('✅ WebRTC connection established');
          break;
          
        case 'disconnected':
          console.warn('⚠️ Connection disconnected, attempting reconnection...');
          attemptReconnection();
          break;
          
        case 'failed':
          console.error('❌ Connection failed');
          setCallState('failed');
          setError('Connection failed - please check your network');
          cleanup();
          if (onCallEnd) onCallEnd();
          break;
          
        case 'closed':
          console.log('Connection closed');
          setCallState('disconnected');
          cleanup();
          break;
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', pc.iceConnectionState);
      
      switch (pc.iceConnectionState) {
        case 'checking':
          setCallState('connecting');
          break;
          
        case 'connected':
        case 'completed':
          setCallState('connected');
          break;
          
        case 'failed':
          console.error('❌ ICE connection failed');
          attemptReconnection();
          break;
          
        case 'disconnected':
          console.warn('⚠️ ICE connection disconnected');
          // Don't immediately fail - wait for reconnection
          break;
      }
    };

    return pc;
  };

  const getUserMedia = async (audioOnly: boolean = false): Promise<MediaStream | null> => {
    setCallState('initiating');
    setError(null);
    
    try {
      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: audioOnly ? false : {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      localStreamRef.current = stream;
      return stream;
    } catch (err: any) {
      console.error('Error accessing media devices:', err);
      setCallState('error');
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera/microphone permission denied. Please allow access and try again.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera or microphone found. Please connect a device and try again.');
      } else {
        setError('Failed to access camera/microphone: ' + err.message);
      }
      return null;
    }
  };

  const startCall = useCallback(async (audioOnly: boolean = false) => {
    if (!targetUserId || !socketRef.current) {
      setCallState('error');
      setError('Invalid call configuration');
      return;
    }

    setError(null);

    try {
      const stream = await getUserMedia(audioOnly);
      if (!stream) {
        setCallState('failed');
        return;
      }

      setCallState('ringing');
      socketRef.current.emit('call_initiate', { targetUserId });

      const pc = createPeerConnection(targetUserId);
      
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socketRef.current.emit('call_offer', {
        offer: pc.localDescription,
        targetUserId
      });

      console.log('Call initiated to:', targetUserId);
    } catch (err: any) {
      console.error('Error starting call:', err);
      setCallState('failed');
      setError(err.message);
    }
  }, [targetUserId]);

  const answerCall = useCallback(async (audioOnly: boolean = false) => {
    setCallState('connecting');
    setError(null);

    try {
      const stream = await getUserMedia(audioOnly);
      if (!stream) {
        setCallState('failed');
        return;
      }
    } catch (err: any) {
      console.error('Error answering call:', err);
      setCallState('error');
      setError(err.message);
    }
  }, []);

  const endCall = useCallback(() => {
    if (targetUserId && socketRef.current) {
      socketRef.current.emit('call_end', { targetUserId });
    }
    cleanup();
    if (onCallEnd) {
      onCallEnd();
    }
  }, [targetUserId, onCallEnd]);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, []);

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  }, []);

  return {
    localStream,
    remoteStream,
    callState,
    error,
    isMuted,
    isVideoOff,
    startCall,
    answerCall,
    endCall,
    toggleMute,
    toggleVideo
  };
}
