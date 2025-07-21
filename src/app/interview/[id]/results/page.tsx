"use client";

import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BarChart, BrainCircuit, MessageSquareQuote, TrendingUp } from "lucide-react";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import Link from "next/link";

const mockResults = {
  jobRole: "Frontend Developer",
  scores: [
    { name: "Communication", value: 7, fill: "var(--color-communication)" },
    { name: "Technical", value: 6, fill: "var(--color-technical)" },
    { name: "Confidence", value: 8, fill: "var(--color-confidence)" },
  ],
  feedback: "Overall, you demonstrated a solid foundation in frontend development. Your communication was clear, but at times you could be more concise. Your technical answers were generally correct, though you seemed to hesitate on some advanced topics. Try to project more confidence by speaking at a steady pace and maintaining eye contact, even in a remote setting. Adding more specific examples from your projects would strengthen your responses.",
  learningPlan: "1. **Deepen React Knowledge:** Focus on advanced hooks like `useMemo` and `useCallback`. Build a small project to solidify your understanding. 2. **Practice STAR Method:** For behavioral questions, structure your answers using the Situation, Task, Action, Result (STAR) method. 3. **Mock Interviews:** Conduct more mock interviews, focusing on your pace and confidence. Record yourself to identify areas for improvement.",
  qna: [
    { question: "Can you tell me about a challenging project you worked on and how you overcame the obstacles?", answer: "I built a real-time chat application using WebSockets.", feedback: "Good start, but could be improved by detailing the specific challenges, your role, and the outcome." },
    { question: "How do you handle disagreements or conflicting ideas with your team members?", answer: "I try to listen to their perspective and find a compromise.", feedback: "A positive approach. Strengthen this by providing a concrete example of a time you successfully resolved a conflict." },
    { question: "Where do you see yourself professionally in the next 5 years, and how does this role fit into that plan?", answer: "I hope to be a senior developer leading a team.", feedback: "This shows ambition. It would be more impactful if you connected this to your passion for the company's mission or technology stack." },
    { question: "Describe your experience with React and its ecosystem, particularly in state management.", answer: "I've used Redux and Zustand. I prefer Zustand for its simplicity.", feedback: "Good technical answer. You could elaborate on the pros and cons you've experienced with each to showcase deeper understanding." },
    { question: "What do you consider your greatest professional weakness, and what steps are you taking to improve it?", answer: "I sometimes take on too much work.", feedback: "A classic answer. To make it more genuine, discuss the steps you're taking to improve, such as using project management tools or improving delegation skills." },
  ],
};

const chartConfig = {
  value: { label: "Score" },
  communication: { label: "Communication", color: "hsl(var(--chart-1))" },
  technical: { label: "Technical", color: "hsl(var(--chart-2))" },
  confidence: { label: "Confidence", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig;

export default function InterviewResultsPage() {
  return (
    <AppLayout>
      <main className="flex-1 p-4 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Interview Results</h1>
                <p className="text-muted-foreground">Analysis for your {mockResults.jobRole} mock interview.</p>
            </div>
            <Link href="/interview/setup" passHref>
                <Button>Start Another Interview</Button>
            </Link>
        </div>
        
        <div className="grid gap-6 lg:grid-cols-5">
          <Card className="lg:col-span-5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BarChart/> Overall Scores</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                <RechartsBarChart accessibilityLayer data={mockResults.scores} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid horizontal={false} />
                  <XAxis type="number" dataKey="value" domain={[0, 10]} tickCount={6} />
                  <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={120} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" hideLabel />} />
                  <Bar dataKey="value" radius={5} />
                </RechartsBarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><MessageSquareQuote/> AI Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base leading-relaxed">{mockResults.feedback}</p>
            </CardContent>
          </Card>
          
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><TrendingUp/> Learning Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base leading-relaxed">{mockResults.learningPlan}</p>
            </CardContent>
          </Card>

          <Card className="lg:col-span-5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BrainCircuit/> Question & Answer Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {mockResults.qna.map((item, index) => (
                  <AccordionItem value={`item-${index}`} key={index}>
                    <AccordionTrigger className="text-left font-semibold hover:no-underline">{item.question}</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-2">
                      <div>
                        <h4 className="font-medium mb-2 text-muted-foreground">Your Answer:</h4>
                        <blockquote className="p-4 bg-muted border-l-4 border-muted-foreground/20 rounded-r-md">
                            {item.answer}
                        </blockquote>
                      </div>
                       <div>
                        <h4 className="font-medium mb-2 text-muted-foreground">Feedback:</h4>
                        <blockquote className="p-4 bg-accent/10 text-accent-foreground border-l-4 border-accent rounded-r-md">
                            {item.feedback}
                        </blockquote>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </main>
    </AppLayout>
  );
}
