import React from "react";
import { CalendarDays, Clock, Edit, Trash2, Download, Share2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { DietPlan } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { deleteDietPlan, exportDietPlan } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "wouter";

interface DietPlanCardProps {
  dietPlan: DietPlan;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}

export default function DietPlanCard({ dietPlan, onEdit, onDelete }: DietPlanCardProps) {
  const { toast } = useToast();
  
  // Delete diet plan mutation
  const deleteMutation = useMutation({
    mutationFn: deleteDietPlan,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Diet plan deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/diet-plans"] });
      if (onDelete) {
        onDelete(dietPlan.id);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete diet plan: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    },
  });
  
  // Export diet plan mutation
  const exportMutation = useMutation({
    mutationFn: (format: "pdf" | "json") => exportDietPlan(dietPlan.id, format),
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Diet plan exported successfully",
      });
      
      // Create download link
      if (data.url) {
        const link = document.createElement("a");
        link.href = data.url;
        link.download = `${dietPlan.name.replace(/\s+/g, "_")}_diet_plan.${data.format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to export diet plan: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    },
  });
  
  // Handle edit button click
  const handleEdit = () => {
    if (onEdit) {
      onEdit(dietPlan.id);
    }
  };
  
  // Handle delete button click
  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this diet plan?")) {
      deleteMutation.mutate(dietPlan.id);
    }
  };
  
  return (
    <Card className="w-full h-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{dietPlan.name}</CardTitle>
            <CardDescription className="mt-1">{dietPlan.description || "Personal diet plan"}</CardDescription>
          </div>
          <Badge variant={dietPlan.status === "active" ? "default" : "secondary"}>
            {dietPlan.status === "active" ? "Active" : "Draft"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center text-sm text-muted-foreground space-x-4">
          <div className="flex items-center">
            <CalendarDays className="h-4 w-4 mr-1" />
            <span>{formatDate(dietPlan.createdAt)}</span>
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            <span>{dietPlan.durationDays} days</span>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-accent bg-opacity-20 rounded p-2 text-center">
            <div className="text-xs text-muted-foreground">Protein</div>
            <div className="font-medium">{dietPlan.proteinPercentage}%</div>
          </div>
          <div className="bg-accent bg-opacity-20 rounded p-2 text-center">
            <div className="text-xs text-muted-foreground">Carbs</div>
            <div className="font-medium">{dietPlan.carbsPercentage}%</div>
          </div>
          <div className="bg-accent bg-opacity-20 rounded p-2 text-center">
            <div className="text-xs text-muted-foreground">Fat</div>
            <div className="font-medium">{dietPlan.fatPercentage}%</div>
          </div>
        </div>
        
        {dietPlan.tags && dietPlan.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {dietPlan.tags.map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" asChild>
          <Link href={`/diet-plans/${dietPlan.id}`}>View Details</Link>
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <svg
                width="15"
                height="15"
                viewBox="0 0 15 15"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM12.5 8.625C13.1213 8.625 13.625 8.12132 13.625 7.5C13.625 6.87868 13.1213 6.375 12.5 6.375C11.8787 6.375 11.375 6.87868 11.375 7.5C11.375 8.12132 11.8787 8.625 12.5 8.625Z"
                  fill="currentColor"
                />
              </svg>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportMutation.mutate("pdf")}>
              <Download className="h-4 w-4 mr-2" />
              Export as PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportMutation.mutate("json")}>
              <Download className="h-4 w-4 mr-2" />
              Export as JSON
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleDelete}
              className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  );
}
