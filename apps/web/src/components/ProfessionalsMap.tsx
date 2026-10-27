import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { ProfessionalProfile } from '../lib/types';

const icon = L.divIcon({
  className: '',
  html: `<div style="background:#9E5F70;width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.3)"><span style="transform:rotate(45deg);color:white;font-size:12px">❀</span></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

interface Props {
  professionals: ProfessionalProfile[];
  height?: string;
  single?: boolean;
}

export default function ProfessionalsMap({ professionals, height = '320px', single = false }: Props) {
  const center: [number, number] = professionals.length === 1 || single
    ? [professionals[0]?.lat ?? -33.0472, professionals[0]?.lng ?? -71.5525]
    : [-33.03, -71.55];

  return (
    <MapContainer
      center={center}
      zoom={single ? 14 : 12}
      style={{ height, width: '100%', borderRadius: 16, zIndex: 0 }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {professionals.map((p) => (
        <Marker key={p.id} position={[p.lat, p.lng]} icon={icon}>
          <Popup>
            <strong>{p.nombrePublico}</strong>
            <br />
            {p.comuna}
            <br />
            <Link to={`/profesional/${p.id}`} style={{ color: '#9E5F70', fontWeight: 600 }}>
              Ver perfil →
            </Link>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
