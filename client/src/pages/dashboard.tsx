import React from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  AppleIcon, 
  Utensils, 
  Brain, 
  Database, 
  Search,
  ArrowRight, 
  RefreshCw,
  TrendingUp
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import FoodCard from "@/components/food/food-card";
import DietPlanCard from "@/components/diet/diet-plan-card";
import NutritionalChart from "@/components/diet/nutritional-chart";

export default function Dashboard() {
  // Fetch recent diet plans
  const { 
    data: recentDietPlans,
    isLoading: isLoadingDietPlans,
  } = useQuery({
    queryKey: ["/api/diet-plans?limit=2"],
  });
  
  // Fetch recent foods
  const { 
    data: recentFoods,
    isLoading: isLoadingFoods,
  } = useQuery({
    queryKey: ["/api/foods/recent?limit=3"],
  });
  
  // Sample diet plan for demo chart
  const sampleDietPlan = {
    calorieGoal: 2000,
    proteinPercentage: 30,
    carbsPercentage: 45,
    fatPercentage: 25,
    meals: [
      { name: "Breakfast", calories: 500 },
      { name: "Lunch", calories: 700 },
      { name: "Dinner", calories: 600 },
      { name: "Snacks", calories: 200 },
    ]
  };
  
  return (
    <div className="space-y-8">
      {/* Quick Actions Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-primary/50 to-primary/30 text-primary-foreground hover:shadow-lg transition-shadow border-none">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Brain className="h-5 w-5 mr-2" />
              AI Diet Generator
            </CardTitle>
            <CardDescription className="text-primary-foreground/80">
              Create personalized diet plans using AI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm opacity-90">
              Answer a few questions about your goals and preferences to get a customized diet plan.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full bg-white text-primary hover:bg-white/90">
              <Link href="/create-diet-plan">
                Create Diet Plan
              </Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="bg-gradient-to-br from-secondary/50 to-secondary/30 text-secondary-foreground hover:shadow-lg transition-shadow border-none">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="h-5 w-5 mr-2" />
              Food Database
            </CardTitle>
            <CardDescription className="text-secondary-foreground/80">
              Explore our comprehensive food database
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm opacity-90">
              Access detailed nutritional information for thousands of foods.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full bg-white text-secondary hover:bg-white/90">
              <Link href="/food-database">
                Browse Foods
              </Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="bg-gradient-to-br from-accent to-accent/30 text-accent-foreground hover:shadow-lg transition-shadow border-none">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="h-5 w-5 mr-2" />
              Analyze a Meal
            </CardTitle>
            <CardDescription className="text-accent-foreground/80">
              Get nutritional breakdown of any meal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm opacity-90">
              Describe your meal and get an instant analysis of its nutritional content.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full bg-white text-primary hover:bg-white/90">
              <Link href="/nutrition">
                Analyze Now
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </section>
      
      {/* Nutritional Chart Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Nutritional Overview</h2>
          <Button variant="ghost" size="sm" className="gap-1">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
        
        <Card>
          <CardContent className="pt-6">
            <NutritionalChart dietPlan={sampleDietPlan} />
          </CardContent>
        </Card>
      </section>
      
      {/* Recent Diet Plans */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Your Diet Plans</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/diet-plans" className="flex items-center gap-1">
              View All
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        
        {isLoadingDietPlans ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="animate-pulse h-64">
              <CardContent className="p-6">
                <div className="h-6 bg-muted rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
                <div className="grid grid-cols-3 gap-2 mt-6">
                  <div className="h-16 bg-muted rounded"></div>
                  <div className="h-16 bg-muted rounded"></div>
                  <div className="h-16 bg-muted rounded"></div>
                </div>
                <div className="h-8 bg-muted rounded w-full mt-6"></div>
              </CardContent>
            </Card>
            <Card className="animate-pulse h-64">
              <CardContent className="p-6">
                <div className="h-6 bg-muted rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
                <div className="grid grid-cols-3 gap-2 mt-6">
                  <div className="h-16 bg-muted rounded"></div>
                  <div className="h-16 bg-muted rounded"></div>
                  <div className="h-16 bg-muted rounded"></div>
                </div>
                <div className="h-8 bg-muted rounded w-full mt-6"></div>
              </CardContent>
            </Card>
          </div>
        ) : recentDietPlans && recentDietPlans.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recentDietPlans.map((plan: any) => (
              <DietPlanCard key={plan.id} dietPlan={plan} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <Utensils className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Diet Plans Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first AI-powered diet plan to get started on your nutrition journey.
              </p>
              <Button asChild>
                <Link href="/create-diet-plan">Create Your First Diet Plan</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </section>
      
      {/* Recently Viewed Foods */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Recently Viewed Foods</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/food-database" className="flex items-center gap-1">
              Browse All
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        
        {isLoadingFoods ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array(3).fill(0).map((_, i) => (
              <Card key={i} className="animate-pulse h-56">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
                  <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
                  <div className="h-4 bg-muted rounded w-full mt-6"></div>
                  <div className="flex gap-2 mt-4">
                    <div className="h-6 bg-muted rounded w-1/3"></div>
                    <div className="h-6 bg-muted rounded w-1/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : recentFoods && recentFoods.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentFoods.map((food: any) => (
              <FoodCard key={food.fdcId} food={food} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <AppleIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Recently Viewed Foods</h3>
              <p className="text-muted-foreground mb-4">
                Explore our food database to find detailed nutritional information.
              </p>
              <Button asChild>
                <Link href="/food-database">Browse Food Database</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </section>
      
      {/* Tips & Resources */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Nutrition Tips & Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Healthy Eating Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-2">
                <li>Focus on whole foods rather than processed foods.</li>
                <li>Include a variety of colorful vegetables in your meals.</li>
                <li>Stay hydrated by drinking plenty of water throughout the day.</li>
                <li>Monitor portion sizes to avoid overeating.</li>
                <li>Limit added sugars and excess sodium in your diet.</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant="outline">Read More Tips</Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Weekly Meal Planning Guide</CardTitle>
              <CardDescription>
                Efficient meal planning saves time and promotes healthier eating
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm">
                <strong>Monday:</strong> Plan your meals for the week and make a shopping list.
              </p>
              <p className="text-sm">
                <strong>Wednesday:</strong> Prepare basic ingredients that can be used in multiple meals.
              </p>
              <p className="text-sm">
                <strong>Weekend:</strong> Batch cook meals that can be refrigerated or frozen for later use.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline">Download Guide</Button>
            </CardFooter>
          </Card>
        </div>
      </section>
    </div>
  );
}
