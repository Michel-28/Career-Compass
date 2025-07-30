import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy } from 'lucide-react';

export default function LeaderboardPage() {
  return (
    <AppLayout>
      <main className="flex-1 p-4 md:p-8 flex items-center justify-center">
        <Card className="w-full max-w-lg text-center">
            <CardHeader>
                <div className="mx-auto bg-primary/10 p-3 rounded-full mb-4 w-fit">
                    <Trophy className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Leaderboard</CardTitle>
                <CardDescription>This feature is coming soon!</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">
                    See how you stack up against other students. Track your progress, earn badges, and climb the ranks!
                </p>
            </CardContent>
        </Card>
      </main>
    </AppLayout>
  );
}
