
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, User, UserPlus, Link as LinkIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { collection, addDoc, onSnapshot, query, limit, getDocs, writeBatch } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';

export default function PeerPracticePage() {
    const router = useRouter();
    const [isSearching, setIsSearching] = useState(false);
    const { toast } = useToast();

    const handleStartSearch = async () => {
        setIsSearching(true);
        const userId = `user_${crypto.randomUUID()}`; // Simple unique ID for guest user

        try {
            const q = query(collection(firestore, 'queue'), limit(1));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                // Match found
                const peerDoc = querySnapshot.docs[0];
                const peerId = peerDoc.id;
                const roomId = crypto.randomUUID();

                const batch = writeBatch(firestore);
                batch.delete(peerDoc.ref);
                
                await batch.commit();

                toast({ title: "Peer Found!", description: "Redirecting to your practice room." });
                router.push(`/peer-practice/${roomId}?userId=${userId}&peerId=${peerId}`);

            } else {
                // No peer found, add to queue
                const queueRef = collection(firestore, 'queue');
                const userDocRef = (await addDoc(queueRef, { waiting: true, timestamp: new Date() })).withConverter(null);
                
                const unsubscribe = onSnapshot(userDocRef, (doc) => {
                    if (!doc.exists()) {
                        // This means we have been matched and removed from queue
                        unsubscribe();
                    }
                });

                // Implement a timeout
                setTimeout(async () => {
                    unsubscribe();
                    const docSnap = await getDocs(query(collection(firestore, 'queue'), limit(1)));
                    if (docSnap.docs.some(doc => doc.id === userDocRef.id)) {
                         const batch = writeBatch(firestore);
                         batch.delete(userDocRef);
                         await batch.commit();
                         setIsSearching(false);
                         toast({ variant: 'destructive', title: 'No peer found', description: 'Please try searching again later.' });
                    }
                }, 30000); // 30 second timeout
            }
        } catch (error) {
            console.error("Error matching peer:", error);
            setIsSearching(false);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not connect to the matching service.' });
        }
    };

    const handleInviteFriend = () => {
        const roomId = crypto.randomUUID();
        const userId = `user_${crypto.randomUUID()}`;
        router.push(`/peer-practice/${roomId}?userId=${userId}`);
    };

    return (
        <AppLayout>
            <main className="flex-1 p-4 md:p-8 flex items-center justify-center">
                 <Card className="w-full max-w-2xl text-center">
                    <CardHeader>
                        <CardTitle className="text-3xl">Peer Interview Practice</CardTitle>
                        <CardDescription>Practice live with another student to sharpen your skills.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-6">
                        <Card className="p-6 flex flex-col items-center justify-center gap-4">
                            <User className="h-10 w-10 text-primary" />
                            <h3 className="text-xl font-semibold">Random Match</h3>
                            <p className="text-muted-foreground text-sm">Get paired with another student who is also looking to practice.</p>
                            <Button onClick={handleStartSearch} className="w-full" disabled={isSearching}>
                                {isSearching && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isSearching ? 'Searching...' : 'Find a Peer'}
                            </Button>
                        </Card>
                        <Card className="p-6 flex flex-col items-center justify-center gap-4">
                            <UserPlus className="h-10 w-10 text-primary" />
                            <h3 className="text-xl font-semibold">Invite a Friend</h3>
                            <p className="text-muted-foreground text-sm">Generate an invitation link to practice with a specific friend.</p>
                            <Button variant="outline" className="w-full" onClick={handleInviteFriend}>
                                <LinkIcon className="mr-2 h-4 w-4"/>
                                Create Private Room
                            </Button>
                        </Card>
                    </CardContent>
                </Card>
            </main>
        </AppLayout>
    );
}
