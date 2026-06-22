import { DynamicColorIOS } from 'react-native';

export const colors = {
  background: DynamicColorIOS({ dark: '#121512', light: '#F7F5EF' }),
  surface: DynamicColorIOS({ dark: '#202520', light: '#FFFFFF' }),
  text: DynamicColorIOS({ dark: '#F0F3EF', light: '#1C211D' }),
  muted: DynamicColorIOS({ dark: '#A6ADA6', light: '#737970' }),
  primary: DynamicColorIOS({ dark: '#79C8A3', light: '#285C46' }),
  primarySoft: DynamicColorIOS({ dark: '#243B30', light: '#E1EDE6' }),
  border: DynamicColorIOS({ dark: '#3B433D', light: '#DEDCD5' }),
  accent: '#E5A83B',
} as const;
