"use client";

import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import {
  Box,
  Button,
  Chip,
  InputAdornment,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  DataGrid,
  GridColDef,
  GridFilterModel,
  GridLogicOperator,
  useGridApiRef,
} from "@mui/x-data-grid";
import Footer from "@/components/Footer/Footer";
import { type ChangeEvent, useState } from "react";
import scss from "./Data.module.scss";

type RevenueRecord = {
  active: string;
  completion: string;
  currency: string;
  customerEmail: string;
  customerName: string;
  discountAmount: string;
  discountRate: string;
  id: number;
  planPrice: string;
  planTier: string;
  product: string;
  region: string;
  revenue: string;
  seats: number;
  segment: string;
  status: "Active" | "At Risk" | "Cancelled" | "Completed" | "Open";
  workspaceId: string;
};

const revenueRows: RevenueRecord[] = [
  {
    active: "Yes",
    completion: "96%",
    currency: "USD",
    customerEmail: "finance@auroralabs.io",
    customerName: "Aurora Labs",
    discountAmount: "$53,426",
    discountRate: "8%",
    id: 1001,
    planPrice: "$4,800",
    planTier: "Enterprise",
    product: "Enterprise Plan",
    region: "North America",
    revenue: "$614,400",
    seats: 128,
    segment: "Strategic",
    status: "Active",
    workspaceId: "WS-1042",
  },
  {
    active: "Yes",
    completion: "88%",
    currency: "USD",
    customerEmail: "ops@northstarhealth.com",
    customerName: "Northstar Health",
    discountAmount: "$18,240",
    discountRate: "5%",
    id: 1002,
    planPrice: "$3,200",
    planTier: "Business",
    product: "Business Plan",
    region: "North America",
    revenue: "$364,800",
    seats: 114,
    segment: "Mid-Market",
    status: "Active",
    workspaceId: "WS-1187",
  },
  {
    active: "Yes",
    completion: "72%",
    currency: "USD",
    customerEmail: "admin@lumaretail.co",
    customerName: "Luma Retail",
    discountAmount: "$6,720",
    discountRate: "7%",
    id: 1003,
    planPrice: "$1,600",
    planTier: "Pro",
    product: "Pro Plan",
    region: "North America",
    revenue: "$96,000",
    seats: 60,
    segment: "SMB",
    status: "Open",
    workspaceId: "WS-1220",
  },
  {
    active: "Yes",
    completion: "100%",
    currency: "USD",
    customerEmail: "revops@heliosystems.ai",
    customerName: "Helio Systems",
    discountAmount: "$22,560",
    discountRate: "6%",
    id: 1004,
    planPrice: "$4,700",
    planTier: "Enterprise",
    product: "Forecasting Add-on",
    region: "Europe",
    revenue: "$376,000",
    seats: 80,
    segment: "Enterprise",
    status: "Completed",
    workspaceId: "WS-1265",
  },
  {
    active: "Yes",
    completion: "67%",
    currency: "USD",
    customerEmail: "billing@brightpath.io",
    customerName: "BrightPath",
    discountAmount: "$3,360",
    discountRate: "4%",
    id: 1005,
    planPrice: "$1,400",
    planTier: "Pro",
    product: "Analytics Add-on",
    region: "North America",
    revenue: "$84,000",
    seats: 60,
    segment: "SMB",
    status: "At Risk",
    workspaceId: "WS-1311",
  },
  {
    active: "No",
    completion: "18%",
    currency: "USD",
    customerEmail: "accounts@evergreenlegal.com",
    customerName: "Evergreen Legal",
    discountAmount: "$1,440",
    discountRate: "3%",
    id: 1006,
    planPrice: "$1,200",
    planTier: "Starter",
    product: "Starter Plan",
    region: "North America",
    revenue: "$48,000",
    seats: 40,
    segment: "SMB",
    status: "Cancelled",
    workspaceId: "WS-1368",
  },
  {
    active: "Yes",
    completion: "91%",
    currency: "EUR",
    customerEmail: "data@novafinance.eu",
    customerName: "Nova Finance",
    discountAmount: "€14,400",
    discountRate: "5%",
    id: 1007,
    planPrice: "€3,600",
    planTier: "Business",
    product: "Reporting Suite",
    region: "Europe",
    revenue: "€288,000",
    seats: 80,
    segment: "Mid-Market",
    status: "Active",
    workspaceId: "WS-1404",
  },
  {
    active: "Yes",
    completion: "82%",
    currency: "USD",
    customerEmail: "platform@cartwheel.app",
    customerName: "Cartwheel",
    discountAmount: "$9,600",
    discountRate: "4%",
    id: 1008,
    planPrice: "$2,000",
    planTier: "Business",
    product: "API Access",
    region: "North America",
    revenue: "$240,000",
    seats: 120,
    segment: "Mid-Market",
    status: "Active",
    workspaceId: "WS-1459",
  },
  {
    active: "Yes",
    completion: "54%",
    currency: "USD",
    customerEmail: "hello@grainline.studio",
    customerName: "Grainline Studio",
    discountAmount: "$960",
    discountRate: "2%",
    id: 1009,
    planPrice: "$800",
    planTier: "Starter",
    product: "Team Seats",
    region: "North America",
    revenue: "$48,000",
    seats: 60,
    segment: "SMB",
    status: "Open",
    workspaceId: "WS-1502",
  },
  {
    active: "Yes",
    completion: "94%",
    currency: "USD",
    customerEmail: "ops@meridiancloud.com",
    customerName: "Meridian Cloud",
    discountAmount: "$39,936",
    discountRate: "8%",
    id: 1010,
    planPrice: "$5,200",
    planTier: "Enterprise",
    product: "Enterprise Plan",
    region: "APAC",
    revenue: "$499,200",
    seats: 96,
    segment: "Enterprise",
    status: "Active",
    workspaceId: "WS-1540",
  },
  {
    active: "Yes",
    completion: "76%",
    currency: "USD",
    customerEmail: "admin@clearwatercrm.com",
    customerName: "Clearwater CRM",
    discountAmount: "$7,680",
    discountRate: "5%",
    id: 1011,
    planPrice: "$2,400",
    planTier: "Business",
    product: "Business Plan",
    region: "North America",
    revenue: "$153,600",
    seats: 64,
    segment: "Mid-Market",
    status: "Active",
    workspaceId: "WS-1596",
  },
  {
    active: "Yes",
    completion: "63%",
    currency: "GBP",
    customerEmail: "revops@atlaslabs.uk",
    customerName: "Atlas Labs",
    discountAmount: "£4,224",
    discountRate: "4%",
    id: 1012,
    planPrice: "£1,760",
    planTier: "Pro",
    product: "Pro Plan",
    region: "Europe",
    revenue: "£105,600",
    seats: 60,
    segment: "SMB",
    status: "At Risk",
    workspaceId: "WS-1633",
  },
  {
    active: "Yes",
    completion: "99%",
    currency: "USD",
    customerEmail: "team@orbitanalytics.com",
    customerName: "Orbit Analytics",
    discountAmount: "$16,128",
    discountRate: "6%",
    id: 1013,
    planPrice: "$4,200",
    planTier: "Enterprise",
    product: "Forecasting Add-on",
    region: "North America",
    revenue: "$268,800",
    seats: 64,
    segment: "Enterprise",
    status: "Completed",
    workspaceId: "WS-1681",
  },
  {
    active: "Yes",
    completion: "87%",
    currency: "USD",
    customerEmail: "billing@signalstack.dev",
    customerName: "SignalStack",
    discountAmount: "$2,016",
    discountRate: "3%",
    id: 1014,
    planPrice: "$1,400",
    planTier: "Pro",
    product: "Analytics Add-on",
    region: "North America",
    revenue: "$67,200",
    seats: 48,
    segment: "SMB",
    status: "Active",
    workspaceId: "WS-1708",
  },
  {
    active: "Yes",
    completion: "79%",
    currency: "USD",
    customerEmail: "finance@pillarops.com",
    customerName: "Pillar Ops",
    discountAmount: "$12,096",
    discountRate: "6%",
    id: 1015,
    planPrice: "$2,800",
    planTier: "Business",
    product: "Reporting Suite",
    region: "LATAM",
    revenue: "$201,600",
    seats: 72,
    segment: "Mid-Market",
    status: "Active",
    workspaceId: "WS-1742",
  },
  {
    active: "No",
    completion: "31%",
    currency: "USD",
    customerEmail: "owner@sproutdesk.com",
    customerName: "Sproutdesk",
    discountAmount: "$720",
    discountRate: "2%",
    id: 1016,
    planPrice: "$900",
    planTier: "Starter",
    product: "Starter Plan",
    region: "North America",
    revenue: "$36,000",
    seats: 40,
    segment: "SMB",
    status: "Cancelled",
    workspaceId: "WS-1801",
  },
  {
    active: "Yes",
    completion: "92%",
    currency: "USD",
    customerEmail: "admin@blueharbor.io",
    customerName: "Blue Harbor",
    discountAmount: "$27,648",
    discountRate: "6%",
    id: 1017,
    planPrice: "$4,800",
    planTier: "Enterprise",
    product: "Enterprise Plan",
    region: "North America",
    revenue: "$460,800",
    seats: 96,
    segment: "Enterprise",
    status: "Active",
    workspaceId: "WS-1844",
  },
  {
    active: "Yes",
    completion: "70%",
    currency: "USD",
    customerEmail: "growth@kineticlabs.ai",
    customerName: "Kinetic Labs",
    discountAmount: "$5,760",
    discountRate: "4%",
    id: 1018,
    planPrice: "$2,400",
    planTier: "Business",
    product: "API Access",
    region: "APAC",
    revenue: "$144,000",
    seats: 60,
    segment: "Mid-Market",
    status: "Open",
    workspaceId: "WS-1905",
  },
  {
    active: "Yes",
    completion: "84%",
    currency: "EUR",
    customerEmail: "workspace@sonarworks.eu",
    customerName: "Sonar Works",
    discountAmount: "€9,792",
    discountRate: "6%",
    id: 1019,
    planPrice: "€2,550",
    planTier: "Business",
    product: "Business Plan",
    region: "Europe",
    revenue: "€163,200",
    seats: 64,
    segment: "Mid-Market",
    status: "Active",
    workspaceId: "WS-1946",
  },
  {
    active: "Yes",
    completion: "58%",
    currency: "USD",
    customerEmail: "accounts@terracotta.co",
    customerName: "Terracotta",
    discountAmount: "$1,920",
    discountRate: "3%",
    id: 1020,
    planPrice: "$1,600",
    planTier: "Pro",
    product: "Pro Plan",
    region: "North America",
    revenue: "$64,000",
    seats: 40,
    segment: "SMB",
    status: "At Risk",
    workspaceId: "WS-2002",
  },
  {
    active: "Yes",
    completion: "97%",
    currency: "USD",
    customerEmail: "systems@vectorly.com",
    customerName: "Vectorly",
    discountAmount: "$11,520",
    discountRate: "5%",
    id: 1021,
    planPrice: "$3,000",
    planTier: "Business",
    product: "Team Seats",
    region: "North America",
    revenue: "$230,400",
    seats: 96,
    segment: "Mid-Market",
    status: "Completed",
    workspaceId: "WS-2064",
  },
  {
    active: "Yes",
    completion: "81%",
    currency: "USD",
    customerEmail: "finance@opalcommerce.com",
    customerName: "Opal Commerce",
    discountAmount: "$14,112",
    discountRate: "7%",
    id: 1022,
    planPrice: "$2,800",
    planTier: "Business",
    product: "Reporting Suite",
    region: "North America",
    revenue: "$201,600",
    seats: 72,
    segment: "Mid-Market",
    status: "Active",
    workspaceId: "WS-2109",
  },
  {
    active: "No",
    completion: "44%",
    currency: "USD",
    customerEmail: "support@redwoodapps.com",
    customerName: "Redwood Apps",
    discountAmount: "$2,016",
    discountRate: "4%",
    id: 1023,
    planPrice: "$1,050",
    planTier: "Starter",
    product: "Starter Plan",
    region: "North America",
    revenue: "$50,400",
    seats: 48,
    segment: "SMB",
    status: "Cancelled",
    workspaceId: "WS-2148",
  },
  {
    active: "Yes",
    completion: "90%",
    currency: "USD",
    customerEmail: "admin@summitgrowth.com",
    customerName: "Summit Growth",
    discountAmount: "$38,400",
    discountRate: "8%",
    id: 1024,
    planPrice: "$5,000",
    planTier: "Enterprise",
    product: "Enterprise Plan",
    region: "North America",
    revenue: "$480,000",
    seats: 96,
    segment: "Strategic",
    status: "Active",
    workspaceId: "WS-2200",
  },
];

const revenueColumns: GridColDef<RevenueRecord>[] = [
  { field: "customerName", headerName: "Customer Name", minWidth: 180, flex: 1.1 },
  { field: "customerEmail", headerName: "Customer Email", minWidth: 220, flex: 1.2 },
  { field: "workspaceId", headerName: "Workspace ID", minWidth: 130 },
  { field: "product", headerName: "Product / Plan", minWidth: 180, flex: 1 },
  { field: "planTier", headerName: "Plan Tier", minWidth: 130 },
  { field: "seats", headerName: "Seats", type: "number", minWidth: 90 },
  { field: "completion", headerName: "Engagement", minWidth: 130 },
  { field: "active", headerName: "Active", minWidth: 95 },
  { field: "planPrice", headerName: "Plan Price", minWidth: 125 },
  { field: "currency", headerName: "Currency", minWidth: 105 },
  { field: "revenue", headerName: "Revenue", minWidth: 130 },
  { field: "discountRate", headerName: "Discount Rate", minWidth: 135 },
  { field: "discountAmount", headerName: "Discount Amount", minWidth: 155 },
  { field: "region", headerName: "Region", minWidth: 140 },
  { field: "segment", headerName: "Segment", minWidth: 130 },
  { field: "status", headerName: "Status", minWidth: 120 },
];

const Data = () => {
  const apiRef = useGridApiRef();
  const theme = useTheme();
  const [filterModel, setFilterModel] = useState<GridFilterModel>({
    items: [],
    quickFilterLogicOperator: GridLogicOperator.Or,
    quickFilterValues: [],
  });
  const searchValue = String(filterModel.quickFilterValues?.[0] ?? "");
  const activeFilterCount =
    filterModel.items.filter((item) => item.value != null && item.value !== "")
      .length + (searchValue ? 1 : 0);

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;

    setFilterModel((currentModel) => ({
      ...currentModel,
      quickFilterValues: value ? [value] : [],
    }));
  };

  const handleOpenFilters = () => {
    apiRef.current?.showFilterPanel();
  };

  const handleExport = () => {
    apiRef.current?.exportDataAsCsv({
      fileName: "datara-data-export",
    });
  };

  return (
    <main className={scss.dataPage}>
      <section className={scss.pageHeader}>
        <div>
          <Typography className={scss.eyebrow}>REVENUE DATA</Typography>
          <Typography component="h1" variant="h3">
            Data
          </Typography>
          <Typography className={scss.pageDescription}>
          Browse and manage the records behind your revenue dashboard.
          </Typography>
        </div>

        <Chip
          className={scss.recordChip}
          label={`${revenueRows.length.toLocaleString()} records`}
          variant="outlined"
        />
      </section>

      <Paper
        className={scss.tableCard}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          boxShadow:
            theme.palette.mode === "dark"
              ? "0 10px 24px rgba(0, 0, 0, 0.18)"
              : "0 10px 24px rgba(15, 23, 42, 0.05)",
        }}
      >
        <div className={scss.tableToolbar}>
          <div>
            <Typography className={scss.tableTitle} component="h2">
              Revenue records
            </Typography>
            <Typography className={scss.tableSubtitle}>
            Search, filter, and export workspace revenue records.
            </Typography>
          </div>

          <div className={scss.toolbarActions}>
            <TextField
              className={scss.searchInput}
              onChange={handleSearchChange}
              placeholder="Search customers or plans"
              size="small"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRoundedIcon fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
              value={searchValue}
            />

            <Button
              className={scss.toolbarButton}
              onClick={handleOpenFilters}
              startIcon={<FilterListRoundedIcon />}
              variant="outlined"
            >
              Filters
              {activeFilterCount > 0 && (
                <span className={scss.filterCount}>{activeFilterCount}</span>
              )}
            </Button>

            <Button
              className={scss.toolbarButton}
              onClick={handleExport}
              startIcon={<FileDownloadOutlinedIcon />}
              variant="outlined"
            >
              Export
            </Button>
          </div>
        </div>

        <div className={scss.tableScroll}>
          <Box className={scss.gridShell}>
            <DataGrid
              apiRef={apiRef}
              checkboxSelection
              columns={revenueColumns}
              disableRowSelectionOnClick
              filterModel={filterModel}
              onFilterModelChange={setFilterModel}
              pageSizeOptions={[10, 25, 50]}
              rows={revenueRows}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 25, page: 0 },
                },
              }}
              sx={{
                "--DataGrid-containerBackground":
                  theme.palette.mode === "dark"
                    ? theme.palette.background.paper
                    : "#f8fafc",
                border: 0,
                color: "text.primary",
                fontFamily: "inherit",
                "& .MuiDataGrid-columnHeaders": {
                  borderBottom: "1px solid",
                  borderColor: "divider",
                },
                "& .MuiDataGrid-columnHeader": {
                  backgroundColor:
                    theme.palette.mode === "dark"
                      ? alpha(theme.palette.common.white, 0.03)
                      : alpha(theme.palette.grey[100], 0.82),
                },
                "& .MuiDataGrid-columnHeaderTitle": {
                  color: "text.secondary",
                  fontSize: "0.74rem",
                  fontWeight: 760,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                },
                "& .MuiDataGrid-cell": {
                  borderColor: "divider",
                  fontSize: "0.88rem",
                },
                "& .MuiDataGrid-row": {
                  transition: "background-color 140ms ease",
                },
                "& .MuiDataGrid-row:hover": {
                  backgroundColor: alpha(theme.palette.secondary.main, 0.045),
                },
                "& .MuiDataGrid-row.Mui-selected": {
                  backgroundColor: alpha(theme.palette.secondary.main, 0.08),
                },
                "& .MuiDataGrid-row.Mui-selected:hover": {
                  backgroundColor: alpha(theme.palette.secondary.main, 0.11),
                },
                "& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus": {
                  outline: `2px solid ${alpha(theme.palette.secondary.main, 0.45)}`,
                  outlineOffset: -2,
                },
                "& .MuiDataGrid-footerContainer": {
                  borderColor: "divider",
                  minHeight: 56,
                },
                "& .MuiCheckbox-root": {
                  color: "text.secondary",
                },
                "& .MuiCheckbox-root.Mui-checked": {
                  color: "secondary.main",
                },
              }}
            />
          </Box>
        </div>
      </Paper>

      <Footer />
    </main>
  );
};

export default Data;
