import React, { useState, useEffect } from "react";
import { DeckGL } from "@deck.gl/react";
import { HexagonLayer } from "@deck.gl/aggregation-layers";
import { Map } from "react-map-gl";
import { Dropdown, Row, Col } from "react-bootstrap";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, 
  ScatterChart, Scatter, Legend, ResponsiveContainer, CartesianGrid
} from 'recharts';
import * as d3 from "d3";

const MAPBOX_TOKEN = "pk.eyJ1Ijoic3RldmVuejEwMyIsImEiOiJjbTNvNWt2bTkwaWt2MmtvaTl3bWtwNXVpIn0.SaDk06dPsIZgFUmu08b-mw";

const INITIAL_VIEW_STATE = {
  longitude: -95.7129,
  latitude: 37.0902,
  zoom: 4,
  pitch: 40,
  bearing: 0,
  maxZoom: 12,
  minZoom: 2
};

const STATE_CONFIGS = {
  default: {
    elevationScale: 1000,
    radius: 20000
  },
  stateLevel: {
    elevationScale: 300,
    radius: 3000
  }
};

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

function Graph1() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedState, setSelectedState] = useState("All");
  const [states, setStates] = useState([]);
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [hoverInfo, setHoverInfo] = useState(null);
  const [histogramData, setHistogramData] = useState([]);
  const [scatterData, setScatterData] = useState([]);
  const [timeValue, setTimeValue] = useState(2024);

  const createHistogramData = (data) => {
    const histogram = d3.histogram()
      .domain([0, 20])
      .thresholds(10)
      .value(d => d.Weekly_Avg_Video_Game_Hours);

    const bins = histogram(data);
    return bins.map(bin => ({
      range: `${bin.x0.toFixed(1)}-${bin.x1.toFixed(1)}`,
      count: bin.length,
      x0: bin.x0,
      x1: bin.x1
    }));
  };

  useEffect(() => {
    d3.csv(`${process.env.PUBLIC_URL}/data/Income_Data_With_Income_Based_Video_Game_Hours.csv`).then((csvData) => {
      const formattedData = csvData.map((row) => ({
        ...row,
        Mean: parseFloat(row.Mean),
        Lat: parseFloat(row.Lat),
        Lon: parseFloat(row.Lon),
        Weekly_Avg_Video_Game_Hours: parseFloat(row.Weekly_Avg_Video_Game_Hours),
      }));

      setData(formattedData);
      setFilteredData(formattedData);
      setStates([...new Set(formattedData.map((d) => d.State_Name))]);
      setHistogramData(createHistogramData(formattedData));
    });
  }, []);

  useEffect(() => {
    let filtered = data;
    if (selectedState !== "All") {
      filtered = data.filter((d) => d.State_Name === selectedState);
      
      const stateData = filtered[0];
      if (stateData) {
        setViewState({
          ...INITIAL_VIEW_STATE,
          longitude: stateData.Lon,
          latitude: stateData.Lat,
          zoom: 6,
          transitionDuration: 1000,
        });
      }

      setHistogramData(createHistogramData(filtered));
      setScatterData(filtered);
    } else {
      setViewState(INITIAL_VIEW_STATE);
      setHistogramData(createHistogramData(data));
      setScatterData([]);
    }
    setFilteredData(filtered);
  }, [selectedState, data]);

  const config = selectedState === "All" ? STATE_CONFIGS.default : STATE_CONFIGS.stateLevel;

  const hexagonLayer = new HexagonLayer({
    id: "hexagon-layer",
    data: filteredData,
    getPosition: (d) => [d.Lon, d.Lat],
    getElevationWeight: (d) => d.Mean || 0,
    elevationScale: config.elevationScale,
    extruded: true,
    radius: config.radius,
    opacity: 0.6,
    coverage: 1,
    getColorValue: (d) => d.reduce((acc, point) => acc + (point.Weekly_Avg_Video_Game_Hours || 0), 0) / d.length,
    colorRange: [[255, 255, 178], [254, 217, 118], [254, 178, 76], [253, 141, 60], [240, 59, 32], [189, 0, 38]],
    pickable: true,
    onHover: setHoverInfo
  });

  const renderTooltip = () => {
    if (!hoverInfo || !hoverInfo.object) return null;

    const { x, y, object } = hoverInfo;
    
    return (
      <div
        className="position-absolute bg-dark text-white p-2 rounded"
        style={{
          left: x,
          top: y,
          zIndex: 1,
          pointerEvents: 'none'
        }}
      >
        <div>Areas: {object.points.length}</div>
        <div>
          Income: ${(object.points.reduce((acc, p) => acc + p.Mean, 0) / 
            object.points.length).toLocaleString(undefined, {maximumFractionDigits: 0})}
        </div>
        <div>
          Gaming Hours: {(object.points.reduce((acc, p) => acc + p.Weekly_Avg_Video_Game_Hours, 0) / 
            object.points.length).toFixed(1)}
        </div>
      </div>
    );
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

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-dark text-white p-2 rounded">
          <p className="mb-0">Range: {payload[0].payload.range}</p>
          <p className="mb-0">Count: {payload[0].payload.count}</p>
        </div>
      );
    }
    return null;
  };

  const ScatterTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-dark text-white p-2 rounded">
          <p className="mb-0">Income: ${data.Mean.toLocaleString()}</p>
          <p className="mb-0">Gaming Hours: {data.Weekly_Avg_Video_Game_Hours.toFixed(1)}</p>
          <p className="mb-0">Type: {data.Type}</p>
        </div>
      );
    }
    return null;
  };

  const CustomPoint = (props) => {
    const { cx, cy, fill } = props;
    return (
      <circle 
        cx={cx} 
        cy={cy} 
        r={0.5}
        fill={fill}
        stroke="none"
      />
    );
  };

  return (
    <div style={styles.wrapper}>
      <h2 style={styles.title}>US Income and Video Game Playing Time Analysis</h2>
      <div style={styles.contentWrapper}>
        <div style={styles.mapCol}>
          <div style={styles.mapContainer}>
            <DeckGL
              viewState={viewState}
              onViewStateChange={({viewState}) => setViewState(viewState)}
              controller={true}
              layers={[hexagonLayer]}
            >
              <Map
                mapboxAccessToken={MAPBOX_TOKEN}
                mapStyle="mapbox://styles/mapbox/dark-v10"
                maxBounds={[[-130, 20], [-60, 55]]}
              />
              {renderTooltip()}
            </DeckGL>
            <TimeSlider />
          </div>
          <div className="position-absolute top-0 end-0 m-3">
            <Dropdown onSelect={setSelectedState}>
              <Dropdown.Toggle variant="secondary">
                State: {selectedState}
              </Dropdown.Toggle>
              <Dropdown.Menu className="bg-dark">
                <Dropdown.Item className="text-white" eventKey="All">All</Dropdown.Item>
                {states.map((state) => (
                  <Dropdown.Item 
                    key={state}
                    eventKey={state}
                    className="text-white"
                  >
                    {state}
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>

        <div style={styles.chartsCol}>
          <div style={styles.chartSection}>
            <h4 style={{ 
              color: 'white', 
              textAlign: 'center', // Use 'left' or 'right' to change alignment if needed
              fontSize: '1.5rem', // Adjust the size of the title
              margin: '20px 0',   // Adjusts space above and below the title
              padding: '0'
            }}>
              Distribution of Weekly Gaming Hours
              {selectedState !== "All" ? ` - ${selectedState}` : " - United States"}
            </h4>
            <div style={styles.chartContainer}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={histogramData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 45 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="range"
                    stroke="#fff"
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    fontSize={12}
                    label={{ value: "Weekly Gaming Hours Range", position: "bottom", offset: 15, fill: "#fff" }}
                  />
                  <YAxis 
                    stroke="#fff" 
                    fontSize={12}
                    label={{ value: "Count", angle: -90, position: "insideLeft", offset: 10, dy: 40, fill: "#fff" }}
                  />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={styles.chartSection}>
          <h4 style={{ 
            color: 'white', 
            textAlign: 'center', // Use 'left' or 'right' to change alignment if needed
            fontSize: '1.5rem', // Adjust the size of the title
            margin: '40px 20',   // Adjusts space above and below the title
            padding: '0'
              }}>
            Income vs Gaming Hours by Type
          </h4>
            <div style={styles.chartContainer}>
  <ResponsiveContainer width="100%" height="100%">
    <ScatterChart
      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis 
        type="number" 
        dataKey="Mean" 
        name="Income" 
        stroke="#fff"
        domain={['auto', 'auto']}
        fontSize={12}
        label={{ value: "Income (USD)", position: "bottom", offset: 20, fill: "#fff" }}
      />
      <YAxis 
        type="number" 
        dataKey="Weekly_Avg_Video_Game_Hours" 
        name="Gaming Hours"
        stroke="#fff"
        fontSize={12}
        label={{ value: "Weekly Gaming Hours", angle: -90, position: "insideLeft", offset: 15, dy: 90, fill: "#fff" }}
      />
      <RechartsTooltip content={<ScatterTooltip />} />
      <Legend 
        layout="horizontal"
        align="right"
        verticalAlign="top"
        wrapperStyle={{ paddingTop: 20, paddingBottom: 10, color: "#fff" }}
      />
      {scatterData.length > 0 && [...new Set(scatterData.map(d => d.Type))].map((type, index) => (
        <Scatter
          key={type}
          name={type}
          data={scatterData.filter(d => d.Type === type)}
          fill={d3.schemeCategory10[index]}
          shape={<CustomPoint />}
        />
      ))}
    </ScatterChart>
            </ResponsiveContainer>  
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Graph1;
