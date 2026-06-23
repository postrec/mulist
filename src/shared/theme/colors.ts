import { DynamicColorIOS } from 'react-native';

export const colors = {
  background: DynamicColorIOS({ dark: '#0C100D', light: '#F7F5EF' }),
  surface: DynamicColorIOS({ dark: '#151A16', light: '#FFFFFF' }),
  text: DynamicColorIOS({ dark: '#F0F3EF', light: '#1C211D' }),
  muted: DynamicColorIOS({ dark: '#A6ADA6', light: '#737970' }),
  primary: DynamicColorIOS({ dark: '#79C8A3', light: '#285C46' }),
  primarySoft: DynamicColorIOS({ dark: '#18261F', light: '#E1EDE6' }),
  border: DynamicColorIOS({ dark: '#262D28', light: '#DEDCD5' }),
  accent: '#E5A83B',
} as const;
