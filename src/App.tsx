import * as stylex from '@stylexjs/stylex';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Header } from './components/Header';
import { AddressSearch } from './components/AddressSearch';
import { MapView } from './components/MapView';
import { RiskReport } from './components/RiskReport';
import { RiskReportSkeleton } from './components/RiskReportSkeleton';
import { LoadingState } from './components/LoadingState';
import { ErrorBanner } from './components/ErrorBanner';
import { RecentSearches } from './components/RecentSearches/RecentSearches';
import { ShareButton } from './components/ShareButton/ShareButton';
import { RiskPanel } from './components/RiskPanel';
import { useGeocoding } from './hooks/useGeocoding';
import { useRiskAssessment } from './hooks/useRiskAssessment';
import { useResultsCache } from './hooks/useResultsCache';
import { useRecentSearches } from './hooks/useRecentSearches';
import { fetchGeologyData } from './services/geology';
import { fetchAmenitiesData } from './services/amenities';
import type { Coordinates, PostcodeLocation, RiskAssessment, FloodRiskData, GeologyData, AmenitiesData, RiskAssessmentResult } from './types';
import { styles } from './App.stylex';

type AppStatus = 'idle' | 'geocoding' | 'analysing' | 'complete' | 'error';

interface OperationResult<T> {
  data: T | null;
  error: string | null;
}

const isValidCoordinate = (latitude: number, longitude: number): boolean => {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
};

const App = () => {
  const [status, setStatus] = useState<AppStatus>('idle');
  const [currentLocation, setCurrentLocation] = useState<PostcodeLocation | null>(null);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null);
  const [floodData, setFloodData] = useState<FloodRiskData | null>(null);
  const [geologyData, setGeologyData] = useState<GeologyData | null>(null);
  const [amenitiesData, setAmenitiesData] = useState<AmenitiesData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { geocode } = useGeocoding();
  const { assess } = useRiskAssessment();
  const { getCachedResult, setCachedResult } = useResultsCache();
  const { recentSearches, addRecentSearch, clearRecentSearches } = useRecentSearches();

  const inputRef = useRef<HTMLInputElement>(null);
  const hasHandledUrlParameter = useRef(false);

  const updateUrlParameter = useCallback((postcode: string) => {
    const cleanedPostcode = postcode.replace(/\s/g, '');
    const baseUrl = window.location.origin + window.location.pathname;
    const url = new URL(baseUrl);
    url.searchParams.set('postcode', cleanedPostcode);
    window.history.replaceState({}, '', url.toString());
  }, []);

  const handleSearch = useCallback(async (postcode: string) => {
    setErrorMessage(null);
    setRiskAssessment(null);
    setFloodData(null);
    setGeologyData(null);
    setAmenitiesData(null);

    const cachedResult = getCachedResult(postcode);
    if (cachedResult) {
      setCurrentLocation(cachedResult.location);
      setCoordinates({
        latitude: cachedResult.location.latitude,
        longitude: cachedResult.location.longitude,
      });
      setRiskAssessment(cachedResult.assessment);
      setFloodData(cachedResult.floodData || null);
      setGeologyData(cachedResult.geologyData || null);
      setAmenitiesData(cachedResult.amenitiesData || null);
      setStatus('complete');
      addRecentSearch(postcode);
      updateUrlParameter(postcode);
      return;
    }

    setStatus('geocoding');

    const locationResult = await geocode(postcode).then<OperationResult<PostcodeLocation>, OperationResult<PostcodeLocation>>(
      (location) => ({
        data: location,
        error: location ? null : 'Unable to find that postcode. Please check it and try again.',
      }),
      () => ({ data: null, error: 'Unable to find that postcode. Please check it and try again.' })
    );

    if (!locationResult.data) {
      setErrorMessage(locationResult.error);
      setStatus('error');
      return;
    }

    const location = locationResult.data;
    if (!isValidCoordinate(location.latitude, location.longitude)) {
      setErrorMessage('Unable to use this postcode. Please try another postcode.');
      setStatus('error');
      return;
    }

    setCurrentLocation(location);
    setCoordinates({
      latitude: location.latitude,
      longitude: location.longitude,
    });

    setStatus('analysing');

    const [assessmentResult, geology, amenities] = await Promise.all([
      assess(location).then<OperationResult<RiskAssessmentResult>, OperationResult<RiskAssessmentResult>>(
        (result) => ({ data: result, error: null }),
        (error: Error) => ({ data: null, error: error.message })
      ),
      fetchGeologyData(location.latitude, location.longitude),
      fetchAmenitiesData(location.latitude, location.longitude),
    ]);

    if (!assessmentResult.data) {
      setErrorMessage(assessmentResult.error || 'An unexpected error occurred');
      setStatus('error');
      return;
    }

    const result = assessmentResult.data;
    setRiskAssessment(result.assessment);
    setFloodData(result.floodData);
    setGeologyData(geology);
    setAmenitiesData(amenities);
    setCachedResult(postcode, {
      location,
      assessment: result.assessment,
      floodData: result.floodData,
      geologyData: geology,
      amenitiesData: amenities,
    });
    setStatus('complete');
    addRecentSearch(postcode);
    updateUrlParameter(postcode);
  }, [addRecentSearch, assess, geocode, getCachedResult, setCachedResult, updateUrlParameter]);

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

  useEffect(() => {
    if (hasHandledUrlParameter.current) {
      return;
    }

    const searchParameters = new URLSearchParams(window.location.search);
    const postcodeParameter = searchParameters.get('postcode');

    if (postcodeParameter) {
      hasHandledUrlParameter.current = true;
      void Promise.resolve().then(() => handleSearch(postcodeParameter));
    }
  }, [handleSearch]);

  const isLoading = status === 'geocoding' || status === 'analysing';

  return (
    <ErrorBoundary>
      <div {...stylex.props(styles.container)}>
        <Header />
        <div {...stylex.props(styles.content)}>
          <div {...stylex.props(styles.leftPanel)}>
            <AddressSearch
              onSearch={handleSearch}
              isLoading={isLoading}
              inputReference={inputRef}
            />

            <RecentSearches
              recentSearches={recentSearches}
              onSelect={handleSearch}
              onClear={clearRecentSearches}
            />

            {errorMessage && (
              <ErrorBanner
                message={errorMessage}
                onDismiss={handleDismissError}
              />
            )}

            {status === 'geocoding' && (
              <LoadingState status={status} />
            )}

            {status === 'analysing' && (
              <RiskReportSkeleton />
            )}

            {riskAssessment && currentLocation && status === 'complete' && (
              <>
                <RiskReport
                  assessment={riskAssessment}
                  postcode={currentLocation.postcode}
                  region={currentLocation.region}
                />
                {(floodData || geologyData || amenitiesData) && (
                  <RiskPanel
                    floodData={floodData || { zone: null, severity: null, warnings: [], error: null }}
                    geologyData={geologyData || undefined}
                    amenitiesData={amenitiesData || undefined}
                  />
                )}
                <ShareButton postcode={currentLocation.postcode} />
              </>
            )}
          </div>

          <div {...stylex.props(styles.rightPanel)}>
            <MapView coordinates={coordinates} floodData={floodData} />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default App;
