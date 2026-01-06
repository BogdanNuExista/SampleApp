import { useState } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

type LocationData = {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
};

export function useGeolocation() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);

  const requestLocationPermission = async () => {
    if (Platform.OS === 'ios') {
      Geolocation.requestAuthorization();
      setHasPermission(true);
      return true;
    }

    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location to track where your focus sessions happen.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        const hasAccess = granted === PermissionsAndroid.RESULTS.GRANTED;
        setHasPermission(hasAccess);
        return hasAccess;
      } catch (err) {
        console.warn('Location permission error:', err);
        return false;
      }
    }

    return false;
  };

  const getCurrentLocation = async (): Promise<LocationData | null> => {
    return new Promise((resolve) => {
      setIsLoading(true);
      
      Geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // Try to get city/country using reverse geocoding
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
              {
                headers: {
                  'User-Agent': 'SampleApp/1.0',
                  'Accept': 'application/json',
                },
              }
            );
            
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            const locationData: LocationData = {
              latitude,
              longitude,
              city: data.address?.city || data.address?.town || data.address?.village || data.address?.county,
              country: data.address?.country,
            };
            
            setLocation(locationData);
            setIsLoading(false);
            resolve(locationData);
          } catch (error) {
            console.warn('Reverse geocoding failed:', error);
            const locationData: LocationData = {
              latitude,
              longitude,
            };
            setLocation(locationData);
            setIsLoading(false);
            resolve(locationData);
          }
        },
        (error) => {
          console.warn('Geolocation error:', error);
          setIsLoading(false);
          resolve(null);
        },
        {
          enableHighAccuracy: false,
          timeout: 15000,
          maximumAge: 10000,
        }
      );
    });
  };

  return {
    location,
    hasPermission,
    isLoading,
    requestLocationPermission,
    getCurrentLocation,
  };
}
