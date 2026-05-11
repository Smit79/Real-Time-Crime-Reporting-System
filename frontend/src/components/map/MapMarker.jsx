import { Marker, Popup } from 'react-leaflet';

import CrimeBadge from '../crime/CrimeBadge';
import SeverityBadge from '../crime/SeverityBadge';

const MapMarker = ({ report, position, onSelect }) => {
  const markerPosition = position || [report?.location?.coordinates?.[1], report?.location?.coordinates?.[0]];
  const hasValidPosition = Array.isArray(markerPosition)
    && Number.isFinite(markerPosition[0])
    && Number.isFinite(markerPosition[1]);

  if (!hasValidPosition) return null;

  return (
    <Marker
      position={markerPosition}
      eventHandlers={{
        click: () => onSelect?.(report),
      }}
    >
      <Popup>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CrimeBadge type={report?.crimeType} />
            <SeverityBadge severity={report?.severity} />
          </div>
          <p className="text-sm font-semibold">{report?.title || 'Location marker'}</p>
        </div>
      </Popup>
    </Marker>
  );
};

export default MapMarker;
