# Before submitting to App Store

1. Connect App Store Connect to RevenueCat (for subscription validation):
   - Generate App-Specific Shared Secret in ASC → App Information
   - Create In-App Purchase Key in ASC → Users and Access → Integrations
   - Add the secret + .p8 file + Key ID + Issuer ID in RevenueCat → App Settings
2. Set up In-App Purchase products in App Store Connect and link them in RevenueCat
3. Run `eas build --platform ios --profile production`
4. Submit to App Store Review with the new build
