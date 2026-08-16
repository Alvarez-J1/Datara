"use client";

import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import dynamic from "next/dynamic";
import {
  Box,
  Button,
  InputAdornment,
  Paper,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  GridColDef,
  GridFilterModel,
  GridLogicOperator,
  GridPaginationModel,
  GridSortModel,
  useGridApiRef,
} from "@mui/x-data-grid";
import Footer from "@/components/Footer/Footer";
import {
  revenueRecords,
  type RevenueRecordQuery,
  type RevenueRecordRow,
  type RevenueStatus,
} from "@/lib/api/analytics";
import { reportApiError } from "@/lib/api/client";
import { useUserSettings, type DefaultTimeRange } from "@/lib/api/settings";
import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import scss from "./Data.module.scss";

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then((module) => module.DataGrid),
  { ssr: false }
) as typeof import("@mui/x-data-grid").DataGrid;

type RevenueGridRow = {
  accountOwner: string;
  amount: number;
  customerSegment: string;
  customerName: string;
  date: string;
  id: number;
  region: string;
  status: RevenueStatus;
};

const checkboxColumn = {
  maxWidth: 50,
  minWidth: 50,
  resizable: false,
  width: 50,
};

const revenueStatusOptions: RevenueStatus[] = [
  "WON",
  "NEGOTIATION",
  "QUALIFIED",
  "LEAD",
  "PROPOSAL",
  "LOST",
];

const desktopRevenueColumns: GridColDef<RevenueGridRow>[] = [
  {
    align: "left",
    field: "customerName",
    filterable: false,
    flex: 1.55,
    headerAlign: "left",
    headerName: "Customer Name",
    minWidth: 220,
    sortable: false,
  },
  {
    align: "left",
    field: "region",
    filterable: false,
    flex: 0.9,
    headerAlign: "left",
    headerName: "Region",
    minWidth: 140,
    sortable: false,
  },
  {
    align: "left",
    field: "customerSegment",
    filterable: false,
    flex: 1.05,
    headerAlign: "left",
    headerName: "Customer Segment",
    minWidth: 150,
    sortable: false,
  },
  {
    align: "left",
    field: "accountOwner",
    filterable: false,
    flex: 1.05,
    headerAlign: "left",
    headerName: "Account Owner",
    minWidth: 150,
    sortable: false,
  },
  {
    align: "left",
    cellClassName: scss.revenueAmount,
    field: "amount",
    filterable: false,
    flex: 0.8,
    headerAlign: "left",
    headerName: "Revenue",
    minWidth: 128,
    sortable: true,
    type: "number",
    valueFormatter: (value: number) => formatCurrency(value),
  },
  {
    align: "left",
    cellClassName: scss.statusCell,
    field: "status",
    flex: 0.75,
    headerAlign: "left",
    headerName: "Status",
    minWidth: 140,
    renderCell: (params) => (
      <StatusChip status={toRevenueStatus(params.value)} />
    ),
    sortable: true,
    type: "singleSelect",
    valueOptions: revenueStatusOptions,
  },
  {
    align: "left",
    field: "date",
    flex: 0.85,
    headerAlign: "left",
    headerName: "Date",
    minWidth: 126,
    sortable: true,
    valueFormatter: (value: string) => formatDate(value),
  },
];

const scrollableRevenueColumns: GridColDef<RevenueGridRow>[] = [
  {
    align: "left",
    field: "customerName",
    filterable: false,
    headerAlign: "left",
    headerName: "Customer Name",
    sortable: false,
    width: 240,
  },
  {
    align: "left",
    field: "region",
    filterable: false,
    headerAlign: "left",
    headerName: "Region",
    sortable: false,
    width: 160,
  },
  {
    align: "left",
    field: "customerSegment",
    filterable: false,
    headerAlign: "left",
    headerName: "Customer Segment",
    sortable: false,
    width: 190,
  },
  {
    align: "left",
    field: "accountOwner",
    filterable: false,
    headerAlign: "left",
    headerName: "Account Owner",
    sortable: false,
    width: 190,
  },
  {
    align: "left",
    cellClassName: scss.revenueAmount,
    field: "amount",
    filterable: false,
    headerAlign: "left",
    headerName: "Revenue",
    sortable: true,
    type: "number",
    valueFormatter: (value: number) => formatCurrency(value),
    width: 150,
  },
  {
    align: "left",
    cellClassName: scss.statusCell,
    field: "status",
    headerAlign: "left",
    headerName: "Status",
    renderCell: (params) => (
      <StatusChip status={toRevenueStatus(params.value)} />
    ),
    sortable: true,
    type: "singleSelect",
    valueOptions: revenueStatusOptions,
    width: 145,
  },
  {
    align: "right",
    field: "date",
    headerAlign: "right",
    headerName: "Date",
    sortable: true,
    valueFormatter: (value: string) => formatDate(value),
    width: 140,
  },
];

const Data = () => {
  const apiRef = useGridApiRef();
  const theme = useTheme();
  const useScrollableColumns = useMediaQuery("(max-width:1023.98px)", {
    noSsr: true,
  });
  const { settings } = useUserSettings();
  const compactMode = settings?.compactMode ?? false;
  const hasAppliedSavedPageSize = useRef(false);
  const [rows, setRows] = useState<RevenueGridRow[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 25,
  });
  const [sortModel, setSortModel] = useState<GridSortModel>([
    { field: "date", sort: "desc" },
  ]);
  const [filterModel, setFilterModel] = useState<GridFilterModel>({
    items: [],
    quickFilterLogicOperator: GridLogicOperator.Or,
    quickFilterValues: [],
  });
  const searchValue = String(filterModel.quickFilterValues?.[0] ?? "");
  const revenueColumns = useScrollableColumns
    ? scrollableRevenueColumns
    : desktopRevenueColumns;

  const query = useMemo(
    () => buildRevenueQuery(paginationModel, sortModel, filterModel, settings?.defaultTimeRange),
    [paginationModel, sortModel, filterModel, settings?.defaultTimeRange]
  );

  // Apply the saved table page size once, the first time it becomes
  // available, so it survives a refresh without overriding the person's
  // in-session pagination choice on every settings re-fetch.
  useEffect(() => {
    if (hasAppliedSavedPageSize.current || !settings) {
      return;
    }

    hasAppliedSavedPageSize.current = true;
    setPaginationModel((current) => ({
      ...current,
      pageSize: settings.tablePageSize,
    }));
  }, [settings]);

  useEffect(() => {
    let isMounted = true;

    const loadRevenueRows = async () => {
      setIsLoading(true);

      try {
        const response = await revenueRecords(query);

        if (!isMounted) {
          return;
        }

        const nextRows = Array.isArray(response?.rows)
          ? response.rows.map(mapRevenueRow)
          : [];

        setRows(nextRows);
        setRowCount(toNonNegativeInteger(response?.rowCount, nextRows.length));
      } catch (error) {
        reportApiError(error, "Revenue records");

        if (isMounted) {
          setRows([]);
          setRowCount(0);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadRevenueRows();

    return () => {
      isMounted = false;
    };
  }, [query]);

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;

    setFilterModel((currentModel) => ({
      ...currentModel,
      quickFilterValues: value ? [value] : [],
    }));
  };

  const handleExport = () => {
    apiRef.current?.exportDataAsCsv({
      fileName: "datara-data-export",
    });
  };

  return (
    <main
      className={`${scss.dataPage} ${compactMode ? scss.compact : ""}`}
      data-compact-mode={compactMode}
    >
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

      </section>

      <Paper
        className={`${scss.tableCard} ${compactMode ? scss.compact : ""}`}
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
            Search and export workspace revenue records.
            </Typography>
          </div>

          <div className={scss.toolbarActions}>
            <TextField
              className={scss.searchInput}
              onChange={handleSearchChange}
              placeholder="Search customers"
              size="small"
              slotProps={{
                input: {
                  "aria-label": "Search revenue records",
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRoundedIcon aria-hidden="true" fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
              value={searchValue}
            />

            <Button
              className={scss.toolbarButton}
              onClick={handleExport}
              startIcon={<FileDownloadOutlinedIcon aria-hidden="true" />}
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
              checkboxColDef={checkboxColumn}
              columnHeaderHeight={compactMode ? 48 : 56}
              columns={revenueColumns}
              density={compactMode ? "compact" : "standard"}
              disableColumnFilter
              disableColumnMenu
              disableColumnResize
              disableRowSelectionOnClick
              filterMode="server"
              filterModel={filterModel}
              loading={isLoading}
              onFilterModelChange={(model) => {
                setFilterModel(model);
                setPaginationModel((current) => ({ ...current, page: 0 }));
              }}
              onPaginationModelChange={setPaginationModel}
              onSortModelChange={(model) => {
                setSortModel(model);
                setPaginationModel((current) => ({ ...current, page: 0 }));
              }}
              pageSizeOptions={[25, 50, 100]}
              paginationMode="server"
              paginationModel={paginationModel}
              rowCount={rowCount}
              rowHeight={compactMode ? 44 : 56}
              rows={rows}
              sortingMode="server"
              sortModel={sortModel}
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
                "& .MuiDataGrid-columnSeparator": {
                  display: "none",
                },
                "& .MuiDataGrid-columnHeader:not(.MuiDataGrid-columnHeaderCheckbox)": {
                  paddingLeft: "24px",
                  paddingRight: "24px",
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
                "& .MuiDataGrid-cell:not(.MuiDataGrid-cellCheckbox)": {
                  paddingLeft: "24px",
                  paddingRight: "24px",
                },
                [`& .${scss.statusCell}`]: {
                  overflow: "visible",
                  paddingLeft: "12px",
                  paddingRight: "12px",
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

const mapRevenueRow = (row: RevenueRecordRow, index: number): RevenueGridRow => ({
  accountOwner:
    typeof row.account_owner === "string" ? row.account_owner : "Unassigned",
  amount: toFiniteNumber(row.amount),
  customerSegment:
    typeof row.customer_segment === "string" ? row.customer_segment : "Unassigned",
  customerName: typeof row.customer_name === "string" ? row.customer_name : "",
  date: typeof row.date === "string" ? row.date : "",
  id: toNonNegativeInteger(row.id, index),
  region: typeof row.region === "string" ? row.region : "Unassigned",
  status: isRevenueStatus(row.status) ? row.status : "LEAD",
});

const buildRevenueQuery = (
  paginationModel: GridPaginationModel,
  sortModel: GridSortModel,
  filterModel: GridFilterModel,
  defaultTimeRange?: DefaultTimeRange
): RevenueRecordQuery => {
  const sort = sortModel[0];

  return {
    page: paginationModel.page,
    size: paginationModel.pageSize,
    search: getSearchFilter(filterModel),
    sortBy: getSortField(sort?.field),
    sortDirection: sort?.sort === "asc" ? "asc" : "desc",
    range: defaultTimeRange,
  };
};

const getSortField = (
  field: GridSortModel[number]["field"] | undefined
): RevenueRecordQuery["sortBy"] => {
  if (field === "amount" || field === "status") {
    return field;
  }
  return "date";
};

const getSearchFilter = (filterModel: GridFilterModel): string | undefined => {
  const value = String(filterModel.quickFilterValues?.[0] ?? "").trim();
  return value || undefined;
};

const StatusChip = ({ status }: { status: RevenueStatus }) => {
  const statusClassName = {
    LEAD: scss.statusLead,
    LOST: scss.statusLost,
    NEGOTIATION: scss.statusNegotiation,
    PROPOSAL: scss.statusProposal,
    QUALIFIED: scss.statusQualified,
    WON: scss.statusWon,
  }[status];

  return (
    <span className={`${scss.statusChip} ${statusClassName}`}>
      {formatStatus(status)}
    </span>
  );
};

const toRevenueStatus = (value: unknown): RevenueStatus => {
  return isRevenueStatus(value) ? value : "LEAD";
};

const isRevenueStatus = (value: unknown): value is RevenueStatus => {
  return revenueStatusOptions.includes(value as RevenueStatus);
};

const formatStatus = (status: RevenueStatus): string => {
  return status;
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 2,
    style: "currency",
  }).format(toFiniteNumber(value));
};

const formatDate = (value: string): string => {
  if (!value) {
    return "";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

const toFiniteNumber = (value: unknown): number => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

const toNonNegativeInteger = (value: unknown, fallback = 0): number => {
  const numberValue = Number(value);
  return Number.isInteger(numberValue) && numberValue >= 0
    ? numberValue
    : fallback;
};

export default Data;
