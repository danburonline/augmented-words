import { XRButton, XRButtonProps } from '@react-three/xr';
import React from 'react';

export const ImmersiveARButton = React.forwardRef<
  HTMLButtonElement,
  Omit<XRButtonProps, 'mode'>
>(
  (
    {
      sessionInit = {
        optionalFeatures: [
          'local-floor',
          'bounded-floor',
          'hand-tracking',
          'layers',
          'plane-detection',
        ],
      },
      children,
      ...rest
    },
    ref
  ) => (
    <XRButton {...rest} ref={ref} mode='AR' sessionInit={sessionInit}>
      {children}
    </XRButton>
  )
);

ImmersiveARButton.displayName = 'ImmersiveARButton';

export default ImmersiveARButton;
