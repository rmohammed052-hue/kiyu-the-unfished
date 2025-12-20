import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, PhoneOff, Video, User } from 'lucide-react';
import { useSocket } from '@/contexts/NotificationContext';
import { useToast } from '@/hooks/use-toast';

export default function IncomingCallPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const socket = useSocket();
  
  // Parse URL parameters
  const params = new URLSearchParams(window.location.search);
  const callerId = params.get('callerId');
  const callerName = params.get('callerName');
  const callType = params.get('callType') as 'voice' | 'video';

  const [callActive, setCallActive] = useState(true);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    if (!socket || !callerId || !callerName || !callType) {
      navigate('/admin/messages');
      return;
    }

    // Listen for call cancellation
    const handleCallEnd = () => {
      setCallActive(false);
      toast({
        title: 'Call Ended',
        description: `${callerName} has ended the call.`,
      });
      setTimeout(() => navigate('/admin/messages'), 2000);
    };

    socket.on('call_end', handleCallEnd);

    return () => {
      socket.off('call_end', handleCallEnd);
    };
  }, [socket, callerId, callerName, callType, navigate, toast]);

  const initPeerConnection = (targetUserId: string): RTCPeerConnection => {
    const configuration: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    const pc = new RTCPeerConnection(configuration);
    peerConnectionRef.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('ice_candidate', {
          candidate: event.candidate,
          targetUserId
        });
      }
    };

    pc.ontrack = (event) => {
      console.log('📹 Remote track received:', event.streams[0]);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    return pc;
  };

  const acceptCall = async () => {
    if (!socket || !callerId) return;

    try {
      console.log(`📞 Accepting ${callType} call from ${callerName}`);
      
      const constraints = callType === 'video'
        ? { video: true, audio: true }
        : { video: false, audio: true };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (localVideoRef.current && callType === 'video') {
        localVideoRef.current.srcObject = stream;
      }

      const pc = initPeerConnection(callerId);
      
      // Get the offer from localStorage or state management
      const storedOffer = localStorage.getItem(`call_offer_${callerId}`);
      if (storedOffer) {
        const offer = JSON.parse(storedOffer);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
      }

      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('call_answer', {
        answer: pc.localDescription,
        targetUserId: callerId
      });

      toast({
        title: 'Call Connected',
        description: `Connected with ${callerName}`,
      });

      // Navigate to active call page
      navigate(`/admin/call/active?userId=${callerId || ''}&userName=${encodeURIComponent(callerName || '')}&callType=${callType || 'voice'}`);
    } catch (err: any) {
      console.error('Error accepting call:', err);
      toast({
        variant: 'destructive',
        title: 'Call Failed',
        description: err.message || 'Failed to accept call',
      });
      rejectCall();
    }
  };

  const rejectCall = () => {
    if (socket && callerId) {
      socket.emit('call_end', { targetUserId: callerId });
    }
    
    toast({
      title: 'Call Declined',
      description: `Declined call from ${callerName}`,
    });

    navigate('/admin/messages');
  };

  const minimize = () => {
    // Navigate back but keep call state in background
    toast({
      title: 'Call Minimized',
      description: 'The call is still ringing. You can return to this page anytime.',
    });
    navigate('/admin/messages');
  };

  if (!callActive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <p className="text-lg text-muted-foreground">Call has ended</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl">
            Incoming {callType === 'video' ? 'Video' : 'Voice'} Call
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
              {callType === 'video' ? (
                <Video className="h-12 w-12 text-primary" />
              ) : (
                <Phone className="h-12 w-12 text-primary" />
              )}
            </div>
            <h3 className="text-2xl font-semibold mb-2">{callerName}</h3>
            <p className="text-muted-foreground">is calling you...</p>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={acceptCall}
              size="lg"
              className="w-full bg-green-500 hover:bg-green-600 text-white"
            >
              <Phone className="h-5 w-5 mr-2" />
              Accept Call
            </Button>
            
            <Button
              onClick={rejectCall}
              variant="destructive"
              size="lg"
              className="w-full"
            >
              <PhoneOff className="h-5 w-5 mr-2" />
              Decline Call
            </Button>

            <Button
              onClick={minimize}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Minimize
            </Button>
          </div>

          {/* Hidden video elements for media setup */}
          {callType === 'video' && (
            <>
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="hidden"
              />
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="hidden"
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
