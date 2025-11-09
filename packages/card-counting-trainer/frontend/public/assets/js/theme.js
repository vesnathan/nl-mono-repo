import { createTheme } from "@mui/material/styles";
import { amber, red } from "@material-ui/core/colors";

const theme = createTheme({
  palette: {
    primary: {
      main: "#3a8845",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#c62828",
      contrastText: "#FFFFFF",
    },
    error: {
      main: red[400],
    },
    warning: {
      main: amber[500],
    },
    info: {
      main: "#FFFFFF",
    },
  },
  components: {
    MuiInputBase: {
      styleOverrides: {
        input: {
          backgroundColor: "rgba(255,2255,255,.8)",
          marginTop: "8px",
        },
      },
    },
    MuiButtonBase: {
      styleOverrides: {
        button: {
          marginTop: "8px",
        },
      },
    },
  },
  props: {
    // Name of the component ⚛️
  },
});
export default theme;
