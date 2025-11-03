import { registerRootComponent } from 'expo';
import { enableFreeze } from 'react-native-screens';

// Disable freeze to avoid React 19 compatibility issues
enableFreeze(false);

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
