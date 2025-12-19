import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

interface UseWebRTCProps {
  isInitiator: boolean;
  targetUserId?: string;
  onCallEnd?: () => void;
  onIncomingCall?: (callerId: string, callerName: string) => void;
}

export function useWebRTC({ isInitiator, targetUserId, onCallEnd, onIncomingCall }: UseWebRTCProps) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

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

    pc.onconnectionstatechange = () => {
      console.log('Connection state:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        setIsConnected(true);
        setIsConnecting(false);
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setIsConnected(false);
        cleanup();
        if (onCallEnd) {
          onCallEnd();
        }
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', pc.iceConnectionState);
      if (pc.iceConnectionState === 'connected') {
        setIsConnected(true);
        setIsConnecting(false);
      }
    };

    return pc;
  };

  const getUserMedia = async (audioOnly: boolean = false): Promise<MediaStream | null> => {
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
      setError('Invalid call configuration');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const stream = await getUserMedia(audioOnly);
      if (!stream) {
        setIsConnecting(false);
        return;
      }

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
      setError(err.message);
      setIsConnecting(false);
    }
  }, [targetUserId]);

  const answerCall = useCallback(async (audioOnly: boolean = false) => {
    setIsConnecting(true);
    setError(null);

    try {
      const stream = await getUserMedia(audioOnly);
      if (!stream) {
        setIsConnecting(false);
        return;
      }
    } catch (err: any) {
      console.error('Error answering call:', err);
      setError(err.message);
      setIsConnecting(false);
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

  const cleanup = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    setRemoteStream(null);
    setIsConnected(false);
    setIsConnecting(false);
    setIsMuted(false);
    setIsVideoOff(false);
  };

  return {
    localStream,
    remoteStream,
    isConnected,
    isConnecting,
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
