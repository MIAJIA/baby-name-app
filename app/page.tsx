import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
  return (
    <div className="container mx-auto py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Find Your Perfect Baby Name</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Discover the ideal name for your baby based on meaning, theme, and Chinese metaphysics elements.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <Card>
          <CardHeader>
            <CardTitle>Meaning & Theme</CardTitle>
            <CardDescription>Find names with special meanings</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Search for names that represent values like strength, wisdom, peace, or any theme that resonates with you.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Chinese Metaphysics</CardTitle>
            <CardDescription>Balance the elements</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Incorporate BaZi (Four Pillars), Qi Men Dun Jia, Feng Shui, and traditional name analysis in your search.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Personalized Analysis</CardTitle>
            <CardDescription>AI-powered insights</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Get detailed analysis of how each name matches your criteria, with explanations for each metaphysical aspect.</p>
          </CardContent>
        </Card>
      </div>

      <div className="text-center">
        <Button size="lg" asChild>
          <Link href="/search">Start Your Search</Link>
        </Button>
      </div>
    </div>
  );
}