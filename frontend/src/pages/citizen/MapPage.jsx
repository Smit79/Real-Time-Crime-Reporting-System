import { Filter, Layers, LocateFixed, Radar, Siren, SlidersHorizontal } from 'lucide-react';
import { Fragment, useEffect, useMemo, useState } from 'react';
import { CircleMarker, MapContainer, Marker, Popup, TileLayer, useMapEvents } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';

import { getAllReports, getHeatmap } from '../../api/crimeApi';
import HeatmapLayer from '../../components/map/HeatmapLayer';
import MapMarker from '../../components/map/MapMarker';
import PageTransition from '../../components/common/PageTransition';
import useDebounce from '../../hooks/useDebounce';
import useGeolocation from '../../hooks/useGeolocation';
import useCrimeStore from '../../store/crimeStore';
import { DEFAULT_MAP_CENTER } from '../../utils/constants';
import { formatRelativeTime } from '../../utils/formatters';

const RecenterMap = ({ center }) => {
  const map = useMapEvents({});

  useEffect(() => {
    if (!center) return;
    map.flyTo(center, Math.max(map.getZoom(), 12), { duration: 0.7 });
  }, [center, map]);

  return null;
};

const ClickCapture = ({ onPick }) => {
  useMapEvents({
    click: (event) => {
      onPick([event.latlng.lat, event.latlng.lng]);
    },
  });

  return null;
};

const MapPage = () => {
  const navigate = useNavigate();
  const { latitude, longitude, getCurrentPosition } = useGeolocation();

  const fetchNearby = useCrimeStore((state) => state.fetchNearby);
  const nearbyReports = useCrimeStore((state) => state.nearbyReports);
  const isLoading = useCrimeStore((state) => state.isLoading);
  const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude);

  const [center, setCenter] = useState(DEFAULT_MAP_CENTER);
  const [pickedLocation, setPickedLocation] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [heatmapPoints, setHeatmapPoints] = useState([]);
  const [fallbackReports, setFallbackReports] = useState([]);
  const [pulseWide, setPulseWide] = useState(false);

  const [filters, setFilters] = useState({
    crimeType: '',
    status: '',
    severityMin: 1,
    radius: 8,
    startDate: '',
    endDate: '',
  });

  const [layerState, setLayerState] = useState({
    markers: true,
    heatmap: false,
  });

  const debouncedFilters = useDebounce(filters, 350);

  useEffect(() => {
    document.title = 'Crime Map | CrimeWatch';
    getCurrentPosition();
  }, [getCurrentPosition]);

  useEffect(() => {
    if (!hasCoordinates) return;
    setCenter([latitude, longitude]);
  }, [hasCoordinates, latitude, longitude]);

  useEffect(() => {
    const pulseTimer = setInterval(() => setPulseWide((prev) => !prev), 900);
    return () => clearInterval(pulseTimer);
  }, []);

  useEffect(() => {
    const loadMapData = async () => {
      const [lat, lng] = center;

      const nearbyResponse = await fetchNearby({
        lat,
        lng,
        radius: debouncedFilters.radius,
        crimeType: debouncedFilters.crimeType || undefined,
        status: debouncedFilters.status || undefined,
        page: 1,
        limit: 120,
      });

      const nearby = nearbyResponse?.data?.reports || [];

      if (nearby.length === 0) {
        const allReportsResponse = await getAllReports({
          page: 1,
          limit: 120,
          crimeType: debouncedFilters.crimeType || undefined,
          status: debouncedFilters.status || undefined,
          sortBy: 'createdAt',
          order: 'desc',
        });

        const globalReports = allReportsResponse?.data?.reports || [];
        setFallbackReports(globalReports);

        // If nearby results are empty, bring map view to latest known report coordinates.
        const firstWithCoords = globalReports.find(
          (report) => Number.isFinite(report?.location?.coordinates?.[0])
            && Number.isFinite(report?.location?.coordinates?.[1])
        );

        if (firstWithCoords) {
          const [reportLng, reportLat] = firstWithCoords.location.coordinates;
          if (Math.abs(center[0] - reportLat) > 0.0001 || Math.abs(center[1] - reportLng) > 0.0001) {
            setCenter([reportLat, reportLng]);
          }
        }
      } else {
        setFallbackReports([]);
      }

      const now = new Date();
      const start = debouncedFilters.startDate ? new Date(debouncedFilters.startDate) : null;
      const periodDays = start ? Math.max(1, Math.ceil((now - start) / (1000 * 60 * 60 * 24))) : 30;

      const heatmapResponse = await getHeatmap({
        period: periodDays,
        crimeType: debouncedFilters.crimeType || undefined,
        severity: debouncedFilters.severityMin || undefined,
      });

      setHeatmapPoints(heatmapResponse?.data?.points || []);
    };

    loadMapData().catch(() => {});
  }, [center, debouncedFilters, fetchNearby]);

  const reportsForDisplay = useMemo(() => {
    return nearbyReports.length > 0 ? nearbyReports : fallbackReports;
  }, [fallbackReports, nearbyReports]);

  const visibleReports = useMemo(() => {
    return reportsForDisplay.filter((report) => {
      if (Number(report.severity || 0) < Number(debouncedFilters.severityMin || 1)) return false;

      if (debouncedFilters.startDate) {
        const from = new Date(debouncedFilters.startDate);
        if (new Date(report.createdAt) < from) return false;
      }

      if (debouncedFilters.endDate) {
        const to = new Date(debouncedFilters.endDate);
        to.setHours(23, 59, 59, 999);
        if (new Date(report.createdAt) > to) return false;
      }

      return true;
    });
  }, [debouncedFilters.endDate, debouncedFilters.severityMin, debouncedFilters.startDate, reportsForDisplay]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleLayerToggle = (key) => {
    setLayerState((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleReportAtLocation = () => {
    if (!pickedLocation) return;
    navigate(`/report-crime?lat=${pickedLocation[0]}&lng=${pickedLocation[1]}`);
  };

  return (
    <PageTransition className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-3xl font-bold text-text">Live Crime Map</h1>
        <button
          type="button"
          onClick={getCurrentPosition}
          className="btn-surface inline-flex w-full items-center justify-center gap-2 sm:w-auto"
          aria-label="Center map on my location"
        >
          <LocateFixed size={16} /> My location
        </button>
      </div>

      <div className="relative h-[70vh] overflow-hidden rounded-2xl border border-border shadow-soft sm:h-[76vh]">
        <MapContainer center={center} zoom={12} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <RecenterMap center={center} />
          <ClickCapture onPick={setPickedLocation} />

          {layerState.heatmap ? <HeatmapLayer points={heatmapPoints} /> : null}

          {layerState.markers
            ? visibleReports.map((report) => {
                const coords = report.location?.coordinates;
                if (!coords) return null;

                return (
                  <Fragment key={report._id}>
                    <MapMarker
                      report={report}
                      position={[coords[1], coords[0]]}
                      onSelect={setSelectedReport}
                    />
                    {Number(report.severity || 0) >= 4 ? (
                      <CircleMarker
                        center={[coords[1], coords[0]]}
                        radius={pulseWide ? 18 : 12}
                        pathOptions={{ color: '#ef4444', fillOpacity: 0.06 }}
                        eventHandlers={{
                          click: () => setSelectedReport(report),
                        }}
                      />
                    ) : null}
                  </Fragment>
                );
              })
            : null}

          {pickedLocation ? (
            <Marker position={pickedLocation}>
              <Popup>Selected location for new report</Popup>
            </Marker>
          ) : null}
        </MapContainer>

        <div className="absolute bottom-4 left-2 right-2 z-[500] rounded-2xl border border-border bg-surface/95 p-4 shadow-soft backdrop-blur sm:left-4 sm:right-auto sm:top-4 sm:w-[320px] sm:max-w-[90vw]">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-text">
            <Filter size={15} /> Map Filters
          </div>

          <div className="grid gap-2">
            <select
              value={filters.crimeType}
              onChange={(event) => handleFilterChange('crimeType', event.target.value)}
              className="input-field"
              aria-label="Filter by crime type"
            >
              <option value="">All crime types</option>
              <option value="theft">Theft</option>
              <option value="robbery">Robbery</option>
              <option value="assault">Assault</option>
              <option value="murder">Murder</option>
              <option value="fraud">Fraud</option>
              <option value="accident">Accident</option>
              <option value="fire">Fire</option>
            </select>

            <select
              value={filters.status}
              onChange={(event) => handleFilterChange('status', event.target.value)}
              className="input-field"
              aria-label="Filter by status"
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved</option>
            </select>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input
                type="date"
                className="input-field"
                value={filters.startDate}
                onChange={(event) => handleFilterChange('startDate', event.target.value)}
                aria-label="Start date"
              />
              <input
                type="date"
                className="input-field"
                value={filters.endDate}
                onChange={(event) => handleFilterChange('endDate', event.target.value)}
                aria-label="End date"
              />
            </div>

            <div className="rounded-xl border border-border p-2">
              <div className="mb-1 flex items-center justify-between text-xs text-text-muted">
                <span className="inline-flex items-center gap-1"><SlidersHorizontal size={12} /> Severity</span>
                <span>{filters.severityMin}+</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={filters.severityMin}
                onChange={(event) => handleFilterChange('severityMin', Number(event.target.value))}
                className="w-full"
                aria-label="Minimum severity"
              />
            </div>

            <div className="rounded-xl border border-border p-2">
              <div className="mb-1 flex items-center justify-between text-xs text-text-muted">
                <span className="inline-flex items-center gap-1"><Radar size={12} /> Radius</span>
                <span>{filters.radius} km</span>
              </div>
              <input
                type="range"
                min="2"
                max="30"
                value={filters.radius}
                onChange={(event) => handleFilterChange('radius', Number(event.target.value))}
                className="w-full"
                aria-label="Search radius in kilometers"
              />
            </div>

            <div className="mt-1 rounded-xl border border-border p-2">
              <div className="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-text-muted">
                <Layers size={12} /> Layers
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted">
                <label className="inline-flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={layerState.markers}
                    onChange={() => handleLayerToggle('markers')}
                  />
                  Markers
                </label>
                <label className="inline-flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={layerState.heatmap}
                    onChange={() => handleLayerToggle('heatmap')}
                  />
                  Heatmap
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-4 right-4 z-[500] hidden rounded-xl border border-border bg-surface/95 p-3 text-xs text-text-muted shadow-soft backdrop-blur sm:block">
          <p className="font-semibold text-text">Density Legend</p>
          <p className="mt-1">Light red: lower concentration</p>
          <p>Deep red: higher concentration</p>
          <p className="mt-2 font-medium text-text">Visible reports: {visibleReports.length}</p>
          {isLoading ? <p className="mt-1">Updating map data...</p> : null}
        </div>

        {pickedLocation ? (
          <div className="absolute bottom-4 left-2 right-2 z-[500] rounded-2xl border border-border bg-surface/95 p-4 shadow-soft backdrop-blur sm:left-4 sm:right-auto sm:max-w-sm">
            <p className="text-sm font-semibold text-text">Selected map location</p>
            <p className="mt-1 text-xs text-text-muted">
              Lat {pickedLocation[0].toFixed(5)}, Lng {pickedLocation[1].toFixed(5)}
            </p>
            <button
              type="button"
              className="btn-danger mt-3 w-full sm:w-auto"
              onClick={handleReportAtLocation}
              aria-label="Report crime at selected location"
            >
              Report crime here
            </button>
          </div>
        ) : null}

        {selectedReport ? (
          <div className="absolute left-2 right-2 top-2 z-[520] rounded-2xl border border-danger/40 bg-surface/95 p-4 shadow-soft backdrop-blur sm:left-auto sm:right-4 sm:top-4 sm:w-[300px]">
            <div className="flex items-center justify-between">
              <p className="inline-flex items-center gap-1 text-sm font-semibold text-danger">
                <Siren size={15} /> Selected incident
              </p>
              <button
                type="button"
                className="text-xs font-semibold text-text-muted"
                onClick={() => setSelectedReport(null)}
                aria-label="Close selected incident"
              >
                Close
              </button>
            </div>
            <h3 className="mt-2 text-base font-semibold text-text">{selectedReport.title}</h3>
            <p className="mt-1 text-xs text-text-muted">{selectedReport.crimeType} - severity {selectedReport.severity}</p>
            <p className="mt-2 text-xs text-text-muted">{formatRelativeTime(selectedReport.createdAt)}</p>
          </div>
        ) : null}
      </div>
    </PageTransition>
  );
};

export default MapPage;
