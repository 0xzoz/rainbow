import React from 'react';
import { Centered } from '../../layout';
import { Nbsp, Text, TruncatedText } from '../../text';
import styled from '@rainbow-me/styled-components';
import { fonts, fontWithWidth } from '@rainbow-me/styles';

export const SwapDetailsRowHeight = 17;

const SwapDetailsText = styled(Text).attrs({
  lineHeight: SwapDetailsRowHeight,
  size: 'smedium',
})({});

export const SwapDetailsLabel = styled(SwapDetailsText).attrs(
  ({ theme: { colors } }) => ({
    color: colors.alpha(colors.blueGreyDark, 0.5),
  })
)(fontWithWidth(fonts.weight.semibold));

export const SwapDetailsValue = styled(SwapDetailsText).attrs(
  ({ theme: { colors }, color = colors.alpha(colors.blueGreyDark, 0.8) }) => ({
    color,
  })
)(fontWithWidth(fonts.weight.bold));

export default function SwapDetailsRow({
  children,
  label,
  truncated = true,
  ...props
}) {
  const component = truncated ? TruncatedText : Text;
  return (
    <Centered {...props}>
      <SwapDetailsText as={component}>
        <SwapDetailsLabel>{label}</SwapDetailsLabel>
        <Nbsp />
        <SwapDetailsValue>{children}</SwapDetailsValue>
      </SwapDetailsText>
    </Centered>
  );
}
