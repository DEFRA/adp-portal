import { createUnifiedTheme, palettes, genPageTheme } from '@backstage/theme';
import styles from 'style-loader!css-loader?{"modules": {"auto": true}}!sass-loader?{"sassOptions": {"quietDeps": true}}!./style.module.scss';

export const lightTheme = createUnifiedTheme({
  palette: {
    ...palettes.light,
    navigation: {
      background: styles.lightThemeNav,
      indicator: styles.primaryColour,
      color: styles.unselectedNavText,
      selectedColor: styles.white,
      navItem: {
        hoverBackground: styles.navHoverBackground,
      },
    },
    primary: {
      main: styles.primaryColour,
    },
    secondary: {
      main: styles.warningColour,
    },
    link: styles.linkColour,
    linkHover: styles.linkHoverColour,
    errorText: styles.errorColour,
    contrastThreshold: 4.5,
  },
  defaultPageTheme: 'home',
  pageTheme: {
    home: genPageTheme({ colors: [`${styles.lightThemeNav}`], shape: 'none' }),
  },
  fontFamily: "'GDS Transport',arial, sans-serif",
  components: {
    BackstageHeader: {
      styleOverrides: {
        header: {
          borderBottom: `4px solid ${styles.primaryColour}`,
        },
      },
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: {
          color: styles.secondaryTextColour,
          '&$error': {
            color: styles.secondaryTextColour,
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: styles.secondaryTextColour,
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        caption: {
          color: ` ${styles.secondaryTextColour} !important`,
        },
      },
    },
  },
});

export const darkTheme = createUnifiedTheme({
  palette: {
    ...palettes.dark,
    background: {
      default: styles.darkBackground,
      paper: styles.darkPaper,
    },
    navigation: {
      background: styles.darkThemeNav,
      indicator: styles.primaryColour,
      color: styles.unselectedNavText,
      selectedColor: styles.white,
      navItem: {
        hoverBackground: styles.navHoverBackground,
      },
    },
    link: styles.linkColour,
    linkHover: styles.linkHoverColour,
    errorText: styles.errorColour,
    contrastThreshold: 4.5,
  },
  defaultPageTheme: 'home',
  pageTheme: {
    home: genPageTheme({ colors: [`${styles.darkThemeNav}`], shape: 'none' }),
  },
  fontFamily: "'GDS Transport',arial, sans-serif",
  components: {
    BackstageHeader: {
      styleOverrides: {
        header: {
          borderBottom: `4px solid ${styles.primaryColour}`,
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        h2: {
          color: `${styles.lightGrey} !important`,
        },
      },
    },
  },
});
