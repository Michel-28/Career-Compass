"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { generateInterviewQuestions } from "@/ai/flows/question-generator";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UploadCloud } from "lucide-react";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_FILE_TYPES = ["text/plain", "application/pdf", "text/markdown"];

const formSchema = z.object({
  jobRole: z.string().min(2, { message: "Job role must be at least 2 characters." }),
  resumeFile: z
    .any()
    .refine((files) => files?.length == 1, "Resume is required.")
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `Max file size is 2MB.`)
    .refine(
      (files) => ACCEPTED_FILE_TYPES.includes(files?.[0]?.type),
      ".txt, .md and .pdf files are accepted."
    ),
});

const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        // For PDF, we can't just read it as text. We will just send a placeholder.
        // In a real-world scenario, you would use a library like pdf.js or an API to extract text.
        if (file.type === "application/pdf") {
            resolve(`This is a PDF resume for the role. The file name is ${file.name}. Please generate questions based on a typical resume for this role.`);
            return;
        }

        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsText(file);
    });
};


export default function InterviewSetupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      jobRole: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
      try {
        const resumeFile = values.resumeFile[0];
        const resumeText = await readFileAsText(resumeFile);
        
        const { questions } = await generateInterviewQuestions({ jobRole: values.jobRole, resume: resumeText });
        const interviewId = crypto.randomUUID();

        // Store interview data in localStorage to be accessed on the interview page
        localStorage.setItem(`interview_${interviewId}`, JSON.stringify({
          jobRole: values.jobRole,
          resume: resumeText,
          questions,
          answers: [],
          evaluations: [],
        }));

        toast({
          title: "Interview Ready!",
          description: "Your questions have been generated. Good luck!",
        });
        router.push(`/interview/${interviewId}`);
      } catch (error) {
        console.error(error);
        toast({
          variant: "destructive",
          title: "Uh oh! Something went wrong.",
          description: "There was a problem setting up your interview. Please check the file and try again.",
        });
      }
    });
  }

  return (
    <AppLayout>
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">New Mock Interview</CardTitle>
              <CardDescription>
                Provide the job role and upload your resume. We'll generate tailored questions for you.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="jobRole"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Role</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Senior Frontend Developer" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="resumeFile"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Resume</FormLabel>
                        <FormControl>
                           <div className="flex items-center justify-center w-full">
                                <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <UploadCloud className="w-8 h-8 mb-4 text-muted-foreground" />
                                        <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                        <p className="text-xs text-muted-foreground">TXT, MD, or PDF (MAX. 2MB)</p>
                                    </div>
                                    <Input 
                                        id="dropzone-file" 
                                        type="file" 
                                        className="hidden" 
                                        accept={ACCEPTED_FILE_TYPES.join(",")}
                                        onChange={(e) => field.onChange(e.target.files)}
                                    />
                                </label>
                            </div> 
                        </FormControl>
                         <FormDescription>
                          {form.watch('resumeFile')?.[0]?.name ? `Selected file: ${form.watch('resumeFile')[0].name}` : 'Your resume helps us create relevant questions.'}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isPending ? "Generating Questions..." : "Start Interview"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
    </AppLayout>
  );
}
