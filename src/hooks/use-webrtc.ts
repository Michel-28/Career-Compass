
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
  const remoteStreamRef = useRef<MediaStream | null>(null);


  const setupMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      setError(null);
      return stream;
    } catch (e) {
      console.error("Error getting user media", e);
      if (e instanceof Error && (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError')) {
           setError("Permission to access camera and microphone was denied.");
      } else {
          setError("Could not access camera and microphone.");
      }
      return null;
    }
  }, []);

  const hangUp = useCallback(async () => {
    if (pc.current) {
        pc.current.onicecandidate = null;
        pc.current.ontrack = null;
        pc.current.onconnectionstatechange = null;
        pc.current.close();
        pc.current = null;
    }
    localStream?.getTracks().forEach((track) => track.stop());
    remoteStreamRef.current?.getTracks().forEach(track => track.stop());

    setLocalStream(null);
    setRemoteStream(null);
    remoteStreamRef.current = null;
    setIsConnected(false);
    
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
  }, [roomId, localStream]);


  const toggleMediaTrack = (kind: 'audio' | 'video', enabled?: boolean) => {
    if (localStream) {
        const track = kind === 'video' ? localStream.getVideoTracks()[0] : localStream.getAudioTracks()[0];
        if (track) {
            track.enabled = enabled !== undefined ? enabled : !track.enabled;
        }
    }
  };


  useEffect(() => {
    let unsubs: (()=>void)[] = [];
    const roomRef = doc(firestore, 'rooms', roomId);

    const setupConnection = async () => {
        const stream = await setupMedia();
        if (!stream) {
          return;
        }

        pc.current = new RTCPeerConnection(servers);

        stream.getTracks().forEach((track) => {
            pc.current?.addTrack(track, stream);
        });

        pc.current.ontrack = (event) => {
            const newRemoteStream = event.streams[0];
            if (remoteStreamRef.current?.id !== newRemoteStream.id) {
                 setRemoteStream(newRemoteStream);
                 remoteStreamRef.current = newRemoteStream;
            }
        };

        pc.current.onconnectionstatechange = () => {
            const state = pc.current?.connectionState;
            if(state === 'connected') {
                setIsConnected(true);
            } else if (state === 'failed' || state === 'disconnected' || state === 'closed') {
                setIsConnected(false);
            }
        }
        
        // --- Signaling Logic ---
        const callerCandidatesCollection = collection(roomRef, 'callerCandidates');
        const calleeCandidatesCollection = collection(roomRef, 'calleeCandidates');

        pc.current.onicecandidate = (event) => {
            if (event.candidate) {
                if (isCaller.current) {
                    addDoc(callerCandidatesCollection, event.candidate.toJSON());
                } else {
                    addDoc(calleeCandidatesCollection, event.candidate.toJSON());
                }
            }
        };
        
        if (isCaller.current) {
            // Caller: create offer
            const offerDescription = await pc.current.createOffer();
            await pc.current.setLocalDescription(offerDescription);
            await setDoc(roomRef, { offer: { type: offerDescription.type, sdp: offerDescription.sdp } });
            
            // Listen for answer
            const unsubAnswer = onSnapshot(roomRef, (snapshot) => {
                const data = snapshot.data();
                if (pc.current && !pc.current.currentRemoteDescription && data?.answer) {
                    const answerDescription = new RTCSessionDescription(data.answer);
                    pc.current.setRemoteDescription(answerDescription);
                }
            });

            // Listen for callee's ICE candidates
            const unsubCalleeCandidates = onSnapshot(calleeCandidatesCollection, (snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'added') {
                        pc.current?.addIceCandidate(new RTCIceCandidate(change.doc.data()));
                    }
                });
            });
            unsubs.push(unsubAnswer, unsubCalleeCandidates);

        } else {
            // Callee: wait for offer, create answer
            const roomSnapshot = await getDoc(roomRef);
            if (!roomSnapshot.exists()) {
              setError("Room does not exist.");
              return;
            }
            
            const offerDescription = roomSnapshot.data().offer;
            if (!pc.current.currentRemoteDescription) {
              await pc.current.setRemoteDescription(new RTCSessionDescription(offerDescription));
            }

            const answerDescription = await pc.current.createAnswer();
            await pc.current.setLocalDescription(answerDescription);

            await updateDoc(roomRef, { answer: { type: answerDescription.type, sdp: answerDescription.sdp } });
            
            // Listen for caller's ICE candidates
            const unsubCallerCandidates = onSnapshot(callerCandidatesCollection, (snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'added') {
                        pc.current?.addIceCandidate(new RTCIceCandidate(change.doc.data()));
                    }
                });
            });
            unsubs.push(unsubCallerCandidates);
        }
    };
    
    setupConnection();

    return () => {
      unsubs.forEach(unsub => unsub());
      hangUp();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]); // Only re-run when roomId changes

  return { localStream, remoteStream, isConnected, error, hangUp, toggleMediaTrack };
}
