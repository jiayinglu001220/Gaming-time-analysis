import React, { useState, useEffect } from "react";
import { DeckGL } from "@deck.gl/react";
import { HexagonLayer } from "@deck.gl/aggregation-layers";
import { Map } from "react-map-gl";
import { Dropdown } from "react-bootstrap";
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import * as d3 from "d3";
import { useMemo } from 'react'; // Import useMemo

const MAPBOX_TOKEN = "pk.eyJ1Ijoic3RldmVuejEwMyIsImEiOiJjbTNvNWt2bTkwaWt2MmtvaTl3bWtwNXVpIn0.SaDk06dPsIZgFUmu08b-mw";

const INITIAL_VIEW_STATE = {
  longitude: -120.7129,
  latitude: 37.0902,
  zoom: 5.5,
  pitch: 40,
  bearing: 0,
  maxZoom: 12,
  minZoom: 2,
};

const styles = {
  wrapper: {
    width: "100%",
    height: "calc(100vh - 56px)",
    backgroundColor: "#212529",
    display: "flex",
    flexDirection: "column",
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
    display: "flex",
  },
  mapCol: {
    width: "66.666%",
    height: "100%",
    position: "relative",
  },
  chartsCol: {
    width: "33.333%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
  },
  chartSection: {
    height: "50%",
  },
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
    padding: '10px 15px',
    borderRadius: '4px'
  },
  label: {
    color: '#fff',
    marginBottom: '8px',
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

function Graph2() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedColumn, setSelectedColumn] = useState("Weekly_Avg_Video_Game_Hours");
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [histogramData, setHistogramData] = useState([]);
  const [selectedCounty, setSelectedCounty] = useState("All");  // New state for county selection
  const [counties, setCounties] = useState([]); // State to store unique county names
  const [timeValue, setTimeValue] = useState(2024); // State for the time slider

  useEffect(() => {
    d3.csv(`${process.env.PUBLIC_URL}/data/incomedata_ca.csv`).then((csvData) => {
      const formattedData = csvData.map((row) => ({
        ...row,  // Keep all original fields
        Weekly_Avg_Video_Game_Hours: parseFloat(row.Weekly_Avg_Video_Game_Hours),
        Weekly_Avg_Exercise_Hours: parseFloat(row.Weekly_Avg_Exercise_Hours),
        Lat: parseFloat(row.Lat),
        Lon: parseFloat(row.Lon),
      }));

      const uniqueCounties = ["All", ...new Set(formattedData.map(d => d.County))]; // Add "All" option first
      setCounties(uniqueCounties);

      setData(formattedData);
      setFilteredData(formattedData);  // Start with all data
      setHistogramData(createHistogramData(formattedData, selectedColumn));
    });
  }, []);

  const createHistogramData = (data, key) => {
    const filtered = data.filter(d => d[key] !== undefined && !isNaN(d[key])); // Filter out undefined/NaN
    if (filtered.length === 0) return []; // Handle empty data

    const histogram = d3.histogram()
        .domain(d3.extent(filtered, d => d[key])) // Dynamic domain based on filtered data
        .thresholds(10)
        .value((d) => d[key]);

    const bins = histogram(filtered);

    return bins.map((bin) => ({
        range: bin.x0 !== undefined && bin.x1 !== undefined ? `${bin.x0.toFixed(1)}-${bin.x1.toFixed(1)}` : "No Data", // Check if x0 and x1 are defined
        count: bin.length,
    }));
  };

  const hexagonLayer = useMemo(() => new HexagonLayer({
    id: 'hexagon-layer',
    data: filteredData,
    getPosition: d => [d.Lon, d.Lat],
    elevationScale: 100, // Adjust as needed
    extruded: true,
    radius: 5000,
    opacity: 0.6,
    colorRange: [[255, 255, 178], [255, 204, 92], [255, 153, 51], [255, 102, 51], [255, 51, 51], [153, 0, 0]],
    getElevationWeight: d => d.Weekly_Avg_Exercise_Hours || 0, // Use simpler logic
    getColorValue: d => d.Weekly_Avg_Video_Game_Hours || 0, // Use simpler logic
    pickable: true,
  }), [filteredData]);

  useEffect(() => {
    let filtered = data;
    if (selectedCounty !== "All") {
      filtered = data.filter((d) => d.County === selectedCounty); // Use 'County' for consistency
    }
    setFilteredData(filtered);
    setHistogramData(createHistogramData(filtered, selectedColumn));

    // Center map based on selected county OR reset to initial view
    if (selectedCounty !== "All" && filtered.length > 0) {
      const center = {
        longitude: d3.mean(filtered, d => d.Lon),
        latitude: d3.mean(filtered, d => d.Lat),
      };
      setViewState({ ...viewState, ...center, zoom: 8, transitionDuration: 500 });
    } else { // Reset view for "All" or empty filtered data
      setViewState(INITIAL_VIEW_STATE);
    }
  }, [selectedCounty, data, selectedColumn]);

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

  return (
    <div style={styles.wrapper}>
      <h2 style={styles.title}>California Exercise and Gaming Hours Analysis</h2>
      <div style={styles.contentWrapper}>
        <div style={styles.mapCol}>
          <div style={styles.mapContainer}>
            <DeckGL
              viewState={viewState}
              controller={true}
              layers={[hexagonLayer]}
              onViewStateChange={({ viewState }) => setViewState(viewState)}
            >
              <Map
                mapboxAccessToken={MAPBOX_TOKEN}
                mapStyle="mapbox://styles/mapbox/dark-v10"
              />
            </DeckGL>
            <TimeSlider />
          </div>
          <Dropdown
            onSelect={(key) => setSelectedCounty(key)} // County selection
            className="position-absolute m-3" 
          >
            <Dropdown.Toggle variant="secondary">
              County: {selectedCounty}
            </Dropdown.Toggle>
            <Dropdown.Menu style={{ backgroundColor: '#343a40', color: 'white' }}>
              <Dropdown.Item eventKey="All">All</Dropdown.Item>
              {counties.map((county) => (
                <Dropdown.Item className="text-white" eventKey={county}>
                  {county}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
        </div>

        <div style={styles.chartsCol}>
          <div style={styles.chartSection}>
          <h4 style={{ 
              color: 'white', 
              textAlign: 'center', // Use 'left' or 'right' to change alignment if needed
              fontSize: '1.5rem', // Adjust the size of the title
              margin: '40px 20',   // Adjusts space above and below the title
              padding: '0',
              height: '50px'
                }}>
              Exercise vs. Gaming Hours
            </h4>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart
                margin={{ top: 20, right: 20, bottom: 50, left: 40 }}
              >
                <CartesianGrid />
                <XAxis
                  type="number"
                  dataKey="Weekly_Avg_Exercise_Hours"
                  name="Avg Exercise Hours"
                  label={{ value: "Avg Exercise Hours (weekly)", position: "bottom", offset: 15, fill: '#fff' }}
                  stroke="#fff"
                />
                <YAxis
                  type="number"
                  dataKey="Weekly_Avg_Video_Game_Hours"
                  name="Average Game Time"
                  label={{ value: "Average Game Time (weekly)", angle: -90, position: 'left', offset: 0, dy:-100, fill: '#fff' }}
                  stroke="#fff"
                />
                <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                <Scatter name="Data" data={filteredData} fill="#8884d8" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Graph2;
