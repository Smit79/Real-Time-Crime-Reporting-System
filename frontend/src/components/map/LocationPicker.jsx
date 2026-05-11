import { Marker, useMapEvents } from 'react-leaflet';

const LocationPicker = ({ position, onChange }) => {
  const map = useMapEvents({
    click(event) {
      onChange?.([event.latlng.lat, event.latlng.lng]);
    },
  });

  if (position) {
    map.flyTo(position, map.getZoom(), { duration: 0.4 });
  }

  return position ? <Marker position={position} /> : null;
};

export default LocationPicker;
