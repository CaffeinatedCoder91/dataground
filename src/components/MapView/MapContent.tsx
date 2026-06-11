import * as stylex from '@stylexjs/stylex';
import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { Coordinates } from '../../types';
import { styles } from './MapView.stylex';

interface MapContentProps {
  coordinates: Coordinates | null;
  token: string;
}

export const MapContent = ({ coordinates, token }: MapContentProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<mapboxgl.Map | null>(null);
  const markerInstance = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    mapboxgl.accessToken = token;

    if (!mapContainer.current) return;

    mapInstance.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-3.5, 54.5],
      zoom: 5,
    });

    return () => {
      mapInstance.current?.remove();
    };
  }, [token]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !coordinates) {
      if (markerInstance.current) {
        markerInstance.current.remove();
        markerInstance.current = null;
      }
      return;
    }

    if (markerInstance.current) {
      markerInstance.current.remove();
    }

    markerInstance.current = new mapboxgl.Marker()
      .setLngLat([coordinates.longitude, coordinates.latitude])
      .addTo(map);

    map.flyTo({
      center: [coordinates.longitude, coordinates.latitude],
      zoom: 13,
      duration: 1500,
    });
  }, [coordinates]);

  return (
    <div {...stylex.props(styles.container)} aria-hidden="true">
      <div {...stylex.props(styles.mapContainer)} ref={mapContainer} />
    </div>
  );
};
