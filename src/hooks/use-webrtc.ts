
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { firestore } from '@/lib/firebase';
import {
  doc,
  collection,
  addDoc,
  onSnapshot,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';

const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};

export function useWebRTC(roomId: string, userId: string, peerId?: string) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const pc = useRef<RTCPeerConnection | null>(null);
  const isCaller = useRef(!peerId);

  const setupStreams = useCallback(async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        return stream;
    } catch (e) {
        console.error("Error getting user media", e);
        return null;
    }
  }, []);

  const createPeerConnection = useCallback((stream: MediaStream) => {
    pc.current = new RTCPeerConnection(servers);
    
    stream.getTracks().forEach((track) => {
        pc.current!.addTrack(track, stream);
    });

    pc.current.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
    };

    pc.current.onconnectionstatechange = () => {
        if(pc.current?.connectionState === 'connected') {
            setIsConnected(true);
        } else if (pc.current?.connectionState === 'failed' || pc.current?.connectionState === 'disconnected') {
            setIsConnected(false);
        }
    }
  }, []);

  const startCall = useCallback(async (stream: MediaStream) => {
    if (!pc.current) return;
    
    const roomRef = doc(firestore, 'rooms', roomId);
    const callerCandidatesCollection = collection(roomRef, 'callerCandidates');
    const calleeCandidatesCollection = collection(roomRef, 'calleeCandidates');

    pc.current.onicecandidate = async (event) => {
        if (event.candidate) {
            await addDoc(callerCandidatesCollection, event.candidate.toJSON());
        }
    };

    const offerDescription = await pc.current.createOffer();
    await pc.current.setLocalDescription(offerDescription);

    const roomWithOffer = {
      offer: {
        type: offerDescription.type,
        sdp: offerDescription.sdp,
      },
      users: [userId, peerId],
    };

    await setDoc(roomRef, roomWithOffer);

    onSnapshot(roomRef, (snapshot) => {
      const data = snapshot.data();
      if (!pc.current?.currentRemoteDescription && data?.answer) {
        const answerDescription = new RTCSessionDescription(data.answer);
        pc.current.setRemoteDescription(answerDescription);
      }
    });

    onSnapshot(calleeCandidatesCollection, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const candidate = new RTCIceCandidate(change.doc.data());
          pc.current!.addIceCandidate(candidate);
        }
      });
    });

  }, [roomId, userId, peerId]);


  const joinCall = useCallback(async (stream: MediaStream) => {
      if(!pc.current) return;

      const roomRef = doc(firestore, 'rooms', roomId);
      const roomSnapshot = await getDoc(roomRef);

      if (!roomSnapshot.exists()) return;

      const callerCandidatesCollection = collection(roomRef, 'callerCandidates');
      const calleeCandidatesCollection = collection(roomRef, 'calleeCandidates');

      pc.current.onicecandidate = async (event) => {
          if (event.candidate) {
              await addDoc(calleeCandidatesCollection, event.candidate.toJSON());
          }
      };

      const offerDescription = roomSnapshot.data().offer;
      await pc.current.setRemoteDescription(new RTCSessionDescription(offerDescription));

      const answerDescription = await pc.current.createAnswer();
      await pc.current.setLocalDescription(answerDescription);

      const roomWithAnswer = {
          answer: {
              type: answerDescription.type,
              sdp: answerDescription.sdp,
          },
      };

      await updateDoc(roomRef, roomWithAnswer);

      onSnapshot(callerCandidatesCollection, (snapshot) => {
          snapshot.docChanges().forEach((change) => {
              if (change.type === 'added') {
                  let data = change.doc.data();
                  pc.current!.addIceCandidate(new RTCIceCandidate(data));
              }
          });
      });
  }, [roomId]);
  
  const start = useCallback(async () => {
    const stream = await setupStreams();
    if(stream) {
        createPeerConnection(stream);
        if(isCaller.current) {
            await startCall(stream);
        } else {
            await joinCall(stream);
        }
    }
  }, [setupStreams, createPeerConnection, startCall, joinCall]);


  const hangUp = useCallback(async () => {
    localStream?.getTracks().forEach((track) => track.stop());
    remoteStream?.getTracks().forEach((track) => track.stop());
    pc.current?.close();
    
    // Clean up firebase
    const roomRef = doc(firestore, 'rooms', roomId);
    const roomSnapshot = await getDoc(roomRef);
    if(roomSnapshot.exists()) {
        const callerCandidatesQuery = query(collection(roomRef, 'callerCandidates'));
        const calleeCandidatesQuery = query(collection(roomRef, 'calleeCandidates'));
        
        const callerDocs = await getDocs(callerCandidatesQuery);
        callerDocs.forEach(async doc => await deleteDoc(doc.ref));

        const calleeDocs = await getDocs(calleeCandidatesQuery);
        calleeDocs.forEach(async doc => await deleteDoc(doc.ref));

        await deleteDoc(roomRef);
    }
    
    setLocalStream(null);
    setRemoteStream(null);
    pc.current = null;
    setIsConnected(false);

  }, [localStream, remoteStream, roomId]);

  return { localStream, remoteStream, isConnected, start, hangUp };
}
