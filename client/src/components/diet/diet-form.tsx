import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { dietRequirementSchema, type DietRequirement } from "@shared/schema";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { MacronutrientChart } from "@/components/ui/chart";

// Form validation schema
const formSchema = z.object({
  name: z.string(),
  age: z.number(),
  gender: z.enum(["male", "female"]),
  height: z.number(),
  weight: z.number(),
  activityLevel: z.enum([
    "sedentary",
    "light",
    "moderate",
    "active",
    "very_active",
  ]),
  dietType: z.enum([
    "balanced",
    "low_carb",
    "high_protein",
    "vegetarian",
    "vegan",
    "keto",
    "paleo",
    "mediterranean",
    "custom",
  ]),
  allergies: z.string().optional(),
  healthConditions: z.string().optional(),
  calorieGoal: z.number().optional(),
  proteinPercentage: z.number(),
  carbsPercentage: z.number(),
  fatPercentage: z.number(),
  meals: z.number(),
  includeDessert: z.boolean().default(false),
  includeSnacks: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

// Diet form component
export default function DietForm({ onSuccess }: { onSuccess?: (data: FormValues) => void }) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("basic");
  
  // Calculate macronutrient percentages
  const [macroPercentages, setMacroPercentages] = useState({
    protein: 30,
    carbs: 40,
    fat: 30,
  });
  
  // Preset diet type macros
  const dietTypePresets = {
    balanced: { protein: 30, carbs: 40, fat: 30 },
    low_carb: { protein: 40, carbs: 20, fat: 40 },
    high_protein: { protein: 50, carbs: 30, fat: 20 },
    vegetarian: { protein: 25, carbs: 50, fat: 25 },
    vegan: { protein: 20, carbs: 60, fat: 20 },
    keto: { protein: 25, carbs: 5, fat: 70 },
    paleo: { protein: 35, carbs: 25, fat: 40 },
    mediterranean: { protein: 20, carbs: 50, fat: 30 },
    custom: { protein: 30, carbs: 40, fat: 30 },
  } as const;
  
  // Default values
  const defaultValues: FormValues = {
    name: "My Diet Plan",
    age: 35,
    gender: "female",
    height: 165,
    weight: 65,
    activityLevel: "moderate",
    dietType: "balanced",
    proteinPercentage: 30,
    carbsPercentage: 40,
    fatPercentage: 30,
    meals: 3,
    includeDessert: false,
    includeSnacks: true,
    allergies: "",
    healthConditions: "",
  };
  
  // Form setup
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: "onChange",
  });
  
  // Watch form values for calculations
  const watchedValues = form.watch();
  
  // Update macros when diet type changes
  React.useEffect(() => {
    const dietType = form.getValues("dietType");
    if (dietType && dietType in dietTypePresets) {
      const presets = dietTypePresets[dietType as keyof typeof dietTypePresets];
      form.setValue("proteinPercentage", presets.protein);
      form.setValue("carbsPercentage", presets.carbs);
      form.setValue("fatPercentage", presets.fat);
      setMacroPercentages(presets);
    }
  }, [form.watch("dietType")]);
  
  // Watch and update macros
  React.useEffect(() => {
    const protein = form.getValues("proteinPercentage");
    const carbs = form.getValues("carbsPercentage");
    const fat = form.getValues("fatPercentage");
    
    setMacroPercentages({
      protein: protein || 30,
      carbs: carbs || 40,
      fat: fat || 30,
    });
  }, [form.watch("proteinPercentage"), form.watch("carbsPercentage"), form.watch("fatPercentage")]);
  
  // Check if macros add up to 100%
  const totalMacros = macroPercentages.protein + macroPercentages.carbs + macroPercentages.fat;
  const macrosValid = totalMacros === 100;
  
  // Generate diet plan mutation
  const generateMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const response = await fetch("/api/diet-plans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate diet plan");
      }
      
      return response.json();
    },
    onSuccess: (data: FormValues) => {
      toast({
        title: "Diet Plan Generated!",
        description: "Your personalized diet plan is ready.",
      });
      if (onSuccess) {
        onSuccess(data);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/diet-plans"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to generate diet plan: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    },
  });
  
  // On form submit
  function onSubmit(values: FormValues) {
    generateMutation.mutate(values);
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Generate Diet Plan</CardTitle>
        <CardDescription>Create a personalized diet plan using AI</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="goals">Diet Goals</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <TabsContent value="basic" className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Diet Plan Name</FormLabel>
                      <FormControl>
                        <Input placeholder="My Diet Plan" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="height"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Height (cm)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight (kg)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="activityLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Activity Level</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select activity level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="sedentary">Sedentary</SelectItem>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="moderate">Moderate</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="very_active">Very Active</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              
              <TabsContent value="goals" className="space-y-4">
                <FormField
                  control={form.control}
                  name="dietType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Diet Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select diet type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="balanced">Balanced</SelectItem>
                          <SelectItem value="low_carb">Low Carb</SelectItem>
                          <SelectItem value="high_protein">High Protein</SelectItem>
                          <SelectItem value="vegetarian">Vegetarian</SelectItem>
                          <SelectItem value="vegan">Vegan</SelectItem>
                          <SelectItem value="keto">Keto</SelectItem>
                          <SelectItem value="paleo">Paleo</SelectItem>
                          <SelectItem value="mediterranean">Mediterranean</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="calorieGoal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Daily Calorie Goal (optional)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormDescription>
                        Leave blank to use the recommended calories
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Macronutrient Distribution</h3>
                  
                  <FormField
                    control={form.control}
                    name="proteinPercentage"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <div className="flex justify-between">
                          <FormLabel>Protein: {field.value}%</FormLabel>
                          <span className="text-sm text-muted-foreground">
                            {Math.round((field.value / 100) * (watchedValues.calorieGoal || 2000) / 4)}g
                          </span>
                        </div>
                        <FormControl>
                          <Slider 
                            value={[field.value]} 
                            min={10} 
                            max={60} 
                            step={1} 
                            onValueChange={(values) => field.onChange(values[0])} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="carbsPercentage"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <div className="flex justify-between">
                          <FormLabel>Carbs: {field.value}%</FormLabel>
                          <span className="text-sm text-muted-foreground">
                            {Math.round((field.value / 100) * (watchedValues.calorieGoal || 2000) / 4)}g
                          </span>
                        </div>
                        <FormControl>
                          <Slider 
                            value={[field.value]} 
                            min={10} 
                            max={70} 
                            step={1} 
                            onValueChange={(values) => field.onChange(values[0])} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="fatPercentage"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <div className="flex justify-between">
                          <FormLabel>Fat: {field.value}%</FormLabel>
                          <span className="text-sm text-muted-foreground">
                            {Math.round((field.value / 100) * (watchedValues.calorieGoal || 2000) / 9)}g
                          </span>
                        </div>
                        <FormControl>
                          <Slider 
                            value={[field.value]} 
                            min={10} 
                            max={60} 
                            step={1} 
                            onValueChange={(values) => field.onChange(values[0])} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="mt-4">
                    <MacronutrientChart 
                      protein={macroPercentages.protein}
                      carbs={macroPercentages.carbs}
                      fat={macroPercentages.fat}
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="preferences" className="space-y-4">
                <FormField
                  control={form.control}
                  name="allergies"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Allergies</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="List any food allergies or intolerances" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="healthConditions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Health Conditions</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="List any health conditions that may affect your diet" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Meal Plan Settings</h3>
                  
                  <FormField
                    control={form.control}
                    name="meals"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Meals Per Day: {field.value}</FormLabel>
                        <FormControl>
                          <Slider 
                            value={[field.value]} 
                            min={2} 
                            max={6} 
                            step={1} 
                            onValueChange={(values) => field.onChange(values[0])} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="includeDessert"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Include Dessert</FormLabel>
                          <FormDescription>
                            Add a dessert option to your meal plan
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="includeSnacks"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Include Snacks</FormLabel>
                          <FormDescription>
                            Add snack options to your meal plan
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
              
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={!macrosValid || generateMutation.isPending}
                >
                  {generateMutation.isPending ? "Generating..." : "Generate Diet Plan"}
                </Button>
              </div>
            </form>
          </Form>
        </Tabs>
      </CardContent>
    </Card>
  );
}
