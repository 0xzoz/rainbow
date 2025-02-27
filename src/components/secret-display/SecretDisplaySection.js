import { useRoute } from '@react-navigation/native';
import { captureException } from '@sentry/react-native';
import lang from 'i18n-js';
import { upperFirst } from 'lodash';
import React, { Fragment, useCallback, useEffect, useState } from 'react';
import {
  createdWithBiometricError,
  identifyWalletType,
  loadSeedPhraseAndMigrateIfNeeded,
} from '../../model/wallet';
import ActivityIndicator from '../ActivityIndicator';
import Spinner from '../Spinner';
import { BiometricButtonContent, Button } from '../buttons';
import { CopyFloatingEmojis } from '../floating-emojis';
import { Icon } from '../icons';
import { Column, ColumnWithMargins, RowWithMargins } from '../layout';
import { Text } from '../text';
import SecretDisplayCard from './SecretDisplayCard';
import WalletTypes from '@rainbow-me/helpers/walletTypes';
import { useWallets } from '@rainbow-me/hooks';
import styled from '@rainbow-me/styled-components';
import { margin, padding, position, shadow } from '@rainbow-me/styles';
import logger from 'logger';

const Title = styled(Text).attrs({
  align: 'center',
  size: 'lmedium',
  weight: 'bold',
})({
  paddingTop: isSmallPhone => (isSmallPhone ? 0 : 20),
});

const DescriptionText = styled(Text).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.alpha(colors.blueGreyDark, 0.6),
  lineHeight: 'loose',
  size: 'lmedium',
  weight: 'semibold',
}))({
  marginBottom: 42,
  marginTop: 5,
  paddingHorizontal: 3,
});

const AuthenticationText = styled(Text).attrs({
  align: 'center',
  color: 'blueGreyDark',
  size: 'large',
  weight: 'normal',
})({
  ...padding.object(0, 60),
});

const CopyButtonIcon = styled(Icon).attrs(({ theme: { colors } }) => ({
  color: colors.appleBlue,
  name: 'copy',
}))({
  ...position.sizeAsObject(16),
  marginTop: 0.5,
});

const CopyButtonRow = styled(RowWithMargins).attrs({
  align: 'center',
  justify: 'start',
  margin: 6,
})({
  backgroundColor: ({ theme: { colors } }) => colors.transparent,
  height: 34,
});

const CopyButtonText = styled(Text).attrs(({ theme: { colors } }) => ({
  color: colors.appleBlue,
  letterSpacing: 'roundedMedium',
  lineHeight: 19,
  size: 'lmedium',
  weight: 'bold',
}))({});

const ToggleSecretButton = styled(Button)(({ theme: { colors } }) => ({
  ...margin.object(0, 20),
  ...shadow.buildAsObject(0, 5, 15, colors.purple, 0.3),
  backgroundColor: colors.appleBlue,
}));

const BiometryWarningText = styled(Text).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.alpha(colors.blueGreyDark, 0.6),
  lineHeight: 'looser',
  size: 'lmedium',
}))({
  ...padding.object(0, 35),
});

const LoadingSpinner = android ? Spinner : ActivityIndicator;

export default function SecretDisplaySection({
  isSmallPhone,
  onSecretLoaded,
  onWalletTypeIdentified,
}) {
  const { params } = useRoute();
  const { selectedWallet, wallets } = useWallets();
  const walletId = params?.walletId || selectedWallet.id;
  const currentWallet = wallets[walletId];
  const [visible, setVisible] = useState(true);
  const [isRecoveryPhraseVisible, setIsRecoveryPhraseVisible] = useState(false);
  const [seed, setSeed] = useState(null);
  const [type, setType] = useState(currentWallet?.type);

  const loadSeed = useCallback(async () => {
    try {
      const s = await loadSeedPhraseAndMigrateIfNeeded(walletId);
      if (s) {
        const walletType = identifyWalletType(s);
        setType(walletType);
        onWalletTypeIdentified?.(walletType);
        setSeed(s);
      }
      setVisible(!!s);
      onSecretLoaded?.(!!s);
      setIsRecoveryPhraseVisible(!!s);
    } catch (e) {
      logger.sentry('Error while trying to reveal secret', e);
      if (e?.message === createdWithBiometricError) {
        setIsRecoveryPhraseVisible(false);
      }
      captureException(e);
      setVisible(false);
      onSecretLoaded?.(false);
    }
  }, [onSecretLoaded, onWalletTypeIdentified, walletId]);

  useEffect(() => {
    // Android doesn't like to show the faceID prompt
    // while the view isn't fully visible
    // so we have to add a timeout to prevent the app from freezing
    android
      ? setTimeout(() => {
          loadSeed();
        }, 300)
      : loadSeed();
  }, [loadSeed]);

  const typeLabel = type === WalletTypes.privateKey ? 'key' : 'phrase';

  const { colors } = useTheme();

  const renderStepNoSeeds = useCallback(() => {
    if (isRecoveryPhraseVisible) {
      return (
        <ColumnWithMargins align="center" justify="center">
          <AuthenticationText>
            {lang.t('back_up.secret.you_need_to_authenticate', {
              typeName: typeLabel,
            })}
          </AuthenticationText>
          <ToggleSecretButton onPress={loadSeed}>
            <BiometricButtonContent
              color={colors.white}
              label={lang.t('back_up.secret.show_recovery', {
                typeName: upperFirst(typeLabel),
              })}
              showIcon={!seed}
            />
          </ToggleSecretButton>
        </ColumnWithMargins>
      );
    } else {
      return (
        <BiometryWarningText>
          Your account has been secured with biometric data, like fingerprint or
          face identification. To see your recovery phrase, turn on biometrics
          in your phone’s settings.
        </BiometryWarningText>
      );
    }
  }, [isRecoveryPhraseVisible, typeLabel, loadSeed, colors.white, seed]);
  return (
    <>
      {visible ? (
        <ColumnWithMargins
          align="center"
          justify="center"
          margin={16}
          paddingHorizontal={30}
        >
          {seed ? (
            <Fragment>
              <CopyFloatingEmojis textToCopy={seed}>
                <CopyButtonRow>
                  <CopyButtonIcon />
                  <CopyButtonText>
                    {lang.t('back_up.secret.copy_to_clipboard')}
                  </CopyButtonText>
                </CopyButtonRow>
              </CopyFloatingEmojis>
              <Column>
                <SecretDisplayCard seed={seed} type={type} />
              </Column>
              <Column>
                <Title isSmallPhone={isSmallPhone}>
                  👆{lang.t('back_up.secret.for_your_eyes_only')} 👆
                </Title>
                <DescriptionText>
                  {lang.t('back_up.secret.anyone_who_has_these')}
                </DescriptionText>
              </Column>
            </Fragment>
          ) : (
            <LoadingSpinner color={colors.blueGreyDark50} />
          )}
        </ColumnWithMargins>
      ) : (
        renderStepNoSeeds()
      )}
    </>
  );
}
