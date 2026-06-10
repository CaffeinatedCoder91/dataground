import * as stylex from '@stylexjs/stylex';
import { useEffect, useRef, useState } from 'react';
import { Header } from './components/Header';
import { AddressSearch } from './components/AddressSearch';
import { MapView } from './components/MapView';
import { RiskReport } from './components/RiskReport';
import { LoadingState } from './components/LoadingState';
import { ErrorBanner } from './components/ErrorBanner';
import { useGeocoding } from './hooks/useGeocoding';
import { useRiskAssessment } from './hooks/useRiskAssessment';
import type { Coordinates, PostcodeLocation, RiskAssessment } from './types';
import { styles } from './App.stylex';

type AppStatus = 'idle' | 'geocoding' | 'analysing' | 'complete' | 'error';

const App = () => {
  const [status, setStatus] = useState<AppStatus>('idle');
  const [currentLocation, setCurrentLocation] = useState<PostcodeLocation | null>(null);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { geocode } = useGeocoding();
  const { assess } = useRiskAssessment();

  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = async (postcode: string) => {
    setStatus('geocoding');
    setErrorMessage(null);
    setRiskAssessment(null);

    try {
      const location = await geocode(postcode);
      setCurrentLocation(location);
      setCoordinates({
        latitude: location.latitude,
        longitude: location.longitude,
      });

      setStatus('analysing');

      const assessment = await assess(location);
      setRiskAssessment(assessment);
      setStatus('complete');
    } catch (caughtError) {
      const error = caughtError instanceof Error
        ? caughtError.message
        : 'An unexpected error occurred';

      setErrorMessage(error);
      setStatus('error');
    }
  };

  const handleDismissError = () => {
    setErrorMessage(null);
    setStatus(riskAssessment ? 'complete' : 'idle');
    inputRef.current?.focus();
  };

  useEffect(() => {
    if (status === 'complete') {
      inputRef.current?.focus();
    }
  }, [status]);

  const isLoading = status === 'geocoding' || status === 'analysing';

  return (
    <div {...stylex.props(styles.container)}>
      <Header />
      <div {...stylex.props(styles.content)}>
        <div {...stylex.props(styles.leftPanel)}>
          <AddressSearch
            onSearch={handleSearch}
            isLoading={isLoading}
            inputReference={inputRef}
          />

          {errorMessage && (
            <ErrorBanner
              message={errorMessage}
              onDismiss={handleDismissError}
            />
          )}

          {(status === 'geocoding' || status === 'analysing') && (
            <LoadingState status={status} />
          )}

          {riskAssessment && currentLocation && status === 'complete' && (
            <RiskReport
              assessment={riskAssessment}
              postcode={currentLocation.postcode}
              region={currentLocation.region}
            />
          )}
        </div>

        <div {...stylex.props(styles.rightPanel)}>
          <MapView coordinates={coordinates} />
        </div>
      </div>
    </div>
  );
};

export default App;
