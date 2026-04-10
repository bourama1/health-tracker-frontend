import React, { memo, useCallback } from 'react';
import { Path } from 'react-native-svg';
import differenceWith from 'ramda/src/differenceWith';

import { bodyFront } from './assets/bodyFront';
import { bodyBack } from './assets/bodyBack';
import { SvgMaleWrapper } from './components/SvgMaleWrapper';
import { bodyFemaleFront } from './assets/bodyFemaleFront';
import { bodyFemaleBack } from './assets/bodyFemaleBack';
import { SvgFemaleWrapper } from './components/SvgFemaleWrapper';

const comparison = (a, b) => a.slug === b.slug;

const Body = ({
  data,
  gender = 'male',
  scale = 1,
  colors = ['#0984e3', '#74b9ff'],
  zoomOnPress = false,
  side = 'front',
  onBodyPartPress,
  theme = 'light',
}) => {
  const mergedBodyParts = useCallback(
    (dataSource) => {
      const innerData = data
        .map((d) => {
          return dataSource.find((t) => {
            return t.slug === d.slug;
          });
        })
        .filter(Boolean);

      const coloredBodyParts = innerData.map((d) => {
        const bodyPart = data.find((e) => e.slug === d?.slug);
        let colorIntensity = 1;
        if (bodyPart?.intensity) colorIntensity = bodyPart.intensity;
        return { ...d, color: colors[colorIntensity - 1] || colors[0] };
      });

      const formattedBodyParts = differenceWith(
        comparison,
        dataSource,
        data
      ).map((part) => ({
        ...part,
        color: theme === 'dark' ? '#333333' : part.color,
      }));

      return [...formattedBodyParts, ...coloredBodyParts];
    },
    [data, colors, theme]
  );

  const getColorToFill = (bodyPart) => {
    let color;
    if (bodyPart.intensity) {
      color = colors[bodyPart.intensity - 1] || colors[0];
    } else {
      color = bodyPart.color;
    }
    return color;
  };

  const renderBodySvg = (data) => {
    const SvgWrapper = gender === 'male' ? SvgMaleWrapper : SvgFemaleWrapper;
    return (
      <SvgWrapper side={side} scale={scale}>
        {mergedBodyParts(data).map((bodyPart) => {
          if (bodyPart.pathArray) {
            return bodyPart.pathArray.map((path) => {
              return (
                <Path
                  key={path}
                  onPress={() => onBodyPartPress?.(bodyPart)}
                  id={bodyPart.slug}
                  fill={getColorToFill(bodyPart)}
                  d={path}
                />
              );
            });
          }
          return null;
        })}
      </SvgWrapper>
    );
  };

  if (gender === 'female') {
    return renderBodySvg(side === 'front' ? bodyFemaleFront : bodyFemaleBack);
  }

  return renderBodySvg(side === 'front' ? bodyFront : bodyBack);
};

export default memo(Body);
