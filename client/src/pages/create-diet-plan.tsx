import React, { useState } from "react";
import { useLocation } from "wouter";
import DietForm from "@/components/diet/diet-form";
import { 
  Brain, 
  SparkleIcon, 
  LayoutDashboard, 
  Utensils 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function CreateDietPlan() {
  const [_, setLocation] = useLocation();
  const [showSuccess, setShowSuccess] = useState(false);
  const [generatedPlanId, setGeneratedPlanId] = useState<number | null>(null);
  
  // Handle successful plan generation
  const handleSuccess = (data: any) => {
    setGeneratedPlanId(data.id);
    setShowSuccess(true);
    
    // Scroll to success message
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Create Diet Plan</h1>
        <Button variant="outline" onClick={() => setLocation("/diet-plans")}>
          <LayoutDashboard className="h-4 w-4 mr-2" />
          Back to Plans
        </Button>
      </div>
      
      {showSuccess && (
        <Alert className="bg-green-50 border-green-500 text-green-800">
          <SparkleIcon className="h-4 w-4" />
          <AlertTitle>Success!</AlertTitle>
          <AlertDescription>
            Your diet plan has been generated successfully. You can now view it or make further adjustments.
            <div className="mt-4 flex gap-4">
              <Button onClick={() => setLocation(`/diet-plans/${generatedPlanId}`)}>
                <Utensils className="h-4 w-4 mr-2" />
                View Diet Plan
              </Button>
              <Button variant="outline" onClick={() => setLocation("/diet-plans")}>
                View All Plans
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <DietForm onSuccess={handleSuccess} />
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="h-5 w-5 mr-2" />
                How It Works
              </CardTitle>
              <CardDescription>
                Our AI-powered diet plan generator creates personalized nutrition recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">1. Enter Your Information</h3>
                <p className="text-sm text-muted-foreground">
                  Provide details about your body, goals, and dietary preferences.
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">2. Customize Your Macros</h3>
                <p className="text-sm text-muted-foreground">
                  Set your desired protein, carbs, and fat distribution or use our recommended values.
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">3. Add Special Requirements</h3>
                <p className="text-sm text-muted-foreground">
                  Include allergies, health conditions, and meal preferences for a truly personalized plan.
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">4. Generate Your Plan</h3>
                <p className="text-sm text-muted-foreground">
                  Our AI analyzes your input to create a balanced, nutritious meal plan tailored to you.
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Nutritional Guidelines</CardTitle>
              <CardDescription>
                General recommendations for a balanced diet
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Protein</h3>
                <p className="text-sm text-muted-foreground">
                  Recommended: 10-35% of daily calories. 
                  Essential for muscle repair and immune function.
                </p>
                <Separator className="my-2" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Carbohydrates</h3>
                <p className="text-sm text-muted-foreground">
                  Recommended: 45-65% of daily calories.
                  Primary energy source for your body and brain.
                </p>
                <Separator className="my-2" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Fats</h3>
                <p className="text-sm text-muted-foreground">
                  Recommended: 20-35% of daily calories.
                  Important for hormone production and nutrient absorption.
                </p>
                <Separator className="my-2" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Water</h3>
                <p className="text-sm text-muted-foreground">
                  Aim for 8-10 cups (2-2.5 liters) daily.
                  Crucial for all bodily functions and nutrient transport.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
