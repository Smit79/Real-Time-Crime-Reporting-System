import { CircleMarker } from 'react-leaflet';

const HeatmapLayer = ({ points = [] }) => {
  return (
    <>
      {points.map((point, index) => {
        const radius = Math.max(4, Math.min(18, Number(point.weight || 1) * 2.5));
        return (
          <CircleMarker
            key={`${point.lat}-${point.lng}-${index}`}
            center={[point.lat, point.lng]}
            radius={radius}
            pathOptions={{
              color: 'transparent',
              fillColor: '#dc2626',
              fillOpacity: 0.16,
            }}
          />
        );
      })}
    </>
  );
};

export default HeatmapLayer;
