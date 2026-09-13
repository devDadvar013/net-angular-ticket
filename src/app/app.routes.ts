import { Routes } from "@angular/router";

export const routes: Routes = [
  {
    path: "",
    loadComponent: () =>
      import("./pages/home/home").then((m) => m.HomePage),
  },
  {
    path: "results",
    loadComponent: () =>
      import("./pages/results/results").then((m) => m.ResultsPage),
  },
  {
    path: "booking/:id",
    loadComponent: () =>
      import("./pages/booking/booking").then((m) => m.BookingPage),
  },
  {
    path: "confirmation",
    loadComponent: () =>
      import("./pages/confirmation/confirmation").then((m) => m.ConfirmationPage),
  },
  {
    path: "tracking",
    loadComponent: () =>
      import("./pages/tracking/tracking").then((m) => m.TrackingPage),
  },
  { path: "**", redirectTo: "" },
];
