import React, { useState } from "react";
import { Search, Filter, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { searchFoods } from "@/lib/usda";
import { useDebounce } from "@/hooks/use-debounce";
import { translateFoodToEnglish, translateUI } from "@/lib/translations";
import FoodCard from "./food-card";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// Using the debounce hook imported at the top of the file

export default function FoodSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    dataType: ["Foundation", "SR Legacy", "Survey (FNDDS)", "Branded"],
    sortBy: "dataType.keyword",
    sortOrder: "asc" as "asc" | "desc",
  });
  const [page, setPage] = useState(1);
  const pageSize = 20;
  
  // Debounce search term to prevent too many API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  
  // Türkçeden İngilizce'ye çevrilen arama terimi
  const translatedSearchTerm = debouncedSearchTerm ? translateFoodToEnglish(debouncedSearchTerm) : "";
  
  // Log the translated term for debugging
  console.log("Arama terimi:", debouncedSearchTerm);
  console.log("Çevrilen terim:", translatedSearchTerm);
  
  // Query for food search with translated term
  const { data, error, isLoading, isPending } = useQuery({
    queryKey: ["/api/foods/search", translatedSearchTerm, page, filters],
    queryFn: () => 
      searchFoods({
        query: translatedSearchTerm,
        dataType: filters.dataType,
        pageSize,
        pageNumber: page,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      }),
    enabled: debouncedSearchTerm.length > 1,
  });
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1); // Reset to first page on new search
  };
  
  // Handle data type filter change
  const handleDataTypeChange = (type: string) => {
    setFilters(prev => {
      const newDataType = prev.dataType.includes(type)
        ? prev.dataType.filter(t => t !== type)
        : [...prev.dataType, type];
      
      return {
        ...prev,
        dataType: newDataType,
      };
    });
    setPage(1); // Reset to first page on filter change
  };
  
  // Handle sort order change
  const handleSortOrderChange = (order: "asc" | "desc") => {
    setFilters(prev => ({
      ...prev,
      sortOrder: order,
    }));
    setPage(1); // Reset to first page on sort change
  };
  
  // Handle sort by change
  const handleSortByChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      sortBy: value,
    }));
    setPage(1); // Reset to first page on sort change
  };
  
  // Generate pagination items
  const renderPaginationItems = () => {
    if (!data) return null;
    
    const totalPages = Math.ceil(data.totalHits / pageSize);
    const items = [];
    
    // Always show first page
    items.push(
      <PaginationItem key="first">
        <PaginationLink
          onClick={() => setPage(1)}
          isActive={page === 1}
        >
          1
        </PaginationLink>
      </PaginationItem>
    );
    
    // Show ellipsis if needed
    if (page > 3) {
      items.push(
        <PaginationItem key="ellipsis-1">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
    
    // Show current page and neighbors
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      if (i === 1 || i === totalPages) continue; // Skip first and last as they are always shown
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            onClick={() => setPage(i)}
            isActive={page === i}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    // Show ellipsis if needed
    if (page < totalPages - 2) {
      items.push(
        <PaginationItem key="ellipsis-2">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
    
    // Always show last page if there is more than one page
    if (totalPages > 1) {
      items.push(
        <PaginationItem key="last">
          <PaginationLink
            onClick={() => setPage(totalPages)}
            isActive={page === totalPages}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    return items;
  };
  
  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col md:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={translateUI("Enter a food name, brand, or ingredient to search our database")}
            value={searchTerm}
            onChange={handleSearchChange}
            className="pl-9"
          />
        </div>
        
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex gap-2">
                <Filter className="h-4 w-4" />
                {translateUI("Filter")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72">
              <h3 className="font-medium mb-2">Food Categories</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="foundation" 
                    checked={filters.dataType.includes("Foundation")}
                    onCheckedChange={() => handleDataTypeChange("Foundation")}
                  />
                  <Label htmlFor="foundation">Foundation Foods</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="sr-legacy" 
                    checked={filters.dataType.includes("SR Legacy")}
                    onCheckedChange={() => handleDataTypeChange("SR Legacy")}
                  />
                  <Label htmlFor="sr-legacy">Standard Reference</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="survey" 
                    checked={filters.dataType.includes("Survey (FNDDS)")}
                    onCheckedChange={() => handleDataTypeChange("Survey (FNDDS)")}
                  />
                  <Label htmlFor="survey">Survey Foods</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="branded" 
                    checked={filters.dataType.includes("Branded")}
                    onCheckedChange={() => handleDataTypeChange("Branded")}
                  />
                  <Label htmlFor="branded">Branded Foods</Label>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <h3 className="font-medium mb-2">Sort By</h3>
              <Select 
                value={filters.sortBy} 
                onValueChange={handleSortByChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dataType.keyword">Data Type</SelectItem>
                  <SelectItem value="lowercaseDescription.keyword">Name</SelectItem>
                  <SelectItem value="fdcId">Food ID</SelectItem>
                  <SelectItem value="publishedDate">Published Date</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex items-center mt-2 space-x-4">
                <Label>Order:</Label>
                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <input 
                      type="radio" 
                      id="asc" 
                      name="sortOrder" 
                      checked={filters.sortOrder === "asc"}
                      onChange={() => handleSortOrderChange("asc")}
                    />
                    <Label htmlFor="asc">Ascending</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="radio" 
                      id="desc" 
                      name="sortOrder" 
                      checked={filters.sortOrder === "desc"}
                      onChange={() => handleSortOrderChange("desc")}
                    />
                    <Label htmlFor="desc">Descending</Label>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          <Select 
            value={filters.sortBy} 
            onValueChange={handleSortByChange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dataType.keyword">Data Type</SelectItem>
              <SelectItem value="lowercaseDescription.keyword">Name</SelectItem>
              <SelectItem value="fdcId">Food ID</SelectItem>
              <SelectItem value="publishedDate">Published Date</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Status Messages */}
      {isPending && (
        <div className="flex justify-center items-center h-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      
      {error && (
        <div className="flex justify-center items-center h-32 text-destructive">
          An error occurred while searching for foods. Please try again.
        </div>
      )}
      
      {!isPending && !error && debouncedSearchTerm && data?.foods?.length === 0 && (
        <div className="flex justify-center items-center h-32 text-muted-foreground">
          No foods found matching "{debouncedSearchTerm}". Try a different search term.
        </div>
      )}
      
      {!isPending && !error && !debouncedSearchTerm && (
        <div className="flex justify-center items-center h-32 text-muted-foreground">
          Enter a search term to find foods in our database.
        </div>
      )}
      
      {/* Search Results */}
      {data?.foods && data.foods.length > 0 && (
        <>
          <div className="text-sm text-muted-foreground">
            Found {data.totalHits} results for "{debouncedSearchTerm}"
          </div>
          
          <div className="food-grid">
            {data.foods.map((food) => (
              <FoodCard key={food.fdcId} food={food} />
            ))}
          </div>
          
          {/* Pagination */}
          {data.totalHits > pageSize && (
            <Pagination>
              <PaginationContent>
                <PaginationPrevious 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                />
                
                {renderPaginationItems()}
                
                <PaginationNext 
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= Math.ceil(data.totalHits / pageSize)}
                />
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}
    </div>
  );
}
