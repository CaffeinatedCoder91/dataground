import * as stylex from '@stylexjs/stylex';
import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { Coordinates, FloodRiskData } from '../../types';
import { DEFAULT_MAP_LATITUDE, DEFAULT_MAP_LONGITUDE, DEFAULT_MAP_ZOOM, MAP_STYLE, RESULT_MAP_ZOOM } from '../../constants';
import { styles } from './MapView.stylex';

interface MapContentProps {
  coordinates: Coordinates | null;
  token: string;
  floodData?: FloodRiskData | null;
}

export const MapContent = ({ coordinates, token, floodData }: MapContentProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<mapboxgl.Map | null>(null);
  const markerInstance = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    mapboxgl.accessToken = token;

    if (!mapContainer.current) return;

    mapInstance.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAP_STYLE,
      center: [DEFAULT_MAP_LONGITUDE, DEFAULT_MAP_LATITUDE],
      zoom: DEFAULT_MAP_ZOOM,
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
      zoom: RESULT_MAP_ZOOM,
      duration: 1500,
    });
  }, [coordinates]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    const sourceId = 'flood-zone-source';
    const layerId = 'flood-zone-layer';
    const outlineLayerId = `${layerId}-outline`;

    // Remove existing source and layer if they exist
    if (map.getLayer(outlineLayerId)) {
      map.removeLayer(outlineLayerId);
    }
    if (map.getLayer(layerId)) {
      map.removeLayer(layerId);
    }
    if (map.getSource(sourceId)) {
      map.removeSource(sourceId);
    }

    // Add new flood zone if polygon data exists
    if (floodData?.polygon) {
      map.addSource(sourceId, {
        type: 'geojson',
        data: floodData.polygon,
      });

      map.addLayer({
        id: layerId,
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': '#2563eb',
          'fill-opacity': 0.3,
        },
      });

      map.addLayer({
        id: outlineLayerId,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': '#1e40af',
          'line-width': 2,
        },
      });
    }
  }, [floodData]);

  return (
    <div {...stylex.props(styles.container)} aria-hidden="true">
      <div {...stylex.props(styles.mapContainer)} ref={mapContainer} />
    </div>
  );
};
