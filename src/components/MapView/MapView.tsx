import * as stylex from '@stylexjs/stylex';
import { lazy, Suspense } from 'react';
import type { Coordinates, FloodRiskData } from '../../types';
import { styles } from './MapView.stylex';

const MapContent = lazy(() => import('./MapContent').then((module) => ({ default: module.MapContent })));

interface MapViewProps {
  coordinates: Coordinates | null;
  floodData?: FloodRiskData | null;
}

const MapLoadingFallback = () => {
  return <div {...stylex.props(styles.loadingFallback)} />;
};

export const MapView = ({ coordinates, floodData }: MapViewProps) => {
  const token = import.meta.env.VITE_MAPBOX_TOKEN;
  const isMapAvailable = Boolean(token);

  if (!isMapAvailable) {
    return (
      <div {...stylex.props(styles.unavailableMessage)} role="status">
        Map unavailable. Add a Mapbox token to view locations.
      </div>
    );
  }

  return (
    <Suspense fallback={<MapLoadingFallback />}>
      <MapContent coordinates={coordinates} token={token} floodData={floodData} />
    </Suspense>
  );
};
