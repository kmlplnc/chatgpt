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
  
  // Daha canlı renkler kullanıyoruz
  const colorScale = ["#4CAF50", "#2196F3", "#FF9800"];
  
  return (
    <div style={{ height: size, width: size }}>
      <VictoryPie
        data={data}
        colorScale={colorScale}
        innerRadius={size * 0.25}
        labelRadius={size * 0.37}
        style={{
          labels: { 
            fill: "white", 
            fontSize: 14,
            fontWeight: "bold",
            textShadow: "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000"
          },
          data: {
            stroke: "white",
            strokeWidth: 2
          }
        }}
        labels={({ datum }) => `${datum.x}\n${datum.y}%`}
        padding={10}
        containerComponent={<VictoryContainer responsive={false} />}
        height={size}
        width={size}
        events={[{
          target: "data",
          eventHandlers: {
            onMouseOver: () => {
              return [
                {
                  target: "data",
                  mutation: (props) => {
                    return {
                      style: { ...props.style, opacity: 0.8, stroke: "black", strokeWidth: 3 }
                    };
                  }
                },
                {
                  target: "labels",
                  mutation: (props) => {
                    return {
                      style: { ...props.style, fontSize: 16 }
                    };
                  }
                }
              ];
            },
            onMouseOut: () => {
              return [
                {
                  target: "data",
                  mutation: () => null
                },
                {
                  target: "labels",
                  mutation: () => null
                }
              ];
            }
          }
        }]}
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
  // Daha zengin ve farklı renkler oluşturuyoruz
  const colorArray = ["#1976D2", "#2E7D32", "#C62828", "#7B1FA2", "#F57C00", "#0097A7", "#D32F2F", "#00796B"];
  
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
            tickLabels: { fontSize: 10, padding: 5, fontWeight: "bold" },
            grid: { stroke: "none" }
          }}
        />
        <VictoryAxis
          dependentAxis
          style={{
            tickLabels: { fontSize: 10, padding: 5, fontWeight: "bold" },
            grid: { stroke: "#e0e0e0", strokeDasharray: "3,3" }
          }}
        />
        <VictoryBar
          data={data.map((item, index) => ({ 
            x: item.name, 
            y: item.percentage || item.value,
            fill: colorArray[index % colorArray.length]
          }))}
          style={{
            data: {
              fill: ({ datum }) => datum.fill,
              width: 25,
              stroke: "black",
              strokeWidth: 0.5
            }
          }}
          labels={({ datum }) => {
            const matchingData = data.find(item => item.name === datum.x);
            return `${matchingData?.value} ${matchingData?.unit}`;
          }}
          labelComponent={
            <VictoryLabel 
              dy={-10} 
              style={{ 
                fontSize: 12, 
                fill: "black",
                fontWeight: "bold"
              }} 
            />
          }
          events={[{
            target: "data",
            eventHandlers: {
              onMouseOver: () => {
                return [
                  {
                    target: "data",
                    mutation: (props) => {
                      return {
                        style: { ...props.style, opacity: 0.8, stroke: "black", strokeWidth: 2 }
                      };
                    }
                  },
                  {
                    target: "labels",
                    mutation: (props) => {
                      return {
                        style: { ...props.style, fontSize: 14 }
                      };
                    }
                  }
                ];
              },
              onMouseOut: () => {
                return [
                  {
                    target: "data",
                    mutation: () => null
                  },
                  {
                    target: "labels",
                    mutation: () => null
                  }
                ];
              }
            }
          }]}
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
  
  // Daha canlı renkler kullanıyoruz
  const colorScale = [
    "#4CAF50", // Yeşil
    "#FF5722", // Turuncu
    "#2196F3", // Mavi
    "#9C27B0", // Mor
    "#FFC107", // Amber
    "#e0e0e0" // Gri (kalan miktar için)
  ];
  
  return (
    <div style={{ height, width }}>
      <VictoryPie
        data={data}
        x="name"
        y="calories"
        colorScale={colorScale}
        innerRadius={75}
        labelRadius={100}
        style={{
          labels: { 
            fill: "white", 
            fontSize: 14,
            fontWeight: "bold",
            textShadow: "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000"
          },
          data: {
            stroke: "white",
            strokeWidth: 2
          }
        }}
        labels={({ datum }) => `${datum.name}\n${datum.calories} kal`}
        padding={10}
        containerComponent={<VictoryContainer responsive={false} />}
        height={height}
        width={width}
        events={[{
          target: "data",
          eventHandlers: {
            onMouseOver: () => {
              return [
                {
                  target: "data",
                  mutation: (props) => {
                    return {
                      style: { ...props.style, opacity: 0.8, stroke: "black", strokeWidth: 3 }
                    };
                  }
                },
                {
                  target: "labels",
                  mutation: (props) => {
                    return {
                      style: { ...props.style, fontSize: 16 }
                    };
                  }
                }
              ];
            },
            onMouseOut: () => {
              return [
                {
                  target: "data",
                  mutation: () => null
                },
                {
                  target: "labels",
                  mutation: () => null
                }
              ];
            }
          }
        }]}
      />
      
      {/* Toplam kalori bilgisi */}
      <div className="text-center mt-4">
        <p className="text-sm font-medium">Toplam: {total} kal / {dailyGoal} kal</p>
        <p className="text-xs text-muted-foreground">
          {Math.round(total / dailyGoal * 100)}% tüketildi
        </p>
      </div>
    </div>
  );
}
