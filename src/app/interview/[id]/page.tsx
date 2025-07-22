"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Loader2, Mic, MicOff, Send, Volume2 } from "lucide-react";
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
import { textToSpeech } from "@/ai/flows/text-to-speech";

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
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

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
    
    // Initialize the SpeechRecognition API
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
        // Do not show toast here, it's better to show it when transcription is done.
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

  const handleSpeakQuestion = async () => {
    if (!interviewData || isSynthesizing) return;
    
    setIsSynthesizing(true);
    try {
      const questionText = interviewData.questions[currentQuestionIndex];
      const { audioDataUri } = await textToSpeech(questionText);
      if (audioPlayerRef.current) {
        audioPlayerRef.current.src = audioDataUri;
        audioPlayerRef.current.play();
      }
    } catch (error) {
      console.error("Text-to-speech error:", error);
      toast({
        variant: "destructive",
        title: "Could not play audio",
        description: "There was an error generating the voice for the question.",
      });
    } finally {
      setIsSynthesizing(false);
    }
  };


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
  const isPending = isEvaluating || isTranscribing || isSynthesizing;

  return (
    <AppLayout>
      <main className="flex-1 p-4 md:p-8 flex items-center justify-center">
        <Card className="w-full max-w-3xl animate-in fade-in-50 duration-500">
          <CardHeader>
            <div className="flex justify-between items-center mb-2">
                <CardTitle>Question {currentQuestionIndex + 1} of {interviewData.questions.length}</CardTitle>
                 <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive">End Interview</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure you want to end the interview?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Your progress will not be saved, and you will be redirected to the dashboard.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => router.push('/dashboard')} className="bg-destructive hover:bg-destructive/90">End Interview</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
            </div>
            <CardDescription className="pt-2">Read the question carefully. You can type or record your answer.</CardDescription>
            <Progress value={progress} className="mt-4" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-6 bg-muted rounded-lg min-h-[100px] flex items-center justify-between gap-4">
              <p className="text-lg font-semibold flex-1">{interviewData.questions[currentQuestionIndex]}</p>
              <Button size="icon" variant="ghost" onClick={handleSpeakQuestion} disabled={isSynthesizing}>
                 {isSynthesizing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Volume2 className="h-5 w-5" />}
                 <span className="sr-only">Read question aloud</span>
              </Button>
            </div>
            <div className="space-y-4">
              <Textarea
                placeholder="Type your answer here..."
                className="min-h-[150px] text-base"
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
                  {isEvaluating ? "Evaluating..." : (isLastQuestion ? "Finish & View Results" : "Submit & Next Question")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
      <audio ref={audioPlayerRef} className="hidden" />
    </AppLayout>
  );
}
