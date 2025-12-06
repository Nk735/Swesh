// Light and Dark theme color palettes

export interface ThemeColors {
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  primary: string;
  secondary: string;
  accent: string;
  border: string;
  success: string;
  error: string;
  inputBackground: string;
  navBackground: string;
  navBorder: string;
  onboardingPink: string;
}

export const lightColors: ThemeColors = {
  background: '#F2E8DF',
  card: '#FFFFFF',
  text: '#333333',
  textSecondary: '#666666',
  primary: '#F28585',
  secondary: '#F2B263',
  accent: '#86A69D',
  border: '#E0E0E0',
  success: '#34C759',
  error: '#FF3B30',
  inputBackground: '#FFFFFF',
  navBackground: '#F28585',
  navBorder: '#F2B263',
  onboardingPink: '#fd9ef8',
};

export const darkColors: ThemeColors = {
  background: '#1A1A2E',
  card: '#2D2D44',
  text: '#FFFFFF',
  textSecondary: '#A0A0A0',
  primary: '#FF6B8A',
  secondary: '#FFB347',
  accent: '#7FCEA0',
  border: '#3D3D5C',
  success: '#30D158',
  error: '#FF453A',
  inputBackground: '#252538',
  navBackground: '#2D2D44',
  navBorder: '#FFB347',
  onboardingPink: '#fd9ef8',
};
