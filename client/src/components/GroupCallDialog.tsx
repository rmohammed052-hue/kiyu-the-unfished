import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  PhoneOff,
  Users
} from "lucide-react";
import type { GroupCallParticipant, CallType } from "@/hooks/useGroupCall";

interface GroupCallDialogProps {
  isOpen: boolean;
  isHost: boolean;
  participants: Map<string, GroupCallParticipant>;
  localStream: MediaStream | null;
  callType: CallType;
  onEndCall: () => void;
  onLeaveCall: () => void;
  onToggleMute: () => void;
  onToggleVideo: () => void;
}

function VideoTile({ 
  stream, 
  userName, 
  isSelf = false 
}: { 
  stream: MediaStream | null; 
  userName: string; 
  isSelf?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const hasVideo = stream?.getVideoTracks().some(track => track.enabled);

  return (
    <div className="relative aspect-video bg-muted rounded-md overflow-hidden border">
      {hasVideo && stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isSelf}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-2xl">
              {userName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      )}
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
        <Badge variant="secondary" className="text-xs">
          {userName} {isSelf && "(You)"}
        </Badge>
      </div>
    </div>
  );
}

export function GroupCallDialog({
  isOpen,
  isHost,
  participants,
  localStream,
  callType,
  onEndCall,
  onLeaveCall,
  onToggleMute,
  onToggleVideo
}: GroupCallDialogProps) {
  const isMuted = !localStream?.getAudioTracks().some(track => track.enabled);
  const isVideoOff = !localStream?.getVideoTracks().some(track => track.enabled);

  const handleToggleMute = () => {
    onToggleMute();
  };

  const handleToggleVideo = () => {
    onToggleVideo();
  };

  const participantCount = participants.size + 1;
  
  const gridCols = participantCount <= 2 ? "grid-cols-1" :
                   participantCount <= 4 ? "grid-cols-2" :
                   participantCount <= 6 ? "grid-cols-3" :
                   "grid-cols-4";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && (isHost ? onEndCall() : onLeaveCall())}>
      <DialogContent 
        className="max-w-[90vw] max-h-[90vh] h-[90vh]"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Group {callType === 'video' ? 'Video' : 'Voice'} Call
            <Badge variant="outline" data-testid="badge-participant-count">
              {participantCount} participant{participantCount !== 1 ? 's' : ''}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          <div className={`grid ${gridCols} gap-3 h-full`}>
            <VideoTile
              stream={localStream}
              userName="You"
              isSelf={true}
            />

            {Array.from(participants.entries()).map(([userId, participant]) => (
              <VideoTile
                key={userId}
                stream={participant.stream}
                userName={participant.userName || userId}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 pt-4 border-t">
          <Button
            variant={isMuted ? "destructive" : "outline"}
            size="icon"
            onClick={handleToggleMute}
            data-testid="button-toggle-mute"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>

          {callType === 'video' && (
            <Button
              variant={isVideoOff ? "destructive" : "outline"}
              size="icon"
              onClick={handleToggleVideo}
              data-testid="button-toggle-video"
              title={isVideoOff ? "Turn on camera" : "Turn off camera"}
            >
              {isVideoOff ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
            </Button>
          )}

          {isHost ? (
            <Button
              variant="destructive"
              onClick={onEndCall}
              data-testid="button-end-call"
            >
              <PhoneOff className="h-4 w-4 mr-2" />
              End Call for Everyone
            </Button>
          ) : (
            <Button
              variant="destructive"
              onClick={onLeaveCall}
              data-testid="button-leave-call"
            >
              <PhoneOff className="h-4 w-4 mr-2" />
              Leave Call
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
