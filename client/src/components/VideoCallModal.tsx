import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, User, Loader2 } from 'lucide-react';
import { useWebRTC } from '@/hooks/useWebRTC';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface VideoCallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetUserId: string;
  targetUserName: string;
  isInitiator: boolean;
}

export function VideoCallModal({
  open,
  onOpenChange,
  targetUserId,
  targetUserName,
  isInitiator
}: VideoCallModalProps) {
  const [callType, setCallType] = useState<'video' | 'audio'>('video');
  const [callStarted, setCallStarted] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const {
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
  } = useWebRTC({
    isInitiator,
    targetUserId,
    onCallEnd: () => {
      setCallStarted(false);
      onOpenChange(false);
    }
  });

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    if (!open) {
      setCallStarted(false);
      setCallType('video');
    }
  }, [open]);

  const handleStartCall = async (type: 'video' | 'audio') => {
    setCallType(type);
    setCallStarted(true);
    await startCall(type === 'audio');
  };

  const handleEndCall = () => {
    endCall();
    setCallStarted(false);
    onOpenChange(false);
  };

  const getConnectionStatus = () => {
    if (error) return { text: 'Error', color: 'bg-red-500' };
    if (isConnected) return { text: 'Connected', color: 'bg-green-500' };
    if (isConnecting) return { text: 'Connecting...', color: 'bg-yellow-500' };
    return { text: 'Ready', color: 'bg-gray-500' };
  };

  const status = getConnectionStatus();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">
                {callStarted ? `Call with ${targetUserName}` : 'Start Call'}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {callStarted ? (
                  <Badge className={`${status.color} text-white`}>
                    {status.text}
                  </Badge>
                ) : (
                  `Call ${targetUserName}`
                )}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="relative bg-black">
          {!callStarted ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 min-h-[400px]">
              <div className="bg-primary/10 p-8 rounded-full mb-6">
                <User className="h-24 w-24 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-2">{targetUserName}</h3>
              <p className="text-gray-400 mb-8">Choose call type</p>
              
              <div className="flex gap-4">
                <Button
                  size="lg"
                  onClick={() => handleStartCall('video')}
                  className="gap-2"
                  data-testid="button-start-video-call"
                >
                  <Video className="h-5 w-5" />
                  Video Call
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() => handleStartCall('audio')}
                  className="gap-2"
                  data-testid="button-start-audio-call"
                >
                  <Phone className="h-5 w-5" />
                  Audio Call
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="relative w-full aspect-video bg-gray-900">
                {remoteStream ? (
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                    data-testid="video-remote"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    {isConnecting ? (
                      <>
                        <Loader2 className="h-16 w-16 text-white animate-spin mb-4" />
                        <p className="text-white text-lg">Connecting to {targetUserName}...</p>
                      </>
                    ) : (
                      <>
                        <div className="bg-primary/20 p-8 rounded-full mb-4">
                          <User className="h-16 w-16 text-white" />
                        </div>
                        <p className="text-white text-lg">{targetUserName}</p>
                        <p className="text-gray-400 text-sm mt-2">Waiting to connect...</p>
                      </>
                    )}
                  </div>
                )}

                {localStream && callType === 'video' && (
                  <div className="absolute bottom-4 right-4 w-48 aspect-video bg-gray-800 rounded-lg overflow-hidden shadow-lg border-2 border-white">
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                      data-testid="video-local"
                    />
                    {isVideoOff && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                        <VideoOff className="h-8 w-8 text-white" />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {error && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-96 max-w-[calc(100%-2rem)]">
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </div>
              )}

              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                <div className="flex items-center justify-center gap-4">
                  <Button
                    size="lg"
                    variant={isMuted ? "destructive" : "secondary"}
                    onClick={toggleMute}
                    className="rounded-full h-14 w-14 p-0"
                    data-testid="button-toggle-mute"
                    title={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                  </Button>

                  {callType === 'video' && (
                    <Button
                      size="lg"
                      variant={isVideoOff ? "destructive" : "secondary"}
                      onClick={toggleVideo}
                      className="rounded-full h-14 w-14 p-0"
                      data-testid="button-toggle-video"
                      title={isVideoOff ? "Turn on camera" : "Turn off camera"}
                    >
                      {isVideoOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
                    </Button>
                  )}

                  <Button
                    size="lg"
                    variant="destructive"
                    onClick={handleEndCall}
                    className="rounded-full h-16 w-16 p-0"
                    data-testid="button-end-call"
                    title="End call"
                  >
                    <PhoneOff className="h-7 w-7" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        {callStarted && (
          <div className="p-4 bg-muted/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${status.color} animate-pulse`} />
              <span className="text-sm text-muted-foreground">{status.text}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {callType === 'video' ? 'Video Call' : 'Audio Call'}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
