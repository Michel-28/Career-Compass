
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, FileText } from "lucide-react";

type PastInterview = {
  id: string;
  jobRole: string;
  date: string;
  overallScore: number;
};

export default function DashboardPage() {
  const [pastInterviews, setPastInterviews] = useState<PastInterview[]>([]);

  useEffect(() => {
    const storedInterviews = localStorage.getItem("past_interviews");
    if (storedInterviews) {
      setPastInterviews(JSON.parse(storedInterviews));
    }
  }, []);

  return (
    <AppLayout>
      <main className="flex-1 p-4 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here are your recent mock interviews.</p>
          </div>
          <Link href="/interview/setup" passHref>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Start New Interview
            </Button>
          </Link>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pastInterviews.length > 0 ? (
            pastInterviews.map((interview) => (
              <Card key={interview.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    {interview.jobRole}
                  </CardTitle>
                  <CardDescription>
                    Interviewed on {new Date(interview.date).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="text-lg font-semibold">Overall Score: <span className="text-accent">{interview.overallScore}/10</span></div>
                </CardContent>
                <CardFooter>
                  <Link href={`/interview/${interview.id}/results`} className="w-full" passHref>
                    <Button variant="outline" className="w-full">View Results</Button>
                  </Link>
                </CardFooter>
              </Card>
            ))
          ) : (
             <Card className="md:col-span-2 lg:col-span-3">
                <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                    <h3 className="text-xl font-medium">No interviews yet</h3>
                    <p className="text-muted-foreground mt-2">Start your first mock interview to see your results here.</p>
                </CardContent>
            </Card>
          )}
        </div>
      </main>
    </AppLayout>
  );
}
