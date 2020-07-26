import React from 'react';

import MapContext from './utils/map-context';

export interface RectProps extends H.map.Polygon.Options {
  boundingBox?: H.geo.Rect;
  top?: number;
  left?: number;
  bottom?: number;
  right?: number;
  strokeColor?: string;
  lineWidth?: number;
  fillColor?: string;
}

export const Rect: React.FC<RectProps> = ({
  boundingBox,
  top,
  left,
  bottom,
  right,
  strokeColor,
  lineWidth,
  fillColor,
}) => {
  const mapContext = React.useContext(MapContext);
  const [rect, setRect] = React.useState<H.map.Rect>();

  React.useEffect(() => {
    const { map } = mapContext;

    if (map && !rect) {
      let newBoundingBox: H.geo.Rect;
      if (boundingBox) {
        newBoundingBox = boundingBox;
      } else if (top && left && bottom && right) {
        newBoundingBox = new H.geo.Rect(top, left, bottom, right);
      } else {
        newBoundingBox = new H.geo.Rect(0, 0, 0, 0);
      }
      const newRect = new H.map.Rect(newBoundingBox, {
        style: {
          fillColor,
          lineWidth,
          strokeColor,
        },
      });
      map.addObject(newRect);

      setRect(newRect);
    }
  }, [
    rect,
    boundingBox,
    top,
    left,
    bottom,
    right,
    fillColor,
    lineWidth,
    mapContext,
    strokeColor,
  ]);

  React.useEffect(() => {
    const { map } = mapContext;
    return () => {
      if (map && rect) {
        map.removeObject(rect);
      }
    };
  }, [rect]);

  React.useEffect(() => {
    if (rect && top && left && bottom && right) {
      rect.setBoundingBox(new H.geo.Rect(top, left, bottom, right));
    }
  }, [rect, top, left, bottom, right]);

  return null;
};

export default Rect;
