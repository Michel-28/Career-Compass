import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

export default function PeerPracticePage() {
  return (
    <AppLayout>
      <main className="flex-1 p-4 md:p-8 flex items-center justify-center">
        <Card className="w-full max-w-lg text-center">
            <CardHeader>
                <div className="mx-auto bg-primary/10 p-3 rounded-full mb-4 w-fit">
                    <Users className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Peer Practice</CardTitle>
                <CardDescription>This feature is coming soon!</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">
                    Connect with other students for live 1-on-1 mock interviews. Give and receive feedback to improve together.
                </p>
            </CardContent>
        </Card>
      </main>
    </AppLayout>
  );
}
