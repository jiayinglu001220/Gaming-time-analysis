import React, { useState, useEffect } from "react";
import { DeckGL } from "@deck.gl/react";
import { ScreenGridLayer } from "@deck.gl/aggregation-layers";
import { Map } from "react-map-gl";
import { Row, Col } from "react-bootstrap";
import { 
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis
} from 'recharts';
import * as d3 from "d3";

const MAPBOX_TOKEN = "pk.eyJ1Ijoic3RldmVuejEwMyIsImEiOiJjbTNvNWt2bTkwaWt2MmtvaTl3bWtwNXVpIn0.SaDk06dPsIZgFUmu08b-mw";

const INITIAL_VIEW_STATE = {
  longitude: -118.2437,
  latitude: 34.0522,
  zoom: 11,
  pitch: 0,
  bearing: 0
}; 

const COLORS = [
  '#4ECDC4', '#45B7D1', '#72A9C2', '#5B8DB6', '#4A7BAA',
  '#3E69A1', '#2B5598', '#1E4592', '#153680', '#0D276E',
  '#07245A', '#011E4A', '#001840', '#001236', '#000C2C'
];

const SPEED_GROUPS = [
  { range: '0.768-5.0', min: 0.768, max: 5.0 },
  { range: '6.0-10.0', min: 6.0, max: 10.0 },
  { range: '12.0-24.0', min: 12.0, max: 24.0 },
  { range: '25.0-75.0', min: 25.0, max: 75.0 },
  { range: '100.0-300.0', min: 100.0, max: 300.0 }
];

const styles = {
  wrapper: {
    width: '100%',
    height: 'calc(100vh - 56px)',
    backgroundColor: '#212529',
    display: 'flex',
    flexDirection: 'column'
  },
  title: {
    color: 'white',
    textAlign: 'center',
    padding: '0px 0',
    margin: 0,
    height: '50px'
  },
  contentWrapper: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden'
  },
  mapCol: {
    width: '66.666%',
    height: '100%',
    position: 'relative'
  },
  mapContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%'
  },
  chartsCol: {
    width: '33.333%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    padding: '0 10px'
  },
  chartSection: {
    height: '50%',
    display: 'flex',
    flexDirection: 'column'
  },
  subtitle: {
    color: 'white',
    textAlign: 'center',
    fontSize: '1rem',
    margin: '5px 0',
    height: '30px'
  },
  chartContainer: {
    flex: 1,
    minHeight: 0
  }
};

const sliderStyles = {
  container: {
    position: 'absolute',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '80%',
    zIndex: 1,
    background: 'rgba(0, 0, 0, 0.6)',
    padding: '5px 5px',
    borderRadius: '2px'
  },
  label: {
    color: '#fff',
    marginBottom: '2px',
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px'
  },
  sliderContainer: {
    width: '100%',
    padding: '0 5px'
  },
  sliderInput: {
    width: '100%',
    height: '4px',
    background: 'rgba(255, 255, 255, 0.3)',
    borderRadius: '2px',
    WebkitAppearance: 'none',
    appearance: 'none',
    cursor: 'pointer'
  },
  value: {
    color: '#fff',
    fontSize: '14px',
    marginTop: '1px',
    textAlign: 'center'
  }
};

function Graph3() {
  const [data, setData] = useState([]);
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [pieData, setPieData] = useState([]);
  const [barData, setBarData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [timeValue, setTimeValue] = useState(2024);

  useEffect(() => {
    const loadData = async () => {
      try {
        const csvData = await d3.csv(`${process.env.PUBLIC_URL}/data/la_with_game_data.csv`);
        const formattedData = csvData.map(row => ({
          ...row,
          lat: parseFloat(row.lat),
          lon: parseFloat(row.lon),
          fastest_speed_down: parseFloat(row.fastest_speed_down),
          gaming_time: parseFloat(row.gaming_time),
          Weekly_Avg_Video_Game_Hours: parseFloat(row.Weekly_Avg_Video_Game_Hours)
        }));
        
        setData(formattedData);
        const uniqueCategories = [...new Set(formattedData.map(d => d.Played_Game_Category))].sort();
        setCategories(uniqueCategories);
        updateChartsFromCell(formattedData);
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };

    loadData();
  }, []);

  const updateChartsFromCell = (cellData) => {
    if (!cellData || !cellData.length) return;

    // Process pie chart data
    const categoryCount = d3.rollup(
      cellData,
      v => v.length,
      d => d.Played_Game_Category
    );
    
    const total = cellData.length;
    const pieChartData = Array.from(categoryCount, ([category, count]) => ({
      name: category,
      value: count,
      percentage: (count / total) * 100
    }))
    .sort((a, b) => b.percentage - a.percentage);

    setPieData(pieChartData);

    // Process bar chart data
    const barChartData = SPEED_GROUPS.map(group => {
      const groupData = cellData.filter(d => 
        d.fastest_speed_down >= group.min && d.fastest_speed_down <= group.max
      );

      const result = {
        range: group.range
      };

      categories.forEach(category => {
        const categoryData = groupData.filter(d => d.Played_Game_Category === category);
        result[category] = categoryData.length > 0 
          ? d3.mean(categoryData, d => d.Weekly_Avg_Video_Game_Hours) || 0 
          : 0;
      });

      return result;
    });

    setBarData(barChartData);
  };

  const TimeSlider = () => (
    <div style={sliderStyles.container}>
      <div style={sliderStyles.label}>
        <span>2000</span>
        <span>2024</span>
      </div>
      <div style={sliderStyles.sliderContainer}>
        <input
          type="range"
          min="2000"
          max="2024"
          value={timeValue}
          onChange={(e) => setTimeValue(Number(e.target.value))}
          style={sliderStyles.sliderInput}
        />
      </div>
      <div style={sliderStyles.value}>Year: {timeValue}</div>
    </div>
  );

  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-dark text-white p-2 rounded">
          <p className="mb-0">{payload[0].name}: {payload[0].value} ({payload[0].payload.percentage.toFixed(2)}%)</p>
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-dark text-white p-2 rounded">
          <p className="mb-0">{payload[0].payload.range}</p>
          {payload.map((entry, index) => (
            <p key={`item-${index}`} className="mb-0">
              {entry.name}: {entry.value.toFixed(2)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={styles.wrapper}>
      <h2 style={styles.title}>Los Angeles: Gaming Time Analysis</h2>
      <div style={styles.contentWrapper}>
        <div style={styles.mapCol}>
          <div style={styles.mapContainer}>
            <DeckGL
              viewState={viewState}
              onViewStateChange={({viewState}) => setViewState(viewState)}
              controller={true}
              layers={[new ScreenGridLayer({
                id: 'screen-grid',
                data,
                getPosition: d => [d.lon, d.lat],
                getWeight: d => d.gaming_time,
                cellSizePixels: 20,
                colorRange: [
                  [32, 128, 177, 178],
                  [52, 152, 219, 178],
                  [72, 176, 242, 178],
                  [92, 200, 255, 178],
                  [112, 224, 255, 178],
                  [132, 248, 255, 178]
                ],
                pickable: true,
                onClick: (info) => {
                  if (info?.object?.points) {
                    updateChartsFromCell(info.object.points);
                  }
                },
                opacity: 1.0,
                aggregation: 'SUM'
              })]}
            >
              <Map
                mapboxAccessToken={MAPBOX_TOKEN}
                mapStyle="mapbox://styles/mapbox/dark-v10"
              />
            </DeckGL>
            <TimeSlider />
          </div>
        </div>

        <div style={styles.chartsCol}>
          <div style={styles.chartSection}>
            <h4 style={{ 
              color: 'white', 
              textAlign: 'center', 
              fontSize: '1.5rem', 
              margin: '40px 20',
              padding: '0'
            }}>  
              Game Category Distribution
            </h4>
            <div style={styles.chartContainer}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius="70%"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={styles.chartSection}>
            <h4 style={{ 
              color: 'white', 
              textAlign: 'center', 
              fontSize: '1.5rem', 
              margin: '40px 20',
              padding: '0'
            }}>
              Gaming Hours by Internet Speed
            </h4>
            <div style={styles.chartContainer}>
              {barData.length > 0 && (
                <ResponsiveContainer width="100%" height="100%" key={new Date().getTime()}>
                  <BarChart
                    data={barData}
                    layout="vertical"
                    margin={{ top: 20, right: 30, left: 120, bottom: 40 }}
                  >
                    <XAxis 
                      type="number" 
                      stroke="#fff"
                      label={{ 
                        value: 'Average Weekly Video Game Hours', 
                        position: 'bottom',
                        fill: '#fff'
                      }}
                    />
                    <YAxis 
                      dataKey="range" 
                      type="category" 
                      stroke="#fff"
                      label={{ 
                        value: 'Internet Speed: Mbps', 
                        angle: -90,
                        position: 'insideLeft',
                        fill: '#fff',
                        offset: -80,
                        dy: 90
                      }}
                    />
                    <RechartsTooltip 
                      content={<CustomBarTooltip />}
                      cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
                    />
                    {categories.length > 0 ? categories.map((category, index) => (
                      <Bar
                        key={category}
                        dataKey={category}
                        stackId="a"
                        fill={COLORS[index % COLORS.length]}
                        minPointSize={2}
                      />
                    )) : null}
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div> 
        </div>
      </div>
    </div>
  );  
}
 
export default Graph3; 
