import React from "react";
import Box from "@mui/material/Box";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Typography from "@mui/material/Typography";
import { ThemeProvider, createTheme } from "@mui/material/styles";

const steps = [
  "Registering Voters",
  "Proposals Registration Started",
  "Proposals Registration Ended",
  "Voting Session Started",
  "Voting Session Ended"
];
const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

function HorizStepper(props) {
  const activeStep = parseInt(props.step);

  return (
    <ThemeProvider theme={darkTheme}>
      <Box sx={{ width: "100%" }}>
        <Stepper activeStep={activeStep}>
          {steps.map((label, index) => {
            const stepProps = {};
            const labelProps = {};
            return (
              <Step key={label} {...stepProps}>
                <StepLabel {...labelProps}>{label}</StepLabel>
              </Step>
            );
          })}
        </Stepper>
        {activeStep === steps.length ? (
          <React.Fragment>
            <Typography sx={{ mt: 2, mb: 1 }}>Votes tallied</Typography>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <Typography sx={{ mt: 2, mb: 1 }}>
              Step {activeStep+1} - {steps[activeStep]}
            </Typography>
          </React.Fragment>
        )}
      </Box>
    </ThemeProvider>
  );
}

export default HorizStepper;
