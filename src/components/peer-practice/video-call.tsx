
'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mic, PhoneOff, Video, VideoOff, Copy, Check } from 'lucide-react';

type VideoCallProps = {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  onHangUp: () => void;
  isConnected: boolean;
  roomId: string;
};

const VideoPlayer = ({ stream, muted = false }: { stream: MediaStream | null; muted?: boolean }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="bg-muted rounded-lg aspect-video flex items-center justify-center relative border overflow-hidden">
      <video ref={videoRef} autoPlay playsInline muted={muted} className="h-full w-full object-cover scale-x-[-1]" />
      {!stream && (
        <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
};


export default function VideoCall({
  localStream,
  remoteStream,
  onHangUp,
  isConnected,
  roomId,
}: VideoCallProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [inviteLink, setInviteLink] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
        setInviteLink(`${window.location.origin}/peer-practice/${roomId}`);
    }
  }, [roomId]);


  const handleCopyLink = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    });
  }

  return (
    <div className="w-full max-w-5xl">
      <Card>
        <CardHeader>
          <CardTitle>Live Interview Session</CardTitle>
          <div className="flex items-center justify-between">
            {isConnected ? (
                <CardDescription className="text-green-600 font-semibold animate-pulse">Peer Connected</CardDescription>
            ) : (
                <CardDescription>Waiting for peer to join...</CardDescription>
            )}
            
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleCopyLink} disabled={!inviteLink}>
                    {isCopied ? <Check className="mr-2 h-4 w-4"/> : <Copy className="mr-2 h-4 w-4"/>}
                    {isCopied ? 'Copied!' : 'Copy Invite Link'}
                </Button>
            </div>

          </div>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div>
            <VideoPlayer stream={remoteStream} />
            <p className="text-sm text-center mt-2 font-medium">Peer's Camera</p>
          </div>
          <div>
            <VideoPlayer stream={localStream} muted />
            <p className="text-sm text-center mt-2 font-medium">Your Camera</p>
          </div>
        </CardContent>
        <CardContent className="flex justify-center gap-4 mt-4">
          <Button variant="destructive" size="lg" onClick={onHangUp}>
            <PhoneOff className="mr-2 h-4 w-4" /> End Session
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
