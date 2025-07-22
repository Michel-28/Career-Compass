
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, BarChart, FileText, Lightbulb } from "lucide-react";
import { Icons } from "@/components/icons";

type PastInterview = {
  id: string;
  jobRole: string;
  date: string;
  overallScore: number;
};

const WelcomeBot = () => (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="24" fill="#E0E7FF"/>
        <path d="M24 16C27.3137 16 30 18.6863 30 22V24C30 27.3137 27.3137 30 24 30C20.6863 30 18 27.3137 18 24V22C18 18.6863 20.6863 16 24 16Z" fill="#6366F1"/>
        <circle cx="21" cy="23" r="1" fill="white"/>
        <circle cx="27" cy="23" r="1" fill="white"/>
        <path d="M22 27H26" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M19 18L18 17" stroke="#6366F1" strokeWidth="2" strokeLinecap="round"/>
        <path d="M29 18L30 17" stroke="#6366F1" strokeWidth="2" strokeLinecap="round"/>
    </svg>
)

export default function DashboardPage() {
  const [pastInterviews, setPastInterviews] = useState<PastInterview[]>([]);
  const [userName, setUserName] = useState("Michel Phelps");

  useEffect(() => {
    const storedInterviews = localStorage.getItem("past_interviews");
    if (storedInterviews) {
      const parsedInterviews: PastInterview[] = JSON.parse(storedInterviews);
      const uniqueInterviews = parsedInterviews.filter(
        (interview, index, self) =>
          index === self.findIndex((t) => t.id === interview.id)
      );
      setPastInterviews(uniqueInterviews);
    }
  }, []);

  return (
    <AppLayout>
        <main className="flex-1 p-4 md:p-8 bg-gray-50/50">
            {/* Welcome Banner */}
            <div className="bg-indigo-50 rounded-lg p-6 flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <WelcomeBot />
                    <div>
                        <h1 className="text-2xl font-bold text-indigo-900">Welcome back, {userName}!</h1>
                        <p className="text-indigo-700">Ready for your next interview session?</p>
                    </div>
                </div>
                <Button className="bg-indigo-500 hover:bg-indigo-600 rounded-full p-3 h-auto shadow-lg">
                    <Lightbulb className="h-6 w-6 text-white"/>
                </Button>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
                {/* Upcoming Interviews */}
                <Card className="h-full">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-indigo-600">Upcoming Interviews</CardTitle>
                        <Calendar className="w-5 h-5 text-gray-400" />
                    </CardHeader>
                    <CardContent className="flex items-center justify-center text-center text-gray-500 min-h-[150px]">
                        <p>No upcoming interviews scheduled</p>
                    </CardContent>
                </Card>

                {/* Recent Performance */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-indigo-600">Recent Performance</CardTitle>
                        <BarChart className="w-5 h-5 text-gray-400" />
                    </CardHeader>
                    <CardContent className="min-h-[150px]">
                        {pastInterviews.length > 0 ? (
                            <div className="space-y-4">
                            {pastInterviews.slice(0, 3).map((interview) => (
                                <Link href={`/interview/${interview.id}/results`} key={interview.id} passHref>
                                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <div>
                                            <p className="font-semibold text-gray-800">{interview.jobRole}</p>
                                            <p className="text-sm text-gray-500">
                                                Interviewed on {new Date(interview.date).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="text-lg font-bold text-indigo-600">{interview.overallScore}/10</div>
                                    </div>
                                </Link>
                            ))}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center text-center text-gray-500 h-full pt-10">
                                <p>No completed interviews yet</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
             <div className="mt-8 flex justify-center">
                 <Link href="/interview/setup" passHref>
                    <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base">
                        Start New Interview
                    </Button>
                </Link>
            </div>
        </main>
    </AppLayout>
  );
}
