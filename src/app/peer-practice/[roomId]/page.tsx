
'use client';

import { useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { AppLayout } from '@/components/app-layout';
import VideoCall from '@/components/peer-practice/video-call';
import { useWebRTC } from '@/hooks/use-webrtc';

export default function RoomPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const roomId = params.roomId as string;
  // Fallback to a random ID if not provided, for robustness.
  const userId = searchParams.get('userId') || `user_${crypto.randomUUID().slice(0, 8)}`;
  const peerId = searchParams.get('peerId') || undefined;

  const { localStream, remoteStream, isConnected, hangUp } = useWebRTC(roomId, userId, peerId);

  const handleHangUp = () => {
    hangUp();
    router.push('/peer-practice');
  };

  return (
    <AppLayout>
      <main className="flex-1 p-4 md:p-8 flex items-center justify-center">
        <VideoCall
          localStream={localStream}
          remoteStream={remoteStream}
          onHangUp={handleHangUp}
          isConnected={isConnected}
          roomId={roomId}
        />
      </main>
    </AppLayout>
  );
}
