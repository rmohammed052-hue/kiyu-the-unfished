import { useState, useEffect, useRef, useCallback } from "react";
import { useSocket } from "@/contexts/NotificationContext";
import { useToast } from "@/hooks/use-toast";

export type CallType = 'voice' | 'video';

export interface GroupCallParticipant {
  userId: string;
  userName: string;
  stream: MediaStream | null;
  peerConnection: RTCPeerConnection | null;
}

interface GroupCallState {
  callId: string | null;
  isActive: boolean;
  isHost: boolean;
  participants: Map<string, GroupCallParticipant>;
  localStream: MediaStream | null;
  callType: CallType;
}

const ICE_SERVERS = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

export function useGroupCall(currentUserId: string) {
  const socket = useSocket();
  const { toast } = useToast();

  const [state, setState] = useState<GroupCallState>({
    callId: null,
    isActive: false,
    isHost: false,
    participants: new Map(),
    localStream: null,
    callType: 'video'
  });

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const createPeerConnection = useCallback((
    remoteUserId: string,
    callId: string
  ): RTCPeerConnection => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit("group_ice_candidate", {
          callId,
          targetUserId: remoteUserId,
          candidate: event.candidate
        });
      }
    };

    pc.ontrack = (event) => {
      const remoteStream = event.streams[0];
      setState(prev => {
        const newParticipants = new Map(prev.participants);
        const participant = newParticipants.get(remoteUserId);
        if (participant) {
          participant.stream = remoteStream;
          newParticipants.set(remoteUserId, participant);
        }
        return { ...prev, participants: newParticipants };
      });
    };

    pc.onconnectionstatechange = () => {
      console.log(`Peer connection to ${remoteUserId}: ${pc.connectionState}`);
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        setState(prev => {
          const newParticipants = new Map(prev.participants);
          const participant = newParticipants.get(remoteUserId);
          if (participant) {
            participant.peerConnection = null;
            participant.stream = null;
            newParticipants.set(remoteUserId, participant);
          }
          return { ...prev, participants: newParticipants };
        });
      }
    };

    return pc;
  }, [socket]);

  const addLocalStreamToAllPeers = useCallback((localStream: MediaStream) => {
    stateRef.current.participants.forEach((participant) => {
      if (participant.peerConnection) {
        localStream.getTracks().forEach((track) => {
          participant.peerConnection!.addTrack(track, localStream);
        });
      }
    });
  }, []);

  const cleanup = useCallback(() => {
    const { localStream, participants } = stateRef.current;

    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }

    participants.forEach(participant => {
      if (participant.peerConnection) {
        participant.peerConnection.close();
      }
      if (participant.stream) {
        participant.stream.getTracks().forEach(track => track.stop());
      }
    });

    setState({
      callId: null,
      isActive: false,
      isHost: false,
      participants: new Map(),
      localStream: null,
      callType: 'video'
    });
  }, []);

  const startGroupCall = useCallback(async (
    participantIds: string[],
    callType: CallType,
    userRole?: string
  ) => {
    if (!socket) {
      toast({
        title: "Connection Error",
        description: "Not connected to server",
        variant: "destructive"
      });
      return;
    }

    if (userRole !== "admin" && userRole !== "super_admin") {
      toast({
        title: "Permission Denied",
        description: "Only admins can start group calls",
        variant: "destructive"
      });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: callType === 'video',
        audio: true
      });

      setState({
        callId: null,
        isActive: true,
        isHost: true,
        participants: new Map(),
        localStream: stream,
        callType
      });

      socket.emit("group_call_start", { participantIds, callType });

      const timeoutId = setTimeout(() => {
        if (!stateRef.current.callId) {
          toast({
            title: "Call Failed",
            description: "Failed to start group call. Please try again.",
            variant: "destructive"
          });
          cleanup();
        }
      }, 5000);

      socket.once("group_call_started", () => {
        clearTimeout(timeoutId);
      });
    } catch (error) {
      console.error("Failed to get user media:", error);
      toast({
        title: "Media Access Error",
        description: "Could not access camera/microphone",
        variant: "destructive"
      });
    }
  }, [socket, toast, cleanup]);

  const joinGroupCall = useCallback(async (callId: string, callType: CallType) => {
    if (!socket) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: callType === 'video',
        audio: true
      });

      setState({
        callId,
        isActive: true,
        isHost: false,
        participants: new Map(),
        localStream: stream,
        callType
      });

      socket.emit("group_call_join", { callId });
    } catch (error) {
      console.error("Failed to join group call:", error);
      toast({
        title: "Media Access Error",
        description: "Could not access camera/microphone",
        variant: "destructive"
      });
    }
  }, [socket, toast]);

  const leaveGroupCall = useCallback(() => {
    const { callId } = stateRef.current;

    if (callId && socket) {
      socket.emit("group_call_leave", { callId });
    } else if (!callId && stateRef.current.isActive) {
      console.warn("Leaving group call without valid callId - local cleanup only");
    }

    cleanup();
  }, [socket, cleanup]);

  const endGroupCall = useCallback(() => {
    const { callId } = stateRef.current;
    if (callId && socket) {
      socket.emit("group_call_end", { callId });
    } else if (!callId && stateRef.current.isActive) {
      console.warn("Ending group call without valid callId - local cleanup only");
    }
    cleanup();
  }, [socket, cleanup]);

  const toggleMute = useCallback(() => {
    const { localStream } = stateRef.current;
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
      }
    }
  }, []);

  const toggleVideo = useCallback(() => {
    const { localStream } = stateRef.current;
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
      }
    }
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on("group_call_started", ({ callId, participants }) => {
      setState(prev => ({
        ...prev,
        callId,
        participants: new Map(participants.filter((p: string) => p !== currentUserId).map((p: string): [string, GroupCallParticipant] => [
          p,
          { userId: p, userName: '', stream: null, peerConnection: null }
        ]))
      }));
    });

    socket.on("group_call_joined", async ({ callId, participants, callType }) => {
      const newParticipants = new Map<string, GroupCallParticipant>(
        participants.filter((p: string) => p !== currentUserId).map((p: string): [string, GroupCallParticipant] => [
          p,
          { userId: p, userName: '', stream: null, peerConnection: null }
        ])
      );

      setState(prev => ({
        ...prev,
        callId,
        callType,
        participants: newParticipants
      }));

      const localStream = stateRef.current.localStream;
      if (!localStream) return;

      for (const [userId] of Array.from(newParticipants.entries())) {
        const pc = createPeerConnection(userId, callId);
        
        localStream.getTracks().forEach((track) => {
          pc.addTrack(track, localStream);
        });

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit("group_call_offer", {
          callId,
          targetUserId: userId,
          offer
        });

        setState(prev => {
          const updated = new Map(prev.participants);
          const participant = updated.get(userId);
          if (participant) {
            participant.peerConnection = pc;
            updated.set(userId, participant);
          }
          return { ...prev, participants: updated };
        });
      }
    });

    socket.on("group_call_participant_joined", async ({ callId, userId, userName }) => {
      if (userId === currentUserId) return;

      setState(prev => {
        const newParticipants = new Map(prev.participants);
        newParticipants.set(userId, {
          userId,
          userName,
          stream: null,
          peerConnection: null
        });
        return { ...prev, participants: newParticipants };
      });
    });

    socket.on("group_call_offer", async ({ callId, fromUserId, offer }) => {
      const pc = createPeerConnection(fromUserId, callId);
      
      const localStream = stateRef.current.localStream;
      if (localStream) {
        localStream.getTracks().forEach((track) => {
          pc.addTrack(track, localStream);
        });
      }

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("group_call_answer", {
        callId,
        targetUserId: fromUserId,
        answer
      });

      setState(prev => {
        const updated = new Map(prev.participants);
        const participant = updated.get(fromUserId);
        if (participant) {
          participant.peerConnection = pc;
          updated.set(fromUserId, participant);
        }
        return { ...prev, participants: updated };
      });
    });

    socket.on("group_call_answer", async ({ callId, fromUserId, answer }) => {
      const participant = stateRef.current.participants.get(fromUserId);
      if (participant?.peerConnection) {
        await participant.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    socket.on("group_ice_candidate", async ({ callId, fromUserId, candidate }) => {
      const participant = stateRef.current.participants.get(fromUserId);
      if (participant?.peerConnection) {
        try {
          await participant.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
          console.error("Error adding ICE candidate:", error);
        }
      }
    });

    socket.on("group_call_participant_left", ({ userId }) => {
      setState(prev => {
        const newParticipants = new Map(prev.participants);
        const participant = newParticipants.get(userId);
        
        if (participant) {
          if (participant.peerConnection) {
            participant.peerConnection.close();
          }
          if (participant.stream) {
            participant.stream.getTracks().forEach(track => track.stop());
          }
          newParticipants.delete(userId);
        }
        
        return { ...prev, participants: newParticipants };
      });
    });

    socket.on("group_call_ended", () => {
      toast({
        title: "Group Call Ended",
        description: "The host has ended the call"
      });
      cleanup();
    });

    return () => {
      socket.off("group_call_started");
      socket.off("group_call_joined");
      socket.off("group_call_participant_joined");
      socket.off("group_call_offer");
      socket.off("group_call_answer");
      socket.off("group_ice_candidate");
      socket.off("group_call_participant_left");
      socket.off("group_call_ended");
      
      cleanup();
    };
  }, [socket, currentUserId, createPeerConnection, cleanup, toast]);

  return {
    state,
    startGroupCall,
    joinGroupCall,
    leaveGroupCall,
    endGroupCall,
    toggleMute,
    toggleVideo
  };
}
