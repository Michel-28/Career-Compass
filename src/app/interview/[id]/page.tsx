"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Loader2, Mic, Send } from "lucide-react";
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

const mockQuestions = [
  "Can you tell me about a challenging project you worked on and how you overcame the obstacles?",
  "How do you handle disagreements or conflicting ideas with your team members?",
  "Where do you see yourself professionally in the next 5 years, and how does this role fit into that plan?",
  "Describe your experience with React and its ecosystem, particularly in state management.",
  "What do you consider your greatest professional weakness, and what steps are you taking to improve it?",
];

export default function InterviewPage({ params }: { params: { id:string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const { id: interviewId } = params;
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [isPending, startTransition] = useTransition();
  const [answers, setAnswers] = useState<string[]>([]);
  
  const isLastQuestion = currentQuestionIndex === mockQuestions.length - 1;
  const progress = ((currentQuestionIndex) / mockQuestions.length) * 100;

  const handleNext = async () => {
     if (!answer.trim()) {
      toast({
        variant: "destructive",
        title: "Empty Answer",
        description: "Please provide an answer before submitting.",
      });
      return;
    }
    
    startTransition(async () => {
      // Simulate AI evaluation
      await new Promise(resolve => setTimeout(resolve, 1500));
      setAnswers([...answers, answer]);
      setAnswer("");

      if (isLastQuestion) {
        toast({
          title: "Interview Complete!",
          description: "Analyzing your answers and generating your results...",
        });
        await new Promise(resolve => setTimeout(resolve, 1500));
        router.push(`/interview/${interviewId}/results`);
      } else {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      }
    });
  };

  return (
    <AppLayout>
      <main className="flex-1 p-4 md:p-8 flex items-center justify-center">
        <Card className="w-full max-w-3xl animate-in fade-in-50 duration-500">
          <CardHeader>
            <div className="flex justify-between items-center mb-2">
                <CardTitle>Question {currentQuestionIndex + 1} of {mockQuestions.length}</CardTitle>
                 <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive-outline">End Interview</Button>
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
                      <AlertDialogAction onClick={() => router.push('/dashboard')}>End Interview</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
            </div>
            <CardDescription className="pt-2">Read the question carefully. You can type or record your answer.</CardDescription>
            <Progress value={progress} className="mt-4" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-6 bg-muted rounded-lg min-h-[100px] flex items-center">
              <p className="text-lg font-semibold">{mockQuestions[currentQuestionIndex]}</p>
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
                <Button type="button" variant="outline" disabled={isPending}>
                  <Mic className="mr-2 h-4 w-4" />
                  Record Answer
                </Button>
                <Button onClick={handleNext} disabled={isPending}>
                  {isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  {isPending ? "Evaluating..." : (isLastQuestion ? "Finish & View Results" : "Submit & Next Question")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </AppLayout>
  );
}
