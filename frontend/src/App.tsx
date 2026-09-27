import { useState } from "react";
import { Container, Box, Typography } from "@mui/material";
import { Header } from "@/components/Header";
import { CatalogPage } from "@/pages/Catalog";
import { BookingsPage } from "@/pages/Bookings";

type TabId = "catalog" | "bookings" | "settings";

export default function App() {
  const [active, setActive] = useState<TabId>("catalog");

  return (
    <>
      <Header
        activeNavId={active}
        onNavigate={(id) => setActive(id as TabId)}
        onBellClick={() => console.log("bell")}
      />
      <Container maxWidth="lg">
        <Box sx={{ my: 3 }}>
          {active === "catalog" && <CatalogPage />}
          {active === "bookings" && <BookingsPage />}
          {active === "settings" && (
            <Typography color="text.secondary">Раздел настроек пока не реализован.</Typography>
          )}
        </Box>
      </Container>
    </>
  );
}
