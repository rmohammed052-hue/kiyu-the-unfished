import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Maximize2, Minimize2 } from "lucide-react";

interface CallInterfaceProps {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  callState: "idle" | "calling" | "incoming" | "connected" | "ended";
  callType: "audio" | "video";
  contactName: string;
  onAccept?: () => void;
  onReject?: () => void;
  onEnd: () => void;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  isMuted: boolean;
  isVideoOff: boolean;
}

export default function CallInterface({
  localStream,
  remoteStream,
  callState,
  callType,
  contactName,
  onAccept,
  onReject,
  onEnd,
  onToggleMute,
  onToggleVideo,
  isMuted,
  isVideoOff,
}: CallInterfaceProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach remote stream to video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (callState === "idle") return null;

  return (
    <div
      className={`fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center ${
        isFullscreen ? "" : "p-4"
      }`}
      data-testid="call-interface"
    >
      {/* Call Status Header */}
      <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/80 to-transparent z-10">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-white mb-2" data-testid="text-contact-name">
            {contactName}
          </h2>
          <p className="text-white/80" data-testid="text-call-status">
            {callState === "calling" && "Calling..."}
            {callState === "incoming" && "Incoming call"}
            {callState === "connected" && "Connected"}
            {callState === "ended" && "Call ended"}
          </p>
        </div>
      </div>

      {/* Video Display */}
      {callType === "video" && (
        <div className="flex-1 w-full max-w-6xl relative">
          {/* Remote Video (Main) */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover rounded-lg"
            data-testid="video-remote"
          />

          {/* Local Video (Picture-in-Picture) */}
          <div className="absolute bottom-4 right-4 w-48 h-36 bg-gray-900 rounded-lg overflow-hidden shadow-2xl border-2 border-white/20">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover mirror"
              data-testid="video-local"
            />
          </div>

          {/* Fullscreen Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white"
            data-testid="button-fullscreen"
          >
            {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
          </Button>
        </div>
      )}

      {/* Audio-Only Display */}
      {callType === "audio" && (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-32 h-32 rounded-full bg-primary flex items-center justify-center">
            <span className="text-5xl font-bold text-white">
              {contactName.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
      )}

      {/* Call Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
        {callState === "incoming" ? (
          // Incoming Call Buttons
          <div className="flex items-center justify-center gap-6">
            <Button
              size="lg"
              variant="destructive"
              onClick={onReject}
              className="rounded-full w-16 h-16"
              data-testid="button-reject"
            >
              <PhoneOff className="h-6 w-6" />
            </Button>
            <Button
              size="lg"
              onClick={onAccept}
              className="rounded-full w-16 h-16 bg-green-600 hover:bg-green-700"
              data-testid="button-accept"
            >
              <Phone className="h-6 w-6" />
            </Button>
          </div>
        ) : (
          // Active Call Controls
          <div className="flex items-center justify-center gap-4">
            {/* Mute Button */}
            <Button
              size="lg"
              variant={isMuted ? "destructive" : "secondary"}
              onClick={onToggleMute}
              className="rounded-full w-14 h-14"
              data-testid="button-mute"
            >
              {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>

            {/* Video Toggle (only for video calls) */}
            {callType === "video" && (
              <Button
                size="lg"
                variant={isVideoOff ? "destructive" : "secondary"}
                onClick={onToggleVideo}
                className="rounded-full w-14 h-14"
                data-testid="button-video-toggle"
              >
                {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
              </Button>
            )}

            {/* End Call Button */}
            <Button
              size="lg"
              variant="destructive"
              onClick={onEnd}
              className="rounded-full w-16 h-16"
              data-testid="button-end-call"
            >
              <PhoneOff className="h-6 w-6" />
            </Button>
          </div>
        )}
      </div>

      {/* Mirror effect for local video */}
      <style>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
}
