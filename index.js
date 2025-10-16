/**
 * @format
 */

import 'react-native-gesture-handler';
import 'react-native-reanimated';
import { AppRegistry } from 'react-native';
import { Buffer } from 'buffer';
import App from './App';
import { name as appName } from './app.json';

if (typeof global.Buffer === 'undefined') {
	global.Buffer = Buffer;
}

AppRegistry.registerComponent(appName, () => App);
