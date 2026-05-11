import { MapContainer, TileLayer } from 'react-leaflet';

import { DEFAULT_MAP_CENTER } from '../../utils/constants';
import MapMarker from './MapMarker';

const CrimeMap = ({ reports = [], center = DEFAULT_MAP_CENTER, zoom = 11 }) => {
  return (
    <div className="h-[300px] overflow-hidden rounded-2xl border border-border shadow-soft sm:h-[420px]">
      <MapContainer center={center} zoom={zoom} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {reports.map((report) => (
          <MapMarker key={report._id} report={report} />
        ))}
      </MapContainer>
    </div>
  );
};

export default CrimeMap;
