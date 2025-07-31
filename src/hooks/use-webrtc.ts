
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
        if (e instanceof Error && (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError')) {
             setError("Permission to access camera and microphone was denied.");
        } else {
            setError("Could not access camera and microphone.");
        }
        return null;
    }
  }, []);

  const cleanupConnection = useCallback(() => {
    if (pc.current) {
        pc.current.onicecandidate = null;
        pc.current.ontrack = null;
        pc.current.onconnectionstatechange = null;
        pc.current.close();
        pc.current = null;
    }
    localStream?.getTracks().forEach((track) => track.stop());
    setLocalStream(null);
    setRemoteStream(null);
    setIsConnected(false);
  }, [localStream]);


  const createPeerConnection = useCallback((stream: MediaStream) => {
    if (pc.current) {
        cleanupConnection();
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
    return newPc;
  }, [cleanupConnection]);

  const startCall = useCallback(async (connection: RTCPeerConnection) => {
    const roomRef = doc(firestore, 'rooms', roomId);
    const callerCandidatesCollection = collection(roomRef, 'callerCandidates');
    
    connection.onicecandidate = async (event) => {
        if (event.candidate) {
            await addDoc(callerCandidatesCollection, event.candidate.toJSON());
        }
    };

    const roomSnapshot = await getDoc(roomRef);
    if (!roomSnapshot.exists() || !roomSnapshot.data()?.offer) {
        const offerDescription = await connection.createOffer();
        await connection.setLocalDescription(offerDescription);

        const roomWithOffer = {
            offer: {
                type: offerDescription.type,
                sdp: offerDescription.sdp,
            },
        };
        await setDoc(roomRef, roomWithOffer);
    }
    
    const unsubscribeAnswer = onSnapshot(roomRef, (snapshot) => {
      const data = snapshot.data();
      if (connection && !connection.currentRemoteDescription && data?.answer) {
        const answerDescription = new RTCSessionDescription(data.answer);
        connection.setRemoteDescription(answerDescription);
      }
    });

    const calleeCandidatesCollection = collection(roomRef, 'calleeCandidates');
    const unsubscribeCalleeCandidates = onSnapshot(calleeCandidatesCollection, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const candidate = new RTCIceCandidate(change.doc.data());
          connection?.addIceCandidate(candidate);
        }
      });
    });

    return () => {
        unsubscribeAnswer();
        unsubscribeCalleeCandidates();
    };

  }, [roomId]);


  const joinCall = useCallback(async (connection: RTCPeerConnection) => {
      const roomRef = doc(firestore, 'rooms', roomId);
      const roomSnapshot = await getDoc(roomRef);

      if (!roomSnapshot.exists()) {
        setError("Room does not exist.");
        return;
      }
      
      const offerDescription = roomSnapshot.data().offer;
      if (!connection.currentRemoteDescription) {
        await connection.setRemoteDescription(new RTCSessionDescription(offerDescription));
      }

      const calleeCandidatesCollection = collection(roomRef, 'calleeCandidates');
      connection.onicecandidate = async (event) => {
          if (event.candidate) {
              await addDoc(calleeCandidatesCollection, event.candidate.toJSON());
          }
      };

      const answerDescription = await connection.createAnswer();
      await connection.setLocalDescription(answerDescription);

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
                  connection?.addIceCandidate(new RTCIceCandidate(data));
              }
          });
      });

      return () => unsubscribeCallerCandidates();

  }, [roomId]);
  
  const hangUp = useCallback(async () => {
    cleanupConnection();
    
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
  }, [roomId, cleanupConnection]);
  
  const toggleMediaTrack = (kind: 'audio' | 'video', enabled?: boolean) => {
    if (localStream) {
        const track = kind === 'video' ? localStream.getVideoTracks()[0] : localStream.getAudioTracks()[0];
        if (track) {
            track.enabled = enabled !== undefined ? enabled : !track.enabled;
        }
    }
  };


  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    const startConnection = async () => {
        const stream = await setupStreams();
        if(stream) {
            const connection = createPeerConnection(stream);
            if(isCaller.current) {
                unsubscribe = await startCall(connection);
            } else {
                unsubscribe = await joinCall(connection);
            }
        }
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

  return { localStream, remoteStream, isConnected, error, hangUp, toggleMediaTrack };
}
