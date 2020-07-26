/* eslint @typescript-eslint/camelcase: 0 */
import React from 'react';
import debounce from 'lodash.debounce';

import MapContext from './utils/map-context';
import { HEvents, events, Events } from './utils/map-events';
import { usePlatform } from './hooks/use-platform';
import { useScript } from './hooks/use-script';
import { useLink } from './hooks/use-link';

export interface HEREMapProps extends H.Map.Options, HEvents {
  apikey: string;
  mapContainerId?: string;
  animateCenter?: boolean;
  animateZoom?: boolean;
  hidpi?: boolean;
  interactive?: boolean;
  secure?: boolean;
  platformOptions?: H.service.Platform.Options;
  style?: {
    config: string;
    baseUrl?: string;
  };
}

export const HEREMap: React.FC<HEREMapProps> = ({
  animateCenter,
  animateZoom,
  apikey,
  mapContainerId = 'map-container',
  center,
  hidpi,
  interactive,
  secure,
  zoom,
  platformOptions,
  style,
  children,
  ...rest
}) => {
  const [map, setMap] = React.useState<H.Map | undefined>(undefined);
  const [behavior, setBehavior] = React.useState<
    H.mapevents.Behavior | undefined
  >(undefined);
  const [ui, setUi] = React.useState<H.ui.UI | undefined>(undefined);
  const debouncedResizeMap = debounce(resizeMap, 200);
  const [,] = useLink(
    'https://js.api.here.com/v3/3.1/mapsjs-ui.css',
    'map-styles',
  );
  const [coreLoaded] = useScript(
    'https://js.api.here.com/v3/3.1/mapsjs-core.js',
    'core',
  );
  const [serviceLoaded] = useScript(
    'https://js.api.here.com/v3/3.1/mapsjs-service.js',
    'service',
  );
  const [uiLoaded] = useScript(
    'https://js.api.here.com/v3/3.1/mapsjs-ui.js',
    'ui',
  );
  const [mapeventsLoaded] = useScript(
    'https://js.api.here.com/v3/3.1/mapsjs-mapevents.js',
    'mapevents',
  );
  const platform = usePlatform(
    platformOptions || {
      apikey: apikey,
      useHTTPS: secure === true,
    },
    coreLoaded && serviceLoaded && uiLoaded && mapeventsLoaded,
  );

  React.useEffect(() => {
    if (platform) {
      const defaultLayers = platform.createDefaultLayers({
        ppi: hidpi ? 320 : 72,
      });

      const mapElement = document.querySelector(`#${mapContainerId}`);

      let customLayer: H.map.layer.Layer | undefined;

      if (mapElement && !map) {
        const newMap = new H.Map(
          mapElement,
          customLayer || defaultLayers.vector.normal.map,
          {
            center,
            zoom,
            pixelRatio: hidpi ? 2 : 1,
          },
        );
        setMap(newMap);
        if (interactive) {
          const newBehavior = new H.mapevents.Behavior(
            new H.mapevents.MapEvents(newMap),
          );

          const newUi = H.ui.UI.createDefault(newMap, defaultLayers);
          setBehavior(newBehavior);
          setUi(newUi);
        }
      }

      if (typeof window !== 'undefined') {
        window.addEventListener('resize', debouncedResizeMap);
      }
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', debouncedResizeMap);
      }
    };
  }, [
    center,
    debouncedResizeMap,
    hidpi,
    interactive,
    map,
    mapContainerId,
    platform,
    zoom,
  ]);

  React.useEffect(() => {
    if (map) {
      Object.entries(events).forEach(([event, hereEvent]) => {
        const e = rest[event as keyof Events];
        if (typeof e === 'function') {
          map.addEventListener(hereEvent, e);
        }
      });
    }
    return () => {
      if (map) {
        Object.entries(events).forEach(([event, hereEvent]) => {
          const e = rest[event as keyof Events];
          if (typeof e === 'function') {
            map.removeEventListener(hereEvent, e);
          }
        });
      }
    };
  }, [map, rest]);

  React.useEffect(() => {
    if (map && center) {
      map.setCenter(center, animateCenter === true);
    }
  }, [animateCenter, center, map]);

  React.useEffect(() => {
    if (map && zoom) {
      map.setZoom(zoom, animateZoom === true);
    }
  }, [animateZoom, map, zoom]);

  function usePrevious(value: any): any {
    const ref = React.useRef();
    React.useEffect(() => {
      ref.current = value;
    });
    return ref.current;
  }

  const previousStyle = usePrevious(style);
  React.useEffect(() => {
    if (map && style) {
      if (
        style.config !== previousStyle.config ||
        style.baseUrl !== previousStyle.baseUrl
      ) {
        const newStyle = new H.map.Style(style.config, style.baseUrl);
        const baseLayer = map.getBaseLayer() as H.map.layer.BaseTileLayer;
        const provider = baseLayer.getProvider();
        provider.setStyle(newStyle);
      }
    }
  }, [map, style, previousStyle]);

  function resizeMap() {
    if (map) {
      map.getViewPort().resize();
    }
  }

  return (
    <MapContext.Provider value={{ map, behavior, ui }}>
      <div
        id={mapContainerId}
        data-testid="map-container"
        style={{ height: '100%' }}
      >
        {map ? children : null}
      </div>
    </MapContext.Provider>
  );
};

export default HEREMap;
