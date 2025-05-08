import * as React from "react";
import { 
  VictoryPie, 
  VictoryBar, 
  VictoryChart, 
  VictoryAxis, 
  VictoryLabel, 
  VictoryTheme, 
  VictoryContainer
} from "victory";

// Macronutrient chart (pie chart)
interface MacroChartProps {
  protein: number;
  carbs: number;
  fat: number;
  size?: number;
}

export function MacronutrientChart({ protein, carbs, fat, size = 200 }: MacroChartProps) {
  const data = [
    { x: "Protein", y: protein },
    { x: "Carbs", y: carbs },
    { x: "Fat", y: fat }
  ];
  
  const colorScale = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)"];
  
  return (
    <div style={{ height: size, width: size }}>
      <VictoryPie
        data={data}
        colorScale={colorScale}
        innerRadius={size * 0.2}
        labelRadius={size * 0.4}
        style={{
          labels: { fill: "var(--foreground)", fontSize: 12 },
          data: {
            stroke: "white",
            strokeWidth: 1
          }
        }}
        labels={({ datum }) => `${datum.x}: ${datum.y}%`}
        padding={10}
        containerComponent={<VictoryContainer responsive={false} />}
        height={size}
        width={size}
      />
    </div>
  );
}

// Nutrient bar chart
interface NutrientData {
  name: string;
  value: number;
  unit: string;
  percentage?: number;
}

interface NutrientBarChartProps {
  data: NutrientData[];
  title?: string;
  height?: number;
  width?: number;
}

export function NutrientBarChart({ data, title, height = 300, width = 500 }: NutrientBarChartProps) {
  return (
    <div style={{ height, width }}>
      {title && <h3 className="text-center font-medium mb-2">{title}</h3>}
      <VictoryChart
        height={height}
        width={width}
        domainPadding={20}
        theme={VictoryTheme.material}
        padding={{ top: 20, bottom: 60, left: 80, right: 40 }}
        containerComponent={<VictoryContainer responsive={false} />}
      >
        <VictoryAxis
          tickLabelComponent={<VictoryLabel angle={-45} textAnchor="end" />}
          style={{
            tickLabels: { fontSize: 10, padding: 5 },
            grid: { stroke: "none" }
          }}
        />
        <VictoryAxis
          dependentAxis
          style={{
            tickLabels: { fontSize: 10, padding: 5 },
            grid: { stroke: "var(--border)", strokeDasharray: "5,5" }
          }}
        />
        <VictoryBar
          data={data.map(item => ({ x: item.name, y: item.percentage || item.value }))}
          style={{
            data: {
              fill: "var(--primary)",
              width: 20
            }
          }}
          labels={({ datum }) => {
            const matchingData = data.find(item => item.name === datum.x);
            return `${matchingData?.value} ${matchingData?.unit}`;
          }}
          labelComponent={
            <VictoryLabel 
              dy={-10} 
              style={{ fontSize: 8, fill: "var(--foreground)" }} 
            />
          }
        />
      </VictoryChart>
    </div>
  );
}

// Calorie breakdown chart
interface CalorieBreakdownProps {
  meals: {
    name: string;
    calories: number;
  }[];
  dailyGoal: number;
  height?: number;
  width?: number;
}

export function CalorieBreakdownChart({ 
  meals, 
  dailyGoal, 
  height = 300, 
  width = 500 
}: CalorieBreakdownProps) {
  const total = meals.reduce((sum, meal) => sum + meal.calories, 0);
  const remaining = Math.max(0, dailyGoal - total);
  
  const data = [
    ...meals,
    { name: "Remaining", calories: remaining }
  ];
  
  const colorScale = [
    "var(--chart-1)", 
    "var(--chart-2)", 
    "var(--chart-3)", 
    "var(--chart-4)", 
    "var(--chart-5)",
    "#cccccc" // For remaining
  ];
  
  return (
    <div style={{ height, width }}>
      <VictoryPie
        data={data}
        x="name"
        y="calories"
        colorScale={colorScale}
        innerRadius={70}
        labelRadius={90}
        style={{
          labels: { fill: "var(--foreground)", fontSize: 12 },
          data: {
            stroke: "white",
            strokeWidth: 1
          }
        }}
        labels={({ datum }) => `${datum.name}: ${datum.calories} cal`}
        padding={10}
        containerComponent={<VictoryContainer responsive={false} />}
        height={height}
        width={width}
      />
    </div>
  );
}
