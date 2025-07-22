"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Loader2, Mic, MicOff, Send, Video } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { evaluateAnswer, EvaluateAnswerOutput } from "@/ai/flows/answer-evaluator";
import { generateInterviewVideo } from "@/ai/flows/generate-interview-video";

type InterviewData = {
  jobRole: string;
  resume: string;
  questions: string[];
  answers: string[];
  evaluations: EvaluateAnswerOutput[];
};

export default function InterviewPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const interviewId = params.id as string;
  
  const [interviewData, setInterviewData] = useState<InterviewData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [isEvaluating, startEvaluationTransition] = useTransition();
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const videoPlayerRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const data = localStorage.getItem(`interview_${interviewId}`);
    if (data) {
      setInterviewData(JSON.parse(data));
    } else {
      toast({
        variant: "destructive",
        title: "Interview not found",
        description: "Could not find the interview data. Please start a new one.",
      });
      router.push('/interview/setup');
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
        toast({ title: "Recording started", description: "Speak now..." });
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.onerror = (event) => {
        setIsRecording(false);
        toast({ variant: "destructive", title: "Recording Error", description: event.error });
      };
      
      let finalTranscript = '';
      recognition.onresult = (event) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        setAnswer(finalTranscript + interimTranscript);
      };
      recognitionRef.current = recognition;
    }

  }, [interviewId, router, toast]);

  const handleGenerateVideo = async () => {
    if (!interviewData || isGeneratingVideo) return;
    
    setVideoUrl(null);
    setIsGeneratingVideo(true);
    try {
      const questionText = interviewData.questions[currentQuestionIndex];
      const { videoUrl } = await generateInterviewVideo({ question: questionText });
      setVideoUrl(videoUrl);
    } catch (error) {
      console.error("Video generation error:", error);
      toast({
        variant: "destructive",
        title: "Could not generate video",
        description: "There was an error generating the video for the question. Please try again.",
      });
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  useEffect(() => {
    if (videoUrl && videoPlayerRef.current) {
      videoPlayerRef.current.src = videoUrl;
      videoPlayerRef.current.play();
    }
  }, [videoUrl]);


  const handleSubmit = async () => {
    if (!answer.trim()) {
      toast({
        variant: "destructive",
        title: "Empty Answer",
        description: "Please provide an answer before submitting.",
      });
      return;
    }
    
    startEvaluationTransition(async () => {
      if (!interviewData) return;

      const evaluation = await evaluateAnswer({
        question: interviewData.questions[currentQuestionIndex],
        answer,
        jobRole: interviewData.jobRole,
        resume: interviewData.resume,
      });

      const updatedData: InterviewData = {
        ...interviewData,
        answers: [...(interviewData.answers || []), answer],
        evaluations: [...(interviewData.evaluations || []), evaluation],
      };
      
      localStorage.setItem(`interview_${interviewId}`, JSON.stringify(updatedData));
      setInterviewData(updatedData);
      setAnswer("");
      setVideoUrl(null); // Reset video for next question

      const isLastQuestion = currentQuestionIndex === interviewData.questions.length - 1;

      if (isLastQuestion) {
        toast({
          title: "Interview Complete!",
          description: "Analyzing your answers and generating your results...",
        });
        router.push(`/interview/${interviewId}/results`);
      } else {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      }
    });
  };

  const toggleRecording = () => {
    if (!recognitionRef.current) {
       toast({
        variant: "destructive",
        title: "Browser not supported",
        description: "Your browser does not support speech recognition.",
      });
      return;
    }
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
  };

  if (!interviewData) {
    return (
      <AppLayout>
        <main className="flex-1 p-4 md:p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </main>
      </AppLayout>
    );
  }

  const progress = ((currentQuestionIndex) / interviewData.questions.length) * 100;
  const isLastQuestion = currentQuestionIndex === interviewData.questions.length - 1;
  const isPending = isEvaluating || isGeneratingVideo;

  return (
    <AppLayout>
      <main className="flex-1 p-4 md:p-8 flex items-center justify-center">
        <Card className="w-full max-w-4xl animate-in fade-in-50 duration-500 grid md:grid-cols-2">
          <div className="p-6 flex flex-col items-center justify-center bg-muted/50 rounded-l-lg">
             <div className="relative w-full aspect-video rounded-lg overflow-hidden border-4 border-primary/20 shadow-lg bg-black flex items-center justify-center">
                {isGeneratingVideo ? (
                    <div className="text-center text-white">
                        <Loader2 className="h-8 w-8 animate-spin mb-2" />
                        <p>AI interviewer is preparing...</p>
                    </div>
                ) : videoUrl ? (
                    <video ref={videoPlayerRef} className="w-full h-full object-cover" controls={false} autoPlay playsInline />
                ) : (
                    <div className="text-center text-muted-foreground p-4">
                        <Video className="h-12 w-12 mx-auto mb-2" />
                        <p>Click "Ask Question" to start.</p>
                    </div>
                )}
             </div>
             <div className="mt-6 p-4 text-center bg-muted rounded-lg w-full">
                <p className="text-lg font-semibold flex-1">{interviewData.questions[currentQuestionIndex]}</p>
             </div>
             <Button size="lg" variant="ghost" onClick={handleGenerateVideo} disabled={isGeneratingVideo} className="mt-4">
                 {isGeneratingVideo ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Video className="mr-2 h-5 w-5" />}
                 {isGeneratingVideo ? 'Generating Video...' : 'Ask Question'}
              </Button>
          </div>

          <div className="p-6">
            <CardHeader className="px-0 pt-0">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <CardTitle>Question {currentQuestionIndex + 1} of {interviewData.questions.length}</CardTitle>
                        <CardDescription className="pt-1">Record or type your response below.</CardDescription>
                    </div>
                    <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive">End</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to end the interview?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Your progress will be lost and you will be returned to the dashboard.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => router.push('/dashboard')} className="bg-destructive hover:bg-destructive/90">End Interview</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                    </AlertDialog>
                </div>
                <Progress value={progress} className="mt-4" />
            </CardHeader>
            <CardContent className="space-y-6 px-0 pb-0">
                <div className="space-y-4">
                <Textarea
                    placeholder="Your answer will appear here..."
                    className="min-h-[200px] text-base"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    disabled={isPending}
                />
                <div className="flex justify-between items-center">
                    <Button type="button" variant="outline" onClick={toggleRecording} disabled={isPending || isEvaluating}>
                    {isRecording ? <MicOff className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}
                    {isRecording ? "Stop Recording" : "Record Answer"}
                    </Button>
                    <Button onClick={handleSubmit} disabled={isPending || !answer}>
                    {isEvaluating ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Send className="mr-2 h-4 w-4" />
                    )}
                    {isEvaluating ? "Evaluating..." : (isLastQuestion ? "Finish & View Results" : "Submit & Next")}
                    </Button>
                </div>
                </div>
            </CardContent>
          </div>
        </Card>
      </main>
    </AppLayout>
  );
}
