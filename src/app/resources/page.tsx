"use client";

import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Library, Map, Book, Download, Search, Video, FileText, Link as LinkIcon, Star, CheckCircle } from 'lucide-react';

const roadmaps = [
  {
    title: "Software Engineer (Product-Based)",
    description: "A 6-month roadmap to crack top product-based companies like Google, Amazon, etc.",
    tags: ["6 Months", "Advanced", "SDE"],
  },
  {
    title: "Full Stack Developer",
    description: "Learn MERN stack and build real-world projects from scratch.",
    tags: ["4 Months", "Intermediate", "Web Dev"],
  },
  {
    title: "Data Analyst",
    description: "Master SQL, Python, and Tableau to become a job-ready data analyst.",
    tags: ["3 Months", "Beginner", "Data"],
  },
  {
    title: "Internship Seeker (1st/2nd Year)",
    description: "A foundational roadmap to build skills and your profile for internships.",
    tags: ["Ongoing", "Beginner", "College"],
  },
];

const subjects = {
  dsa: [
    { title: "Complete C++ DSA Course", type: "Video", icon: Video, tags: ["Beginner", "Video"], link: "#" },
    { title: "Top 50 Array Interview Questions", type: "PDF", icon: FileText, tags: ["Practice", "PDF"], link: "#" },
    { title: "Striver's SDE Sheet", type: "Link", icon: LinkIcon, tags: ["Advanced", "Practice"], link: "#" },
  ],
  dbms: [
    { title: "Normalization Explained Simply", type: "Video", icon: Video, tags: ["Concepts", "Video"], link: "#" },
    { title: "SQL Practice Set (HackerRank)", type: "Link", icon: LinkIcon, tags: ["Practice", "SQL"], link: "#" },
  ],
  hr: [
      { title: "Top 50 HR Interview Questions & Answers", type: "PDF", icon: FileText, tags: ["Top 50", "PDF"], link: "#" },
      { title: "How to Answer 'Tell Me About Yourself'", type: "Video", icon: Video, tags: ["Behavioral", "Video"], link: "#" },
  ]
};

const ResourceCard = ({ title, description, tags, onSelect }: { title: string, description: string, tags: string[], onSelect: () => void }) => (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onSelect}>
        <CardHeader>
            <CardTitle className="text-xl">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex flex-wrap gap-2">
                {tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
            </div>
        </CardContent>
    </Card>
);

const ResourceItem = ({ title, type, icon: Icon, tags, link }: { title: string, type: string, icon: React.ElementType, tags: string[], link: string }) => (
    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted">
        <div className="flex items-center gap-4">
            <Icon className="h-6 w-6 text-primary"/>
            <div>
                <a href={link} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline">{title}</a>
                <div className="flex flex-wrap gap-1 mt-1">
                    {tags.map(tag => <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>)}
                </div>
            </div>
        </div>
        <Button variant="ghost" size="icon">
            <CheckCircle className="h-5 w-5 text-gray-400 hover:text-green-500"/>
        </Button>
    </div>
);

export default function ResourcesPage() {
  return (
    <AppLayout>
        <main className="flex-1 p-4 md:p-8">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-primary/10 rounded-full">
                    <Library className="h-8 w-8 text-primary"/>
                </div>
                <div>
                    <h1 className="text-3xl font-bold">Resources &amp; Roadmaps Hub</h1>
                    <p className="text-muted-foreground">Your one-stop library for end-to-end interview preparation.</p>
                </div>
            </div>

            <Tabs defaultValue="roadmaps" className="w-full">
                <TabsList className="grid w-full grid-cols-3 max-w-2xl mx-auto">
                    <TabsTrigger value="roadmaps"><Map className="mr-2 h-4 w-4"/> Roadmaps</TabsTrigger>
                    <TabsTrigger value="prep"><Book className="mr-2 h-4 w-4"/> Subject Prep</TabsTrigger>
                    <TabsTrigger value="search"><Search className="mr-2 h-4 w-4"/> Search</TabsTrigger>
                </TabsList>
                
                <TabsContent value="roadmaps" className="mt-6">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {roadmaps.map((roadmap) => (
                            <ResourceCard key={roadmap.title} {...roadmap} onSelect={() => {}} />
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="prep" className="mt-6">
                     <Tabs defaultValue="dsa" className="w-full">
                        <TabsList className="flex-wrap h-auto">
                            <TabsTrigger value="dsa">DSA</TabsTrigger>
                            <TabsTrigger value="dbms">DBMS</TabsTrigger>
                            <TabsTrigger value="os">OS</TabsTrigger>
                            <TabsTrigger value="cn">Computer Networks</TabsTrigger>
                            <TabsTrigger value="oops">OOPs</TabsTrigger>
                            <TabsTrigger value="aptitude">Aptitude</TabsTrigger>
                            <TabsTrigger value="hr">HR Interview</TabsTrigger>
                        </TabsList>
                        <TabsContent value="dsa" className="mt-4 space-y-3">
                            {subjects.dsa.map(item => <ResourceItem key={item.title} {...item} />)}
                        </TabsContent>
                         <TabsContent value="dbms" className="mt-4 space-y-3">
                            {subjects.dbms.map(item => <ResourceItem key={item.title} {...item} />)}
                        </TabsContent>
                         <TabsContent value="hr" className="mt-4 space-y-3">
                            {subjects.hr.map(item => <ResourceItem key={item.title} {...item} />)}
                        </TabsContent>
                        {/* Add more TabsContent for other subjects */}
                     </Tabs>
                </TabsContent>

                <TabsContent value="search" className="mt-6 max-w-3xl mx-auto">
                    <Card>
                        <CardHeader>
                            <CardTitle>Find What You Need</CardTitle>
                            <CardDescription>Search for topics, questions, or notes across all subjects.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-2">
                                <Input placeholder="e.g., 'SQL Joins' or 'HR weakness question'..." />
                                <Button><Search className="mr-2 h-4 w-4"/> Search</Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Button variant="outline">PDF</Button>
                                <Button variant="outline">Video</Button>
                                <Button variant="outline">Last-Minute</Button>
                                <Button variant="outline">Beginner</Button>
                                <Button variant="outline">Advanced</Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </main>
    </AppLayout>
  );
}