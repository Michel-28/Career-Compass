
"use client";

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, User, UserPlus, Link, Send, Video, PhoneOff } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';

type PeerPracticeState = 'idle' | 'searching' | 'in_session' | 'feedback';

const UserVideoPlaceholder = ({ name, isMuted = false }: { name: string, isMuted?: boolean }) => (
    <div className="bg-muted rounded-lg aspect-video flex items-center justify-center relative border">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Avatar className="h-20 w-20">
                <AvatarImage src={`https://placehold.co/100x100.png`} data-ai-hint="user avatar" />
                <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <p className="font-semibold">{name}</p>
        </div>
        {!isMuted && (
            <div className="absolute bottom-2 right-2 bg-background/80 p-2 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
        )}
    </div>
);

export default function PeerPracticePage() {
    const [state, setState] = useState<PeerPracticeState>('idle');
    const [timeLeft, setTimeLeft] = useState(0);
    const { toast } = useToast();

    useEffect(() => {
        if (state !== 'in_session' || timeLeft === 0) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setState('feedback');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [state, timeLeft]);


    const handleStartSearch = () => {
        setState('searching');
        // Simulate finding a match
        setTimeout(() => {
            setState('in_session');
            setTimeLeft(15 * 60); // 15 minute session
        }, 3000);
    };

    const handleEndSession = () => {
        setState('feedback');
        setTimeLeft(0);
    };

    const handleSubmitFeedback = (e: React.FormEvent) => {
        e.preventDefault();
        toast({
            title: "Feedback Submitted!",
            description: "Your feedback has been shared with your peer.",
        });
        setState('idle');
    };

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    };

    const renderIdleState = () => (
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
                    <Button onClick={handleStartSearch} className="w-full">Find a Peer</Button>
                </Card>
                 <Card className="p-6 flex flex-col items-center justify-center gap-4">
                    <UserPlus className="h-10 w-10 text-primary" />
                    <h3 className="text-xl font-semibold">Invite a Friend</h3>
                     <p className="text-muted-foreground text-sm">Generate an invitation link to practice with a specific friend.</p>
                    <Button variant="outline" className="w-full" onClick={() => toast({ title: 'Coming Soon!', description: 'This feature will be available shortly.' })}>
                        <Link className="mr-2 h-4 w-4"/>
                        Generate Link
                    </Button>
                </Card>
            </CardContent>
        </Card>
    );

    const renderSearchingState = () => (
        <Card className="w-full max-w-md text-center p-8">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-6" />
            <h2 className="text-2xl font-bold">Finding a Peer...</h2>
            <p className="text-muted-foreground mt-2">Please wait while we connect you with another student.</p>
        </Card>
    );

    const renderInSessionState = () => (
       <div className="w-full max-w-5xl">
            <Card>
                <CardHeader>
                    <CardTitle>Live Interview Session</CardTitle>
                    <div className="flex items-center justify-between">
                         <CardDescription>You are now connected with your peer.</CardDescription>
                         <div className="font-mono text-xl font-bold text-primary">{formatTime(timeLeft)}</div>
                    </div>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                    <UserVideoPlaceholder name="Alex (Peer)" />
                    <UserVideoPlaceholder name="You (Me)" isMuted />
                </CardContent>
                 <CardContent className="flex justify-center gap-4 mt-4">
                    <Button variant="destructive" onClick={handleEndSession}>
                        <PhoneOff className="mr-2 h-4 w-4" /> End Session
                    </Button>
                    <Button>
                        <Video className="mr-2 h-4 w-4" /> Toggle Camera
                    </Button>
                 </CardContent>
            </Card>
       </div>
    );

    const renderFeedbackState = () => (
        <Card className="w-full max-w-xl">
             <CardHeader>
                <CardTitle>Session Complete!</CardTitle>
                <CardDescription>Please provide feedback for your peer, Alex.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmitFeedback} className="space-y-6">
                    <div className="space-y-4">
                        <Label htmlFor="clarity">Clarity (How clear was their communication?)</Label>
                        <Slider defaultValue={[5]} max={10} step={1} id="clarity" />
                    </div>
                     <div className="space-y-4">
                        <Label htmlFor="confidence">Confidence (How confident did they seem?)</Label>
                        <Slider defaultValue={[7]} max={10} step={1} id="confidence" />
                    </div>
                     <div className="space-y-4">
                        <Label htmlFor="listening">Listening Skills (Did they listen effectively?)</Label>
                        <Slider defaultValue={[8]} max={10} step={1} id="listening" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="comments">Additional Comments</Label>
                        <Textarea id="comments" placeholder="e.g., Great points on project management, could be more concise..." />
                    </div>
                    <Button type="submit" className="w-full">
                        <Send className="mr-2 h-4 w-4" /> Submit Feedback
                    </Button>
                </form>
            </CardContent>
        </Card>
    );

    const renderState = () => {
        switch (state) {
            case 'searching': return renderSearchingState();
            case 'in_session': return renderInSessionState();
            case 'feedback': return renderFeedbackState();
            case 'idle':
            default:
                return renderIdleState();
        }
    }

    return (
        <AppLayout>
            <main className="flex-1 p-4 md:p-8 flex items-center justify-center">
                {renderState()}
            </main>
        </AppLayout>
    );
}
