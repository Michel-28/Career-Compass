
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
  writeBatch,
  getDocs,
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
  const [error, setError] = useState<string | null>(null);
  const pc = useRef<RTCPeerConnection | null>(null);
  const isCaller = useRef(!peerId);

  const setupStreams = useCallback(async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        setError(null);
        return stream;
    } catch (e) {
        console.error("Error getting user media", e);
        if (e instanceof Error && e.name === 'NotAllowedError') {
             setError("Permission to access camera and microphone was denied.");
        } else {
            setError("Could not access camera and microphone.");
        }
        return null;
    }
  }, []);

  const createPeerConnection = useCallback((stream: MediaStream) => {
    // Ensure any existing connection is closed
    if (pc.current) {
        pc.current.close();
    }
      
    const newPc = new RTCPeerConnection(servers);
    
    stream.getTracks().forEach((track) => {
        newPc.addTrack(track, stream);
    });

    newPc.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
    };

    newPc.onconnectionstatechange = () => {
        if(newPc.connectionState === 'connected') {
            setIsConnected(true);
        } else if (newPc.connectionState === 'failed' || newPc.connectionState === 'disconnected' || newPc.connectionState === 'closed') {
            setIsConnected(false);
        }
    }
    pc.current = newPc;
  }, []);

  const startCall = useCallback(async () => {
    if (!pc.current || !localStream) return;
    
    const roomRef = doc(firestore, 'rooms', roomId);
    const callerCandidatesCollection = collection(roomRef, 'callerCandidates');
    
    pc.current.onicecandidate = async (event) => {
        if (event.candidate) {
            await addDoc(callerCandidatesCollection, event.candidate.toJSON());
        }
    };

    const roomSnapshot = await getDoc(roomRef);
    if (!roomSnapshot.exists() || !roomSnapshot.data()?.offer) {
        const offerDescription = await pc.current.createOffer();
        await pc.current.setLocalDescription(offerDescription);

        const roomWithOffer = {
            offer: {
                type: offerDescription.type,
                sdp: offerDescription.sdp,
            },
            users: [userId, peerId],
        };
        await setDoc(roomRef, roomWithOffer, { merge: true });
    }
    
    const unsubscribeAnswer = onSnapshot(roomRef, (snapshot) => {
      const data = snapshot.data();
      if (pc.current && !pc.current.currentRemoteDescription && data?.answer) {
        const answerDescription = new RTCSessionDescription(data.answer);
        pc.current.setRemoteDescription(answerDescription);
      }
    });

    const calleeCandidatesCollection = collection(roomRef, 'calleeCandidates');
    const unsubscribeCalleeCandidates = onSnapshot(calleeCandidatesCollection, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const candidate = new RTCIceCandidate(change.doc.data());
          pc.current?.addIceCandidate(candidate);
        }
      });
    });

    return () => {
        unsubscribeAnswer();
        unsubscribeCalleeCandidates();
    };

  }, [roomId, userId, peerId, localStream]);


  const joinCall = useCallback(async () => {
      if(!pc.current || !localStream) return;

      const roomRef = doc(firestore, 'rooms', roomId);
      const roomSnapshot = await getDoc(roomRef);

      if (!roomSnapshot.exists()) {
        setError("Room does not exist.");
        return;
      }

      const calleeCandidatesCollection = collection(roomRef, 'calleeCandidates');

      pc.current.onicecandidate = async (event) => {
          if (event.candidate) {
              await addDoc(calleeCandidatesCollection, event.candidate.toJSON());
          }
      };

      const offerDescription = roomSnapshot.data().offer;
      if (!pc.current.currentRemoteDescription) {
        await pc.current.setRemoteDescription(new RTCSessionDescription(offerDescription));
      }


      const answerDescription = await pc.current.createAnswer();
      await pc.current.setLocalDescription(answerDescription);

      const roomWithAnswer = {
          answer: {
              type: answerDescription.type,
              sdp: answerDescription.sdp,
          },
      };

      await updateDoc(roomRef, roomWithAnswer);

      const callerCandidatesCollection = collection(roomRef, 'callerCandidates');
      const unsubscribeCallerCandidates = onSnapshot(callerCandidatesCollection, (snapshot) => {
          snapshot.docChanges().forEach((change) => {
              if (change.type === 'added') {
                  let data = change.doc.data();
                  pc.current?.addIceCandidate(new RTCIceCandidate(data));
              }
          });
      });

      return () => unsubscribeCallerCandidates();

  }, [roomId, localStream]);
  
  const start = useCallback(async () => {
    const stream = await setupStreams();
    if(stream) {
        createPeerConnection(stream);
        let unsubscribe: (() => void) | undefined;
        if(isCaller.current) {
            unsubscribe = await startCall();
        } else {
            unsubscribe = await joinCall();
        }
        return unsubscribe;
    }
  }, [setupStreams, createPeerConnection, startCall, joinCall]);


  const hangUp = useCallback(async () => {
    localStream?.getTracks().forEach((track) => track.stop());
    remoteStream?.getTracks().forEach((track) => track.stop());
    if (pc.current) {
      pc.current.close();
      pc.current = null;
    }
    
    // Clean up firebase
    try {
        const roomRef = doc(firestore, 'rooms', roomId);
        const roomSnapshot = await getDoc(roomRef);
        if(roomSnapshot.exists()) {
            const batch = writeBatch(firestore);
            
            const callerCandidatesQuery = query(collection(roomRef, 'callerCandidates'));
            const calleeCandidatesQuery = query(collection(roomRef, 'calleeCandidates'));
            
            const callerDocs = await getDocs(callerCandidatesQuery);
            callerDocs.forEach(doc => batch.delete(doc.ref));

            const calleeDocs = await getDocs(calleeCandidatesQuery);
            calleeDocs.forEach(doc => batch.delete(doc.ref));

            batch.delete(roomRef);
            await batch.commit();
        }
    } catch (e) {
        console.error("Error during firebase cleanup: ", e);
    }
    
    setLocalStream(null);
    setRemoteStream(null);
    setIsConnected(false);

  }, [localStream, remoteStream, roomId]);
  
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    const startConnection = async () => {
        const unsub = await start();
        unsubscribe = unsub;
    };
    
    startConnection();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      hangUp();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { localStream, remoteStream, isConnected, error, start, hangUp };
}
