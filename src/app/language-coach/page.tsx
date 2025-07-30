import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Languages } from 'lucide-react';

export default function LanguageCoachPage() {
  return (
    <AppLayout>
      <main className="flex-1 p-4 md:p-8 flex items-center justify-center">
        <Card className="w-full max-w-lg text-center">
            <CardHeader>
                <div className="mx-auto bg-primary/10 p-3 rounded-full mb-4 w-fit">
                    <Languages className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Language Coach</CardTitle>
                <CardDescription>This feature is coming soon!</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">
                    Get detailed feedback on your speech clarity, grammar, and vocabulary. Includes a daily vocabulary builder to help you improve.
                </p>
            </CardContent>
        </Card>
      </main>
    </AppLayout>
  );
}
